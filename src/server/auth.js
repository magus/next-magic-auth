import gql from 'graphql-tag';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import config from './config';
import cookie from './cookie';
import graphql from './graphql';
import random from './random';
import request from './request';
import words from './words';

import roles from 'src/shared/roles';
import { Token } from 'graphql';

const JwtFields = {
  HasuraNamespace: 'https://hasura.io/jwt/claims',
  HasuraAllowedRoles: 'x-hasura-allowed-roles',
  HasuraDefaultRole: 'x-hasura-default-role',
  HasuraUserId: 'x-hasura-user-id',
  MagicNamespace: 'https://magicwords.vercel.app/claims',
  MagicTokenKind: 'x-magic-token-kind',
  MagicLoginRequest: 'x-magic-login-request',
};

const JwtDefaults = {
  AllowedRoles: [roles.user, roles.self],
};

const TokenKinds = {
  login: 'login',
  refresh: 'refresh',
  jwt: 'jwt',
};

const getExpires = (expiresMinutes) => new Date(Date.now() + expiresMinutes * 60 * 1000);

function encodeJwtToken(kind, expiresMinutes, extraData) {
  const data = {
    [JwtFields.HasuraNamespace]: {
      ...extraData.hasuraData,
    },
    [JwtFields.MagicNamespace]: {
      [JwtFields.MagicTokenKind]: kind,
      ...extraData.magicData,
    },
  };

  const expiresIn = `${expiresMinutes}m`;
  const encoded = jwt.sign(data, config.JWT_SECRET.key, {
    algorithm: config.JWT_SECRET.type,
    expiresIn,
  });

  // convert expire minutes to milliseconds for unix ms timestamp
  const expires = getExpires(expiresMinutes);

  return { encoded, expires };
}

function generateLoginToken() {
  // generate random 64 byte secret value for login verification
  // only sent in email to remotely verify login request
  const secret = random.base64(32);
  // calculate expires time for cookie and storing in database
  const expires = getExpires(config.LOGIN_TOKEN_EXPIRES);

  return { secret, expires };
}

function setupLoginRequest(req, res, loginTokenId, loginTokenSecret) {
  // loginTokenId will be written inside cookie
  // requesting client will send in /api/auth/complete

  // sign the login token kind and store in cookie
  const { encoded, expires } = encodeJwtToken(TokenKinds.login, config.LOGIN_TOKEN_EXPIRES, {
    magicData: {
      [JwtFields.MagicLoginRequest]: loginTokenId,
    },
  });

  // store login token to auth cookie
  cookie.set(req, res, encoded, { expires });

  // generate a jwt to access the specific loginToken
  const jwtToken = encodeJwtToken(TokenKinds.login, config.LOGIN_TOKEN_EXPIRES, {
    hasuraData: {
      [JwtFields.HasuraAllowedRoles]: [roles.login],
      [JwtFields.HasuraDefaultRole]: roles.login,
      // hijack hasura user id header and send loginToken id instead
      [JwtFields.HasuraUserId]: loginTokenId,
    },
    magicData: {
      [JwtFields.MagicLoginRequest]: loginTokenId,
    },
  });

  // calculate phrase for showing on login for confirmation with email
  const phrase = words.getPhraseFromToken(loginTokenSecret);

  // return login hasura token and phrase
  return { jwtToken, phrase };
}

function generateRefreshToken(loginTokenId, user) {
  const refreshToken = encodeJwtToken(TokenKinds.refresh, config.JWT_REFRESH_TOKEN_EXPIRES, {
    hasuraData: {
      [JwtFields.HasuraAllowedRoles]: [roles.self],
      [JwtFields.HasuraDefaultRole]: roles.self,
      [JwtFields.HasuraUserId]: user.id,
    },
    magicData: {
      [JwtFields.MagicLoginRequest]: loginTokenId,
    },
  });

  return refreshToken;
}

function generateHasuraToken(loginTokenId, user) {
  // build allowedRoles array for user
  const allowedRoles = user.roles.map((userRole) => userRole.role.name);
  allowedRoles.push(...JwtDefaults.AllowedRoles);

  // ensure roles includes defaultRole
  if (!~allowedRoles.indexOf(user.defaultRole)) {
    allowedRoles.push(user.defaultRole);
  }

  const jwtToken = encodeJwtToken(TokenKinds.jwt, config.JWT_TOKEN_EXPIRES, {
    hasuraData: {
      [JwtFields.HasuraAllowedRoles]: allowedRoles,
      [JwtFields.HasuraDefaultRole]: user.defaultRole,
      [JwtFields.HasuraUserId]: user.id,
    },
  });

  return jwtToken;
}

async function refreshAuthentication(req, res, serverToken, authCookie) {
  // verify serverToken is not expired
  if (Date.now() > new Date(serverToken.expires).getTime()) {
    // e.g. /auth/timeout
    throw new Error('token expired');
  }

  // metadata for refresh token (user agent, ip, etc.)
  const refreshMetadata = {
    ...request.parse(req),
    lastActive: new Date(),
  };

  let loginTokenId;

  // serverToken may be either a
  //   1. completing a login (loginToken, first refresh token)
  //   2. or refreshing a login (refreshToken)

  // scenario 1: completing a login (first refreshToken)
  // no authCookie, generating first refreshToken and storing in cookie
  if (!authCookie) {
    loginTokenId = serverToken.id;

    const refreshToken = generateRefreshToken(loginTokenId, serverToken.user);

    // store new refreshToken in database
    await graphql.query(setRefreshToken, {
      variables: {
        loginTokenId,
        userId: serverToken.user.id,
        value: refreshToken.encoded,
        expires: refreshToken.expires,
        ...refreshMetadata,
      },
    });

    // set new refresh token to cookie
    cookie.set(req, res, refreshToken.encoded);
  } else if (authCookie === serverToken.value) {
    // scenario  2: refreshing a login (refreshToken)
    // authCookie matches stored refreshToken (serverToken.value)
    loginTokenId = serverToken.loginTokenId;

    // update refresh token expires in database (refresh the refreshToken)
    await graphql.query(updateRefreshToken, {
      variables: {
        loginTokenId,
        expires: getExpires(config.JWT_REFRESH_TOKEN_EXPIRES),
        ...refreshMetadata,
      },
    });

    // update refresh token cookie (so the expires updates)
    cookie.set(req, res, serverToken.value);
  } else {
    // authCookie did not match server stored refreshToken
    // todo generate static page for this
    // e.g. /auth/invalid
    throw new Error('invalid auth cookie, force logout');
  }

  // always return the encoded hasura jwt token ({ encoded, expires })
  return generateHasuraToken(loginTokenId, serverToken.user);
}

async function restoreLoginRequest(req, res, loginRequestId) {
  const kind = getJwtField(getAuthCookie(req), JwtFields.MagicTokenKind);

  if (kind === TokenKinds.login) {
    const { loginToken } = await graphql.query(getLoginToken, {
      variables: {
        id: loginRequestId,
      },
    });

    // verify login token is not expired
    if (Date.now() > new Date(loginToken.expires).getTime()) {
      // e.g. /auth/timeout
      throw new Error('login token expired');
    }

    // if loginToken is approved, signal client to complete
    if (loginToken.approved) {
      return { approved: true };
    }

    // return loginRequest to restore on client
    // will open check email modal and listen for login token changes
    const loginRequest = setupLoginRequest(req, res, loginToken.id, loginToken.secret);

    return loginRequest;
  }

  return false;
}

function decodeJwtClaims(jwtToken) {
  if (!jwtToken) {
    return {};
  }

  const { [JwtFields.HasuraNamespace]: hasuraClaims, [JwtFields.MagicNamespace]: magicClaims } = jwt.decode(
    jwtToken,
    config.JWT_SECRET.key,
  );

  return { ...hasuraClaims, ...magicClaims };
}

function getJwtField(jwtToken, field) {
  const claims = decodeJwtClaims(jwtToken);
  return claims[field];
}

const getAuthCookie = cookie.get;

export default {
  clearCookies: cookie.clear,
  getAuthCookie,

  generateLoginToken,
  setupLoginRequest,

  refreshAuthentication,

  restoreLoginRequest,

  getLoginRequest: (req) => getJwtField(getAuthCookie(req), JwtFields.MagicLoginRequest),

  getJwtTokenUserId: (req) => getJwtField(getAuthCookie(req), JwtFields.HasuraUserId),
};

// {
//   "data": {
//     "insert_refreshToken": {
//       "returning": [
//         {
//           "id": "8466db4e-146f-4d3b-933f-b146aa375d5d"
//         }
//       ]
//     }
//   }
// }
const setRefreshToken = gql`
  mutation SetRefreshToken(
    $userId: uuid!
    $loginTokenId: uuid!
    $value: String!
    $expires: timestamptz!
    $lastActive: timestamptz!
    $ip: String!
    $userAgent: String!
    $userAgentRaw: String!
    $geo: jsonb!
  ) {
    insert_refreshToken(
      objects: {
        userId: $userId
        loginTokenId: $loginTokenId
        value: $value
        expires: $expires
        ip: $ip
        userAgent: $userAgent
        userAgentRaw: $userAgentRaw
        geo: $geo
      }
    ) {
      returning {
        loginTokenId
      }
    }
  }
`;

const updateRefreshToken = gql`
  mutation UpdateRefreshToken(
    $loginTokenId: uuid!
    $expires: timestamptz!
    $lastActive: timestamptz!
    $ip: String!
    $userAgent: String!
    $userAgentRaw: String!
    $geo: jsonb!
  ) {
    update_refreshToken_by_pk(
      pk_columns: { loginTokenId: $loginTokenId }
      _set: {
        expires: $expires
        lastActive: $lastActive
        ip: $ip
        userAgent: $userAgent
        userAgentRaw: $userAgentRaw
        geo: $geo
      }
    ) {
      loginTokenId
    }
  }
`;

const UserForLoginFragment = gql`
  fragment UserForLoginFragment on user {
    id
    email
    defaultRole
    roles {
      role {
        name
        id
      }
    }
  }
`;

const getLoginToken = gql`
  ${UserForLoginFragment}

  query GetLoginToken($id: uuid!) {
    loginToken: loginToken_by_pk(id: $id) {
      id
      approved
      expires
      secret
      user {
        ...UserForLoginFragment
      }
    }
  }
`;

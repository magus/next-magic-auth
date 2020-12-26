import gql from 'graphql-tag';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import config from './config';
import cookie from './cookie';
import graphql from './graphql';
import random from './random';

import roles from 'src/shared/roles';

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

const getExpires = (expiresMinutes) =>
  new Date(Date.now() + expiresMinutes * 60 * 1000);

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

function setLoginTokenCookie(res, loginTokenId) {
  // loginTokenId will be written inside cookie
  // requesting client will send in /api/auth/complete

  // sign the login token kind and store in cookie
  const { encoded, expires } = encodeJwtToken(
    TokenKinds.login,
    config.LOGIN_TOKEN_EXPIRES,
    {
      magicData: {
        [JwtFields.MagicLoginRequest]: loginTokenId,
      },
    },
  );

  // store login token to auth cookie
  cookie.set(res, encoded, { expires });
}

function generateJWTToken(loginTokenId, user) {
  const refreshToken = encodeJwtToken(
    TokenKinds.refresh,
    config.JWT_REFRESH_TOKEN_EXPIRES,
    {
      hasuraData: {
        [JwtFields.HasuraAllowedRoles]: [roles.self],
        [JwtFields.HasuraDefaultRole]: roles.self,
        [JwtFields.HasuraUserId]: user.id,
      },
      magicData: {
        [JwtFields.MagicLoginRequest]: loginTokenId,
      },
    },
  );

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

  return { jwtToken, refreshToken };
}

async function refreshAuthentication(res, serverToken) {
  // verify serverToken is not expired
  if (Date.now() > new Date(serverToken.expires).getTime()) {
    // e.g. /auth/timeout
    throw new Error('token expired');
  }

  // serverToken may be either a
  //   1. refreshToken (refreshing a login)
  //   2. or loginToken (completing a login)
  const loginTokenId = serverToken.loginTokenId || serverToken.id;

  const tokens = generateJWTToken(loginTokenId, serverToken.user);

  // store refresh token in database
  // also delete login token if present
  await graphql.query(setRefreshToken, {
    variables: {
      loginTokenId,
      userId: serverToken.user.id,
      value: tokens.refreshToken.encoded,
      expires: tokens.refreshToken.expires,
    },
  });

  // store refresh token to cookie
  cookie.set(res, tokens.refreshToken.encoded);

  // return only the encdoed jwt token value
  return tokens.jwtToken.encoded;
}

function decodeJwtClaims(jwtToken) {
  if (!jwtToken) {
    return {};
  }

  const {
    [JwtFields.HasuraNamespace]: hasuraClaims,
    [JwtFields.MagicNamespace]: magicClaims,
  } = jwt.decode(jwtToken, config.JWT_SECRET.key);

  return { ...hasuraClaims, ...magicClaims };
}

function getJwtField(jwtToken, field) {
  const claims = decodeJwtClaims(jwtToken);
  return claims[field];
}

const getAuthCookie = (req) => req.cookies[config.AUTH_COOKIE];

export default {
  clearCookies: cookie.clear,

  generateLoginToken,
  setLoginTokenCookie,

  refreshAuthentication,

  getAuthCookie,

  getLoginRequest: (req) =>
    getJwtField(getAuthCookie(req), JwtFields.MagicLoginRequest),

  getJwtTokenUserId: (req) =>
    getJwtField(getAuthCookie(req), JwtFields.HasuraUserId),
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
  ) {
    insert_refreshToken(
      objects: {
        userId: $userId
        loginTokenId: $loginTokenId
        value: $value
        expires: $expires
      }
      on_conflict: {
        constraint: refreshToken_pkey
        update_columns: [value, expires]
      }
    ) {
      returning {
        loginTokenId
      }
    }
  }
`;

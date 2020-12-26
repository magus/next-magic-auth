import gql from 'graphql-tag';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import config from './config';
import cookie from './cookie';
import graphql from './graphql';
import random from './random';

import roles from 'src/shared/roles';

const CLAIMS_NAMESPACE = 'https://hasura.io/jwt/claims';
const HASURA_USER_ID_HEADER = 'x-hasura-user-id';
const defaultAllowedRoles = [roles.user, roles.self];
const TOKEN_KIND = 'x-magic-token-kind';
const LOGIN_REQUEST = 'x-magic-login-request';
const TokenKinds = {
  login: 'login',
  refresh: 'refresh',
  jwt: 'jwt',
};

function generateLoginToken(res) {
  // generate random 64 bytes for login verification
  const token = random.base64(32);
  // generate expiration in future
  const expires = new Date(Date.now() + config.LOGIN_TOKEN_EXPIRES * 60 * 1000);
  // generate login requestCookie which will be written to cookie
  // requesting client will send in /api/auth/complete
  const requestCookie = random.base64(32);

  // sign the login token kind and store in cookie
  const refreshToken = jwt.sign(
    {
      [CLAIMS_NAMESPACE]: {
        [TOKEN_KIND]: TokenKinds.login,
        [LOGIN_REQUEST]: requestCookie,
      },
    },
    config.JWT_SECRET.key,
    {
      algorithm: config.JWT_SECRET.type,
      expiresIn: `${config.LOGIN_TOKEN_EXPIRES}m`,
    },
  );

  setCookies(res, { refreshToken });

  return { token, expires, requestCookie };
}

function generateJWTToken(user) {
  const allowedRoles = user.roles.map((userRole) => userRole.role.name);
  allowedRoles.push(...defaultAllowedRoles);

  // ensure roles includes defaultRole
  if (!~allowedRoles.indexOf(user.defaultRole)) {
    allowedRoles.push(user.defaultRole);
  }

  const refreshToken = jwt.sign(
    {
      [CLAIMS_NAMESPACE]: {
        'x-hasura-allowed-roles': [roles.self],
        'x-hasura-default-role': roles.self,
        [HASURA_USER_ID_HEADER]: user.id,
        [TOKEN_KIND]: TokenKinds.refresh,
      },
    },
    config.JWT_SECRET.key,
    {
      algorithm: config.JWT_SECRET.type,
      expiresIn: `${config.JWT_REFRESH_TOKEN_EXPIRES}m`,
    },
  );

  const refreshTokenExpires = new Date(
    Date.now() + config.JWT_REFRESH_TOKEN_EXPIRES * 60 * 1000,
  );

  const token = jwt.sign(
    {
      [CLAIMS_NAMESPACE]: {
        'x-hasura-allowed-roles': allowedRoles,
        'x-hasura-default-role': user.defaultRole,
        [HASURA_USER_ID_HEADER]: user.id,
        [TOKEN_KIND]: TokenKinds.jwt,
      },
    },
    config.JWT_SECRET.key,
    {
      algorithm: config.JWT_SECRET.type,
      expiresIn: `${config.JWT_TOKEN_EXPIRES}m`,
    },
  );

  return { token, refreshToken, refreshTokenExpires };
}

async function refreshAuthentication(res, serverToken, clientToken) {
  // verify serverToken is not expired
  if (Date.now() > new Date(serverToken.expires).getTime()) {
    // e.g. /auth/timeout
    throw new Error('token expired');
  }

  // verify clientToken against serverToken stored for userId
  if (clientToken && clientToken !== serverToken.value) {
    // todo generate static page for this
    // e.g. /auth/invalid
    throw new Error('unexpected token value');
  }

  const jwtToken = generateJWTToken(serverToken.user);

  // store refresh token in database
  // also delete login token if present
  await graphql.query(setRefreshTokenDeleteLoginToken, {
    variables: {
      userId: serverToken.user.id,
      refreshToken: jwtToken.refreshToken,
      expires: jwtToken.refreshTokenExpires,
    },
  });

  // set authentication cookies
  setCookies(res, {
    refreshToken: jwtToken.refreshToken,
  });

  return jwtToken.token;
}

function clearCookies(res) {
  setCookies(
    res,
    {
      refreshToken: '',
    },
    { expires: new Date(0) },
  );
}

function setCookies(res, { refreshToken }, cookieOptions) {
  const cookies = [];

  if (typeof refreshToken === 'string') {
    cookies.push(
      cookie.generateCookie(config.AUTH_COOKIE, refreshToken, {
        ...cookieOptions,
      }),
    );
  }

  res.setHeader('Set-Cookie', cookies);
}

function decodeJWT(jwtToken) {
  const { [CLAIMS_NAMESPACE]: claims } = jwt.decode(
    jwtToken,
    config.JWT_SECRET.key,
  );
  return claims;
}

function getLoginRequest(jwtToken) {
  const claims = decodeJWT(jwtToken);
  if (claims[TOKEN_KIND] === TokenKinds.login) {
    return claims[LOGIN_REQUEST];
  }

  return null;
}

function getJwtTokenUserId(jwtToken) {
  const claims = decodeJWT(jwtToken);
  return claims[HASURA_USER_ID_HEADER];
}

export default {
  clearCookies,
  generateLoginToken,
  generateJWTToken,
  refreshAuthentication,
  getJwtTokenUserId,
  getLoginRequest,
};

const setRefreshTokenDeleteLoginToken = gql`
  mutation SetRefreshTokenDeleteLoginToken(
    $userId: uuid!
    $refreshToken: String!
    $expires: timestamptz!
  ) {
    insert_refreshToken(
      objects: { userId: $userId, value: $refreshToken, expires: $expires }
      on_conflict: {
        constraint: refreshToken_pkey
        update_columns: [value, expires]
      }
    ) {
      affected_rows
    }

    delete_loginToken_by_pk(userId: $userId) {
      userId
    }
  }
`;

import gql from 'graphql-tag';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import config from './config';
import cookie from './cookie';
import graphql from './graphql';
import random from './random';

const CLAIMS_NAMESPACE = 'https://hasura.io/jwt/claims';
const HASURA_USER_ID_HEADER = 'x-hasura-user-id';
const defaultAllowedRoles = ['user', 'self'];

function generateLoginToken() {
  // generate random 64 bytes for login verification
  const token = random.base64(32);

  const expires = new Date(Date.now() + config.LOGIN_TOKEN_EXPIRES * 60 * 1000);

  return { token, expires };
}

function generateJWTToken(user) {
  const allowedRoles = user.roles.map((userRole) => userRole.role.name);
  allowedRoles.push(...defaultAllowedRoles);

  // ensure roles includes defaultRole
  if (!~allowedRoles.indexOf(user.defaultRole)) {
    allowedRoles.push(user.defaultRole);
  }

  const refreshToken = random.base64(32);
  const refreshTokenExpires = new Date(
    Date.now() + config.JWT_REFRESH_TOKEN_EXPIRES * 60 * 1000,
  );
  const token = jwt.sign(
    {
      [CLAIMS_NAMESPACE]: {
        'x-hasura-allowed-roles': allowedRoles,
        'x-hasura-default-role': user.defaultRole,
        [HASURA_USER_ID_HEADER]: user.id,
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

async function refreshAuthentication(res, clientToken, serverToken) {
  // verify serverToken is not expired
  if (Date.now() > new Date(serverToken.expires).getTime()) {
    // e.g. /auth/timeout
    throw new Error('token expired');
  }

  // verify clientToken against serverToken stored for userId
  if (clientToken !== serverToken.value) {
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

  setCookies(res, {
    jwtToken: jwtToken.token,
    refreshToken: jwtToken.refreshToken,
  });

  return;
}

function clearCookies(res) {
  setCookies(
    res,
    {
      jwtToken: '',
      refreshToken: '',
    },
    { expires: new Date(0) },
  );
}

function setCookies(res, { jwtToken, refreshToken }, cookieOptions) {
  res.setHeader('Set-Cookie', [
    cookie.generateCookie(cookie.cookies.jwtToken, jwtToken, {
      httpOnly: false,
      ...cookieOptions,
    }),
    cookie.generateCookie(cookie.cookies.refreshToken, refreshToken, {
      ...cookieOptions,
    }),
  ]);
}

function getJwtTokenUserId(jwtToken) {
  const { [CLAIMS_NAMESPACE]: claims } = jwt.decode(
    jwtToken,
    config.JWT_SECRET.key,
  );
  return claims[HASURA_USER_ID_HEADER];
}

export default {
  clearCookies,
  generateLoginToken,
  generateJWTToken,
  refreshAuthentication,
  getJwtTokenUserId,
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

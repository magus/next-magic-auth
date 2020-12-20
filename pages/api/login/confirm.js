import gql from 'graphql-tag';

import config from '../../../src/server/config';
import cookie from '../../../src/server/cookie';
import graphql from '../../../src/server/graphql';
import auth from '../../../src/server/auth';

const loginConfirmUrl = `${config.FRONTEND_HOST}/login/confirm`;

export default async function loginConfirm(req, res) {
  try {
    const { token, userId } = req.query;

    const {
      loginToken: [loginToken],
    } = await graphql.query(getLoginTokenByUserId, {
      variables: { userId },
    });

    // verify loginToken is not expired
    if (Date.now() > new Date(loginToken.expires).getTime()) {
      // e.g. /login/timeout
      throw new Error('token expired');
    }

    // verify token against loginToken stored for userId
    if (token !== loginToken.value) {
      console.debug({ loginToken: loginToken.value, token });
      // todo generate static page for this
      // e.g. /login/invalid
      throw new Error('unexpected token value');
    }

    const jwtToken = auth.generateJWTToken(loginToken.user);

    // store refresh token in database
    await graphql.query(setRefreshToken, {
      variables: {
        userId,
        refreshToken: jwtToken.refreshToken,
        expires: jwtToken.refreshTokenExpires,
      },
    });

    res.setHeader('Set-Cookie', [
      cookie.generateCookie(config.Cookies.jwtToken, jwtToken.token),
      cookie.generateCookie(config.Cookies.refreshToken, jwtToken.refreshToken),
    ]);

    return res.status(200).json({ error: false });
    // return res.status(302).redirect(loginConfirmUrl);
  } catch (e) {
    return res
      .status(400)
      .json({ error: true, message: e.message, stack: e.stack.split('\n') });
  }
}

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

const getLoginTokenByUserId = gql`
  ${UserForLoginFragment}

  query GetLoginTokenByUserId($userId: uuid!) {
    loginToken(where: { userId: { _eq: $userId } }) {
      value
      expires
      user {
        ...UserForLoginFragment
      }
    }
  }
`;

const setRefreshToken = gql`
  mutation SetRefreshToken(
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
  }
`;

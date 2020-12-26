import gql from 'graphql-tag';

import auth from 'src/server/auth';
import config from 'src/server/config';
import cookie from 'src/server/cookie';
import graphql from 'src/server/graphql';

export default async function loginRefresh(req, res) {
  try {
    const refreshToken = req.cookies[config.AUTH_COOKIE];

    if (!refreshToken) {
      throw new Error('refresh token missing');
    }

    const userId = auth.getJwtTokenUserId(refreshToken);

    const {
      refreshToken: [serverRefreshToken],
    } = await graphql.query(getRefreshTokenByUserId, {
      variables: { userId },
    });

    if (!serverRefreshToken) {
      throw new Error(
        'no valid login sessions found in backend, logout and try again',
      );
    }

    const jwtToken = await auth.refreshAuthentication(
      res,
      serverRefreshToken,
      refreshToken,
    );

    return res.status(200).json({ error: false, jwtToken });
  } catch (e) {
    console.error(e);

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

const getRefreshTokenByUserId = gql`
  ${UserForLoginFragment}

  query GetRefreshTokenByUserId($userId: uuid!) {
    refreshToken(where: { userId: { _eq: $userId } }) {
      value
      expires
      user {
        ...UserForLoginFragment
      }
    }
  }
`;

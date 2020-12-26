import gql from 'graphql-tag';

import auth from 'src/server/auth';
import graphql from 'src/server/graphql';

export default async function loginRefresh(req, res) {
  try {
    const authCookie = auth.getAuthCookie(req);

    // no auth cookie, return 200 with no jwtToken
    if (!authCookie) {
      return res.status(200).json({ error: false });
    }

    // extract hasura user id from jwt token
    const userId = auth.getJwtTokenUserId(req);

    if (!userId) {
      throw new Error('missing user id');
    }

    // lookup refresh token in backend to compare against authCookie
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

    // refresh token stored in db must match the authCookie
    // if they do, refreshAuthentication takes care of setting auth cookie
    // returns jwt token for client side authentication
    const jwtToken = await auth.refreshAuthentication(
      res,
      serverRefreshToken,
      authCookie,
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

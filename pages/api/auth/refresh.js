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

    const loginRequestId = auth.getLoginRequest(req);

    if (!loginRequestId) {
      throw new Error('missing login request');
    }

    // lookup refresh token in backend to compare against authCookie
    const { refreshToken_by_pk: serverRefreshToken } = await graphql.query(
      getRefreshToken,
      {
        variables: { loginRequestId },
      },
    );

    if (!serverRefreshToken) {
      throw new Error(
        'no valid login sessions found in backend, logout and try again',
      );
    }

    // refreshAuthentication takes care of setting auth cookie
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

const getRefreshToken = gql`
  ${UserForLoginFragment}

  query GetRefreshToken($loginRequestId: uuid!) {
    refreshToken_by_pk(loginTokenId: $loginRequestId) {
      loginTokenId
      value
      expires
      user {
        ...UserForLoginFragment
      }
    }
  }
`;

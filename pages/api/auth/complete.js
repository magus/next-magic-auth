import gql from 'graphql-tag';

import config from '../../../src/server/config';
import cookie from '../../../src/server/cookie';
import graphql from '../../../src/server/graphql';
import auth from '../../../src/server/auth';

export default async function loginComplete(req, res) {
  try {
    // get login token by requestCookie
    const requestCookie = req.cookies[cookie.cookies.loginRequestCookie];

    const {
      loginToken: [loginToken],
    } = await graphql.query(getLoginTokenByCookie, {
      variables: { requestCookie },
    });

    // if loginToken is not approved, throw error
    if (!loginToken.approved) {
      throw new Error('login not approved');
    }

    // loginToken is approved, write authentication headers
    await auth.refreshAuthentication(res, loginToken);

    return res.status(200).json({ error: false });
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

const getLoginTokenByCookie = gql`
  ${UserForLoginFragment}

  query GetLoginTokenByCookie($requestCookie: String!) {
    loginToken(where: { requestCookie: { _eq: $requestCookie } }) {
      approved
      value
      expires
      user {
        ...UserForLoginFragment
      }
    }
  }
`;

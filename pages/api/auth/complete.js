import gql from 'graphql-tag';

import graphql from 'src/server/graphql';
import auth from 'src/server/auth';

export default async function loginComplete(req, res) {
  try {
    const loginRequestId = auth.getLoginRequest(req);

    if (!loginRequestId) {
      throw new Error('missing login request in cookie, check cookie');
    }

    const {
      loginToken,
      loginTokenUser: { user },
    } = await graphql.query(getLoginToken, {
      variables: {
        id: loginRequestId,
      },
    });

    // if loginToken is not approved, throw error
    if (!loginToken.approved) {
      throw new Error('login not approved');
    }

    // loginToken is approved, write authentication headers
    const jwtToken = await auth.refreshAuthentication(req, res, loginToken);

    return res.status(200).json({ error: false, jwtToken, loginRequestId, user });
  } catch (e) {
    console.error(e);

    return res.status(400).json({ error: true, message: e.message, stack: e.stack.split('\n') });
  }
}

const UserForSelfFragment = gql`
  fragment UserForSelfFragment on user {
    id
    email
    created
    updated
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

  ${UserForSelfFragment}

  query GetLoginToken($id: uuid!) {
    loginTokenUser: loginToken_by_pk(id: $id) {
      user {
        ...UserForSelfFragment
      }
    }

    loginToken: loginToken_by_pk(id: $id) {
      id
      approved
      expires
      user {
        ...UserForLoginFragment
      }
    }
  }
`;

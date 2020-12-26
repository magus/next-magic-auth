import gql from 'graphql-tag';

import graphql from 'src/server/graphql';
import auth from 'src/server/auth';

export default async function loginComplete(req, res) {
  try {
    const loginRequestId = auth.getLoginRequest(req);

    if (!loginRequestId) {
      throw new Error('missing login request');
    }

    const {
      loginToken: [loginToken],
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
    const jwtToken = await auth.refreshAuthentication(res, loginToken);

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

const getLoginToken = gql`
  ${UserForLoginFragment}

  query GetLoginToken($id: uuid!) {
    loginToken_by_pk(id: $id) {
      approved
      value
      expires
      user {
        ...UserForLoginFragment
      }
    }
  }
`;

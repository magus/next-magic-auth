import gql from 'graphql-tag';

import config from '../../../src/server/config';
import graphql from '../../../src/server/graphql';
import auth from '../../../src/server/auth';

const loginConfirmUrl = `${config.FRONTEND_HOST}/auth/confirm`;

export default async function loginConfirm(req, res) {
  try {
    const { token, userId } = req.query;

    const {
      loginToken: [loginToken],
    } = await graphql.query(getLoginTokenByUserId, {
      variables: { userId },
    });

    await auth.refreshAuthentication(res, token, loginToken);

    // return res.status(200).json({ error: false });
    return res.status(302).redirect(loginConfirmUrl);
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

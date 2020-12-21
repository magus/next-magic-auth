import gql from 'graphql-tag';

import config from '../../../src/server/config';
import graphql from '../../../src/server/graphql';
import auth from '../../../src/server/auth';

const loginConfirmUrl = `${config.FRONTEND_HOST}/auth/confirm`;

export default async function loginConfirm(req, res) {
  try {
    const { token, userId } = req.query;

    // set loginToken to approved
    await graphql.query(approveLoginTokenByUserId, {
      variables: { userId },
    });

    // client will then be able to hit /auth/login/complete
    // which will hit server and write refresh token

    // return res.status(200).json({ error: false });
    return res.status(302).redirect(loginConfirmUrl);
  } catch (e) {
    console.error(e);

    return res
      .status(400)
      .json({ error: true, message: e.message, stack: e.stack.split('\n') });
  }
}

const approveLoginTokenByUserId = gql`
  mutation ApproveLoginTokenByUserId($userId: uuid!) {
    update_loginToken_by_pk(
      pk_columns: { userId: $userId }
      _set: { approved: true }
    ) {
      userId
    }
  }
`;

import gql from 'graphql-tag';

import config from 'src/server/config';
import graphql from 'src/server/graphql';
import auth from 'src/server/auth';

const loginConfirmUrl = `${config.FRONTEND_HOST}/auth/confirm`;

export default async function loginConfirm(req, res) {
  try {
    const { token, userId } = req.query;

    // set loginToken to approved
    const data = await graphql.query(approveLoginTokenByUserId, {
      variables: { userId },
    });

    // when login token exists
    //   { data: { loginToken: { userId: 'd5347111-fa43-4c09-b3dd-7e9994651be5' } } }
    // when login token does not exist
    //   { data: { loginToken: null } }
    if (!data.loginToken) {
      throw new Error('login token missing, try again');
    }

    // token does not match
    if (data.loginToken.value !== token) {
      throw new Error('login token invalid, try again');
    }

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
    loginToken: update_loginToken_by_pk(
      pk_columns: { userId: $userId }
      _set: { approved: true }
    ) {
      value
      userId
    }
  }
`;

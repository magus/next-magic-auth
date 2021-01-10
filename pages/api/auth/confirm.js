import gql from 'graphql-tag';

import config from 'src/server/config';
import graphql from 'src/server/graphql';
import auth from 'src/server/auth';

const loginConfirmUrl = `${process.env.PROTOCOL}://${process.env.HOSTNAME}/auth/confirm`;

export default async function loginConfirm(req, res) {
  try {
    const { id, token } = req.query;

    // set loginToken to approved
    const data = await graphql.query(approveLoginToken, {
      variables: { id },
    });

    // when login token exists
    //   { data: { loginToken: { secret: '...' } } }
    // when login token does not exist
    //   { data: { loginToken: null } }
    if (!data.loginToken) {
      throw new Error('login token missing, try again');
    }

    // token does not match stored secret
    if (data.loginToken.secret !== token) {
      throw new Error('login token invalid, try again');
    }

    // verify loginToken not expired
    if (Date.now() > new Date(data.loginToken.expires).getTime()) {
      throw new Error('login token expired, try again');
    }

    // client will then be able to hit /auth/login/complete
    // which will hit server and write refresh token

    // return res.status(200).json({ error: false });
    // res.setHeader('Content-Type', 'text/html');
    // return res.status(200).send(`
    //   <html>
    //     <head>
    //       <meta http-equiv="Refresh" content="0; URL=${loginConfirmUrl}">
    //     </head>
    //   </html>
    // `);
    return res.status(302).redirect(`${loginConfirmUrl}?email=${data.loginToken.email}`);
  } catch (e) {
    console.error(e);

    return res.status(400).json({ error: true, message: e.message, stack: e.stack.split('\n') });
  }
}

const approveLoginToken = gql`
  mutation ApproveLoginToken($id: uuid!) {
    loginToken: update_loginToken_by_pk(pk_columns: { id: $id }, _set: { approved: true }) {
      secret
      expires
      email
    }
  }
`;

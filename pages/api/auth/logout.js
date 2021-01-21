import gql from 'graphql-tag';

import auth from 'src/server/auth';
import graphql from 'src/server/graphql';

export default async function logout(req, res) {
  try {
    auth.clearCookies(req, res);

    const loginRequestId = auth.getLoginRequest(req);
    if (loginRequestId) {
      // delete login request (loginToken)
      // this will also cascade and delete refreshTokens
      await graphql.query(deleteLoginToken, {
        variables: { id: loginRequestId },
      });
    }

    return res.status(200).json({ error: false });
  } catch (e) {
    console.error(e);
    // always return a 200 to ensure this never fails
    // return res.status(400).json({ error: true, message: e.message, stack: e.stack.split('\n') });
    return res.status(200).json({ error: true, message: e.message, stack: e.stack.split('\n') });
  }
}

const deleteLoginToken = gql`
  mutation DeleteLoginToken($id: uuid!) {
    delete_loginToken_by_pk(id: $id) {
      id
    }
  }
`;

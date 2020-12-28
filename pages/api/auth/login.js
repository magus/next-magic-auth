import gql from 'graphql-tag';
import Joi from 'joi';

import graphql from 'src/server/graphql';
import auth from 'src/server/auth';
import words from 'src/server/words';

// schema for validating username and password
const schema = Joi.object({
  email: Joi.string().email().required(),
});

export default async function login(req, res) {
  try {
    const form = typeof req.body === 'string' ? JSON.parse(req.body) : {};
    const { error, value } = schema.validate(form);

    if (error) {
      const [errorDetail] = error.details;

      return res
        .status(400)
        .json({ error: true, message: errorDetail.message });
    }

    const { email } = value;

    const loginToken = auth.generateLoginToken();

    // update/create user & update/create loginToken
    // the stored token is used to confirm and complete login
    const upsertLoginTokenWithUserResult = await graphql.query(
      upsertLoginTokenWithUser,
      {
        variables: {
          // user
          email,

          // loginToken contains secret and expires
          ...loginToken,
        },
      },
    );

    const [
      { id: loginTokenId, userId },
    ] = upsertLoginTokenWithUserResult.insert_loginToken.returning;

    // store loginToken id in cookie
    // returns a jwtToken for requesting the single loginToken request
    const jwtToken = auth.setLoginTokenCookie(res, loginTokenId);

    // calculate phrase for showing on login for confirmation with email
    const phrase = words.getPhraseFromToken(loginToken.secret);

    return res.status(200).json({
      error: false,
      phrase,
      jwtToken,
    });
  } catch (e) {
    console.error(e);

    return res
      .status(400)
      .json({ error: true, message: e.message, stack: e.stack.split('\n') });
  }
}

const upsertLoginTokenWithUser = gql`
  mutation UpsertLoginTokenWithUser(
    $email: String!
    $secret: String!
    $expires: timestamptz!
  ) {
    insert_loginToken(
      objects: {
        secret: $secret
        expires: $expires
        approved: false
        email: $email
        user: {
          data: { email: $email }
          on_conflict: { constraint: user_email_key, update_columns: updated }
        }
      }
    ) {
      returning {
        id
        userId
      }
    }
  }
`;

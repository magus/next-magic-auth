import gql from 'graphql-tag';
import Joi from 'joi';

import config from '../../src/server/config';
import graphql from '../../src/server/graphql';
import auth from '../../src/server/auth';
import random from '../../src/utils/random';
import serverEmail from '../../src/server/email';

// schema for validating username and password
const schema = Joi.object({
  email: Joi.string().email().required(),
});

export default async function login(req, res) {
  try {
    const form = JSON.parse(req.body);
    const { error, value } = schema.validate(form);

    if (error) {
      const [errorDetail] = error.details;

      return res
        .status(400)
        .json({ error: true, message: errorDetail.message });
    }

    // upsert user by email (get if existing, create if not)
    const { email } = value;

    const {
      data: upsertUserData,
      error: upsertUserError,
    } = await graphql.query(upsertUser, {
      variables: { email },
    });

    if (upsertUserError) {
      return res.status(500).json({ error: true, message: upsertUserError });
    }

    const [user] = upsertUserData.insert_user.returning;

    const {
      token: loginToken,
      expires: loginTokenExpires,
    } = auth.generateLoginToken();
    // store token to confirm via email link
    const setLoginTokenResult = await graphql.query(setLoginToken, {
      variables: { userId: user.id, loginToken, expires: loginTokenExpires },
    });

    // const emailResponse = await serverEmail.send(email, {
    //   subject: 'Login to Magic',
    //   text: 'content',
    //   html: '<strong>strong content</strong>',
    // });

    // const jwtToken = auth.generateJWTToken(user);

    return res.status(200).json({
      error: false,
      email,
      // jwtToken,
    });
  } catch (e) {
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

const upsertUser = gql`
  ${UserForLoginFragment}

  mutation UpsertUser($email: String!) {
    insert_user(
      objects: { email: $email }
      on_conflict: { constraint: user_email_key, update_columns: updated }
    ) {
      returning {
        ...UserForLoginFragment
      }
    }
  }
`;

const setRefreshToken = gql`
  mutation SetRefreshToken(
    $userId: uuid!
    $refreshToken: String!
    $expires: timestamptz!
  ) {
    insert_refreshToken(
      objects: { userId: $userId, value: $refreshToken, expires: $expires }
      on_conflict: {
        constraint: refreshToken_pkey
        update_columns: [value, expires]
      }
    ) {
      affected_rows
    }
  }
`;

const setLoginToken = gql`
  mutation SetLoginToken(
    $loginToken: String!
    $userId: uuid!
    $expires: timestamptz!
  ) {
    insert_loginToken(
      objects: { expires: $expires, userId: $userId, value: $loginToken }
      on_conflict: {
        constraint: loginToken_pkey
        update_columns: [created, value, expires]
      }
    ) {
      affected_rows
    }
  }
`;

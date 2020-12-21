import gql from 'graphql-tag';
import Joi from 'joi';

import config from '../../../src/server/config';
import graphql from '../../../src/server/graphql';
import auth from '../../../src/server/auth';
import random from '../../../src/server/random';
import serverEmail from '../../../src/server/email';
import words from '../../../src/server/words';

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

    const {
      token: loginToken,
      expires: loginTokenExpires,
      requestCookie,
    } = auth.generateLoginToken(res);

    // update/create user & update/create loginToken
    // the stored token is used to confirm and complete login
    await graphql.query(setLoginToken, {
      variables: {
        // user
        email,
        // loginToken
        loginToken,
        expires: loginTokenExpires,
        requestCookie,
      },
    });

    const loginConfirmUrl = `${
      config.FRONTEND_HOST
    }/api/auth/confirm?token=${encodeURIComponent(
      loginToken,
    )}&userId=${encodeURIComponent(user.id)}`;

    // nouns = 185 words; adjectives = 228 words
    // so 4 characters of 64-bit values = 256 bits, enough to index into both word lists
    const charsPerWord = 4;
    const getWordFrom = (base64String, wordList) => {
      const base64Bits = base64String
        .split('')
        .reduce((sum, c) => sum + words.base64Chars[c], 0);
      const word = wordList[base64Bits % wordList.length];

      return word;
    };

    const adjective = getWordFrom(
      loginToken.substr(0, charsPerWord),
      words.adjectives,
    );
    const noun = getWordFrom(
      loginToken.substr(loginToken.length - charsPerWord, charsPerWord),
      words.nouns,
    );
    const phrase = [adjective, noun].join(' ');

    const emailHtml = `
    <h3>Click the magic words below to finish the login.</h3>

    <a href="${loginConfirmUrl}"><strong>${phrase}</strong></a>

    <div>Click <a href="">here</a> if the magic words do not match what you saw on the login page.</div>
    `;

    const emailResponse = await serverEmail.send(email, {
      subject: 'Login to Magic',
      text: `Click this magic link to login! `,
      html: emailHtml,
    });

    return res.status(200).json({
      error: false,
      email,
      phrase,
      // jwtToken,
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
    $loginToken: String!
    $expires: timestamptz!
    $requestCookie: String!
  ) {
    insert_loginToken(
      objects: {
        expires: $expires
        value: $loginToken
        requestCookie: $requestCookie
        approved: false
        user: {
          data: { email: $email }
          on_conflict: { constraint: user_email_key, update_columns: updated }
        }
      }
      on_conflict: {
        constraint: loginToken_pkey
        update_columns: [created, value, expires, requestCookie, approved]
      }
    ) {
      affected_rows
    }
  }
`;

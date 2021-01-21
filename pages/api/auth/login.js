import gql from 'graphql-tag';
import Joi from 'joi';

import graphql from 'src/server/graphql';
import auth from 'src/server/auth';
import request from 'src/server/request';

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

      return res.status(400).json({ error: true, message: errorDetail.message });
    }

    const email = value.email.toLowerCase();

    const loginToken = auth.generateLoginToken();

    const requestMetadata = request.parse(req);
    const domain = request.getDomain(req);

    // update/create user & update/create loginToken
    // the stored token is used to confirm and complete login
    const upsertLoginTokenWithUserResult = await graphql.query(upsertLoginTokenWithUser, {
      variables: {
        // user
        email,

        // metadata for login token (user agent, ip, etc.)
        ...requestMetadata,
        domain,
        // loginToken contains secret and expires
        ...loginToken,
      },
    });

    const [{ id: loginTokenId, userId }] = upsertLoginTokenWithUserResult.insert_loginToken.returning;

    // store loginToken id in cookie
    // returns a jwtToken for requesting the single loginToken request
    // returns phrase for check email modal
    const { jwtToken, phrase } = auth.setupLoginRequest(req, res, loginTokenId, loginToken.secret);

    return res.status(200).json({
      error: false,
      phrase,
      jwtToken,
    });
  } catch (e) {
    console.error(e);

    return res.status(400).json({ error: true, message: e.message, stack: e.stack.split('\n') });
  }
}

const upsertLoginTokenWithUser = gql`
  mutation UpsertLoginTokenWithUser(
    $email: String!
    $secret: String!
    $expires: timestamptz!
    $ip: String!
    $userAgent: String!
    $userAgentRaw: String!
    $geo: jsonb!
    $domain: String!
  ) {
    insert_loginToken(
      objects: {
        secret: $secret
        expires: $expires
        approved: false
        email: $email
        ip: $ip
        userAgent: $userAgent
        userAgentRaw: $userAgentRaw
        geo: $geo
        domain: $domain
        user: { data: { email: $email }, on_conflict: { constraint: user_email_key, update_columns: updated } }
      }
    ) {
      returning {
        id
        userId
      }
    }
  }
`;

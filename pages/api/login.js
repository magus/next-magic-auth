import gql from 'graphql-tag';
import Joi from 'joi';

import graphql from '../../src/server/graphql';
import jwt from '../../src/server/jwt';

// schema for validating username and password
const schema = Joi.object({
  email: Joi.string().email().required(),
});

export default async function login(req, res) {
  try {
    const form = JSON.parse(req.body);
    const { error, value } = schema.validate(form);

    console.debug({ form, error, value });

    if (error) {
      const [errorDetail] = error.details;

      return res
        .status(400)
        .json({ error: true, message: errorDetail.message });
    }

    // get the user for this email
    const { email } = value;
    const {
      data: userByEmailData,
      error: userByEmailError,
    } = await graphql.query(userByEmail, {
      variables: { email },
    });

    if (userByEmailError) {
      return res.status(500).json({ error: true, message: userByEmailError });
    }

    let user;

    if (userByEmailData.user.length) {
      const [foundUserByEmail] = userByEmailData.user;
      user = foundUserByEmail;
    } else {
      // no user, create user
      const { data, error } = await graphql.query(createUser, {
        variables: { email },
      });

      const [createdUser] = data.insert_user.returning;
      user = createdUser;
    }

    // const jwtToken = jwt.generateJWTToken(user);

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

const userByEmailString = `
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

query UserByEmail($email: String!) {
  user(where: { email: { _eq: $email } }) {
    ...UserForLoginFragment
  }
}
`;

const userByEmail = gql`
  ${UserForLoginFragment}

  query UserByEmail($email: String!) {
    user(where: { email: { _eq: $email } }) {
      ...UserForLoginFragment
    }
  }
`;

const createUser = gql`
  ${UserForLoginFragment}

  mutation CreateUser($email: String!) {
    insert_user(objects: { email: $email }) {
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

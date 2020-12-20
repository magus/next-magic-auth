import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import config from './config';
import random from '../utils/random';

const defaultAllowedRoles = ['user', 'self'];

export default {
  generateLoginToken: function generateLoginToken() {
    // generate random 64 bytes for login verification
    const token = random.base64(32);

    const expires = new Date(
      Date.now() + config.LOGIN_TOKEN_EXPIRES * 60 * 1000,
    );

    return { token, expires };
  },
  generateJWTToken: function generateJWTToken(user) {
    const allowedRoles = user.roles.map((userRole) => userRole.role.name);
    allowedRoles.push(...defaultAllowedRoles);

    // ensure roles includes defaultRole
    if (!~allowedRoles.indexOf(user.defaultRole)) {
      allowedRoles.push(user.defaultRole);
    }

    const refreshToken = random.base64(32);
    const expires = new Date(Date.now() + config.JWT_TOKEN_EXPIRES * 60 * 1000);
    const token = jwt.sign(
      {
        'https://hasura.io/jwt/claims': {
          'x-hasura-allowed-roles': allowedRoles,
          'x-hasura-default-role': user.defaultRole,
          'x-hasura-user-id': user.id,
        },
      },
      config.JWT_SECRET.key,
      {
        algorithm: config.JWT_SECRET.type,
        expiresIn: `${config.JWT_TOKEN_EXPIRES}m`,
      },
    );

    return { token, expires, refreshToken };
  },
};

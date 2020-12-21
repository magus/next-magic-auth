import { serialize } from 'cookie';

import config from '../server/config';
import cookies from '../shared/cookies';

export default {
  cookies,

  generateCookie: function generateCookie(name, value, extraOptions = {}) {
    const stringValue =
      typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);

    const options = {
      maxAge: config.JWT_COOKIE_EXPIRES * 60 * 1000,
      secure: config.__DEV__ ? false : true,
      httpOnly: true,
      path: '/',
      ...extraOptions,
    };

    if ('maxAge' in options) {
      options.expires = new Date(Date.now() + options.maxAge);
      options.maxAge /= 1000;
    }

    return serialize(name, String(stringValue), options);
  },
};

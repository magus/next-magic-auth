import { serialize } from 'cookie';

import config from './config';

export default {
  clear: clearCookies,
  set: setCookie,
};

function clearCookies(res) {
  setCookie(res, '', { expires: new Date(0) });
}

function setCookie(res, value, cookieOptions) {
  const cookie = generateCookie(config.AUTH_COOKIE, value, {
    ...cookieOptions,
  });

  // set cookie can take an array to return multiple cookies
  // right now we only set a single cookie
  res.setHeader('Set-Cookie', [cookie]);
}

function generateCookie(name, value, extraOptions = {}) {
  const stringValue =
    typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);

  const options = {
    maxAge: config.JWT_COOKIE_EXPIRES * 60 * 1000,
    secure: config.__DEV__ ? false : true,
    httpOnly: true,
    path: '/',
    ...extraOptions,
  };

  if (config.COOKIE_DOMAIN) {
    options.domain = config.COOKIE_DOMAIN;
  }

  if ('maxAge' in options) {
    options.expires = new Date(Date.now() + options.maxAge);
    options.maxAge /= 1000;
  }

  return serialize(name, String(stringValue), options);
}

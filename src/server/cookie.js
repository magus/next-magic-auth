import { serialize } from 'cookie';

import config from './config';

export default {
  clear: clearCookies,
  set: setCookie,
  get: getCookie,
};

const COOKIE_NAME = '__magic__rtk';

function clearCookies(res) {
  setCookie(res, '', { expires: new Date(0) });
}

function getCookie(req) {
  return req.cookies[COOKIE_NAME];
}

function setCookie(res, value, cookieOptions) {
  const cookie = generateCookie(COOKIE_NAME, value, {
    ...cookieOptions,
  });

  // set cookie can take an array to return multiple cookies
  // right now we only set a single cookie
  res.setHeader('Set-Cookie', [cookie]);
}

function generateCookie(name, value, extraOptions = {}) {
  const stringValue = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);

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

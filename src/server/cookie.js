import { serialize } from 'cookie';

import config from './config';
import request from './request';

export default {
  clear: clearCookies,
  set: setCookie,
  get: getCookie,
};

const COOKIE_NAME = '__magic__rtk';

function clearCookies(req, res) {
  setCookie(req, res, '', { expires: new Date(0) });
}

function getCookie(req) {
  return req.cookies[COOKIE_NAME];
}

function setCookie(req, res, value, cookieOptions) {
  const domain = request.getDomain(req);
  const cookie = generateCookie(COOKIE_NAME, value, {
    domain,
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
    secure: __DEV__ ? false : true,
    httpOnly: true,
    path: '/',
    ...extraOptions,
  };

  // if domain from request is in matched allowed domains
  // then use it to specify the domain in cookie options
  // e.g. 'iamnoah.com' will match when used on req from 'magic.iamnoah.com'
  //      and allow the cookie to be shared on all iamnoah.com requests
  if (!__DEV__ && config.ALLOWED_COOKIE_DOMAINS && extraOptions.domain) {
    for (const allowedDomain of config.ALLOWED_COOKIE_DOMAINS) {
      if (!!~extraOptions.domain.indexOf(allowedDomain)) {
        options.domain = allowedDomain;
      }
    }
  }

  if ('maxAge' in options) {
    options.expires = new Date(Date.now() + options.maxAge);
    options.maxAge /= 1000;
  }

  return serialize(name, String(stringValue), options);
}

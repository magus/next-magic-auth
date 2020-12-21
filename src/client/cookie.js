import { parse } from 'cookie';
import cookies from '../shared/cookies';

function getCookies() {
  const cookies = parse(document.cookie);
  return cookies;
}

export default {
  getCookies,

  getJwtToken: function getJwtToken() {
    const documentCookies = getCookies();
    return documentCookies[cookies.jwtToken];
  },
};

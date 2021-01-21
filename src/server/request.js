import geoip from 'geo-from-ip';
import uaParser from 'ua-parser-js';

export default {
  getDomain,
  getRealIP,
  getUserAgent,
  parse,
};

function getDeviceDescription(device) {
  if (device.model) {
    return `${device.model}`;
  } else if (device.type === 'mobile') {
    return 'Mobile';
  } else {
    return 'Desktop';
  }
}

const DOMAIN_REGEX = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/gim;

function getDomain(req) {
  const values = [req.hostname, req.headers.host, req.headers.origin];
  for (const value of values) {
    if (value) {
      const [domain] = value.match(DOMAIN_REGEX);
      if (domain) {
        return domain;
      }
    }
  }
}

function getRealIP(req) {
  return req.headers['x-real-ip'] || req.connection.remoteAddress;
}

function getGeoFromIP(ip) {
  // {
  //   "code": {
  //     "state": "CA",
  //     "country": "US",
  //     "continent": "NA"
  //   },
  //   "city": "San Francisco",
  //   "state": "California",
  //   "country": "United States",
  //   "continent": "North America",
  //   "postal": "94105",
  //   "location": {
  //     "accuracy_radius": 1,
  //     "latitude": 37.7852,
  //     "longitude": -122.3874,
  //     "metro_code": 807,
  //     "time_zone": "America/Los_Angeles"
  //   }
  // }
  const geo = geoip.allData(ip);
  return geo;
}

function getUserAgent(req) {
  const userAgentRaw = req.headers['user-agent'];
  const parsedUserAgent = uaParser(userAgentRaw);
  const { device, os, browser } = parsedUserAgent;
  const deviceDescription = getDeviceDescription(device);
  const commonDescription = `${browser.name} / ${os.name}`;
  const userAgent = `${deviceDescription} (${commonDescription})`;

  return {
    userAgentRaw,
    userAgent,
  };
}

function parse(req) {
  const ip = getRealIP(req);

  return {
    ip,
    geo: getGeoFromIP(ip),
    ...getUserAgent(req),
  };
}

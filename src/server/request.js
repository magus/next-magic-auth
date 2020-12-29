import uaParser from 'ua-parser-js';

export default { parse };

function getDeviceDescription(device) {
  if (device.model) {
    return `${device.model}`;
  } else if (device.type === 'mobile') {
    return 'Mobile';
  } else {
    return 'Desktop';
  }
}

function parse(req) {
  const realip = req.headers['x-real-ip'] || req.connection.remoteAddress;
  const ip = realip === '::1' ? 'localhost' : realip;

  const userAgentRaw = req.headers['user-agent'];
  const parsedUserAgent = uaParser(userAgentRaw);
  const { device, os, browser } = parsedUserAgent;
  const deviceDescription = getDeviceDescription(device);
  const commonDescription = `${browser.name} / ${os.name}`;
  const userAgent = `${deviceDescription} (${commonDescription})`;

  return {
    ip,
    userAgentRaw,
    userAgent,
  };
}

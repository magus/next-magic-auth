import uaParser from 'ua-parser-js';

export default { parse };

function getDeviceDescription(device) {
  if (device.vendor && device.model) {
    return `${device.vendor} ${device.model}`;
  } else if (device.vendor) {
    return `${device.vendor}`;
  } else if (device.model) {
    return `${device.model}`;
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
  const commonDescription = `${browser.name} ${browser.major} / ${os.name} ${os.version}`;
  const userAgent = `${deviceDescription} (${commonDescription})`;

  return {
    ip,
    userAgentRaw,
    userAgent,
  };
}

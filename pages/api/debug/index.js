import { convertHRTime } from 'src/server/time';
import request from 'src/server/request';

export default async function handleUserAgent(req, res) {
  const start = process.hrtime();

  const debug = {};
  debug.reqKeys = Object.keys(req);
  debug.getDomain = {
    result: request.getDomain(req),
    values: {
      'req.hostname': req.hostname || '<undefined>',
      'req.headers.host': req.headers.host || '<undefined>',
      'req.headers.origin': req.headers.origin || '<undefined>',
    },
  };

  const time = convertHRTime(process.hrtime(start));
  return res.status(200).json(JSON.stringify({ error: false, debug, time }, null, 2));
}

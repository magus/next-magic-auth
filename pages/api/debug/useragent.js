import { convertHRTime } from 'src/server/time';
import request from 'src/server/request';

export default async function handleUserAgent(req, res) {
  const start = process.hrtime();

  const userAgent = request.getUserAgent(req);

  const time = convertHRTime(process.hrtime(start));

  return res.status(200).json(JSON.stringify({ error: false, ...userAgent, time }, null, 2));
}

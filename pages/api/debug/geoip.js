import geoip from 'geo-from-ip';

import { convertHRTime } from 'src/server/time';
import request from 'src/server/request';

export default async function handleGeoIP(req, res) {
  const start = process.hrtime();

  const ip = req.query.ip || request.getRealIP(req);
  const geo = await geoip.allData(ip);

  const time = convertHRTime(process.hrtime(start));

  if (geo.error) {
    return res.status(404).json(JSON.stringify({ error: true, geo, time }, null, 2));
  }

  return res.status(200).json(JSON.stringify({ error: false, geo, time }, null, 2));
}

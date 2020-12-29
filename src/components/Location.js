export default function Location({ geo }) {
  if (geo.error) {
    return 'Unknown';
  } else if (geo.city && geo.state && geo.country) {
    return `${geo.city} (${geo.state}, ${geo.country})`;
  } else if (geo.city && geo.country) {
    return `${geo.city} (${geo.country})`;
  } else if (geo.country) {
    return geo.country;
  }

  return 'Unknown';
}

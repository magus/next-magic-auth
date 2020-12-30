export default function Location({ rowWithGeo }) {
  if (rowWithGeo) {
    const { geoCity, geoState, geoCountry, geoCountryFull } = rowWithGeo;

    if (geoCity && geoState && geoCountry) {
      return `${geoCity} (${geoState}, ${geoCountry})`;
    } else if (geoCity && geoCountry) {
      return `${geoCity} (${geoCountry})`;
    } else if (geoState && geoCountry) {
      return `${geoState} (${geoCountry})`;
    } else if (geoCountryFull) {
      return geoCountryFull;
    }
  }

  return 'Unknown';
}

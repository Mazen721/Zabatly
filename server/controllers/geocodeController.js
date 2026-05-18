const axios = require('axios');

function formatAddressFromComponents(address, lat, lng) {
  if (!address) {
    return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
  }

  const parts = [
    address.road,
    address.neighbourhood || address.suburb,
    address.city || address.town || address.village,
    address.state,
    address.country,
  ].filter(Boolean);

  return parts.length
    ? parts.join(', ')
    : `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
}

exports.reverseGeocode = async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'lat and lng are required' });
  }

  try {
    const { data } = await axios.get(
      'https://nominatim.openstreetmap.org/reverse',
      {
        params: {
          format: 'json',
          lat,
          lon: lng,
          zoom: 18,
          addressdetails: 1,
        },
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'ZabatlyCarRental/1.0 (car-rental-app)',
        },
        timeout: 10000,
      }
    );

    const address =
      data.display_name || formatAddressFromComponents(data.address, lat, lng);

    res.json({ address, lat, lng });
  } catch (err) {
    console.error('Reverse geocode error:', err.message);
    res.status(502).json({ message: 'Failed to resolve address for this location' });
  }
};

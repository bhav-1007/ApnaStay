const fetch = require("node-fetch");

async function geocodeLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

  const response = await fetch(url, {
    headers: {
      // Nominatim's usage policy requires a real User-Agent identifying your app
      "User-Agent": "ApnaStay/1.0 (learning project)",
    },
  });

  const data = await response.json();

  if (!data || data.length === 0) {
    return null; // location not found
  }

  return {
    type: "Point",
    coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)],
  };
}

module.exports = geocodeLocation;
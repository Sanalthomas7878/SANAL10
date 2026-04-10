const buildLocationAddress = (location) =>
  location ? `${location.areaName}, ${location.city}, ${location.state} - ${location.pinCode}` : '';

module.exports = { buildLocationAddress };

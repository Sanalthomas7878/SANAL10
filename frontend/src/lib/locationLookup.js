export const normalizePinCode = (value = '') => value.replace(/\D/g, '').slice(0, 6);

export const findLocationByPinCode = (locations = [], pinCode = '') =>
  locations.find((location) => location.pinCode === normalizePinCode(pinCode));

export const buildServiceAreaAddress = (location) =>
  location ? `${location.areaName}, ${location.city}, ${location.state} - ${location.pinCode}` : '';

export const getPinCodeStatus = (pinCode, location) => {
  const normalizedPinCode = normalizePinCode(pinCode);

  if (!normalizedPinCode) {
    return 'idle';
  }

  if (normalizedPinCode.length < 6) {
    return 'partial';
  }

  return location ? 'serviceable' : 'unavailable';
};

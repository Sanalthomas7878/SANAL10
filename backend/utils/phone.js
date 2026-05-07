const normalizeIndianPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  return digits;
};

const hasRepeatedDigits = (phone) => /^(\d)\1{9}$/.test(phone);

const getIndianPhoneValidationMessage = (value) => {
  const phone = normalizeIndianPhone(value);

  if (!phone) {
    return 'Phone number is required.';
  }

  if (phone.length !== 10) {
    return 'Enter a valid 10-digit Indian mobile number.';
  }

  if (hasRepeatedDigits(phone)) {
    return 'Phone number cannot contain the same digit repeated 10 times.';
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return 'Enter a valid Indian mobile number starting with 6, 7, 8, or 9.';
  }

  return '';
};

const formatIndianPhone = (value) => `+91 ${normalizeIndianPhone(value)}`;

module.exports = {
  normalizeIndianPhone,
  getIndianPhoneValidationMessage,
  formatIndianPhone,
};

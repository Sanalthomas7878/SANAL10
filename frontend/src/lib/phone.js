export const INDIA_COUNTRY_CODE = '+91';
export const INDIA_COUNTRY_OPTION_LABEL = '🇮🇳 +91';

export const normalizeIndianPhoneInput = (value) =>
  String(value || '').replace(/\D/g, '').slice(0, 10);

const hasRepeatedDigits = (phone) => /^(\d)\1{9}$/.test(phone);

export const isRepeatedDigitIndianPhone = (value) => {
  const phone = normalizeIndianPhoneInput(value);
  return phone.length === 10 && hasRepeatedDigits(phone);
};

export const getIndianPhoneValidationMessage = (value) => {
  const phone = normalizeIndianPhoneInput(value);

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

export const formatIndianPhoneForDisplay = (value) => {
  const digits = String(value || '').replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('91')) {
    return `${INDIA_COUNTRY_CODE} ${digits.slice(2)}`;
  }

  if (digits.length === 10) {
    return `${INDIA_COUNTRY_CODE} ${digits}`;
  }

  return value || '';
};

import React from 'react';
import {
  INDIA_COUNTRY_CODE,
  INDIA_COUNTRY_OPTION_LABEL,
  normalizeIndianPhoneInput,
} from '../lib/phone';

const PhoneField = ({
  id,
  name = 'phone',
  value,
  onChange,
  required = false,
  placeholder = 'Enter 10-digit mobile number',
}) => {
  const handlePhoneChange = (event) => {
    onChange?.({
      target: {
        name,
        value: normalizeIndianPhoneInput(event.target.value),
      },
    });
  };

  return (
    <div className="phone-field">
      <div className="phone-field__group">
        <select
          className="form-input phone-field__country"
          value={INDIA_COUNTRY_CODE}
          onChange={() => {}}
          aria-label="Country code"
        >
          <option value={INDIA_COUNTRY_CODE}>{INDIA_COUNTRY_OPTION_LABEL}</option>
        </select>
        <input
          id={id}
          name={name}
          type="text"
          className="form-input phone-field__number"
          value={value}
          onChange={handlePhoneChange}
          inputMode="numeric"
          maxLength="10"
          pattern="[0-9]*"
          autoComplete="tel-national"
          placeholder={placeholder}
          required={required}
        />
      </div>
    </div>
  );
};

export default PhoneField;

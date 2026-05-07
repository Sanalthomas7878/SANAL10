import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordField = ({ className = '', ...props }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        {...props}
        type={isVisible ? 'text' : 'password'}
        className={`form-input password-field__input ${className}`.trim()}
      />
      <button
        type="button"
        className="password-field__toggle"
        onClick={() => setIsVisible((current) => !current)}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isVisible}
      >
        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordField;

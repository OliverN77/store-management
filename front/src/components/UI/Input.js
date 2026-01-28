import React from 'react';
import './Input.css';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  min,
  max,
  step,
  ...props
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`input ${error ? 'input--error' : ''}`}
        {...props}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default Input;

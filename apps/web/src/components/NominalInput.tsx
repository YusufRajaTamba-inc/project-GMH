import React, { useEffect, useState } from 'react';
import { formatNominal, parseNominal } from '../utils/currency';

export interface NominalInputProps {
  id?: string;
  name?: string;
  value: number | string | undefined | null;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  required?: boolean;
  disabled?: boolean;
  prefix?: string;
  autoFocus?: boolean;
}

export const NominalInput: React.FC<NominalInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = 'misal: 2.000.000',
  className = 'form-input',
  style,
  required = false,
  disabled = false,
  prefix = 'Rp',
  autoFocus = false,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value === undefined || value === null || value === '' || value === 0) return '';
    return formatNominal(value);
  });

  useEffect(() => {
    if (value === undefined || value === null || value === '') {
      setDisplayValue('');
    } else {
      const numVal = typeof value === 'number' ? value : parseNominal(value);
      if (numVal === 0 && displayValue === '') {
        // preserve empty display if user cleared it
      } else {
        setDisplayValue(numVal > 0 ? formatNominal(numVal) : '');
      }
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const cleanDigits = rawInput.replace(/\D/g, '');

    if (!cleanDigits) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const numeric = parseInt(cleanDigits, 10);
    const formatted = formatNominal(numeric);
    setDisplayValue(formatted);
    onChange(numeric);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      {prefix && (
        <span
          style={{
            position: 'absolute',
            left: 10,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--gmh-text-muted)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1,
          }}
        >
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        className={className}
        style={{
          fontWeight: 600,
          fontFamily: 'inherit',
          letterSpacing: 0.3,
          ...style,
          paddingLeft: prefix ? 36 : 12,
        }}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleInputChange}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
      />
    </div>
  );
};

export default NominalInput;

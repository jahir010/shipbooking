import React, { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export default function Select({
  label,
  error,
  options,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className='flex flex-col gap-1'>
      {label && (
        <label className='text-sm font-semibold text-gray-700'>{label}</label>
      )}
      <select
        className={`
          px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
          bg-white
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      >
        <option value=''>Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className='text-red-500 text-sm'>{error}</p>}
    </div>
  );
}

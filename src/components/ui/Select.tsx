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
    <div className='flex flex-col gap-2'>
      {label && (
        <label className='text-xs font-semibold uppercase tracking-[0.18em] text-[#6e8799]'>{label}</label>
      )}
      <select
        className={`
          rounded-2xl border bg-white/92 px-4 py-3 text-[#163b5f] outline-none ring-0
          focus:border-[#7cd4d8] focus:ring-2 focus:ring-[#7cd4d8]/25
          ${error ? 'border-red-400' : 'border-[#d8e3e8]'}
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
      {error && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  );
}

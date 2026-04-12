import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className='flex flex-col gap-2'>
      {label && (
        <label className='text-xs font-semibold uppercase tracking-[0.18em] text-[#6e8799]'>{label}</label>
      )}
      <input
        className={`
          rounded-2xl border bg-white/92 px-4 py-3 text-[#163b5f] outline-none ring-0
          focus:border-[#7cd4d8] focus:ring-2 focus:ring-[#7cd4d8]/25
          ${error ? 'border-red-400' : 'border-[#d8e3e8]'}
          ${className}
        `}
        {...props}
      />
      {error && <p className='text-sm text-red-500'>{error}</p>}
      {helperText && <p className='text-sm text-[#6f8291]'>{helperText}</p>}
    </div>
  );
}

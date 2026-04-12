import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60';

  const variantStyles = {
    primary:
      'bg-[#0f3b68] text-white shadow-[0_14px_32px_rgba(15,59,104,0.22)] hover:bg-[#0a2c4f]',
    secondary:
      'border border-[#d6e1e7] bg-white/92 text-[#163b5f] hover:bg-[#f5f8f8]',
    danger:
      'bg-[#b84d4d] text-white shadow-[0_14px_30px_rgba(184,77,77,0.18)] hover:bg-[#973f3f]',
    success:
      'bg-[#14806c] text-white shadow-[0_14px_30px_rgba(20,128,108,0.18)] hover:bg-[#106756]',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthClass} ${className}`}
      {...props}
    />
  );
}

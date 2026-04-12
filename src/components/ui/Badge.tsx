import React, { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const variantMap = {
  primary: 'bg-[#e2f2f4] text-[#145a73]',
  success: 'bg-[#dff3ea] text-[#187156]',
  warning: 'bg-[#f7edd1] text-[#8b6722]',
  danger: 'bg-[#f7dddd] text-[#9f4747]',
  info: 'bg-[#e3e5f9] text-[#4d569d]',
};

const sizeMap = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-[0.14em] ${variantMap[variant]} ${sizeMap[size]}`}
    >
      {children}
    </span>
  );
}

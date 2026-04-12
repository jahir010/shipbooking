import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-[2rem] border border-white/50 bg-white/78 shadow-[0_20px_50px_rgba(15,59,104,0.08)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

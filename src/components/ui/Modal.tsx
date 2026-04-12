import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-40 flex items-center justify-center bg-[#08233d]/55 p-4 backdrop-blur-sm'>
      <div className={`w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/35 bg-[#f7f5ef]/95 shadow-[0_30px_90px_rgba(8,35,61,0.28)]`}>
        {title && (
          <div className='flex items-center justify-between border-b border-[#d9e4e8] px-6 py-5'>
            <h3 className='font-display text-3xl font-semibold text-[#0f3b68]'>{title}</h3>
            <button
              onClick={onClose}
              className='rounded-full border border-[#d9e4e8] bg-white p-2 text-[#5e7686] hover:text-[#0f3b68]'
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className='p-6'>{children}</div>
      </div>
    </div>
  );
}

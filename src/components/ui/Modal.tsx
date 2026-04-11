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
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40'>
      <div className={`bg-white rounded-lg shadow-xl w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className='flex justify-between items-center border-b p-4'>
            <h3 className='text-lg font-semibold'>{title}</h3>
            <button
              onClick={onClose}
              className='text-gray-500 hover:text-gray-700'
            >
              <X size={24} />
            </button>
          </div>
        )}
        <div className='p-4'>{children}</div>
      </div>
    </div>
  );
}

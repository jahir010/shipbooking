import React, { useMemo, useRef, useState } from 'react';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}

export default function ImageUpload({ label, value, onChange, helperText }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const previewSrc = useMemo(() => value, [value]);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  return (
    <div className='flex flex-col gap-2'>
      <label className='text-sm font-semibold text-gray-700'>{label}</label>
      <div
        className={`rounded-xl border border-dashed p-4 transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
        }`}
        tabIndex={0}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onPaste={(event) => {
          const pastedText = event.clipboardData.getData('text');
          if (pastedText.trim().startsWith('http')) {
            onChange(pastedText.trim());
          }
        }}
      >
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={handleFileChange}
        />
        <div className='flex flex-col items-center justify-center gap-2 text-center'>
          <p className='text-sm font-medium text-gray-700'>Drag & drop an image here</p>
          <p className='text-sm text-gray-500'>or click to browse and upload a local image</p>
          <p className='text-xs text-gray-500'>You can also paste a public image URL while active.</p>
        </div>
      </div>
      {previewSrc ? (
        <div className='mt-2 rounded-lg border border-gray-200 overflow-hidden'>
          <img
            src={previewSrc}
            alt='Image preview'
            className='h-40 w-full object-cover'
          />
        </div>
      ) : null}
      {helperText && <p className='text-sm text-gray-500'>{helperText}</p>}
    </div>
  );
}

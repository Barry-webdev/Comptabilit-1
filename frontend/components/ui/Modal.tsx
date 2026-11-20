'use client';

import { useEffect, type ReactNode } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  large?: boolean;
};

export default function Modal({ isOpen, onClose, title, children, large }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative z-10 w-full ${large ? 'max-w-3xl' : 'max-w-lg'} rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <h2 id="modal-title" className="text-base font-semibold text-[#172B4D]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#64748B] hover:bg-[#F5F7F6] hover:text-[#172B4D] transition-colors"
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

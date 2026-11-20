import type { ReactNode } from 'react';

type CardProps = {
  titre?: string;
  children: ReactNode;
  className?: string;
};

export default function Card({ titre, children, className = '' }: CardProps) {
  return (
    <div className={['rounded-xl border border-[#E2E8F0] bg-white shadow-sm', className].join(' ')}>
      {titre && (
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <h2 className="text-base font-semibold text-[#172B4D]">{titre}</h2>
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

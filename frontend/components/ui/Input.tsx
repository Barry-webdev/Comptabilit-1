import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  erreur?: string;
};

export default function Input({ label, erreur, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#172B4D]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={[
          'rounded-md border px-3 py-2 text-sm text-[#172B4D] placeholder-[#64748B] transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[#176B45] focus:border-[#176B45]',
          erreur
            ? 'border-[#DC2626] bg-[#DC2626]/5'
            : 'border-[#CBD5E1] bg-white hover:border-[#176B45]/50',
          'disabled:bg-[#F5F7F6] disabled:text-[#64748B] disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      />
      {erreur && <p className="text-xs text-[#DC2626]">{erreur}</p>}
    </div>
  );
}

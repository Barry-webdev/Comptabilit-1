import type { SelectHTMLAttributes } from 'react';

type Option = { value: string; label: string };

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Option[];
  erreur?: string;
};

export default function Select({ label, options, erreur, id, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#172B4D]">
          {label}
        </label>
      )}
      <select
        id={id}
        className={[
          'rounded-md border px-3 py-2 text-sm text-[#172B4D] bg-white transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[#176B45] focus:border-[#176B45]',
          erreur
            ? 'border-[#DC2626] bg-[#DC2626]/5'
            : 'border-[#CBD5E1] hover:border-[#176B45]/50',
          'disabled:bg-[#F5F7F6] disabled:text-[#64748B] disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {erreur && <p className="text-xs text-[#DC2626]">{erreur}</p>}
    </div>
  );
}

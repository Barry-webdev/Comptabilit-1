import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[#176B45] text-white hover:bg-[#0f4f31] active:bg-[#0a3a24] disabled:bg-[#176B45]/40',
  secondary:
    'bg-white text-[#172B4D] border border-[#CBD5E1] hover:bg-[#F5F7F6] active:bg-[#E2E8F0] disabled:text-[#64748B]',
  danger:
    'bg-[#DC2626] text-white hover:bg-[#b91c1c] active:bg-[#991b1b] disabled:bg-[#DC2626]/40',
  ghost:
    'bg-transparent text-[#172B4D] hover:bg-[#F5F7F6] active:bg-[#E2E8F0] disabled:text-[#64748B]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#176B45] focus:ring-offset-2 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}

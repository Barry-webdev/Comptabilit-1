type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

type BadgeProps = {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
};

const variantClasses: Record<Variant, string> = {
  success: 'bg-[#16A34A]/10 text-[#16A34A]',
  warning: 'bg-[#D97706]/10 text-[#D97706]',
  error:   'bg-[#DC2626]/10 text-[#DC2626]',
  info:    'bg-[#172B4D]/10 text-[#172B4D]',
  neutral: 'bg-[#64748B]/10 text-[#64748B]',
};

export default function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

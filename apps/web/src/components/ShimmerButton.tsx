import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'emerald' | 'sky' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ShimmerButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ShimmerButtonProps) {
  const variantStyles = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 border-indigo-500 font-bold',
    emerald:
      'bg-brand-emerald hover:bg-emerald-600 text-dark-950 font-black shadow-lg shadow-brand-emerald/30 border-transparent',
    sky:
      'bg-brand-sky hover:bg-sky-400 text-dark-950 font-black shadow-lg shadow-brand-sky/30 border-transparent',
    outline:
      'bg-[#1C2329]/90 hover:bg-[#252E37] text-white border-[#2E3842] hover:border-slate-500 shadow-md',
  }[variant];

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-xl font-bold gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-xl font-extrabold gap-2',
    lg: 'px-7 py-3.5 text-base rounded-2xl font-black gap-2.5',
  }[size];

  return (
    <button
      {...props}
      className={`group relative inline-flex items-center justify-center overflow-hidden border transition-all duration-300 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${variantStyles} ${sizeStyles} ${className}`}
    >
      {/* Dynamic shimmer reflection sweep */}
      <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:animate-[shimmer-slide_1.5s_infinite] pointer-events-none" />

      {/* Button Content */}
      <span className="relative z-10 flex items-center">{children}</span>
    </button>
  );
}


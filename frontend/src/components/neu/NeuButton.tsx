import React from 'react'

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'yellow' | 'pink' | 'cyan' | 'green' | 'black' | 'white'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  snapScale?: boolean
}

export function NeuButton({
  children,
  variant = 'yellow',
  size = 'md',
  className = '',
  snapScale = true,
  ...props
}: NeuButtonProps) {
  const variantClasses = {
    yellow: 'bg-[#F7CB46] text-black hover:bg-[#f6c22f]',
    pink: 'bg-[#FE90E8] text-black hover:bg-[#fd74e2]',
    cyan: 'bg-[#C0F7FE] text-black hover:bg-[#a5f3fd]',
    green: 'bg-[#99E885] text-black hover:bg-[#83e26c]',
    black: 'bg-black text-white hover:bg-slate-900',
    white: 'bg-white text-black hover:bg-slate-50',
  }[variant]

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }[size]

  // Sudden 1-to-1 scale snaps and fast industrial timing (0% blur)
  const scaleClasses = snapScale
    ? 'neu-btn-snap transform active:scale-95 hover:scale-102 transition-all duration-100 ease-out'
    : 'neu-btn'

  return (
    <button
      className={`${scaleClasses} rounded-none font-bold uppercase tracking-wider ${variantClasses} ${sizeClasses} ${className}`}
      style={{ filter: 'none' }}
      {...props}
    >
      {children}
    </button>
  )
}

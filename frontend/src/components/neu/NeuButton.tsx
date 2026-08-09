import React from 'react'

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'yellow' | 'pink' | 'cyan' | 'green' | 'black' | 'white'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function NeuButton({
  children,
  variant = 'yellow',
  size = 'md',
  className = '',
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

  return (
    <button
      className={`neu-btn rounded-none font-bold uppercase tracking-wider ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

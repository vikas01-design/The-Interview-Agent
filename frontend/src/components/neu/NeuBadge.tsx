import React from 'react'

interface NeuBadgeProps {
  children: React.ReactNode
  variant?: 'yellow' | 'pink' | 'cyan' | 'green' | 'cream' | 'black' | 'white'
  className?: string
}

export function NeuBadge({ children, variant = 'yellow', className = '' }: NeuBadgeProps) {
  const variantClasses = {
    yellow: 'bg-[#F7CB46] text-black',
    pink: 'bg-[#FE90E8] text-black',
    cyan: 'bg-[#C0F7FE] text-black',
    green: 'bg-[#99E885] text-black',
    cream: 'bg-[#FFDC8B] text-black',
    black: 'bg-black text-white',
    white: 'bg-white text-black',
  }[variant]

  return (
    <span
      className={`neu-badge rounded-none px-2.5 py-0.5 text-[11px] font-mono font-black border-2 border-black inline-flex items-center gap-1 ${variantClasses} ${className}`}
    >
      {children}
    </span>
  )
}

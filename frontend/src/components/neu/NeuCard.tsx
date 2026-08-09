import React from 'react'

interface NeuCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  color?: 'white' | 'yellow' | 'pink' | 'cyan' | 'green' | 'cream' | 'black'
  className?: string
}

export function NeuCard({ children, color = 'white', className = '', ...props }: NeuCardProps) {
  const bgClasses = {
    white: 'bg-white text-black',
    yellow: 'bg-[#F7CB46] text-black',
    pink: 'bg-[#FE90E8] text-black',
    cyan: 'bg-[#C0F7FE] text-black',
    green: 'bg-[#99E885] text-black',
    cream: 'bg-[#FFDC8B] text-black',
    black: 'bg-black text-white',
  }[color]

  return (
    <div
      className={`border-3 border-black shadow-neu rounded-none p-5 ${bgClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

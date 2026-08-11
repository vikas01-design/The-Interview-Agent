import React from 'react'

interface NeuCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  color?: 'white' | 'yellow' | 'pink' | 'cyan' | 'green' | 'cream' | 'black'
  className?: string
  hoverSnap?: boolean
  revealOnScroll?: boolean
}

export function NeuCard({
  children,
  color = 'white',
  className = '',
  hoverSnap = true,
  revealOnScroll = false,
  ...props
}: NeuCardProps) {
  const bgClasses = {
    white: 'bg-white text-black',
    yellow: 'bg-[#F7CB46] text-black',
    pink: 'bg-[#FE90E8] text-black',
    cyan: 'bg-[#C0F7FE] text-black',
    green: 'bg-[#99E885] text-black',
    cream: 'bg-[#FFDC8B] text-black',
    black: 'bg-black text-white',
  }[color]

  const hoverClasses = hoverSnap
    ? 'neu-card-snap hover:scale-[1.015] active:scale-[0.985] transition-transform duration-100 ease-out'
    : ''

  const revealClasses = revealOnScroll ? 'reveal-on-scroll' : ''

  return (
    <div
      className={`border-3 border-black shadow-neu rounded-none p-5 ${bgClasses} ${hoverClasses} ${revealClasses} ${className}`}
      style={{ filter: 'none' }}
      {...props}
    >
      {children}
    </div>
  )
}

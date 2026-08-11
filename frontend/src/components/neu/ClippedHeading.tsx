import React, { useRef, useEffect, useState } from 'react'

interface ClippedHeadingProps {
  children: React.ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'span'
  className?: string
  innerClassName?: string
  delay?: number // in ms
  immediate?: boolean
}

/**
 * ClippedHeading Component
 * Implements the typography spec: "The whole heading sliding up from a clipped container"
 * Outer container has `overflow: hidden` and `clip-container`
 * Inner heading element slides up from translateY(110%) to translateY(0) with fast, snappy, industrial movement.
 */
export function ClippedHeading({
  children,
  as: Tag = 'h2',
  className = '',
  innerClassName = '',
  delay = 0,
  immediate = false,
}: ClippedHeadingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(immediate)

  useEffect(() => {
    if (immediate) {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setInView(true), delay)
          } else {
            setInView(true)
          }
          if (containerRef.current) observer.unobserve(containerRef.current)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [delay, immediate])

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden block max-w-full ${className}`}
      style={{ isolation: 'isolate' }}
    >
      <Tag
        className={`block transition-transform duration-300 filter-none ${
          inView ? 'translate-y-0 opacity-100' : 'translate-y-[115%] opacity-100'
        } ${innerClassName}`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          filter: 'none',
          willChange: 'transform',
        }}
      >
        {children}
      </Tag>
    </div>
  )
}

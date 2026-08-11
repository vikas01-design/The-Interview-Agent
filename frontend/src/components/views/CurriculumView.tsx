import { NeuCard } from '../neu/NeuCard'
import { NeuBadge } from '../neu/NeuBadge'
import { ClippedHeading } from '../neu/ClippedHeading'
import type { Candidate } from '../../types'
import { useScrollReveal } from '../../utils/useScrollReveal'

interface Props {
  candidate: Candidate
}

export function CurriculumView({ candidate }: Props) {
  useScrollReveal()
  const missions = candidate.missions

  return (
    <div className="max-w-7xl mx-auto space-y-10 md:space-y-12 pb-12">
      
      {/* Header */}
      <div className="space-y-2 border-b-3 border-black pb-4 reveal-on-scroll">
        <NeuBadge variant="yellow">JOURNEY MAP</NeuBadge>
        
        <ClippedHeading
          as="h1"
          innerClassName="text-clamp-heading font-black uppercase text-black"
          immediate={true}
        >
          31-DAY AI ENGINEERING JOURNEY
        </ClippedHeading>

        <p className="text-sm font-bold text-slate-700">
          Interactive cohort mission status, completion verification, and technical topic mapping for {candidate.member.name}.
        </p>
      </div>

      {/* 31 Day Responsive Grid using responsive-grid spec */}
      <div className="responsive-grid">
        {missions.map((m) => {
          const isPassed = m.passed
          const isSkipped = m.skipped

          return (
            <NeuCard
              key={m.day}
              color={isPassed ? 'white' : isSkipped ? 'pink' : 'white'}
              className={`space-y-3 ${isPassed ? 'border-l-8 border-l-[#99E885]' : isSkipped ? 'border-l-8 border-l-[#FE90E8]' : ''}`}
              hoverSnap={true}
              revealOnScroll={true}
            >
              <div className="flex items-center justify-between">
                <NeuBadge variant={isPassed ? 'green' : isSkipped ? 'pink' : 'black'}>
                  DAY {m.day < 10 ? `0${m.day}` : m.day}
                </NeuBadge>
                <span className="font-mono text-xs font-black">
                  {isPassed ? '✓ COMPLETED' : isSkipped ? '⚠ SKIPPED' : '○ PENDING'}
                </span>
              </div>

              <h4 className="font-black text-base uppercase text-black line-clamp-1">{m.title}</h4>

              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-600 pt-2 border-t border-slate-200">
                <span>ATTEMPTS: {m.attempts || 1}</span>
                <span>STATUS: {isPassed ? 'PASSED' : 'UNTESTED'}</span>
              </div>
            </NeuCard>
          )
        })}
      </div>
    </div>
  )
}

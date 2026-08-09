import { NeuCard } from '../neu/NeuCard'
import { NeuBadge } from '../neu/NeuBadge'
import type { Candidate } from '../../types'

interface Props {
  candidate: Candidate
}

export function CurriculumView({ candidate }: Props) {
  const missions = candidate.missions

  return (
    <div className="max-w-7xl mx-auto space-y-10 md:space-y-12 pb-12">
      
      {/* Header */}
      <div className="space-y-2 border-b-3 border-black pb-4">
        <NeuBadge variant="yellow">JOURNEY MAP</NeuBadge>
        <h1 className="text-3xl md:text-5xl font-black uppercase text-black">
          31-DAY AI ENGINEERING JOURNEY
        </h1>
        <p className="text-sm font-bold text-slate-700">
          Interactive cohort mission status, completion verification, and technical topic mapping for {candidate.member.name}.
        </p>
      </div>

      {/* 31 Day Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {missions.map((m) => {
          const isPassed = m.passed
          const isSkipped = m.skipped

          return (
            <NeuCard
              key={m.day}
              color={isPassed ? 'white' : isSkipped ? 'pink' : 'white'}
              className={`space-y-3 ${isPassed ? 'border-l-8 border-l-[#99E885]' : isSkipped ? 'border-l-8 border-l-[#FE90E8]' : ''}`}
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

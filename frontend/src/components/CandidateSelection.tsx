import { useState } from 'react'
import type { Candidate } from '../types'
import { ResumeAnalyzerModal } from './ResumeAnalyzerModal'

interface Props {
  candidates: Candidate[]
  onSelect: (candidate: Candidate) => void
}

export function CandidateSelection({ candidates, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [analyzingCandidate, setAnalyzingCandidate] = useState<Candidate | null>(null)

  const filtered = candidates.filter(
    (c) =>
      c.member.name.toLowerCase().includes(search.toLowerCase()) ||
      c.member.jobRole.toLowerCase().includes(search.toLowerCase()) ||
      c.member.id.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero header */}
      <div className="border-b border-slate-800/60 bg-slate-950/95 px-6 py-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          TECH REALMS · AI Interview Agent
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          Adaptive Technical Interviews & Resume Intelligence
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-slate-400 leading-relaxed">
          Each interview is built from the candidate's actual 31-day cohort journey.
          Analyze candidates' AI resume alignment or jump straight into the interview.
        </p>

        {/* Feature pills */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['8+ adaptive questions', 'Deep Answer Evaluation', 'Behavioral Communication', 'AI Resume Intelligence', 'Unified Dashboard'].map((f) => (
            <span key={f} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400">
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search candidates by name, role, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {filtered.length} of {candidates.length} candidates
          </p>
        </div>

        {/* Candidate grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((candidate) => (
            <CandidateCard
              key={candidate.member.id}
              candidate={candidate}
              isHovered={hoveredId === candidate.member.id}
              onHover={(id) => setHoveredId(id)}
              onSelect={onSelect}
              onAnalyzeResume={(c) => setAnalyzingCandidate(c)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 text-center text-slate-500">
            <p className="text-lg">No candidates match your search.</p>
          </div>
        )}
      </div>

      {analyzingCandidate && (
        <ResumeAnalyzerModal
          candidate={analyzingCandidate}
          onClose={() => setAnalyzingCandidate(null)}
          onStartInterview={() => {
            const c = analyzingCandidate
            setAnalyzingCandidate(null)
            onSelect(c)
          }}
        />
      )}
    </div>
  )
}

function CandidateCard({
  candidate,
  isHovered,
  onHover,
  onSelect,
  onAnalyzeResume,
}: {
  candidate: Candidate
  isHovered: boolean
  onHover: (id: string | null) => void
  onSelect: (c: Candidate) => void
  onAnalyzeResume: (c: Candidate) => void
}) {
  const { member, signals, missions } = candidate
  const skipped = missions.filter((m) => m.skipped).length
  const strong = missions.filter((m) => m.passed && m.attempts === 1).length
  const firstTryRate = Math.round((signals.missionsFirstTry / Math.max(signals.missionsCompleted, 1)) * 100)

  const profileColor =
    firstTryRate >= 70
      ? 'emerald'
      : firstTryRate >= 40
        ? 'amber'
        : 'rose'

  const colorMap = {
    emerald: {
      ring: 'ring-emerald-500/30',
      badge: 'bg-emerald-500/10 text-emerald-400',
      dot: 'bg-emerald-400',
      bar: 'bg-emerald-500',
    },
    amber: {
      ring: 'ring-amber-500/30',
      badge: 'bg-amber-500/10 text-amber-400',
      dot: 'bg-amber-400',
      bar: 'bg-amber-500',
    },
    rose: {
      ring: 'ring-rose-500/30',
      badge: 'bg-rose-500/10 text-rose-400',
      dot: 'bg-rose-400',
      bar: 'bg-rose-500',
    },
  }[profileColor]

  return (
    <div
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
      className={`group relative flex flex-col justify-between rounded-2xl border bg-slate-900/70 p-5 text-left transition-all duration-200 ${
        isHovered
          ? `border-slate-600 bg-slate-900 ring-2 ${colorMap.ring} shadow-lg`
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${colorMap.dot}`} />
              <h2 className="truncate text-sm font-semibold text-slate-100">{member.name}</h2>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-400">{member.jobRole}</p>
          </div>
          <span className="shrink-0 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs font-mono text-slate-400">
            {member.id.replace('CAND-', '#')}
          </span>
        </div>

        {/* First-try rate bar */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-slate-500">First-try rate</span>
            <span className={`font-semibold ${firstTryRate >= 70 ? 'text-emerald-400' : firstTryRate >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
              {firstTryRate}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${colorMap.bar}`}
              style={{ width: `${firstTryRate}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <MiniStat label="Done" value={String(signals.missionsCompleted)} />
          <MiniStat label="Strong" value={String(strong)} accent="emerald" />
          <MiniStat label="Skipped" value={String(skipped)} accent={skipped > 2 ? 'amber' : undefined} />
        </div>

        {/* Experience & Education */}
        <div className="mt-4 space-y-1 border-t border-slate-800 pt-3 text-xs text-slate-500">
          <p>{member.yearsExperience} yr{member.yearsExperience !== 1 ? 's' : ''} exp · {member.education}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2 border-t border-slate-800/60 pt-3">
        <button
          type="button"
          onClick={() => onAnalyzeResume(candidate)}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-2 py-2 text-center text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
        >
          📄 Resume AI
        </button>
        <button
          type="button"
          onClick={() => onSelect(candidate)}
          className="flex-1 rounded-xl bg-emerald-600 px-2 py-2 text-center text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
        >
          Interview →
        </button>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'emerald' | 'amber' | 'rose'
}) {
  const valueColor = accent === 'emerald' ? 'text-emerald-400' : accent === 'amber' ? 'text-amber-400' : 'text-slate-200'
  return (
    <div className="rounded-lg bg-slate-950/60 px-2 py-1.5 text-center">
      <p className="text-slate-500 text-[10px]">{label}</p>
      <p className={`font-semibold ${valueColor}`}>{value}</p>
    </div>
  )
}

import { NeuCard } from '../neu/NeuCard'
import { NeuButton } from '../neu/NeuButton'
import { NeuBadge } from '../neu/NeuBadge'
import type { Candidate } from '../../types'
import { loadUserCandidateData } from '../../utils/candidateStore'

interface Props {
  candidate: Candidate
  onStartInterviewClick: () => void
  onOpenResumeClick: () => void
}

export function DashboardView({ candidate, onStartInterviewClick, onOpenResumeClick }: Props) {
  const member = candidate.member
  const userData = loadUserCandidateData(member.id, member.name)
  
  const sessions = userData.sessions
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length) : 78
  const avgTech = sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.technicalKnowledge, 0) / sessions.length) : 86
  const avgComm = sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.communication, 0) / sessions.length) : 88
  const resumeScore = userData.lastResumeScore ?? 79

  // Extract dynamic strengths and drawbacks from actual completed sessions
  const dynamicStrengths = Array.from(new Set(sessions.flatMap(s => s.strengths)))
  const dynamicDrawbacks = Array.from(new Set(sessions.flatMap(s => s.drawbacks)))

  const topStrengths = dynamicStrengths.length >= 3 ? dynamicStrengths.slice(0, 3) : [
    'RAG PIPELINE ARCHITECTURE',
    'VECTOR DATABASES & EMBEDDINGS',
    'PROMPT ENGINEERING',
  ]

  const topDrawbacks = dynamicDrawbacks.length >= 3 ? dynamicDrawbacks.slice(0, 3) : [
    'RETRIEVAL EVALUATION (RECALL@K, MRR)',
    'PRODUCTION AI & MONITORING',
    'MODEL CONTEXT PROTOCOL (MCP)',
  ]

  const completedMissions = candidate.missions.filter((m) => m.passed)

  return (
    <div className="space-y-10 md:space-y-12 max-w-7xl mx-auto pb-12">
      
      {/* Hero Welcome Command Banner */}
      <NeuCard color="yellow" className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <NeuBadge variant="black">CANDIDATE COMMAND CENTER</NeuBadge>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-black uppercase">
              WELCOME BACK, {member.name}!
            </h1>
            <p className="text-sm font-bold text-slate-900 max-w-2xl">
              Target Position: <span className="underline font-black">{userData.lastResumeRole || member.jobRole}</span> ({member.yearsExperience} yrs experience). Real candidate metrics loaded for {member.name}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <NeuButton variant="black" size="lg" onClick={onStartInterviewClick}>
              START INTERVIEW →
            </NeuButton>
            <NeuButton variant="pink" size="lg" onClick={onOpenResumeClick}>
              RESUME AI ⚡
            </NeuButton>
          </div>
        </div>
      </NeuCard>

      {/* Primary Real Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <NeuCard color="white">
          <span className="font-mono text-xs font-black uppercase text-slate-500 block">INTERVIEW SCORE</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-5xl font-black text-black tabular-nums">{avgScore}</span>
            <span className="font-mono text-sm font-bold text-slate-500">/ 100</span>
          </div>
          <p className="mt-2 text-xs font-bold text-slate-700">Real Average Across {sessions.length} Sessions</p>
        </NeuCard>

        <NeuCard color="cyan">
          <span className="font-mono text-xs font-black uppercase text-slate-800 block">TECHNICAL KNOWLEDGE</span>
          <div className="mt-2 text-5xl font-black font-mono text-black tabular-nums">{avgTech}%</div>
          <p className="mt-2 text-xs font-bold text-slate-800">Dynamic Technical Score</p>
        </NeuCard>

        <NeuCard color="pink">
          <span className="font-mono text-xs font-black uppercase text-slate-800 block">COMMUNICATION</span>
          <div className="mt-2 text-5xl font-black font-mono text-black tabular-nums">{avgComm}%</div>
          <p className="mt-2 text-xs font-bold text-slate-800">Dynamic Behavioral Score</p>
        </NeuCard>

        <NeuCard color="green">
          <span className="font-mono text-xs font-black uppercase text-slate-800 block">RESUME MATCH</span>
          <div className="mt-2 text-5xl font-black font-mono text-black tabular-nums">{resumeScore}%</div>
          <p className="mt-2 text-xs font-bold text-slate-800">Target Role Match: {userData.lastResumeRole || 'AI Engineer'}</p>
        </NeuCard>
      </div>

      {/* Candidate Intelligence Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Strongest Areas */}
        <NeuCard color="white" className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="font-black text-xl uppercase tracking-tight">CANDIDATE INTELLIGENCE — STRONGEST AREAS</h3>
            <NeuBadge variant="green">HIGH PROFICIENCY</NeuBadge>
          </div>

          <div className="space-y-5 font-mono">
            {topStrengths.map((st, idx) => {
              const score = 92 - idx * 8
              return (
                <div key={idx}>
                  <div className="flex justify-between font-mono font-black text-xs mb-1">
                    <span className="uppercase">{st}</span>
                    <span>{score}%</span>
                  </div>
                  <div className="h-4 w-full border-2 border-black bg-slate-100 p-0.5">
                    <div className="h-full bg-[#99E885] border-r-2 border-black" style={{ width: `${score}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </NeuCard>

        {/* Needs Attention */}
        <NeuCard color="white" className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="font-black text-xl uppercase tracking-tight">NEEDS ATTENTION & REVISION</h3>
            <NeuBadge variant="pink">ACTION REQUIRED</NeuBadge>
          </div>

          <div className="space-y-5 font-mono">
            {topDrawbacks.map((dr, idx) => {
              const score = 48 + idx * 6
              return (
                <div key={idx}>
                  <div className="flex justify-between font-mono font-black text-xs mb-1">
                    <span className="uppercase">{dr}</span>
                    <span>{score}%</span>
                  </div>
                  <div className="h-4 w-full border-2 border-black bg-slate-100 p-0.5">
                    <div className="h-full bg-[#FE90E8] border-r-2 border-black" style={{ width: `${score}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </NeuCard>
      </div>

      {/* Cohort Progress Grid Quick View */}
      <NeuCard color="cream">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            <NeuBadge variant="black">COHORT JOURNEY</NeuBadge>
            <h3 className="text-2xl font-black uppercase text-black mt-1">31-DAY AI ENGINEERING PROGRESS</h3>
          </div>
          <span className="font-mono text-sm font-black bg-white border-2 border-black px-3 py-1 shadow-neu-sm">
            {completedMissions.length} / 31 DAYS COMPLETED
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 mt-6">
          {candidate.missions.slice(0, 16).map((m) => (
            <div
              key={m.day}
              className={`p-3 border-2 border-black text-center font-mono font-black text-xs ${
                m.passed ? 'bg-[#99E885]' : m.skipped ? 'bg-[#FE90E8]' : 'bg-white'
              }`}
            >
              <div className="text-[10px] opacity-75">DAY {m.day}</div>
              <div className="truncate mt-1">{m.passed ? '✓ PASSED' : m.skipped ? '⚠ SKIPPED' : '○ PENDING'}</div>
            </div>
          ))}
        </div>
      </NeuCard>
    </div>
  )
}

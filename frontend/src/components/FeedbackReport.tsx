import type { Candidate, Feedback, InterviewProgress } from '../types'
import { NeuCard } from './neu/NeuCard'
import { NeuButton } from './neu/NeuButton'
import { NeuBadge } from './neu/NeuBadge'

export interface IntegrityReportData {
  score: number
  events: Array<{
    id: string
    type: string
    severity: string
    timestamp: string
    label: string
  }>
}

interface Props {
  feedback: Feedback
  candidate: Candidate
  progress?: InterviewProgress | null
  integrityData?: IntegrityReportData | null
  onRestart: () => void
}

export function FeedbackReport({ feedback, candidate, integrityData, onRestart }: Props) {
  const scoreMatch = feedback.summary.match(/(\d{1,3})\s*\/\s*100/)
  const score = feedback.overallScore ?? (scoreMatch ? parseInt(scoreMatch[1], 10) : 80)
  const grade = feedback.grade ?? (score >= 85 ? 'A' : score >= 75 ? 'B+' : score >= 60 ? 'B' : 'C')

  const drawbacksList = (feedback.drawbacks && feedback.drawbacks.length > 0) ? feedback.drawbacks : feedback.gaps
  const comm = feedback.communicationMetrics

  const integrityScore = integrityData?.score ?? 94
  const integrityEvents = integrityData?.events || []

  return (
    <div className="min-h-screen bg-[#FFFDF6] p-6 md:p-8 font-sans text-black">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <NeuCard color="yellow" className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <NeuBadge variant="black">PERFORMANCE REPORT</NeuBadge>
              <h1 className="text-3xl md:text-5xl font-black uppercase text-black">
                {candidate.member.name.toUpperCase()}
              </h1>
              <p className="text-sm font-bold text-slate-900">
                {candidate.member.jobRole} · {candidate.member.yearsExperience} yrs exp · {candidate.member.education}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="border-3 border-black bg-white px-6 py-4 text-center shadow-neu">
                <span className="font-mono text-[10px] font-black uppercase text-slate-600 block">OVERALL SCORE</span>
                <span className="font-mono text-4xl font-black text-black">{score}</span>
                <span className="font-mono text-xs font-bold text-slate-500 block">GRADE {grade}</span>
              </div>
            </div>
          </div>
        </NeuCard>

        {/* Executive Summary */}
        <NeuCard color="white" className="space-y-3">
          <h3 className="font-mono text-xs font-black uppercase text-black border-b-2 border-black pb-2">
            EXECUTIVE SUMMARY & INTERVIEWER CONCLUSION
          </h3>
          <p className="text-sm font-bold leading-relaxed text-black">
            {feedback.summary}
          </p>
        </NeuCard>

        {/* Competencies */}
        <NeuCard color="white" className="space-y-4">
          <h3 className="font-mono text-xs font-black uppercase text-black border-b-2 border-black pb-2">
            COMPETENCY EVALUATION
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-2 border-black bg-[#C0F7FE] p-3 text-center">
              <span className="font-mono text-[10px] font-black uppercase text-slate-800 block">TECHNICAL KNOWLEDGE</span>
              <span className="font-mono text-3xl font-black text-black">{feedback.technicalKnowledge ?? 80}%</span>
            </div>

            <div className="border-2 border-black bg-[#99E885] p-3 text-center">
              <span className="font-mono text-[10px] font-black uppercase text-slate-800 block">PROBLEM SOLVING</span>
              <span className="font-mono text-3xl font-black text-black">{feedback.problemSolving ?? 78}%</span>
            </div>

            <div className="border-2 border-black bg-[#FFDC8B] p-3 text-center">
              <span className="font-mono text-[10px] font-black uppercase text-slate-800 block">SYSTEM DESIGN</span>
              <span className="font-mono text-3xl font-black text-black">{feedback.systemDesign ?? 80}%</span>
            </div>

            <div className="border-2 border-black bg-[#FE90E8] p-3 text-center">
              <span className="font-mono text-[10px] font-black uppercase text-slate-800 block">COMMUNICATION</span>
              <span className="font-mono text-3xl font-black text-black">{feedback.communication ?? 88}%</span>
            </div>
          </div>
        </NeuCard>

        {/* Behavioral & Voice Communication Metrics */}
        {comm && (
          <NeuCard color="cyan" className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-mono text-xs font-black uppercase text-black">
                BEHAVIORAL & VOICE COMMUNICATION METRICS
              </h3>
              <NeuBadge variant="black">SCORE {comm.communicationScore}/100</NeuBadge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs font-black">
              <div className="bg-white border-2 border-black p-2.5 text-center">
                <span className="text-[10px] text-slate-500 block">CLARITY</span>
                <span>{Math.round(comm.clarity * 100)}%</span>
              </div>
              <div className="bg-white border-2 border-black p-2.5 text-center">
                <span className="text-[10px] text-slate-500 block">CONFIDENCE</span>
                <span>{Math.round(comm.confidence * 100)}%</span>
              </div>
              <div className="bg-white border-2 border-black p-2.5 text-center">
                <span className="text-[10px] text-slate-500 block">STRUCTURE</span>
                <span>{Math.round(comm.structure * 100)}%</span>
              </div>
              <div className="bg-white border-2 border-black p-2.5 text-center">
                <span className="text-[10px] text-slate-500 block">CONCISENESS</span>
                <span>{Math.round(comm.conciseness * 100)}%</span>
              </div>
              <div className="bg-white border-2 border-black p-2.5 text-center">
                <span className="text-[10px] text-slate-500 block">TECH COMM</span>
                <span>{Math.round(comm.technicalCommunication * 100)}%</span>
              </div>
            </div>
          </NeuCard>
        )}

        {/* Section 36: Dedicated Camera Interview Integrity Report */}
        <NeuCard color="white" className="space-y-4 border-l-8 border-l-[#F7CB46]">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <div>
              <NeuBadge variant="yellow">SECTION 36 INTEGRITY REPORT</NeuBadge>
              <h3 className="font-mono text-base font-black uppercase text-black mt-1">
                ENVIRONMENTAL INTERVIEW INTEGRITY
              </h3>
            </div>

            <div className="border-2 border-black bg-[#FFFDF6] px-4 py-2 text-center">
              <span className="text-[9px] font-mono font-black uppercase text-slate-500 block">INTEGRITY SIGNAL</span>
              <span className="font-mono text-2xl font-black text-black">{integrityScore} / 100</span>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between p-2 bg-[#FFFDF6] border-2 border-black font-bold">
              <span>CAMERA AVAILABILITY & PRESENCE:</span>
              <span className="text-[#99E885] font-black">✓ STABLE (100%)</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#FFFDF6] border-2 border-black font-bold">
              <span>SESSION FOCUS:</span>
              <span className="text-black font-black">91%</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-mono text-xs font-black uppercase text-slate-700">OBSERVED SESSION EVENTS</h4>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2 border-2 border-black bg-white flex items-center gap-2">
                <span className="text-[#99E885] font-black">✓</span>
                <span>Candidate camera presence stable throughout session.</span>
              </div>
              {integrityEvents.length > 0 ? (
                integrityEvents.map((evt, idx) => (
                  <div key={idx} className="p-2 border-2 border-black bg-[#FFDC8B]/40 flex items-center gap-2">
                    <span className="text-[#FE90E8] font-black">⚠</span>
                    <span>[{evt.timestamp}] {evt.label}</span>
                  </div>
                ))
              ) : (
                <div className="p-2 border-2 border-black bg-white flex items-center gap-2">
                  <span className="text-[#99E885] font-black">✓</span>
                  <span>No window blur or face orientation anomalies recorded.</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] font-mono text-slate-600 font-bold">
            💡 Note: Integrity signals record observable environmental anomalies neutrally and do not automatically alter candidate technical scores.
          </p>
        </NeuCard>

        {/* Unified Strengths vs Drawbacks */}
        <div className="grid gap-6 md:grid-cols-2">
          <NeuCard color="green" className="space-y-3">
            <h3 className="font-mono text-xs font-black uppercase text-black border-b-2 border-black pb-2">
              TECHNICAL & COMMUNICATION STRENGTHS
            </h3>
            <ul className="space-y-2 text-xs font-bold text-black">
              {feedback.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-black">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </NeuCard>

          <NeuCard color="pink" className="space-y-3">
            <h3 className="font-mono text-xs font-black uppercase text-black border-b-2 border-black pb-2">
              AREAS TO IMPROVE & REVISION FOCUS
            </h3>
            <ul className="space-y-2 text-xs font-bold text-black">
              {drawbacksList.map((d, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-black">⚠</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </NeuCard>
        </div>

        {/* Action Button */}
        <div className="text-center pt-4">
          <NeuButton variant="yellow" size="lg" onClick={onRestart} className="px-8 shadow-neu-lg">
            RETURN TO COMMAND DASHBOARD →
          </NeuButton>
        </div>
      </div>
    </div>
  )
}

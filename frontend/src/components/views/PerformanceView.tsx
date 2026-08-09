import { NeuCard } from '../neu/NeuCard'
import { NeuBadge } from '../neu/NeuBadge'
import type { Candidate } from '../../types'

interface Props {
  candidate: Candidate
}

export function PerformanceView({ candidate }: Props) {
  const member = candidate.member

  return (
    <div className="max-w-7xl mx-auto space-y-10 md:space-y-12 pb-12">
      
      {/* Header */}
      <div className="space-y-2 border-b-3 border-black pb-4">
        <NeuBadge variant="pink">ANALYTICS WORKSPACE</NeuBadge>
        <h1 className="text-3xl md:text-5xl font-black uppercase text-black">
          PERFORMANCE DASHBOARD
        </h1>
        <p className="text-sm font-bold text-slate-700">
          In-depth technical knowledge breakdown, communication scoring, and topic mastery metrics for {member.name}.
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <NeuCard color="yellow">
          <span className="font-mono text-[10px] font-black uppercase text-black">OVERALL SCORE</span>
          <div className="mt-1 text-4xl font-black font-mono text-black">82 / 100</div>
          <span className="text-[10px] font-bold text-slate-900 mt-1 block">GRADE: B+</span>
        </NeuCard>

        <NeuCard color="cyan">
          <span className="font-mono text-[10px] font-black uppercase text-black">TECHNICAL SCORE</span>
          <div className="mt-1 text-4xl font-black font-mono text-black">86%</div>
          <span className="text-[10px] font-bold text-slate-900 mt-1 block">CONCEPT MASTERY</span>
        </NeuCard>

        <NeuCard color="green">
          <span className="font-mono text-[10px] font-black uppercase text-black">PROBLEM SOLVING</span>
          <div className="mt-1 text-4xl font-black font-mono text-black">78%</div>
          <span className="text-[10px] font-bold text-slate-900 mt-1 block">TRADE-OFF ANALYSIS</span>
        </NeuCard>

        <NeuCard color="pink">
          <span className="font-mono text-[10px] font-black uppercase text-black">COMMUNICATION</span>
          <div className="mt-1 text-4xl font-black font-mono text-black">88%</div>
          <span className="text-[10px] font-bold text-slate-900 mt-1 block">CLARITY & STRUCTURE</span>
        </NeuCard>

        <NeuCard color="cream">
          <span className="font-mono text-[10px] font-black uppercase text-black">REASONING SCORE</span>
          <div className="mt-1 text-4xl font-black font-mono text-black">81%</div>
          <span className="text-[10px] font-bold text-slate-900 mt-1 block">LOGICAL STEP-THROUGH</span>
        </NeuCard>
      </div>

      {/* Curriculum Topic Mastery */}
      <NeuCard color="white" className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <h3 className="font-black text-xl uppercase tracking-tight">CURRICULUM TOPIC MASTERY BREAKDOWN</h3>
          <NeuBadge variant="cyan">TOPIC BY TOPIC</NeuBadge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-mono font-black text-xs mb-1">
                <span>RAG PIPELINES & RETRIEVAL</span>
                <span>88%</span>
              </div>
              <div className="h-4 w-full border-2 border-black bg-slate-100 p-0.5">
                <div className="h-full bg-[#99E885] border-r-2 border-black" style={{ width: '88%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono font-black text-xs mb-1">
                <span>VECTOR DATABASES & EMBEDDINGS</span>
                <span>85%</span>
              </div>
              <div className="h-4 w-full border-2 border-black bg-slate-100 p-0.5">
                <div className="h-full bg-[#99E885] border-r-2 border-black" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono font-black text-xs mb-1">
                <span>AGENTIC AI & MULTI-AGENT ORCHESTRATION</span>
                <span>78%</span>
              </div>
              <div className="h-4 w-full border-2 border-black bg-slate-100 p-0.5">
                <div className="h-full bg-[#C0F7FE] border-r-2 border-black" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-mono font-black text-xs mb-1">
                <span>MODEL CONTEXT PROTOCOL (MCP)</span>
                <span>64%</span>
              </div>
              <div className="h-4 w-full border-2 border-black bg-slate-100 p-0.5">
                <div className="h-full bg-[#FFDC8B] border-r-2 border-black" style={{ width: '64%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono font-black text-xs mb-1">
                <span>PRODUCTION DEPLOYMENT & CONTAINERIZATION</span>
                <span>60%</span>
              </div>
              <div className="h-4 w-full border-2 border-black bg-slate-100 p-0.5">
                <div className="h-full bg-[#FFDC8B] border-r-2 border-black" style={{ width: '60%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono font-black text-xs mb-1">
                <span>PRODUCTION AI OBSERVABILITY & EVALUATION</span>
                <span>55%</span>
              </div>
              <div className="h-4 w-full border-2 border-black bg-slate-100 p-0.5">
                <div className="h-full bg-[#FE90E8] border-r-2 border-black" style={{ width: '55%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </NeuCard>

      {/* Answer Quality & Progression Timeline */}
      <NeuCard color="white" className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <h3 className="font-black text-xl uppercase tracking-tight">ANSWER QUALITY PROGRESSION</h3>
          <NeuBadge variant="black">LAST 8 INTERVIEW QUESTIONS</NeuBadge>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 pt-2">
          {[82, 74, 91, 78, 86, 68, 89, 85].map((score, idx) => (
            <div key={idx} className="border-2 border-black bg-[#FFFDF6] p-3 text-center">
              <span className="font-mono text-[10px] font-black text-slate-500 block">Q{idx + 1}</span>
              <span className={`font-mono text-xl font-black ${score >= 80 ? 'text-[#99E885]' : 'text-black'}`}>
                {score}
              </span>
              <span className="text-[9px] font-bold text-slate-600 block mt-1">/ 100</span>
            </div>
          ))}
        </div>
      </NeuCard>
    </div>
  )
}

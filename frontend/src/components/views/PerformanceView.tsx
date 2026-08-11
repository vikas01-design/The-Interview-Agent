import { NeuCard } from '../neu/NeuCard'
import { NeuBadge } from '../neu/NeuBadge'
import { ClippedHeading } from '../neu/ClippedHeading'
import type { Candidate } from '../../types'
import { useScrollReveal } from '../../utils/useScrollReveal'

interface Props {
  candidate: Candidate
}

export function PerformanceView({ candidate }: Props) {
  useScrollReveal()
  const member = candidate.member

  return (
    <div className="max-w-7xl mx-auto space-y-10 md:space-y-12 pb-12">
      
      {/* Header with Clipped Heading */}
      <div className="space-y-2 border-b-3 border-black pb-4 reveal-on-scroll">
        <NeuBadge variant="pink">ANALYTICS WORKSPACE</NeuBadge>
        
        <ClippedHeading
          as="h1"
          innerClassName="text-clamp-heading font-black uppercase text-black"
          immediate={true}
        >
          PERFORMANCE DASHBOARD
        </ClippedHeading>

        <p className="text-sm font-bold text-slate-700">
          In-depth technical knowledge breakdown, communication scoring, and topic mastery metrics for {member.name}.
        </p>
      </div>

      {/* Top Metrics Row responsive grid */}
      <div className="responsive-grid">
        <NeuCard color="yellow" hoverSnap={true} revealOnScroll={true}>
          <span className="font-mono text-[10px] font-black uppercase text-black">OVERALL SCORE</span>
          <div className="mt-1 text-4xl font-black font-mono text-black">82 / 100</div>
          <span className="text-[10px] font-bold text-slate-900 mt-1 block">GRADE: B+</span>
        </NeuCard>

        <NeuCard color="cyan" hoverSnap={true} revealOnScroll={true}>
          <span className="font-mono text-[10px] font-black uppercase text-black">TECHNICAL SCORE</span>
          <div className="mt-1 text-4xl font-black font-mono text-black">86%</div>
          <span className="text-[10px] font-bold text-slate-900 mt-1 block">CONCEPT MASTERY</span>
        </NeuCard>

        <NeuCard color="green" hoverSnap={true} revealOnScroll={true}>
          <span className="font-mono text-[10px] font-black uppercase text-black">PROBLEM SOLVING</span>
          <div className="mt-1 text-4xl font-black font-mono text-black">78%</div>
          <span className="text-[10px] font-bold text-slate-900 mt-1 block">TRADE-OFF ANALYSIS</span>
        </NeuCard>

        <NeuCard color="pink" hoverSnap={true} revealOnScroll={true}>
          <span className="font-mono text-[10px] font-black uppercase text-black">COMMUNICATION</span>
          <div className="mt-1 text-4xl font-black font-mono text-black">88%</div>
          <span className="text-[10px] font-bold text-slate-900 mt-1 block">CLARITY & STRUCTURE</span>
        </NeuCard>

        <NeuCard color="cream" hoverSnap={true} revealOnScroll={true}>
          <span className="font-mono text-[10px] font-black uppercase text-black">REASONING SCORE</span>
          <div className="mt-1 text-4xl font-black font-mono text-black">81%</div>
          <span className="text-[10px] font-bold text-slate-900 mt-1 block">LOGICAL STEP-THROUGH</span>
        </NeuCard>
      </div>

      {/* Curriculum Topic Mastery */}
      <NeuCard color="white" className="space-y-6" hoverSnap={true} revealOnScroll={true}>
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <ClippedHeading as="h3" innerClassName="font-black text-xl uppercase tracking-tight">
            CURRICULUM TOPIC MASTERY BREAKDOWN
          </ClippedHeading>
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
      <NeuCard color="white" className="space-y-4" hoverSnap={true} revealOnScroll={true}>
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <ClippedHeading as="h3" innerClassName="font-black text-xl uppercase tracking-tight">
            ANSWER QUALITY PROGRESSION
          </ClippedHeading>
          <NeuBadge variant="black">LAST 8 INTERVIEW QUESTIONS</NeuBadge>
        </div>

        <div className="responsive-grid pt-2">
          {[82, 74, 91, 78, 86, 68, 89, 85].map((score, idx) => (
            <div key={idx} className="border-2 border-black bg-[#FFFDF6] p-3 text-center neu-btn-snap">
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

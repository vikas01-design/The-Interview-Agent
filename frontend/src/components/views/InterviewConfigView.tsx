import { useState } from 'react'
import { NeuCard } from '../neu/NeuCard'
import { NeuButton } from '../neu/NeuButton'
import { NeuBadge } from '../neu/NeuBadge'
import { ClippedHeading } from '../neu/ClippedHeading'
import type { Candidate } from '../../types'
import { useScrollReveal } from '../../utils/useScrollReveal'

interface Props {
  candidate: Candidate
  onBeginInterview: (config: {
    targetRole: string
    experienceLevel: string
    interviewMode: string
    difficulty: string
    useResumeContext: boolean
    voiceMode: boolean
    cameraMode: boolean
  }) => void
}

const ROLES = [
  'AI Engineer',
  'Data Engineer',
  'ML Engineer',
  'Software Engineer',
  'Backend Engineer',
  'Data Scientist',
  'DevOps Engineer',
]

const LEVELS = ['Entry Level', 'Mid-Level', 'Senior Level', 'Lead / Staff']
const MODES = ['Technical Deep-Dive', 'System Architecture', 'Behavioral & Tech', 'Full Synthetic Mock']

export function InterviewConfigView({ candidate, onBeginInterview }: Props) {
  useScrollReveal()

  const [targetRole, setTargetRole] = useState(candidate.member.jobRole || 'AI Engineer')
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level')
  const [interviewMode, setInterviewMode] = useState('Technical Deep-Dive')
  const [difficulty] = useState('Adaptive')
  const [useResumeContext, setUseResumeContext] = useState(true)
  const [voiceMode, setVoiceMode] = useState(true)
  const [cameraMode, setCameraMode] = useState(true)

  return (
    <div className="max-w-5xl mx-auto space-y-10 md:space-y-12 pb-12">
      
      {/* Header with Clipped Heading */}
      <div className="space-y-2 border-b-3 border-black pb-4 reveal-on-scroll">
        <NeuBadge variant="yellow">CONFIGURATOR</NeuBadge>
        
        <ClippedHeading
          as="h1"
          innerClassName="text-clamp-heading font-black uppercase text-black"
          immediate={true}
        >
          NEW TECHNICAL INTERVIEW
        </ClippedHeading>

        <p className="text-sm font-bold text-slate-700">
          Configure interview context, voice/text modes, camera integrity monitoring, and target position expectations.
        </p>
      </div>

      {/* Main Form responsive grid */}
      <div className="responsive-grid">
        {/* Left Column: Options */}
        <NeuCard color="white" className="space-y-5" hoverSnap={true} revealOnScroll={true}>
          <h3 className="font-black text-lg uppercase border-b-2 border-black pb-2">1. TARGET ROLE & INTERVIEW MODE</h3>

          <div>
            <label className="block text-xs font-mono font-black uppercase text-slate-800 mb-1.5">Target Position Role</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full border-2 border-black bg-white p-3 font-bold text-sm focus:bg-[#C0F7FE] focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-black uppercase text-slate-800 mb-1.5">Target Seniority Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full border-2 border-black bg-white p-3 font-bold text-sm focus:bg-[#C0F7FE] focus:outline-none"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-black uppercase text-slate-800 mb-1.5">Interview Focus Area</label>
            <select
              value={interviewMode}
              onChange={(e) => setInterviewMode(e.target.value)}
              className="w-full border-2 border-black bg-white p-3 font-bold text-sm focus:bg-[#C0F7FE] focus:outline-none"
            >
              {MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Voice vs Text Selectors */}
          <div className="border-2 border-black p-3 bg-[#FFFDF6] space-y-2">
            <span className="block text-xs font-mono font-black uppercase text-black">INTERVIEW RESPONSE MODE</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs font-bold">
                <input
                  type="radio"
                  name="voiceToggle"
                  checked={voiceMode}
                  onChange={() => setVoiceMode(true)}
                  className="accent-black"
                />
                <span>🎙 VOICE MODE (STT + TTS)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs font-bold">
                <input
                  type="radio"
                  name="voiceToggle"
                  checked={!voiceMode}
                  onChange={() => setVoiceMode(false)}
                  className="accent-black"
                />
                <span>⌨ TEXT MODE</span>
              </label>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cameraMode}
                onChange={(e) => setCameraMode(e.target.checked)}
                className="h-5 w-5 border-2 border-black accent-[#F7CB46]"
              />
              <span className="text-xs font-black uppercase text-black">Enable Camera Interview Integrity Monitor</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useResumeContext}
                onChange={(e) => setUseResumeContext(e.target.checked)}
                className="h-5 w-5 border-2 border-black accent-[#F7CB46]"
              />
              <span className="text-xs font-black uppercase text-black">Enable Resume AI Context & Match Evidence</span>
            </label>
          </div>
        </NeuCard>

        {/* Right Column: Guardrails & Context Summary */}
        <NeuCard color="cyan" className="space-y-6 flex flex-col justify-between" hoverSnap={true} revealOnScroll={true}>
          <div className="space-y-4">
            <h3 className="font-black text-lg uppercase border-b-2 border-black pb-2 text-black">2. SYSTEM GUARDRAILS</h3>

            <div className="space-y-3 font-mono text-xs font-bold text-black">
              <div className="flex items-center gap-2 p-2 bg-white border-2 border-black">
                <span className="font-black text-sm text-[#99E885]">✓</span>
                <span>VOICE & TEXT INTERVIEW ENGINE (STT + TTS)</span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white border-2 border-black">
                <span className="font-black text-sm text-[#99E885]">✓</span>
                <span>CAMERA OBSERVABLE INTEGRITY MONITOR</span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white border-2 border-black">
                <span className="font-black text-sm text-[#99E885]">✓</span>
                <span>8+ MANDATORY INTERVIEW QUESTIONS</span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white border-2 border-black">
                <span className="font-black text-sm text-[#99E885]">✓</span>
                <span>DYNAMIC ADAPTIVE FOLLOW-UP GENERATION</span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white border-2 border-black">
                <span className="font-black text-sm text-[#99E885]">✓</span>
                <span>REAL-TIME MULTI-DIMENSIONAL EVALUATION</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-black">
            <div className="flex items-center justify-between text-xs font-bold font-mono">
              <span>CANDIDATE:</span>
              <span className="font-black">{candidate.member.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold font-mono mt-1">
              <span>MODE:</span>
              <span className="bg-[#F7CB46] px-2 py-0.5 border border-black font-black">
                {voiceMode ? '🎙 VOICE MODE' : '⌨ TEXT MODE'}
              </span>
            </div>
          </div>
        </NeuCard>
      </div>

      {/* CTA Button */}
      <div className="text-center pt-4">
        <NeuButton
          variant="yellow"
          size="lg"
          className="w-full max-w-md py-4 text-base shadow-neu-lg"
          snapScale={true}
          onClick={() =>
            onBeginInterview({
              targetRole,
              experienceLevel,
              interviewMode,
              difficulty,
              useResumeContext,
              voiceMode,
              cameraMode,
            })
          }
        >
          BEGIN TECHNICAL INTERVIEW →
        </NeuButton>
      </div>
    </div>
  )
}

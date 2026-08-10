import { useEffect, useState } from 'react'
import { NeuBadge } from './NeuBadge'

export type EmotionState = 'default' | 'asking' | 'thinking' | 'evaluating' | 'impressed'

interface EmotionMeta {
  id: EmotionState
  label: string
  icon: string
  badgeVariant: 'yellow' | 'pink' | 'cyan' | 'green' | 'black'
  badgeBg: string
  dialogue: string
  quote: string
  metrics: { label: string; val: string; color: string }[]
  imgPath: string
}

const EMOTIONS: Record<EmotionState, EmotionMeta> = {
  default: {
    id: 'default',
    label: 'READY FOR INTERVIEW',
    icon: '💻',
    badgeVariant: 'yellow',
    badgeBg: 'bg-[#F7CB46]',
    dialogue: 'Senior AI Architect Interviewer initialized.',
    quote: '"Welcome to your adaptive technical interview. I will evaluate your answers across 5 core dimensions."',
    metrics: [
      { label: 'STATUS', val: 'IDLE / READY', color: '#F7CB46' },
      { label: 'ROLE', val: 'SENIOR ARCHITECT', color: '#C0F7FE' },
      { label: 'GRAPH RAG', val: 'CONNECTED', color: '#99E885' },
    ],
    imgPath: '/assets/character/default.png',
  },
  asking: {
    id: 'asking',
    label: 'ASKING QUESTION',
    icon: '🗣️',
    badgeVariant: 'cyan',
    badgeBg: 'bg-[#C0F7FE]',
    dialogue: 'Formulating role-specific architecture question...',
    quote: '"How would you evaluate whether your RAG retrieval pipeline is returning high-quality context before passing it to the LLM?"',
    metrics: [
      { label: 'QUESTION TYPE', val: 'SYSTEM DESIGN', color: '#C0F7FE' },
      { label: 'DIFFICULTY', val: 'STAFF / SENIOR', color: '#FE90E8' },
      { label: 'LISTEN MODE', val: 'RECORDING', color: '#99E885' },
    ],
    imgPath: '/assets/character/asking.png',
  },
  thinking: {
    id: 'thinking',
    label: 'THINKING & PARSING',
    icon: '🤔',
    badgeVariant: 'pink',
    badgeBg: 'bg-[#FE90E8]',
    dialogue: 'Processing candidate response against Knowledge Graph...',
    quote: '"Analyzing candidate\'s trade-off rationale... comparing Recall@K and MRR metrics against reference architectures."',
    metrics: [
      { label: 'PARSING', val: 'SEMANTIC GRAPH', color: '#FE90E8' },
      { label: 'KNOWLEDGE BASE', val: 'MATCHING', color: '#F7CB46' },
      { label: 'LATENCY', val: '42ms', color: '#99E885' },
    ],
    imgPath: '/assets/character/thinking.png',
  },
  evaluating: {
    id: 'evaluating',
    label: 'EVALUATING METRICS',
    icon: '🧐',
    badgeVariant: 'yellow',
    badgeBg: 'bg-[#F7CB46]',
    dialogue: 'Scoring response across 5 technical dimensions...',
    quote: '"Candidate demonstrated strong understanding of retrieval metrics, but trade-off on vector DB latency requires follow-up."',
    metrics: [
      { label: 'RELEVANCE', val: '94%', color: '#99E885' },
      { label: 'CORRECTNESS', val: '88%', color: '#99E885' },
      { label: 'DEPTH', val: '82%', color: '#F7CB46' },
    ],
    imgPath: '/assets/character/evaluating.png',
  },
  impressed: {
    id: 'impressed',
    label: 'IMPRESSED / HIGH SCORE',
    icon: '💡',
    badgeVariant: 'green',
    badgeBg: 'bg-[#99E885]',
    dialogue: 'Outstanding answer detected!',
    quote: '"Spot on! Excellent identification of Mean Reciprocal Rank (MRR) and semantic similarity thresholding. Top tier candidate response!"',
    metrics: [
      { label: 'FINAL SCORE', val: '94 / 100', color: '#99E885' },
      { label: 'FEEDBACK', val: 'EXCEEDS EXPECTATION', color: '#FE90E8' },
      { label: 'SIGNAL', val: 'STRONG HIRE', color: '#99E885' },
    ],
    imgPath: '/assets/character/impressed.png',
  },
}

const EMOTION_KEYS: EmotionState[] = ['asking', 'thinking', 'evaluating', 'impressed', 'default']

interface NeoBrutalCharacterProps {
  initialEmotion?: EmotionState
  showControls?: boolean
  className?: string
  compact?: boolean
}

export function NeoBrutalCharacter({
  initialEmotion = 'asking',
  showControls = true,
  className = '',
}: NeoBrutalCharacterProps) {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>(initialEmotion)
  const [isAutoShuttle, setIsAutoShuttle] = useState(true)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [typedQuote, setTypedQuote] = useState('')

  // Auto-shuttle emotions timer
  useEffect(() => {
    if (!isAutoShuttle) return

    const interval = setInterval(() => {
      setCurrentEmotion((prev) => {
        const idx = EMOTION_KEYS.indexOf(prev)
        const next = (idx + 1) % EMOTION_KEYS.length
        return EMOTION_KEYS[next]
      })
    }, 4500)

    return () => clearInterval(interval)
  }, [isAutoShuttle])

  // Typewriter effect for speech bubble quote
  const meta = EMOTIONS[currentEmotion]
  useEffect(() => {
    let index = 0
    setTypedQuote('')
    const timer = setInterval(() => {
      if (index <= meta.quote.length) {
        setTypedQuote(meta.quote.slice(0, index))
        index++
      } else {
        clearInterval(timer)
      }
    }, 25)

    return () => clearInterval(timer)
  }, [currentEmotion, meta.quote])

  const handleSelectEmotion = (em: EmotionState) => {
    setIsAutoShuttle(false)
    setCurrentEmotion(em)
  }

  return (
    <div className={`relative flex flex-col font-sans text-black ${className}`}>
      
      {/* Outer Neo-Brutalist Frame Container */}
      <div className="relative border-3 border-black bg-[#FFFDF6] p-4 sm:p-6 shadow-neu-lg overflow-hidden transition-all duration-300">
        
        {/* Top Header Bar of Frame */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-3 border-black pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 animate-ping rounded-full bg-[#FE90E8]"></span>
            <NeuBadge variant={meta.badgeVariant} className="text-xs px-2.5 py-0.5">
              {meta.icon} {meta.label}
            </NeuBadge>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoShuttle(!isAutoShuttle)}
              className={`font-mono text-[11px] font-black border-2 border-black px-2.5 py-1 uppercase shadow-neu-sm transition-transform active:translate-x-0.5 ${
                isAutoShuttle ? 'bg-[#99E885] text-black animate-pulse' : 'bg-white text-slate-700'
              }`}
              title="Toggle automatic emotion shuttle cycling"
            >
              {isAutoShuttle ? '⚡ SHUTTLE: ON' : '⏸ SHUTTLE: PAUSED'}
            </button>
          </div>
        </div>

        {/* Floating Neo-Brutalist Sticky Notes & Tech Charts Overlay */}
        <div className="absolute top-14 right-6 hidden md:flex flex-col gap-2 z-10 pointer-events-none animate-float">
          <div className="border-2 border-black bg-[#FE90E8] px-2 py-1 font-mono text-[10px] font-black uppercase rotate-3 shadow-neu-sm">
            📌 RECALL@K: 0.94
          </div>
          <div className="border-2 border-black bg-[#F7CB46] px-2 py-1 font-mono text-[10px] font-black uppercase -rotate-2 shadow-neu-sm">
            ⚡ GRAPH RETRIEVAL
          </div>
          <div className="border-2 border-black bg-[#C0F7FE] px-2 py-1 font-mono text-[10px] font-black uppercase rotate-1 shadow-neu-sm">
            📊 SYSTEM DESIGN
          </div>
        </div>

        {/* Main Artwork Display + Speech Bubble Grid */}
        <div className="grid gap-6 md:grid-cols-12 items-center">
          
          {/* Left / Top: Character Illustration Frame */}
          <div className="md:col-span-7 relative group">
            
            {/* Hand-drawn style framing border & shadow */}
            <div className="relative border-3 border-black bg-white shadow-neu overflow-hidden rounded-sm transition-all duration-300">
              
              {/* Image element with smooth fade transition */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FBF9F1] flex items-center justify-center">
                
                {/* Fallback loading skeleton */}
                <div className="absolute inset-0 bg-[#F7CB46]/20 animate-pulse flex items-center justify-center font-mono font-black text-xs">
                  ⚡ LOADING ARTWORK...
                </div>

                <img
                  src={meta.imgPath}
                  alt={`AI Interviewer Character - ${meta.label}`}
                  className={`w-full h-full object-cover relative z-10 transition-all duration-500 hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-90'}`}
                  onLoad={() => setImgLoaded(true)}
                  onError={(e) => {
                    // Fallback image if asset loading fails
                    const target = e.currentTarget
                    target.onerror = null
                    target.src = '/assets/hero.png'
                  }}
                />

                {/* Subtle Emotion Overlay Badges over image */}
                <div className="absolute bottom-3 left-3 z-20">
                  <span className="border-2 border-black bg-black px-2 py-0.5 font-mono text-[10px] font-black text-white shadow-neu-sm">
                    CHARACTER STATE: {meta.id.toUpperCase()}
                  </span>
                </div>

                {/* Animated Blinking / Expressive SVG Micro-Overlay */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {/* Subtle floaty soundwave or sparkles */}
                  {currentEmotion === 'asking' && (
                    <div className="absolute top-4 right-4 flex gap-1 animate-pulse">
                      <span className="w-2 h-6 bg-[#FE90E8] border border-black animate-bounce"></span>
                      <span className="w-2 h-10 bg-[#F7CB46] border border-black animate-bounce delay-75"></span>
                      <span className="w-2 h-4 bg-[#99E885] border border-black animate-bounce delay-150"></span>
                    </div>
                  )}

                  {currentEmotion === 'thinking' && (
                    <div className="absolute top-4 left-4 border-2 border-black bg-[#FFDC8B] p-2 text-xs font-mono font-black animate-float shadow-neu-sm">
                      💭 Calculating MRR...
                    </div>
                  )}

                  {currentEmotion === 'impressed' && (
                    <div className="absolute top-4 right-4 border-2 border-black bg-[#99E885] p-2 text-xs font-mono font-black animate-bounce shadow-neu-sm">
                      🌟 EUREKA! +100 PTS
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Character Sub-Caption */}
            <div className="mt-2 flex items-center justify-between font-mono text-[11px] font-bold text-slate-800">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-[#99E885] animate-ping"></span>
                MINIMALIST CARTOON ART · NEO-BRUTALISM
              </span>
              <span>THEME: AI INTERVIEWER</span>
            </div>
          </div>

          {/* Right / Bottom: Live Dialogue Speech Bubble & Real-time Evaluator Stats */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Speech / Dialogue Bubble (Neo-Brutalist Style) */}
            <div className="relative border-3 border-black bg-[#FFDC8B] p-4 shadow-neu space-y-2">
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5 font-mono text-xs font-black">
                <span className="uppercase text-black">🗣️ INTERVIEWER SPEECH</span>
                <span className="bg-black text-[#F7CB46] px-1.5 py-0.5 text-[10px]">LIVE VOICE</span>
              </div>

              <div className="min-h-[80px] font-mono text-xs font-bold text-black leading-relaxed">
                {typedQuote}
                <span className="animate-ping font-black text-[#FE90E8]">|</span>
              </div>

              {/* Triangle Tail pointing to left character */}
              <div className="hidden md:block absolute -left-3 top-8 w-0 h-0 border-t-8 border-t-transparent border-r-[12px] border-r-black border-b-8 border-b-transparent"></div>
            </div>

            {/* Live Signal Metrics Panel */}
            <div className="border-2 border-black bg-white p-3 space-y-2 shadow-neu-sm font-mono text-xs">
              <div className="font-black text-[11px] uppercase border-b border-black pb-1 flex justify-between">
                <span>EVALUATION TELEMETRY</span>
                <span className="text-[#FE90E8]">REAL-TIME</span>
              </div>

              <div className="space-y-1.5">
                {meta.metrics.map((m, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-slate-700">{m.label}:</span>
                    <span
                      className="border border-black px-2 py-0.5 font-black shadow-[1px_1px_0px_0px_#000]"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emotion Shuttle Progress Indicator */}
            {isAutoShuttle && (
              <div className="space-y-1 font-mono text-[10px] font-bold">
                <div className="flex justify-between text-slate-700">
                  <span>SHUTTLING EMOTIONS...</span>
                  <span>{currentEmotion.toUpperCase()}</span>
                </div>
                <div className="h-2 w-full border-2 border-black bg-white overflow-hidden p-0.5">
                  <div className="h-full bg-[#FE90E8] animate-pulse transition-all duration-300" style={{ width: '100%' }}></div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Emotion Pill Control Bar */}
        {showControls && (
          <div className="mt-6 pt-4 border-t-3 border-black flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono text-xs font-black uppercase text-black flex items-center gap-2">
              <span>SELECT EMOTION STATE:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {EMOTION_KEYS.map((key) => {
                const em = EMOTIONS[key]
                const isActive = currentEmotion === key
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectEmotion(key)}
                    className={`font-mono text-xs font-black px-3 py-1.5 border-2 border-black uppercase transition-all shadow-neu-sm flex items-center gap-1.5 ${
                      isActive
                        ? `${em.badgeBg} text-black -translate-y-1 shadow-[4px_4px_0px_0px_#000]`
                        : 'bg-white text-black hover:bg-slate-100'
                    }`}
                  >
                    <span>{em.icon}</span>
                    <span>{key}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

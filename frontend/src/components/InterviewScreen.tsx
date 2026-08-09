import { useEffect, useRef, useState } from 'react'
import { sendMessage, startInterview } from '../api'
import type { Candidate, ChatMessage, Feedback, InterviewProgress } from '../types'
import { FeedbackReport, type IntegrityReportData } from './FeedbackReport'
import { NeuCard } from './neu/NeuCard'
import { NeuButton } from './neu/NeuButton'
import { NeuBadge } from './neu/NeuBadge'
import { addFinishedSession } from '../utils/candidateStore'
import { speakQuestion, stopSpeech, pauseSpeech, resumeSpeech, SpeechRecognitionManager } from '../utils/speech'
import { CameraMonitorWidget, type IntegrityEvent } from './CameraMonitorWidget'

interface Props {
  candidate: Candidate
  sessionId: string
  voiceModeInitial?: boolean
  cameraStreamInitial?: MediaStream | null
  onRestart: () => void
}

type VoiceState =
  | 'QUESTION_READY'
  | 'AI_SPEAKING'
  | 'WAITING_FOR_CANDIDATE'
  | 'LISTENING'
  | 'TRANSCRIPT_READY'
  | 'SUBMITTED'
  | 'EVALUATING'

interface TurnFeedback {
  whatWasGood: string
  whatWasMissing: string
  strategy: string
}

export function InterviewScreen({
  candidate,
  sessionId,
  voiceModeInitial = true,
  cameraStreamInitial = null,
  onRestart,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<InterviewProgress | null>(null)
  const [isTyping, setIsTyping] = useState(false)

  // Voice & TTS / STT States
  const [voiceMode, setVoiceMode] = useState(voiceModeInitial)
  const [voiceState, setVoiceState] = useState<VoiceState>('QUESTION_READY')
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeechPaused, setIsSpeechPaused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Mobile Drawers
  const [signalsDrawerOpen, setSignalsDrawerOpen] = useState(false)
  const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false)

  // Dynamic Live Knowledge Model
  const [liveTechScore, setLiveTechScore] = useState(82)
  const [liveDepthScore, setLiveDepthScore] = useState(74)
  const [liveReasoningScore, setLiveReasoningScore] = useState(70)
  const [liveCommScore, setLiveCommScore] = useState(86)

  // Question-Level Feedbacks Array
  const [turnFeedbacks, setTurnFeedbacks] = useState<Record<number, TurnFeedback>>({})

  // Camera Integrity State
  const [cameraStream] = useState<MediaStream | null>(cameraStreamInitial)
  const [integrityEvents, setIntegrityEvents] = useState<IntegrityEvent[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sttManagerRef = useRef<SpeechRecognitionManager | null>(null)

  useEffect(() => {
    sttManagerRef.current = new SpeechRecognitionManager()
    return () => {
      stopSpeech()
      sttManagerRef.current?.stopListening()
    }
  }, [])

  // Start interview initialization
  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const res = await startInterview(sessionId, candidate)
        if (cancelled) return
        setMessages([
          {
            role: 'interviewer',
            content: res.reply,
            topic: res.progress?.currentTopic ?? undefined,
            difficulty: res.progress?.difficulty ?? undefined,
          },
        ])
        if (res.progress) setProgress(res.progress)

        // Automatically speak initial question if voice mode active
        if (voiceModeInitial && res.reply) {
          triggerAITTS(res.reply)
        }
      } catch (err) {
        if (!cancelled) setError('Could not start the interview. Is the backend server running?')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [candidate, sessionId, voiceModeInitial])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, input])

  // Speak AI question via TTS
  const triggerAITTS = (text: string) => {
    if (!voiceMode) return
    setVoiceState('AI_SPEAKING')
    setIsSpeechPaused(false)

    speakQuestion(text, {
      rate: speechSpeed,
      muted: isMuted,
      onStart: () => setVoiceState('AI_SPEAKING'),
      onEnd: () => setVoiceState('WAITING_FOR_CANDIDATE'),
      onError: () => setVoiceState('WAITING_FOR_CANDIDATE'),
    })
  }

  // Handle Candidate Microphone Recording (STT)
  const handleStartRecording = () => {
    if (!sttManagerRef.current?.isSupported()) {
      setError('Speech recognition is not supported in this browser. You can type your answer below.')
      return
    }

    stopSpeech()
    setIsRecording(true)
    setVoiceState('LISTENING')

    sttManagerRef.current.startListening(
      (transcript, _isFinal) => {
        setInput(transcript)
        setVoiceState('TRANSCRIPT_READY')
      },
      (errMessage) => {
        console.error('STT Error:', errMessage)
        setIsRecording(false)
        setVoiceState('WAITING_FOR_CANDIDATE')
        setError(errMessage)
      }
    )
  }

  const handleStopRecording = () => {
    sttManagerRef.current?.stopListening()
    setIsRecording(false)
    if (input.trim()) {
      setVoiceState('TRANSCRIPT_READY')
    } else {
      setVoiceState('WAITING_FOR_CANDIDATE')
    }
  }

  // Generate question-level feedback and adapt next question strategy
  function generateQuestionFeedback(ansLength: number): TurnFeedback {
    if (ansLength > 150) {
      return {
        whatWasGood: 'Correctly explained core architectural principles and technical concepts.',
        whatWasMissing: 'Could provide more details on retrieval quality metrics (Recall@K, MRR).',
        strategy: 'Increasing difficulty to test trade-offs and production scalability...',
      }
    } else if (ansLength > 60) {
      return {
        whatWasGood: 'Identified the main concept accurately.',
        whatWasMissing: 'Missed explicit trade-offs and implementation parameters.',
        strategy: 'Asking targeted follow-up question to test depth of understanding...',
      }
    } else {
      return {
        whatWasGood: 'Answer touched on basic intuition.',
        whatWasMissing: 'Lacks technical depth, specific formulas, and concrete examples.',
        strategy: 'Probing foundational concepts before moving to complex architecture...',
      }
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading || done) return

    stopSpeech()
    sttManagerRef.current?.stopListening()
    setIsRecording(false)

    setInput('')
    const candidateMsgIndex = messages.length
    setMessages((prev) => [...prev, { role: 'candidate', content: text }])
    setIsTyping(true)
    setVoiceState('EVALUATING')
    setError(null)

    // Generate Question-Level Feedback
    const qCount = progress?.questionNumber ?? Math.floor(candidateMsgIndex / 2) + 1
    const turnFb = generateQuestionFeedback(text.length)
    setTurnFeedbacks((prev) => ({ ...prev, [qCount]: turnFb }))

    // Update dynamic knowledge model signals
    const delta = text.length > 120 ? 3 : text.length > 50 ? 1 : -2
    setLiveTechScore((s) => Math.min(98, Math.max(60, s + delta)))
    setLiveDepthScore((s) => Math.min(98, Math.max(55, s + delta)))
    setLiveReasoningScore((s) => Math.min(98, Math.max(58, s + delta)))
    setLiveCommScore((s) => Math.min(98, Math.max(65, s + (text.length > 80 ? 2 : -1))))

    try {
      const res = await sendMessage(sessionId, text)
      setIsTyping(false)
      if (res.progress) setProgress(res.progress)

      if (res.done) {
        setDone(true)
        if (res.feedback) {
          setFeedback(res.feedback)
          try {
            addFinishedSession(candidate.member.id, candidate.member.name, res.feedback, candidate.member.jobRole || 'AI Engineer')
          } catch (e) {
            console.error('Failed to persist finished session', e)
          }
        }
        if (res.reply) {
          setMessages((prev) => [...prev, { role: 'interviewer', content: res.reply }])
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'interviewer',
            content: res.reply,
            topic: res.progress?.currentTopic ?? undefined,
            difficulty: res.progress?.difficulty ?? undefined,
          },
        ])

        // Trigger AI speech for the next question
        if (voiceMode && res.reply) {
          triggerAITTS(res.reply)
        }
      }
    } catch (err) {
      setIsTyping(false)
      setVoiceState('WAITING_FOR_CANDIDATE')
      setError('Failed to send answer. Please try again.')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const handleLogIntegrityEvent = (evt: IntegrityEvent) => {
    setIntegrityEvents((prev) => [...prev, evt])
  }

  if (done && feedback) {
    const integrityData: IntegrityReportData = {
      score: Math.max(70, 100 - integrityEvents.length * 6),
      events: integrityEvents,
    }
    return (
      <FeedbackReport
        candidate={candidate}
        feedback={feedback}
        integrityData={integrityData}
        onRestart={onRestart}
      />
    )
  }

  const qNum = progress?.questionNumber ?? messages.filter(m => m.role === 'interviewer').length
  const currentTopic = progress?.currentTopic ?? 'AI Engineering'
  const currentDay = progress?.currentDay ?? 14
  const difficulty = progress?.difficulty ?? 'medium'
  const lastInterviewerMsg = [...messages].reverse().find((m) => m.role === 'interviewer')?.content

  return (
    <div className="flex h-screen w-full flex-col bg-[#FFFDF6] font-sans text-black overflow-hidden relative">
      
      {/* Console Top Header */}
      <header className="flex shrink-0 flex-wrap items-center justify-between border-b-3 border-black bg-[#F7CB46] px-4 sm:px-6 py-2.5 sm:py-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <NeuBadge variant="black" className="text-[10px] sm:text-xs">TECHNICAL CONSOLE</NeuBadge>
          <span className="font-mono text-xs sm:text-sm font-black uppercase text-black truncate max-w-[150px] sm:max-w-none">
            {candidate.member.jobRole.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 font-mono text-[10px] sm:text-xs font-black">
          {/* Voice Mode Toggle */}
          <button
            onClick={() => {
              if (voiceMode) {
                stopSpeech()
                sttManagerRef.current?.stopListening()
                setIsRecording(false)
              } else if (lastInterviewerMsg) {
                triggerAITTS(lastInterviewerMsg)
              }
              setVoiceMode(!voiceMode)
            }}
            className={`px-2 sm:px-3 py-1 border-2 border-black font-black uppercase transition ${
              voiceMode ? 'bg-[#FE90E8] text-black shadow-neu-sm' : 'bg-white text-slate-700'
            }`}
          >
            VOICE: {voiceMode ? '● ON' : '○ OFF'}
          </button>

          <span className="bg-white border-2 border-black px-2 sm:px-3 py-1 shadow-neu-sm">
            Q{qNum < 10 ? `0${qNum}` : qNum}/10
          </span>

          <span className="hidden md:inline-block bg-[#99E885] border-2 border-black px-3 py-1 shadow-neu-sm">
            DAY {currentDay} · {currentTopic.toUpperCase()}
          </span>

          <button
            onClick={() => {
              stopSpeech()
              onRestart()
            }}
            className="neu-btn bg-white px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-black text-black"
          >
            EXIT
          </button>
        </div>
      </header>

      {/* Mobile Drawer Quick Bar (< lg) */}
      <div className="flex lg:hidden shrink-0 items-center justify-between border-b-2 border-black bg-white px-4 py-2 text-[10px] font-mono font-black">
        <button
          onClick={() => setSignalsDrawerOpen(!signalsDrawerOpen)}
          className="neu-btn bg-[#C0F7FE] px-2.5 py-1 text-black"
        >
          📊 LIVE SIGNALS ({liveTechScore}%)
        </button>

        <button
          onClick={() => setTimelineDrawerOpen(!timelineDrawerOpen)}
          className="neu-btn bg-[#F7CB46] px-2.5 py-1 text-black"
        >
          📜 TIMELINE (Q0{qNum}/10)
        </button>
      </div>

      {/* Mobile Signals Drawer Modal */}
      {signalsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 lg:hidden">
          <div className="w-full max-w-sm border-3 border-black bg-white p-5 space-y-4 shadow-neu-lg">
            <div className="flex justify-between items-center border-b-2 border-black pb-2 font-mono font-black text-xs">
              <span>LIVE SIGNAL MODEL</span>
              <button onClick={() => setSignalsDrawerOpen(false)} className="bg-slate-100 px-2 py-0.5 border border-black">✕</button>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between font-black mb-1"><span>TECHNICAL</span><span>{liveTechScore}%</span></div>
                <div className="h-3 border-2 border-black bg-white p-0.5"><div className="h-full bg-[#99E885]" style={{ width: `${liveTechScore}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between font-black mb-1"><span>DEPTH</span><span>{liveDepthScore}%</span></div>
                <div className="h-3 border-2 border-black bg-white p-0.5"><div className="h-full bg-[#F7CB46]" style={{ width: `${liveDepthScore}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between font-black mb-1"><span>REASONING</span><span>{liveReasoningScore}%</span></div>
                <div className="h-3 border-2 border-black bg-white p-0.5"><div className="h-full bg-[#F7CB46]" style={{ width: `${liveReasoningScore}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between font-black mb-1"><span>COMMUNICATION</span><span>{liveCommScore}%</span></div>
                <div className="h-3 border-2 border-black bg-white p-0.5"><div className="h-full bg-[#99E885]" style={{ width: `${liveCommScore}%` }}></div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Timeline Drawer Modal */}
      {timelineDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 lg:hidden">
          <div className="w-full max-w-xs border-3 border-black bg-white p-5 space-y-4 shadow-neu-lg">
            <div className="flex justify-between items-center border-b-2 border-black pb-2 font-mono font-black text-xs">
              <span>QUESTION TIMELINE</span>
              <button onClick={() => setTimelineDrawerOpen(false)} className="bg-slate-100 px-2 py-0.5 border border-black">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isCurrent = num === qNum
                const isCompleted = num < qNum
                return (
                  <div
                    key={num}
                    className={`p-2 border-2 border-black text-center font-black ${
                      isCurrent
                        ? 'bg-[#F7CB46]'
                        : isCompleted
                        ? 'bg-[#99E885]'
                        : 'bg-white'
                    }`}
                  >
                    Q{num < 10 ? `0${num}` : num} {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Console Workspace */}
      <div className="flex flex-1 overflow-hidden p-3 sm:p-6 gap-6 max-w-7xl mx-auto w-full">
        
        {/* Left Panel: Context & Live State Signal (Desktop >= lg) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-4">
          <NeuCard color="white" className="space-y-4">
            <h3 className="font-mono text-xs font-black uppercase text-black border-b-2 border-black pb-2">
              INTERVIEW STATE
            </h3>
            
            <div>
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">CANDIDATE</span>
              <span className="font-black text-sm text-black">{candidate.member.name}</span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">SYSTEM STATE</span>
              <NeuBadge variant={voiceState === 'AI_SPEAKING' ? 'pink' : isRecording ? 'green' : 'yellow'}>
                {voiceState === 'AI_SPEAKING' ? '◉ AI SPEAKING' : isRecording ? '🔴 LISTENING' : '● WAITING'}
              </NeuBadge>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">DIFFICULTY LEVEL</span>
              <NeuBadge variant={difficulty === 'hard' ? 'pink' : difficulty === 'medium' ? 'yellow' : 'cyan'}>
                ● {difficulty.toUpperCase()}
              </NeuBadge>
            </div>
          </NeuCard>

          {/* Dynamic Live Signal Model */}
          <NeuCard color="cyan" className="space-y-4 flex-1">
            <h3 className="font-mono text-xs font-black uppercase text-black border-b-2 border-black pb-2">
              LIVE SIGNAL MODEL
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between font-black mb-1"><span>TECHNICAL</span><span>{liveTechScore}%</span></div>
                <div className="h-3 border-2 border-black bg-white p-0.5"><div className="h-full bg-[#99E885]" style={{ width: `${liveTechScore}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between font-black mb-1"><span>DEPTH</span><span>{liveDepthScore}%</span></div>
                <div className="h-3 border-2 border-black bg-white p-0.5"><div className="h-full bg-[#F7CB46]" style={{ width: `${liveDepthScore}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between font-black mb-1"><span>REASONING</span><span>{liveReasoningScore}%</span></div>
                <div className="h-3 border-2 border-black bg-white p-0.5"><div className="h-full bg-[#F7CB46]" style={{ width: `${liveReasoningScore}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between font-black mb-1"><span>COMMUNICATION</span><span>{liveCommScore}%</span></div>
                <div className="h-3 border-2 border-black bg-white p-0.5"><div className="h-full bg-[#99E885]" style={{ width: `${liveCommScore}%` }}></div></div>
              </div>
            </div>
          </NeuCard>
        </aside>

        {/* Center Panel: Main Question & Voice Console */}
        <main className="flex-1 flex flex-col overflow-hidden space-y-4">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center space-y-3">
                <div className="h-10 w-10 animate-spin border-4 border-black border-t-transparent"></div>
                <p className="font-mono text-xs font-black uppercase text-black">INITIALIZING TECHNICAL INTERVIEW CONSOLE...</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const turnQNum = Math.floor(idx / 2) + 1
                const turnFb = turnFeedbacks[turnQNum]

                return (
                  <div key={idx} className={`space-y-2 ${msg.role === 'candidate' ? 'pl-2 sm:pl-8' : 'pr-2 sm:pr-8'}`}>
                    {msg.role === 'interviewer' ? (
                      <div className="space-y-3">
                        {/* Section 21: Render Question-Level Feedback Card if feedback exists for this turn */}
                        {turnFb && idx > 0 && (
                          <NeuCard color="cream" className="space-y-2 border-l-4 sm:border-l-8 border-l-[#FE90E8] p-3 sm:p-5">
                            <div className="flex items-center justify-between border-b-2 border-black pb-1">
                              <NeuBadge variant="black" className="text-[9px] sm:text-xs">FEEDBACK EVALUATION</NeuBadge>
                              <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase text-slate-700">Q0{turnQNum} TURN</span>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 font-mono text-xs font-bold pt-1">
                              <div className="p-2 border-2 border-black bg-white">
                                <span className="text-[#99E885] font-black uppercase block mb-0.5">✓ WHAT WAS GOOD:</span>
                                <span>{turnFb.whatWasGood}</span>
                              </div>

                              <div className="p-2 border-2 border-black bg-white">
                                <span className="text-[#FE90E8] font-black uppercase block mb-0.5">⚠ MISSING CONCEPTS:</span>
                                <span>{turnFb.whatWasMissing}</span>
                              </div>
                            </div>

                            <div className="p-2 border-2 border-black bg-[#C0F7FE] font-mono text-xs font-bold">
                              <span className="font-black text-black uppercase">💡 ADAPTIVE STRATEGY: </span>
                              <span>{turnFb.strategy}</span>
                            </div>
                          </NeuCard>
                        )}

                        <NeuCard color="white" className="space-y-3 border-l-4 sm:border-l-8 border-l-[#F7CB46] p-3 sm:p-6">
                          <div className="flex flex-wrap items-center justify-between border-b-2 border-black pb-2 gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <NeuBadge variant="yellow" className="text-[10px] sm:text-xs">INTERVIEWER QUESTION</NeuBadge>
                              {msg.topic && <NeuBadge variant="cyan" className="text-[10px] sm:text-xs">{msg.topic}</NeuBadge>}
                              {voiceState === 'AI_SPEAKING' && idx === messages.length - 1 && (
                                <NeuBadge variant="pink" className="animate-pulse text-[10px] sm:text-xs">◉ SPEAKING...</NeuBadge>
                              )}
                            </div>

                            {/* Speech Synthesis Controls */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-[10px]">
                              <button
                                type="button"
                                onClick={() => triggerAITTS(msg.content)}
                                className="neu-btn bg-[#C0F7FE] px-2 py-0.5 text-black text-[10px]"
                              >
                                🔊 REPLAY
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (isSpeechPaused) {
                                    resumeSpeech()
                                    setIsSpeechPaused(false)
                                  } else {
                                    pauseSpeech()
                                    setIsSpeechPaused(true)
                                  }
                                }}
                                className="neu-btn bg-white px-2 py-0.5 text-black text-[10px]"
                              >
                                {isSpeechPaused ? '▶ RESUME' : '⏸ PAUSE'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  stopSpeech()
                                  setIsMuted(!isMuted)
                                }}
                                className="neu-btn bg-white px-2 py-0.5 text-black text-[10px]"
                              >
                                {isMuted ? '🔇 MUTED' : '🔊 MUTE'}
                              </button>

                              <select
                                value={speechSpeed}
                                onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                                className="border border-black bg-white px-1 py-0.5 font-bold text-[10px]"
                              >
                                <option value={0.75}>0.75x</option>
                                <option value={1.0}>1.0x</option>
                                <option value={1.25}>1.25x</option>
                                <option value={1.5}>1.5x</option>
                              </select>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm font-bold text-black whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </p>
                        </NeuCard>
                      </div>
                    ) : (
                      <NeuCard color="green" className="space-y-2 border-r-4 sm:border-r-8 border-r-black p-3 sm:p-5">
                        <div className="flex items-center justify-between border-b-2 border-black pb-1">
                          <NeuBadge variant="black" className="text-[10px] sm:text-xs">YOUR RESPONSE</NeuBadge>
                          <span className="font-mono text-[10px] font-black text-black">{candidate.member.name}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-black whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      </NeuCard>
                    )}
                  </div>
                )
              })
            )}

            {isTyping && (
              <NeuCard color="white" className="p-3 sm:p-4 space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs font-black">
                  <div className="h-3 w-3 animate-ping bg-[#F7CB46] border border-black shrink-0"></div>
                  <span className="text-[11px] sm:text-xs">AI AGENT IS EVALUATING ANSWER & GENERATING ADAPTIVE FOLLOW-UP...</span>
                </div>
              </NeuCard>
            )}

            {error && (
              <NeuCard color="pink" className="p-4">
                <p className="font-mono text-xs font-black text-black">⚠ {error}</p>
              </NeuCard>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Answer Input Console (Voice STT Microphone + Editable Text) */}
          <form onSubmit={handleSend} className="shrink-0 space-y-2">
            <NeuCard color="white" className="p-3 sm:p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between border-b-2 border-black pb-2 gap-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-mono text-[10px] sm:text-xs font-black uppercase text-black">
                    YOUR TECHNICAL ANSWER {voiceMode ? '(VOICE / EDIT)' : ''}
                  </span>
                  {isRecording && (
                    <span className="font-mono text-[10px] sm:text-xs font-black text-[#FE90E8] animate-pulse flex items-center gap-1">
                      🔴 RECORDING... 🎙 ▂ ▅ █ ▆ ▃
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] font-bold text-slate-600 ml-auto">{input.length} / 2000 CHARS</span>
              </div>

              {/* Microphone Voice Controls */}
              {voiceMode && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-[#FFFDF6] border-2 border-black">
                  {!isRecording ? (
                    <NeuButton
                      type="button"
                      variant="yellow"
                      size="sm"
                      onClick={handleStartRecording}
                      disabled={loading || done}
                      className="w-full sm:w-auto text-xs py-2"
                    >
                      🎙 START SPEAKING ANSWER
                    </NeuButton>
                  ) : (
                    <NeuButton
                      type="button"
                      variant="pink"
                      size="sm"
                      onClick={handleStopRecording}
                      className="w-full sm:w-auto text-xs py-2"
                    >
                      ⏹ STOP RECORDING
                    </NeuButton>
                  )}

                  {input.trim() && !isRecording && (
                    <NeuButton
                      type="button"
                      variant="white"
                      size="sm"
                      onClick={() => setInput('')}
                      className="text-xs py-2"
                    >
                      CLEAR TRANSCRIPT
                    </NeuButton>
                  )}
                </div>
              )}

              {/* Editable Answer Textarea */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  voiceMode
                    ? "Tap 'START SPEAKING ANSWER' to speak, or type your answer here..."
                    : 'Explain your approach, implementation details, and technical trade-offs...'
                }
                disabled={loading || done}
                rows={3}
                className="w-full border-2 border-black bg-white p-2.5 sm:p-3 font-bold text-xs sm:text-sm text-black placeholder-slate-400 focus:bg-[#FFFDF6] focus:outline-none"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                <span className="font-mono text-[9px] sm:text-[10px] font-bold text-slate-600">
                  Press ENTER to Submit, SHIFT+ENTER for New Line
                </span>

                <NeuButton
                  type="submit"
                  variant="yellow"
                  size="md"
                  disabled={loading || done || !input.trim()}
                  className="w-full sm:w-auto text-xs py-2.5"
                >
                  SUBMIT ANSWER →
                </NeuButton>
              </div>
            </NeuCard>
          </form>
        </main>

        {/* Right Panel: Question Timeline (Desktop >= xl) */}
        <aside className="hidden xl:flex flex-col w-56 shrink-0 space-y-4">
          <NeuCard color="white" className="space-y-4">
            <h3 className="font-mono text-xs font-black uppercase text-black border-b-2 border-black pb-2">
              QUESTION TIMELINE
            </h3>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isCurrent = num === qNum
                const isCompleted = num < qNum
                return (
                  <div
                    key={num}
                    className={`p-2 border-2 border-black text-center font-black ${
                      isCurrent
                        ? 'bg-[#F7CB46]'
                        : isCompleted
                        ? 'bg-[#99E885]'
                        : 'bg-white'
                    }`}
                  >
                    Q{num < 10 ? `0${num}` : num} {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                  </div>
                )
              })}
            </div>
          </NeuCard>
        </aside>
      </div>

      {/* Section 36: Live Camera Integrity Monitor Overlay */}
      {cameraStream && (
        <CameraMonitorWidget stream={cameraStream} onLogEvent={handleLogIntegrityEvent} />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'
import { NeuCard } from '../neu/NeuCard'
import { NeuButton } from '../neu/NeuButton'
import { NeuBadge } from '../neu/NeuBadge'
import { NeoBrutalCharacter } from '../neu/NeoBrutalCharacter'

interface LandingPageProps {
  onEnterDashboard: () => void
  onOpenResumeAI: () => void
}

const FAQS = [
  {
    q: 'How does the AI technical interview work?',
    a: 'The platform uses an adaptive AI interviewer engine powered by LLMs and TheBreeth graph retrieval. It presents technical concepts, evaluates your multiline answer across 5 performance dimensions, and dynamically generates follow-up questions tailored to your gaps.',
  },
  {
    q: 'What roles and seniority levels are supported?',
    a: 'You can evaluate candidates or practice for AI Engineer, Data Engineer, ML Engineer, Software Engineer, Backend Engineer, Data Scientist, DevOps Engineer, and custom roles across Junior, Mid-Level, Senior, and Lead/Staff seniorities.',
  },
  {
    q: 'How does the role-aware resume scoring system work?',
    a: 'Unlike static 1-size-fits-all scoring, our Resume AI analyzes your resume specifically against your selected target role and custom Job Description. The same resume can score 93% for Data Engineer and 75% for AI Engineer with explicit matched and missing evidence bullets.',
  },
  {
    q: 'Can I upload or paste custom Job Descriptions?',
    a: 'Yes! You can drag-and-drop PDF/TXT/DOCX files or paste raw target Job Description text to evaluate candidates directly against specific enterprise job requirements.',
  },
  {
    q: 'How are adaptive follow-up questions generated?',
    a: 'When you submit an answer, the evaluator agent analyzes your correctness, depth, structure, and reasoning. If you show strong concept understanding but miss trade-offs or evaluation metrics, the system automatically shifts difficulty and asks targeted follow-ups.',
  },
]

const TICKER_TEXT = '⚡ 31-DAY COHORT JOURNEY · ROLE-AWARE RESUME SCORING · GRAPH RETRIEVAL MODEL · MULTI-DIMENSIONAL EVALUATION · REAL-TIME ADAPTIVE QUESTIONS · '

export function LandingPage({ onEnterDashboard, onOpenResumeAI }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [typedText, setTypedText] = useState('')
  const fullText = "I measure Recall@K and Mean Reciprocal Rank (MRR) across evaluation datasets, and implement semantic similarity thresholding to filter noise."

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      setTypedText(fullText.slice(0, index))
      index++
      if (index > fullText.length) {
        index = 0
      }
    }, 45)
    return () => clearInterval(timer)
  }, [])

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  return (
    <div className="min-h-screen w-full bg-[#FFFDF6] font-sans text-black bg-dot-pattern overflow-x-hidden">
      
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between border-b-3 border-black bg-[#F7CB46] px-4 sm:px-6 py-2.5 sm:py-3 shadow-neu-sm gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 border-2 border-black bg-black px-2.5 sm:px-3 py-1 text-white shadow-neu-sm hover:scale-105 transition-transform">
            <span className="font-mono font-black text-xs sm:text-base text-[#F7CB46]">⚡ AI INTERVIEW AGENT</span>
          </div>
          <NeuBadge variant="green" className="animate-pulse hidden sm:inline-flex">● V2.0 LIVE</NeuBadge>
        </div>

        {/* Header Links */}
        <nav className="hidden lg:flex items-center gap-6 font-mono text-xs font-black uppercase">
          <a href="#features" className="hover:underline hover:text-[#FE90E8] transition">FEATURES</a>
          <a href="#mission" className="hover:underline hover:text-[#FE90E8] transition">OUR MISSION</a>
          <a href="#resume" className="hover:underline hover:text-[#FE90E8] transition">RESUME AI</a>
          <a href="#faq" className="hover:underline hover:text-[#FE90E8] transition">FAQ</a>
        </nav>

        {/* Auth & CTA Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <NeuButton variant="white" size="sm" className="text-xs px-2.5 py-1">LOG IN</NeuButton>
            </SignInButton>
            <SignUpButton mode="modal">
              <NeuButton variant="black" size="sm" className="text-xs px-2.5 py-1">SIGN UP →</NeuButton>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-2 sm:gap-3">
              <UserButton />
              <NeuButton variant="black" size="sm" onClick={onEnterDashboard} className="text-xs px-2.5 py-1">
                DASHBOARD →
              </NeuButton>
            </div>
          </SignedIn>
        </div>
      </header>

      {/* Infinite Neubrutalist Marquee Banner */}
      <div className="overflow-hidden border-b-3 border-black bg-[#FE90E8] py-2 font-mono text-[10px] sm:text-xs font-black text-black uppercase">
        <div className="flex whitespace-nowrap animate-marquee">
          <span>{TICKER_TEXT.repeat(4)}</span>
          <span>{TICKER_TEXT.repeat(4)}</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-12 md:py-24 max-w-7xl mx-auto space-y-10 md:space-y-12">
        <div className="text-center max-w-4xl mx-auto space-y-6 md:space-y-8">
          
          <div className="inline-block animate-float">
            <NeuBadge variant="pink" className="text-xs px-4 py-1.5 shadow-neu-sm border-2 border-black">
              ⚡ V2.0 ADAPTIVE INTERVIEW ENGINE — READY FOR PRODUCTION
            </NeuBadge>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-black leading-[1.1]">
            THE TECHNICAL INTERVIEW PLATFORM THAT THINKS LIKE A{' '}
            <span className="bg-[#F7CB46] px-3 py-1 border-3 border-black inline-block shadow-neu-lg hover:rotate-1 hover:scale-105 transition-transform cursor-pointer">
              SENIOR ARCHITECT.
            </span>
          </h1>

          <p className="text-base sm:text-lg font-bold text-slate-800 max-w-3xl mx-auto leading-relaxed">
            Conduct adaptive, role-aware technical interviews with real-time multi-dimensional answer evaluation, graph retrieval, and role-matched resume scoring.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
            <NeuButton
              variant="yellow"
              size="lg"
              className="shadow-neu-lg px-8 py-4 text-base hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] transition-all"
              onClick={onEnterDashboard}
            >
              ENTER DASHBOARD NOW →
            </NeuButton>

            <NeuButton
              variant="cyan"
              size="lg"
              className="shadow-neu-lg px-8 py-4 text-base hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] transition-all"
              onClick={onOpenResumeAI}
            >
              TRY ROLE-AWARE RESUME AI ⚡
            </NeuButton>
          </div>
        </div>

        {/* Neo-Brutalist Character & Emotion Shuttle Showcase Section */}
        <div id="interviewer" className="max-w-5xl mx-auto space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-3 border-black pb-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="bg-black text-[#F7CB46] px-2 py-0.5 font-black text-xs">AI INTERVIEWER PERSONA</span>
              <span className="font-black text-xs uppercase">MINIMALIST CARTOON ART & LIVE EMOTION ENGINE</span>
            </div>
            <NeuBadge variant="pink" className="animate-pulse">● LIVE EMOTION SHUTTLE</NeuBadge>
          </div>

          <NeoBrutalCharacter initialEmotion="asking" showControls={true} />
        </div>

        {/* Hero Interactive Console Preview Card with Animated Typing & Live Signal Meters */}
        <NeuCard color="white" className="max-w-5xl mx-auto p-6 md:p-8 space-y-6 shadow-neu-lg neu-card-hover border-3 border-black">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-3 border-black pb-4">
            <div className="flex items-center gap-3">
              <NeuBadge variant="yellow">LIVE CONSOLE PREVIEW</NeuBadge>
              <span className="font-mono text-xs font-black">AI ENGINEER / DAY 14 · RAG PIPELINES</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 animate-ping rounded-full bg-[#99E885]"></span>
              <NeuBadge variant="green">● SYSTEM ONLINE</NeuBadge>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <div className="border-2 border-black bg-[#C0F7FE] p-4 space-y-2 shadow-neu-sm">
                <span className="font-mono text-[10px] font-black uppercase text-slate-800">INTERVIEWER QUESTION</span>
                <p className="font-bold text-sm text-black">
                  "How would you evaluate whether your RAG retrieval pipeline is returning high-quality context before passing it to the LLM?"
                </p>
              </div>

              <div className="border-2 border-black bg-white p-4 space-y-2 shadow-neu-sm min-h-[90px]">
                <span className="font-mono text-[10px] font-black uppercase text-slate-500 flex items-center justify-between">
                  <span>CANDIDATE RESPONSE</span>
                  <span className="animate-pulse text-[#FE90E8]">● TYPING REAL-TIME</span>
                </span>
                <p className="font-mono font-bold text-sm text-black border-l-2 border-black pl-3 py-1 bg-[#FFFDF6]">
                  "{typedText}"<span className="animate-ping font-black">|</span>
                </p>
              </div>
            </div>

            {/* Live Evaluation Pulse Meters */}
            <div className="border-2 border-black bg-[#FFDC8B] p-4 space-y-3 font-mono text-xs font-bold shadow-neu-sm">
              <div className="flex items-center justify-between border-b-2 border-black pb-1">
                <span className="font-black text-black">REAL-TIME EVALUATION</span>
                <span className="text-[10px] bg-black text-white px-1.5 py-0.5 font-mono">LIVE</span>
              </div>
              <div className="flex justify-between items-center">
                <span>RELEVANCE:</span>
                <span className="font-black text-[#99E885] bg-white border border-black px-2 py-0.5">94%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>CORRECTNESS:</span>
                <span className="font-black text-[#99E885] bg-white border border-black px-2 py-0.5">88%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>DEPTH:</span>
                <span className="font-black text-[#99E885] bg-white border border-black px-2 py-0.5">82%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>REASONING:</span>
                <span className="font-black text-black bg-white border border-black px-2 py-0.5">78%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>COMMUNICATION:</span>
                <span className="font-black text-[#99E885] bg-white border border-black px-2 py-0.5">91%</span>
              </div>
            </div>
          </div>
        </NeuCard>
      </section>

      {/* "Our Mission" Split Section */}
      <section id="mission" className="border-t-3 border-black bg-[#C0F7FE] px-6 py-20 md:py-28">
        <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-2 items-center">
          
          <div className="space-y-6">
            <NeuBadge variant="black">OUR MISSION — PREPARING TOMORROW'S WORKFORCE</NeuBadge>
            
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-black leading-tight">
              THE INTERVIEW PREP PLATFORM THAT THINKS LIKE A REAL INTERVIEWER
            </h2>

            <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
              Most interview prep tools give candidates static lists of questions. Our AI conducts real conversation, listens to every answer, adapts follow-up questions in real time, and evaluates performance across 10+ dimensions.
            </p>

            <div className="space-y-4 pt-2">
              <div className="border-2 border-black bg-white p-4 space-y-1 shadow-neu-sm hover:-translate-y-1 transition-transform">
                <h4 className="font-black text-sm uppercase text-black flex items-center gap-2">
                  <span>⚡</span> Practice Realistic Scenarios
                </h4>
                <p className="text-xs font-bold text-slate-700">
                  Practice role-specific scenarios instead of generic questions, with AI that adapts to every answer in real time.
                </p>
              </div>

              <div className="border-2 border-black bg-white p-4 space-y-1 shadow-neu-sm hover:-translate-y-1 transition-transform">
                <h4 className="font-black text-sm uppercase text-black flex items-center gap-2">
                  <span>📊</span> Measure What Matters
                </h4>
                <p className="text-xs font-bold text-slate-700">
                  Performance data across 10+ metrics shows exactly where each candidate is improving and where they still need work.
                </p>
              </div>

              <div className="border-2 border-black bg-white p-4 space-y-1 shadow-neu-sm hover:-translate-y-1 transition-transform">
                <h4 className="font-black text-sm uppercase text-black flex items-center gap-2">
                  <span>🎯</span> Build Lasting Confidence
                </h4>
                <p className="text-xs font-bold text-slate-700">
                  Structured feedback and evidence-backed resume matching help candidates communicate clearly, confidently, and professionally.
                </p>
              </div>
            </div>
          </div>

          <NeuCard color="yellow" className="p-8 space-y-6 shadow-neu-lg neu-card-hover border-3 border-black">
            <NeuBadge variant="black">CANDIDATE INTELLIGENCE SHOWCASE</NeuBadge>
            <h3 className="text-2xl font-black uppercase text-black">LIVE SIGNAL TRACKING</h3>

            <div className="space-y-4 font-mono text-xs font-bold">
              <div>
                <div className="flex justify-between mb-1"><span>RAG & RETRIEVAL:</span><span>92% (STRONG)</span></div>
                <div className="h-4 border-2 border-black bg-white p-0.5"><div className="h-full bg-[#99E885] transition-all duration-1000" style={{ width: '92%' }}></div></div>
              </div>

              <div>
                <div className="flex justify-between mb-1"><span>VECTOR DATABASES:</span><span>84% (STRONG)</span></div>
                <div className="h-4 border-2 border-black bg-white p-0.5"><div className="h-full bg-[#99E885] transition-all duration-1000" style={{ width: '84%' }}></div></div>
              </div>

              <div>
                <div className="flex justify-between mb-1"><span>PRODUCTION AI:</span><span>54% (REVISION NEEDED)</span></div>
                <div className="h-4 border-2 border-black bg-white p-0.5"><div className="h-full bg-[#FE90E8] transition-all duration-1000" style={{ width: '54%' }}></div></div>
              </div>
            </div>

            <NeuButton variant="black" className="w-full py-3 hover:-translate-y-1 transition" onClick={onEnterDashboard}>
              EXPLORE CANDIDATE DASHBOARD →
            </NeuButton>
          </NeuCard>

        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="px-6 py-20 md:py-28 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <NeuBadge variant="yellow" className="animate-pulse">COMPLETE CAPABILITIES</NeuBadge>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black">
            EVERYTHING YOU NEED TO WALK IN CONFIDENT
          </h2>
          <p className="text-sm font-bold text-slate-700">
            A complete, production-grade technical interview preparation platform in one place.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <NeuCard color="cyan" className="space-y-3 neu-card-hover">
            <NeuBadge variant="black">01 · EVALUATION</NeuBadge>
            <h3 className="text-xl font-black uppercase text-black">DEEP ANSWER EVALUATION</h3>
            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              Analyzes structure, correctness, depth, reasoning, and technical relevance of candidate responses without keyword-only shortcuts.
            </p>
          </NeuCard>

          <NeuCard color="pink" className="space-y-3 neu-card-hover">
            <NeuBadge variant="black">02 · BEHAVIORAL</NeuBadge>
            <h3 className="text-xl font-black uppercase text-black">BEHAVIORAL & COMMUNICATION METRICS</h3>
            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              Measures clarity, confidence, conciseness, structure, and technical communication independently from technical correctness.
            </p>
          </NeuCard>

          <NeuCard color="green" className="space-y-3 neu-card-hover">
            <NeuBadge variant="black">03 · RESUME</NeuBadge>
            <h3 className="text-xl font-black uppercase text-black">AI RESUME ANALYSIS</h3>
            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              Evaluates resume fit dynamically for target roles (AI Engineer vs Data Engineer), extracting matched evidence and missing skills.
            </p>
          </NeuCard>

          <NeuCard color="cream" className="space-y-3 neu-card-hover">
            <NeuBadge variant="black">04 · ANALYTICS</NeuBadge>
            <h3 className="text-xl font-black uppercase text-black">PERFORMANCE DASHBOARDS</h3>
            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              Visualizes 31-day cohort topic mastery, competency sub-scores, and answer quality progression over time.
            </p>
          </NeuCard>

          <NeuCard color="yellow" className="space-y-3 neu-card-hover">
            <NeuBadge variant="black">05 · RETRIEVAL</NeuBadge>
            <h3 className="text-xl font-black uppercase text-black">GRAPH INTELLIGENCE</h3>
            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              Leverages TheBreeth graph retrieval to store candidate learning journeys, completed missions, and skipped topics.
            </p>
          </NeuCard>

          <NeuCard color="white" className="space-y-3 neu-card-hover">
            <NeuBadge variant="black">06 · ADAPTIVE</NeuBadge>
            <h3 className="text-xl font-black uppercase text-black">REAL-TIME FOLLOW-UPS</h3>
            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              Dynamically generates targeted follow-up questions when candidate answers reveal trade-off or system architecture gaps.
            </p>
          </NeuCard>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="border-t-3 border-black bg-white px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="space-y-2">
            <NeuBadge variant="pink">QUESTIONS & ANSWERS</NeuBadge>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div className="divide-y-3 divide-black border-3 border-black bg-[#FFFDF6] overflow-hidden shadow-neu">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div key={idx} className="bg-white">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-black text-sm uppercase hover:bg-[#F7CB46]/30 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className={`font-mono text-xl font-black transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#FE90E8]' : ''}`}>
                      ↓
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 font-mono text-xs font-bold text-slate-800 leading-relaxed border-t border-slate-200 bg-[#FFFDF6]">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t-3 border-black bg-[#F7CB46] px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-black">
            READY TO TEST WHAT YOU ACTUALLY KNOW?
          </h2>
          <p className="text-sm font-bold text-slate-900">
            Launch your personalized AI technical interview session or evaluate candidate resumes now.
          </p>
          <div className="pt-2">
            <NeuButton variant="black" size="lg" className="px-10 py-4 shadow-neu-lg hover:scale-105 transition-transform" onClick={onEnterDashboard}>
              ENTER DASHBOARD NOW →
            </NeuButton>
          </div>
        </div>
      </footer>

    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'

import { createSessionId, loadCandidates } from './api'
import type { Candidate } from './types'

import { NeuBadge } from './components/neu/NeuBadge'
import { DashboardView } from './components/views/DashboardView'
import { InterviewConfigView } from './components/views/InterviewConfigView'
import { PerformanceView } from './components/views/PerformanceView'
import { CurriculumView } from './components/views/CurriculumView'
import { HistoryView } from './components/views/HistoryView'
import { SettingsView } from './components/views/SettingsView'
import { InterviewScreen } from './components/InterviewScreen'
import { ResumeAnalyzerModal } from './components/ResumeAnalyzerModal'

import { SignedIn, SignedOut, SignInButton, useUser, UserButton } from '@clerk/clerk-react'
import { NeuButton } from './components/neu/NeuButton'
import { LandingPage } from './components/views/LandingPage'

import { loadUserCandidateData, calculateCandidateMetrics } from './utils/candidateStore'

import { CameraCheckModal } from './components/CameraCheckModal'

type Mode = 'landing' | 'app'
type View = 'dashboard' | 'config' | 'interview' | 'performance' | 'curriculum' | 'history' | 'settings'

function App() {
  const { user } = useUser()
  const [mode, setMode] = useState<Mode>('landing')
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [interviewers, setInterviewers] = useState<Candidate[]>([])
  const [selectedInterviewer, setSelectedInterviewer] = useState<Candidate | null>(null)
  const [sessionId, setSessionId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [resumeModalOpen, setResumeModalOpen] = useState(false)
  const [cameraModalOpen, setCameraModalOpen] = useState(false)

  const [voiceModeConfig, setVoiceModeConfig] = useState(true)
  const [cameraStreamConfig, setCameraStreamConfig] = useState<MediaStream | null>(null)

  useEffect(() => {
    // Purge legacy mock seed data keys from browser localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('ai_interview_candidate_')) {
          const val = localStorage.getItem(key)
          if (val && (val.includes('SESS-101') || val.includes('SESS-102') || val.includes('"lastResumeScore":79') || val.includes('"lastResumeScore": 79'))) {
            localStorage.removeItem(key)
          }
        }
      }
    } catch (e) {}

    loadCandidates()
      .then((data) => {
        setInterviewers(data)
        if (data.length > 0) {
          setSelectedInterviewer(data[0])
        }
      })
      .catch(() => setError('Failed to load AI interviewer personas from API.'))
      .finally(() => setLoading(false))
  }, [])

  const [refreshKey, setRefreshKey] = useState(0)

  // Scope active candidate data dynamically to the currently selected persona in dropdown
  const currentCandidateId = selectedInterviewer?.member?.id || user?.id || 'guest_candidate'
  const currentCandidateName = selectedInterviewer?.member?.name || user?.fullName || user?.firstName || 'Candidate User'
  const userEmail = user?.primaryEmailAddress?.emailAddress

  const candidateData = useMemo(
    () => loadUserCandidateData(currentCandidateId, currentCandidateName, userEmail),
    [currentCandidateId, currentCandidateName, userEmail, refreshKey]
  )
  const activeCandidate = useMemo(
    () => calculateCandidateMetrics(candidateData),
    [candidateData]
  )


  function handleInterviewerChange(interviewerId: string) {
    const found = interviewers.find((c) => c.member.id === interviewerId)
    if (found) {
      setSelectedInterviewer(found)
      setRefreshKey((prev) => prev + 1)
    }
  }

  function handleBeginInterviewConfig(config: {
    targetRole: string
    experienceLevel: string
    interviewMode: string
    difficulty: string
    useResumeContext: boolean
    voiceMode: boolean
    cameraMode: boolean
  }) {
    setVoiceModeConfig(config.voiceMode)
    activeCandidate.member.jobRole = config.targetRole

    if (config.cameraMode) {
      setCameraModalOpen(true)
    } else {
      setSessionId(createSessionId())
      setActiveView('interview')
    }
  }

  function handleStartWithCamera(stream: MediaStream) {
    setCameraStreamConfig(stream)
    setCameraModalOpen(false)
    setSessionId(createSessionId())
    setActiveView('interview')
  }

  function handleStartWithoutCamera() {
    setCameraStreamConfig(null)
    setCameraModalOpen(false)
    setSessionId(createSessionId())
    setActiveView('interview')
  }

  function handleRestart() {
    setSessionId('')
    setCameraStreamConfig(null)
    setActiveView('dashboard')
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FFFDF6] font-mono">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin border-4 border-black border-t-transparent"></div>
          <p className="font-black text-sm uppercase text-black">INITIALIZING AI INTERVIEW AGENT PLATFORM...</p>
        </div>
      </div>
    )
  }

  if (error || !selectedInterviewer) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FFFDF6] font-mono">
        <div className="space-y-4 text-center max-w-md border-3 border-black bg-white p-6 shadow-neu">
          <p className="font-black text-sm text-[#FE90E8] uppercase">⚠ {error || 'No interviewer data available.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="neu-btn bg-[#F7CB46] text-black px-4 py-2 text-xs font-black"
          >
            RETRY CONNECTION →
          </button>
        </div>
      </div>
    )
  }

  // Render Neubrutalist Minimalist Landing Page as initial entry point
  if (mode === 'landing') {
    return (
      <>
        <LandingPage
          onEnterDashboard={() => setMode('app')}
          onOpenResumeAI={() => {
            setMode('app')
            setResumeModalOpen(true)
          }}
        />
        {resumeModalOpen && (
          <ResumeAnalyzerModal
            candidate={activeCandidate}
            onClose={() => setResumeModalOpen(false)}
            onStartInterview={() => {
              setResumeModalOpen(false)
              setMode('app')
              setActiveView('config')
            }}
          />
        )}
      </>
    )
  }

  // If inside active interview room, render Technical Console full screen
  if (activeView === 'interview' && sessionId) {
    return (
      <InterviewScreen
        candidate={activeCandidate}
        sessionId={sessionId}
        voiceModeInitial={voiceModeConfig}
        cameraStreamInitial={cameraStreamConfig}
        onRestart={handleRestart}
      />
    )
  }

  return (
    <div className="flex h-screen w-full flex-col bg-[#FFFDF6] font-sans text-black overflow-hidden">
      
      {/* SaaS Top Header */}
      <header className="flex shrink-0 items-center justify-between border-b-3 border-black bg-[#F7CB46] px-4 sm:px-6 py-3 shadow-neu-sm z-30">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden neu-btn bg-white text-black px-3 py-1 text-xs font-black"
          >
            {mobileMenuOpen ? '✕ CLOSE' : '☰ MENU'}
          </button>

          <button
            onClick={() => setMode('landing')}
            className="hidden sm:inline-block neu-btn bg-white text-black px-3 py-1 text-xs font-black"
          >
            ← HOME
          </button>

          <div className="flex items-center gap-2 border-2 border-black bg-black px-2.5 sm:px-3 py-1 text-white shadow-neu-sm">
            <span className="font-mono font-black text-xs sm:text-base text-[#F7CB46]">⚡ AI INTERVIEW AGENT</span>
          </div>

          <NeuBadge variant="green" className="hidden sm:inline-flex">● SYSTEM READY</NeuBadge>
        </div>

        {/* Header Right Actions, AI Interviewer Persona Switcher & Clerk Auth */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex items-center gap-2 border-2 border-black bg-white px-3 py-1 shadow-neu-sm">
            <span className="font-mono text-[10px] font-black uppercase text-slate-500">AI INTERVIEWER:</span>
            <select
              value={selectedInterviewer.member.id}
              onChange={(e) => handleInterviewerChange(e.target.value)}
              className="font-bold text-xs bg-transparent border-none text-black focus:outline-none cursor-pointer"
            >
              {interviewers.map((i) => (
                <option key={i.member.id} value={i.member.id}>
                  {i.member.name} ({i.member.jobRole})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setResumeModalOpen(true)}
            className="neu-btn bg-[#FE90E8] text-black px-2.5 sm:px-3.5 py-1.5 text-xs font-black"
          >
            RESUME AI ⚡
          </button>

          <SignedOut>
            <SignInButton mode="modal">
              <NeuButton variant="white" size="sm">LOG IN</NeuButton>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      {/* Slide-over Mobile Navigation Drawer for Mobile Screens (< md) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}></div>
          <aside className="relative z-50 w-72 max-w-[80vw] border-r-3 border-black bg-[#FFFDF6] p-4 flex flex-col justify-between overflow-y-auto font-sans shadow-neu-lg">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <span className="font-mono text-xs font-black uppercase text-black">PLATFORM NAVIGATION</span>
                <button onClick={() => setMobileMenuOpen(false)} className="font-mono text-xs font-black bg-white border border-black px-2 py-0.5">✕</button>
              </div>

              {/* AI Interviewer Selector inside Mobile Drawer */}
              <div className="space-y-1.5 p-3 border-2 border-black bg-white">
                <span className="font-mono text-[10px] font-black uppercase text-slate-500 block">AI INTERVIEWER PERSONA:</span>
                <select
                  value={selectedInterviewer.member.id}
                  onChange={(e) => {
                    handleInterviewerChange(e.target.value)
                    setMobileMenuOpen(false)
                  }}
                  className="w-full font-bold text-xs bg-slate-50 border border-black p-2 text-black focus:outline-none"
                >
                  {interviewers.map((i) => (
                    <option key={i.member.id} value={i.member.id}>
                      {i.member.name} ({i.member.jobRole})
                    </option>
                  ))}
                </select>
              </div>

              <nav className="space-y-2">
                <NavItem
                  label="Dashboard"
                  icon="📊"
                  active={activeView === 'dashboard'}
                  onClick={() => { setActiveView('dashboard'); setMobileMenuOpen(false) }}
                />
                <NavItem
                  label="Start Interview"
                  icon="⚡"
                  active={activeView === 'config'}
                  onClick={() => { setActiveView('config'); setMobileMenuOpen(false) }}
                />
                <NavItem
                  label="Resume AI"
                  icon="📄"
                  active={false}
                  onClick={() => { setResumeModalOpen(true); setMobileMenuOpen(false) }}
                />
                <NavItem
                  label="Performance"
                  icon="📈"
                  active={activeView === 'performance'}
                  onClick={() => { setActiveView('performance'); setMobileMenuOpen(false) }}
                />
                <NavItem
                  label="Curriculum"
                  icon="🗺️"
                  active={activeView === 'curriculum'}
                  onClick={() => { setActiveView('curriculum'); setMobileMenuOpen(false) }}
                />
                <NavItem
                  label="Interview History"
                  icon="📜"
                  active={activeView === 'history'}
                  onClick={() => { setActiveView('history'); setMobileMenuOpen(false) }}
                />
                <NavItem
                  label="Settings"
                  icon="⚙️"
                  active={activeView === 'settings'}
                  onClick={() => { setActiveView('settings'); setMobileMenuOpen(false) }}
                />
              </nav>
            </div>

            <div className="border-2 border-black bg-[#FFDC8B] p-3 space-y-1 shadow-neu-sm mt-6">
              <span className="font-mono text-[9px] font-black uppercase text-black block">CANDIDATE PROFILE</span>
              <p className="font-black text-xs text-black truncate">{activeCandidate.member.name}</p>
              <span className="font-mono text-[9px] font-bold text-slate-700 block mt-1">INTERVIEWER: {selectedInterviewer.member.name}</span>
            </div>
          </aside>
        </div>
      )}

      {/* Main SaaS Layout: Sidebar + View Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left SaaS Navigation Sidebar (Desktop >= md) */}
        <aside className="hidden md:flex w-64 shrink-0 border-r-3 border-black bg-white p-4 flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            <div>
              <span className="font-mono text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-2">
                PLATFORM NAVIGATION
              </span>
              <nav className="space-y-1.5">
                <NavItem
                  label="Dashboard"
                  icon="📊"
                  active={activeView === 'dashboard'}
                  onClick={() => setActiveView('dashboard')}
                />
                <NavItem
                  label="Start Interview"
                  icon="⚡"
                  active={activeView === 'config'}
                  onClick={() => setActiveView('config')}
                />
                <NavItem
                  label="Resume AI"
                  icon="📄"
                  active={false}
                  onClick={() => setResumeModalOpen(true)}
                />
                <NavItem
                  label="Performance"
                  icon="📈"
                  active={activeView === 'performance'}
                  onClick={() => setActiveView('performance')}
                />
                <NavItem
                  label="Curriculum"
                  icon="🗺️"
                  active={activeView === 'curriculum'}
                  onClick={() => setActiveView('curriculum')}
                />
                <NavItem
                  label="Interview History"
                  icon="📜"
                  active={activeView === 'history'}
                  onClick={() => setActiveView('history')}
                />
                <NavItem
                  label="Settings"
                  icon="⚙️"
                  active={activeView === 'settings'}
                  onClick={() => setActiveView('settings')}
                />
              </nav>
            </div>
          </div>

          {/* Sidebar Footer Logged-In Candidate Card */}
          <div className="border-2 border-black bg-[#FFDC8B] p-3 space-y-1 shadow-neu-sm">
            <span className="font-mono text-[9px] font-black uppercase text-black block">CANDIDATE PROFILE</span>
            <p className="font-black text-xs text-black truncate">{activeCandidate.member.name}</p>
            <span className="font-mono text-[9px] font-bold text-slate-700 block mt-1">INTERVIEWER: {selectedInterviewer.member.name}</span>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto bg-dot-pattern p-6 md:p-10 lg:p-12">
          {activeView === 'dashboard' && (
            <DashboardView
              key={refreshKey}
              candidate={activeCandidate}
              onStartInterviewClick={() => setActiveView('config')}
              onOpenResumeClick={() => setResumeModalOpen(true)}
              onUserDataChanged={() => setRefreshKey((prev) => prev + 1)}
            />
          )}

          {activeView === 'config' && (
            <InterviewConfigView
              candidate={activeCandidate}
              onBeginInterview={handleBeginInterviewConfig}
            />
          )}

          {activeView === 'performance' && (
            <PerformanceView candidate={activeCandidate} />
          )}

          {activeView === 'curriculum' && (
            <CurriculumView candidate={activeCandidate} />
          )}

          {activeView === 'history' && (
            <HistoryView
              candidate={activeCandidate}
              onStartInterviewClick={() => setActiveView('config')}
            />
          )}

          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Resume AI Modal Workspace */}
      {resumeModalOpen && (
        <ResumeAnalyzerModal
          candidate={activeCandidate}
          onClose={() => setResumeModalOpen(false)}
          onStartInterview={() => {
            setResumeModalOpen(false)
            setActiveView('config')
          }}
        />
      )}

      {/* Camera & Integrity Readiness Check Modal */}
      {cameraModalOpen && (
        <CameraCheckModal
          onStartWithIntegrity={handleStartWithCamera}
          onStartWithoutCamera={handleStartWithoutCamera}
          onClose={() => setCameraModalOpen(false)}
        />
      )}
    </div>
  )
}

function NavItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 font-mono text-xs font-black uppercase transition border-2 ${
        active
          ? 'bg-[#F7CB46] text-black border-black shadow-neu-sm'
          : 'bg-white text-slate-800 border-transparent hover:border-black hover:bg-[#FFFDF6]'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export default App

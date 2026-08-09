import { useState } from 'react'
import type { Candidate, ResumeAnalysis, RoleComparisonResponse } from '../types'
import { analyzeResume, compareResumeRoles } from '../api'
import { NeuCard } from './neu/NeuCard'
import { NeuButton } from './neu/NeuButton'
import { NeuBadge } from './neu/NeuBadge'
import { updateResumeScore } from '../utils/candidateStore'

interface Props {
  candidate: Candidate
  onClose: () => void
  onStartInterview: () => void
}

const ROLES = [
  'AI Engineer',
  'Data Engineer',
  'ML Engineer',
  'Software Engineer',
  'Backend Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'Other',
]

const SENIORITIES = ['Junior', 'Mid-Level', 'Senior', 'Lead / Staff']

export function ResumeAnalyzerModal({ candidate, onClose, onStartInterview }: Props) {
  const [step, setStep] = useState<'upload' | 'results'>('upload')

  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [comparison, setComparison] = useState<RoleComparisonResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [comparing, setComparing] = useState(false)

  const [targetRole, setTargetRole] = useState(candidate.member.jobRole || 'AI Engineer')
  const [seniorityLevel, setSeniorityLevel] = useState('Mid-Level')
  const [jobDescription, setJobDescription] = useState('')
  const [customText, setCustomText] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'scorecard' | 'compare' | 'curriculum' | 'bullets'>('scorecard')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) {
        setCustomText(text)
      }
    }
    reader.readAsText(file)
  }

  const handleUseCandidateProfile = () => {
    const profileSummary = `Member: ${candidate.member.name}\nRole: ${candidate.member.jobRole}\nYears Experience: ${candidate.member.yearsExperience}\nEducation: ${candidate.member.education}\nCompleted Missions: ${candidate.missions.filter(m => m.passed).map(m => m.title).join(', ')}`
    setCustomText(profileSummary)
    setUploadedFileName(`Profile: ${candidate.member.name}`)
  }

  const runAnalysis = async () => {
    setLoading(true)
    setStep('results')

    try {
      const data = await analyzeResume(
        candidate,
        undefined,
        customText.trim() ? customText : undefined,
        targetRole,
        seniorityLevel,
        jobDescription.trim() ? jobDescription : undefined
      )
      setAnalysis(data)
      if (data.roleReport) {
        try {
          updateResumeScore(candidate.member.id, candidate.member.name, data.roleReport.overallMatchScore, data.roleReport.targetRole)
        } catch (e) {
          console.error('Failed to persist resume score', e)
        }
      }
    } catch (err) {
      console.error('Failed to run resume analysis', err)
    } finally {
      setLoading(false)
    }
  }

  const runRoleComparison = async () => {
    setComparing(true)
    try {
      const compData = await compareResumeRoles(candidate, customText.trim() ? customText : undefined, seniorityLevel)
      setComparison(compData)
      setActiveTab('compare')
    } catch (err) {
      console.error('Failed to run role comparison', err)
    } finally {
      setComparing(false)
    }
  }

  const roleReport = analysis?.roleReport

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col border-3 border-black bg-[#FFFDF6] shadow-neu-lg overflow-hidden text-black">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-3 border-black px-6 py-4 bg-[#F7CB46]">
          <div className="flex items-center gap-3">
            <NeuBadge variant="black">RESUME AI</NeuBadge>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                ROLE-AWARE RESUME INTELLIGENCE
              </h2>
              <p className="text-xs font-bold text-slate-900">
                {candidate.member.name} · {candidate.member.jobRole} ({candidate.member.yearsExperience} yrs exp)
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="neu-btn bg-white px-3 py-1 text-xs font-black text-black"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* STEP 1: Upload / Input Form */}
        {step === 'upload' ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-8 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <NeuBadge variant="cyan">TARGET EVALUATION SETUP</NeuBadge>
              <h3 className="text-3xl font-black uppercase text-black">UPLOAD & EVALUATE RESUME</h3>
              <p className="text-sm font-bold text-slate-700">
                Select your target job role and seniority level, upload your resume file or paste text to generate a role-specific match score.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto w-full">
              {/* Target Role & Seniority Options */}
              <NeuCard color="white" className="space-y-5">
                <h4 className="text-xs font-mono font-black uppercase text-black border-b-2 border-black pb-2">
                  1. TARGET POSITION & SENIORITY
                </h4>
                
                <div>
                  <label className="block text-xs font-mono font-black uppercase text-slate-800 mb-1.5">Target Job Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full border-2 border-black bg-white p-3 font-bold text-xs focus:bg-[#C0F7FE] focus:outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-black uppercase text-slate-800 mb-1.5">Seniority Level</label>
                  <select
                    value={seniorityLevel}
                    onChange={(e) => setSeniorityLevel(e.target.value)}
                    className="w-full border-2 border-black bg-white p-3 font-bold text-xs focus:bg-[#C0F7FE] focus:outline-none"
                  >
                    {SENIORITIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-black uppercase text-slate-800 mb-1.5">Target Job Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste specific job description requirements or responsibilities..."
                    className="w-full border-2 border-black bg-white p-3 font-bold text-xs focus:bg-[#C0F7FE] focus:outline-none"
                  />
                </div>
              </NeuCard>

              {/* Upload File / Paste Text */}
              <NeuCard color="cyan" className="space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-black uppercase text-black border-b-2 border-black pb-2">
                    2. RESUME FILE SOURCE
                  </h4>

                  {/* File Upload Box */}
                  <div className="relative border-2 border-black bg-white p-6 text-center cursor-pointer hover:bg-[#FFFDF6] transition shadow-neu-sm">
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="space-y-2">
                      <div className="text-3xl">📁</div>
                      <p className="text-xs font-black text-black">
                        {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Click to Upload Resume File (.pdf, .txt, .docx)'}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-slate-600">or drag and drop your file here</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-black uppercase text-slate-800 mb-1.5">Or Paste Resume Text</label>
                    <textarea
                      rows={4}
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Paste raw resume text, work experience, or key project bullet points..."
                      className="w-full border-2 border-black bg-white p-3 font-bold text-xs focus:bg-[#FFFDF6] focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleUseCandidateProfile}
                    className="text-xs text-black hover:underline font-mono font-black flex items-center gap-1"
                  >
                    ⚡ Use Pre-Loaded Candidate Profile Data ({candidate.member.name})
                  </button>
                </div>
              </NeuCard>
            </div>

            {/* Action CTA */}
            <div className="flex items-center justify-center gap-4 pt-4 max-w-xl mx-auto w-full">
              <NeuButton
                variant="yellow"
                size="lg"
                onClick={runAnalysis}
                className="w-full py-4 text-base shadow-neu-lg"
              >
                ANALYZE & SCORE RESUME FOR {targetRole.toUpperCase()} →
              </NeuButton>
            </div>
          </div>
        ) : (
          /* STEP 2: Evaluation Results & Dashboard */
          <>
            {/* Toolbar Header for Results */}
            <div className="border-b-3 border-black bg-[#C0F7FE] p-4 px-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="neu-btn bg-white px-3 py-1.5 text-xs font-black text-black"
                >
                  ← CHANGE RESUME / ROLE
                </button>

                <span className="text-xs font-mono font-bold text-black">
                  TARGET: <span className="bg-[#F7CB46] px-2 py-0.5 border border-black font-black">{targetRole} ({seniorityLevel})</span>
                </span>
              </div>

              <div className="flex gap-2">
                <NeuButton
                  variant="pink"
                  size="sm"
                  onClick={runRoleComparison}
                  disabled={comparing || loading}
                >
                  {comparing ? 'COMPARING...' : '📊 COMPARE ALL ROLES'}
                </NeuButton>

                <NeuButton
                  variant="black"
                  size="sm"
                  onClick={onStartInterview}
                >
                  BEGIN INTERVIEW →
                </NeuButton>
              </div>
            </div>

            {/* Results Content Body */}
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
                
                {/* Navigation Tabs */}
                <div className="flex border-b-2 border-black space-x-4">
                  <TabButton label="Role Match Scorecard" active={activeTab === 'scorecard'} onClick={() => setActiveTab('scorecard')} />
                  <TabButton label="Multi-Role Comparison" active={activeTab === 'compare'} onClick={() => setActiveTab('compare')} />
                  <TabButton label="Curriculum Alignment" active={activeTab === 'curriculum'} onClick={() => setActiveTab('curriculum')} />
                  <TabButton label="Impact Bullet Enhancements" active={activeTab === 'bullets'} onClick={() => setActiveTab('bullets')} />
                </div>

                {loading ? (
                  <div className="flex h-64 flex-col items-center justify-center space-y-3">
                    <div className="h-10 w-10 animate-spin border-4 border-black border-t-transparent"></div>
                    <p className="text-sm font-mono font-black text-black uppercase">EVALUATING RESUME FOR {targetRole}...</p>
                  </div>
                ) : (
                  <>
                    {/* Tab 1: Role Match Scorecard */}
                    {activeTab === 'scorecard' && roleReport && (
                      <div className="space-y-6">
                        {/* Role Match Banner */}
                        <NeuCard color="yellow" className="p-6">
                          <div className="flex flex-wrap items-center justify-between gap-6">
                            <div>
                              <NeuBadge variant="black">MATCH REPORT</NeuBadge>
                              <h3 className="text-2xl font-black uppercase text-black mt-1">
                                {roleReport.targetRole} · {roleReport.seniorityLevel}
                              </h3>
                              <p className="mt-1 text-xs font-bold text-slate-900 max-w-xl">{roleReport.whySummary}</p>
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="border-3 border-black bg-white px-6 py-3 text-center shadow-neu-sm">
                                <span className="text-[10px] font-mono font-black uppercase text-slate-500 block">MATCH SCORE</span>
                                <span className="text-4xl font-black font-mono text-black tabular-nums">
                                  {roleReport.overallMatchScore}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </NeuCard>

                        {/* Sub-Scores Breakdown */}
                        <NeuCard color="white" className="space-y-4">
                          <h4 className="text-xs font-mono font-black uppercase text-black border-b-2 border-black pb-2">
                            ROLE MATCH SUB-SCORE BREAKDOWN
                          </h4>
                          <div className="grid gap-4 sm:grid-cols-3">
                            <SubScoreCard label="Skills Match" value={roleReport.subScores.skillsMatch} />
                            <SubScoreCard label="Experience Match" value={roleReport.subScores.experienceMatch} />
                            <SubScoreCard label="Project Relevance" value={roleReport.subScores.projectRelevance} />
                            <SubScoreCard label="Technology Match" value={roleReport.subScores.technologyMatch} />
                            <SubScoreCard label="Seniority Expectation" value={roleReport.subScores.seniorityMatch} />
                            <SubScoreCard label="Impact & Metrics" value={roleReport.subScores.impactScore} />
                          </div>
                        </NeuCard>

                        {/* Dynamic Categories */}
                        {roleReport.categories && roleReport.categories.length > 0 && (
                          <NeuCard color="white" className="space-y-3">
                            <h4 className="text-xs font-mono font-black uppercase text-black border-b-2 border-black pb-2">
                              TARGET ROLE SKILL CATEGORIES & WEIGHTING
                            </h4>
                            <div className="space-y-3">
                              {roleReport.categories.map((cat, idx) => (
                                <div key={idx}>
                                  <div className="flex justify-between font-mono text-xs font-black mb-1">
                                    <span>{cat.categoryName} <span className="font-normal text-slate-600">({cat.weightPct}% weight)</span></span>
                                    <span>{cat.scorePct}%</span>
                                  </div>
                                  <div className="h-3 w-full border-2 border-black bg-slate-100 p-0.5">
                                    <div
                                      className={`h-full border-r-2 border-black ${cat.scorePct >= 80 ? 'bg-[#99E885]' : cat.scorePct >= 60 ? 'bg-[#FFDC8B]' : 'bg-[#FE90E8]'}`}
                                      style={{ width: `${cat.scorePct}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </NeuCard>
                        )}

                        {/* Evidence: Matched vs Missing */}
                        <div className="grid gap-6 md:grid-cols-2">
                          <NeuCard color="green" className="space-y-3">
                            <h4 className="text-xs font-mono font-black uppercase text-black border-b-2 border-black pb-2">
                              MATCHED ROLE REQUIREMENTS
                            </h4>
                            <ul className="space-y-2 text-xs font-bold text-slate-900">
                              {roleReport.matchedEvidence.map((m, idx) => (
                                <li key={idx} className="leading-relaxed">{m}</li>
                              ))}
                            </ul>
                          </NeuCard>

                          <NeuCard color="pink" className="space-y-3">
                            <h4 className="text-xs font-mono font-black uppercase text-black border-b-2 border-black pb-2">
                              MISSING EVIDENCE & SKILL GAPS
                            </h4>
                            <ul className="space-y-2 text-xs font-bold text-slate-900">
                              {roleReport.missingEvidence.map((m, idx) => (
                                <li key={idx} className="leading-relaxed">{m}</li>
                              ))}
                            </ul>
                          </NeuCard>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Multi-Role Comparison */}
                    {activeTab === 'compare' && (
                      <div className="space-y-6">
                        {comparison ? (
                          <>
                            <NeuCard color="cyan" className="p-5 flex items-center justify-between">
                              <div>
                                <NeuBadge variant="black">BEST MATCH ROLE</NeuBadge>
                                <h3 className="text-2xl font-black uppercase text-black mt-1">
                                  {comparison.bestMatchRole} ({comparison.bestMatchScore}% MATCH)
                                </h3>
                                <p className="text-xs font-bold text-slate-800 mt-1">{comparison.summary}</p>
                              </div>
                              <NeuBadge variant="yellow" className="text-base px-4 py-2">★ BEST</NeuBadge>
                            </NeuCard>

                            <div className="divide-y-2 divide-black border-3 border-black bg-white overflow-hidden shadow-neu">
                              {comparison.comparisons.map((c, idx) => (
                                <div key={idx} className={`p-4 flex items-center justify-between gap-4 ${c.isBestMatch ? 'bg-[#FFDC8B]/40' : ''}`}>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-black text-sm uppercase">{c.role}</span>
                                      {c.isBestMatch && (
                                        <NeuBadge variant="green">BEST MATCH</NeuBadge>
                                      )}
                                    </div>
                                    <p className="text-xs font-bold text-slate-600 mt-0.5">{c.why}</p>
                                  </div>

                                  <div className="shrink-0 text-right">
                                    <span className={`font-mono text-2xl font-black tabular-nums ${c.score >= 85 ? 'text-[#99E885]' : 'text-black'}`}>
                                      {c.score}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12 space-y-4">
                            <p className="font-mono text-xs font-bold text-black">Compare candidate resume fit across AI Engineer, Data Engineer, ML Engineer, and Software Engineer roles simultaneously.</p>
                            <NeuButton variant="pink" onClick={runRoleComparison} disabled={comparing}>
                              RUN MULTI-ROLE COMPARISON →
                            </NeuButton>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Curriculum Alignment */}
                    {activeTab === 'curriculum' && analysis && (
                      <NeuCard color="white" className="space-y-4">
                        <h3 className="text-xs font-mono font-black uppercase text-black border-b-2 border-black pb-2">
                          31-DAY AI COHORT CURRICULUM ALIGNMENT MATRIX
                        </h3>
                        <div className="divide-y-2 divide-black border-2 border-black overflow-hidden">
                          {analysis.curriculumAlignment.map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-4 p-4 text-xs font-mono">
                              <div>
                                <p className="font-black text-black uppercase">{item.topic}</p>
                                <p className="text-slate-600 font-bold mt-0.5">{item.resumeEvidence}</p>
                              </div>
                              <NeuBadge variant={item.status === 'Strong' ? 'green' : item.status === 'Moderate' ? 'cyan' : 'pink'}>
                                {item.status}
                              </NeuBadge>
                            </div>
                          ))}
                        </div>
                      </NeuCard>
                    )}

                    {/* Tab 4: Impact Bullet Enhancements */}
                    {activeTab === 'bullets' && analysis && (
                      <NeuCard color="white" className="space-y-4">
                        <h3 className="text-xs font-mono font-black uppercase text-black border-b-2 border-black pb-2">
                          RESUME IMPACT STATEMENT ENHANCEMENTS
                        </h3>
                        <div className="space-y-4">
                          {analysis.weakPointEnhancements.map((item, idx) => (
                            <div key={idx} className="border-2 border-black bg-[#FFFDF6] p-4 space-y-2 shadow-neu-sm">
                              <div>
                                <NeuBadge variant="pink">ORIGINAL / WEAK</NeuBadge>
                                <p className="mt-1 text-xs font-bold text-slate-500 line-through">{item.weakStatement}</p>
                              </div>
                              <div>
                                <NeuBadge variant="green">ENHANCED IMPACT</NeuBadge>
                                <p className="mt-1 text-xs font-black text-black">{item.enhancedStatement}</p>
                              </div>
                              <p className="text-[10px] font-mono font-bold text-slate-600">💡 Rationale: {item.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </NeuCard>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SubScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-2 border-black bg-[#FFFDF6] p-3 text-center shadow-neu-sm">
      <span className="font-mono text-[10px] font-black text-slate-600 uppercase block">{label}</span>
      <span className="font-mono text-2xl font-black mt-1 block text-black">
        {value}%
      </span>
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-2 text-xs font-mono font-black uppercase tracking-wider border-b-3 transition ${
        active ? 'border-black text-black bg-[#F7CB46] px-3 py-1' : 'border-transparent text-slate-600 hover:text-black'
      }`}
    >
      {label}
    </button>
  )
}

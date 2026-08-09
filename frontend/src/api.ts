import type { Candidate, InterviewResponse, ResumeAnalysis, RoleComparisonResponse } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_BASE = `${BASE_URL}/api`

export async function loadCandidates(): Promise<Candidate[]> {
  // Candidates are now served from the backend, which sources them from TheBreeth.
  // Falls back to local JSON automatically server-side if TheBreeth is unavailable.
  const res = await fetch(`${API_BASE}/candidates`)
  if (!res.ok) throw new Error('Failed to load candidates from API')
  const data = await res.json()
  return data.candidates as Candidate[]
}

export async function startInterview(
  sessionId: string,
  candidate: Candidate,
): Promise<InterviewResponse> {
  const res = await fetch(`${API_BASE}/interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, candidate }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Failed to start interview: ${detail}`)
  }
  return res.json() as Promise<InterviewResponse>
}

export async function sendMessage(
  sessionId: string,
  message: string,
): Promise<InterviewResponse> {
  const res = await fetch(`${API_BASE}/interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Failed to send message: ${detail}`)
  }
  return res.json() as Promise<InterviewResponse>
}

export async function analyzeResume(
  candidate: Candidate,
  sessionId?: string,
  customResumeText?: string,
  targetRole: string = 'AI Engineer',
  seniorityLevel: string = 'Mid-Level',
  jobDescription?: string,
): Promise<ResumeAnalysis> {
  const res = await fetch(`${API_BASE}/resume/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate,
      sessionId,
      customResumeText,
      targetRole,
      seniorityLevel,
      jobDescription,
    }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Failed to analyze resume: ${detail}`)
  }
  return res.json() as Promise<ResumeAnalysis>
}

export async function compareResumeRoles(
  candidate: Candidate,
  customResumeText?: string,
  seniorityLevel: string = 'Mid-Level',
  targetRoles?: string[],
): Promise<RoleComparisonResponse> {
  const res = await fetch(`${API_BASE}/resume/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate,
      customResumeText,
      seniorityLevel,
      targetRoles,
    }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Failed to compare roles: ${detail}`)
  }
  return res.json() as Promise<RoleComparisonResponse>
}

export function createSessionId(): string {
  return crypto.randomUUID()
}

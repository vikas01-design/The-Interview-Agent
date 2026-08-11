import type { Candidate, InterviewResponse, ResumeAnalysis, RoleComparisonResponse } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_BASE = `${BASE_URL}/api`

export async function loadCandidates(): Promise<Candidate[]> {
  try {
    const res = await fetch(`${API_BASE}/candidates`)
    if (res.ok) {
      const data = await res.json()
      if (data && Array.isArray(data.candidates) && data.candidates.length > 0) {
        return data.candidates as Candidate[]
      }
    }
  } catch (err) {
    console.warn('API candidates endpoint unavailable, using static fallback candidates:', err)
  }

  const res = await fetch('/data/candidates.json')
  if (!res.ok) throw new Error('Failed to load fallback candidates dataset')
  const data = await res.json()
  return data.candidates as Candidate[]
}

export async function fetchUserDashboardBackend(userId: string, name?: string, email?: string) {
  try {
    const params = new URLSearchParams()
    if (name) params.set('name', name)
    if (email) params.set('email', email)

    const res = await fetch(`${API_BASE}/user/${encodeURIComponent(userId)}?${params.toString()}`)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Backend user dashboard endpoint unavailable:', err)
  }
  return null
}

export async function updateUserProfileBackend(
  userId: string,
  targetRole?: string,
  yearsExperience?: number,
  jobDescription?: string
) {
  try {
    const res = await fetch(`${API_BASE}/user/${encodeURIComponent(userId)}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRole, yearsExperience, jobDescription }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Backend update profile endpoint unavailable:', err)
  }
  return null
}

export async function updateUserCurriculumBackend(
  userId: string,
  day: number,
  status: string,
  score?: number
) {
  try {
    const res = await fetch(`${API_BASE}/user/${encodeURIComponent(userId)}/curriculum/${day}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, score }),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Backend update curriculum endpoint unavailable:', err)
  }
  return null
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

export async function fetchSessionTelemetry(sessionId: string) {
  try {
    const res = await fetch(`${API_BASE}/interview/${encodeURIComponent(sessionId)}/telemetry`)
    if (res.ok) return await res.json()
  } catch (err) {
    console.warn('Session telemetry endpoint unavailable:', err)
  }
  return null
}

export async function fetchGlobalTelemetry() {
  try {
    const res = await fetch(`${API_BASE}/analytics/telemetry`)
    if (res.ok) return await res.json()
  } catch (err) {
    console.warn('Global telemetry endpoint unavailable:', err)
  }
  return null
}

export async function startInterviewSession(
  sessionId: string,
  candidate: Candidate,
): Promise<InterviewResponse> {
  const res = await fetch(`${API_BASE}/interview/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, candidate }),
  })
  if (!res.ok) {
    return startInterview(sessionId, candidate)
  }
  return res.json() as Promise<InterviewResponse>
}

export async function submitInterviewAnswer(
  sessionId: string,
  answer: string,
  questionId?: string,
): Promise<InterviewResponse> {

  const res = await fetch(`${API_BASE}/interview/${encodeURIComponent(sessionId)}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, answer }),
  })
  if (!res.ok) {
    return sendMessage(sessionId, answer)
  }
  return res.json() as Promise<InterviewResponse>
}

export async function getInterviewSession(sessionId: string) {
  try {
    const res = await fetch(`${API_BASE}/interview/${encodeURIComponent(sessionId)}`)
    if (res.ok) return await res.json()
  } catch (err) {
    console.warn('Get interview session endpoint unavailable:', err)
  }
  return null
}

export function createSessionId(): string {
  return crypto.randomUUID()
}



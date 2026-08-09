import type { Candidate, Feedback, Mission } from '../types'

export interface SavedSession {
  id: string
  date: string
  role: string
  score: number
  technicalKnowledge: number
  communication: number
  status: string
  questionsCount: number
  strengths: string[]
  drawbacks: string[]
}

export interface UserCandidateData {
  userId: string
  name: string
  email?: string
  jobRole: string
  yearsExperience: number
  education: string
  sessions: SavedSession[]
  lastResumeScore: number | null
  lastResumeRole: string | null
  missions: Mission[]
}

const DEFAULT_MISSIONS: Mission[] = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1
  const passedDays = [1, 2, 3, 5, 7, 8, 10, 12, 14]
  const skippedDays = [4, 9]
  return {
    day,
    title: getMissionTitle(day),
    passed: passedDays.includes(day),
    skipped: skippedDays.includes(day),
    attempts: passedDays.includes(day) ? 1 : 0,
  }
})

function getMissionTitle(day: number): string {
  const titles = [
    'Python & Data Structures Refresher',
    'LLM API Integration & Prompting',
    'Tokenization & Embeddings Deep Dive',
    'Vector Database Fundamentals (ChromaDB)',
    'RAG Pipeline Construction from Scratch',
    'Chunking Strategies & Document Loaders',
    'Retrieval Evaluation (Recall@K, MRR)',
    'Semantic Search & Hybrid Keyword Search',
    'Reranking Models & Cross-Encoders',
    'Agentic AI Architectures & Tools',
    'ReAct Framework & Tool Calling',
    'LangChain & LlamaIndex Frameworks',
    'Model Context Protocol (MCP) Tools',
    'Advanced Vector Indexes (HNSW, IVFFlat)',
    'Fine-Tuning Foundations (LoRA/QLoRA)',
    'Dataset Curation & Evaluation Models',
    'LLM Observability & Tracing (LangSmith)',
    'Prompt Injection & AI Security',
    'Async Python & FastAPI Microservices',
    'Dockerization of AI Microservices',
    'Kubernetes Deployment for LLM Apps',
    'Caching Strategies (Redis & Semantic Cache)',
    'Streaming API Responses & WebSockets',
    'Multi-Agent System Orchestration',
    'Automated Testing for LLM Pipelines',
    'Cost Optimization & Token Budgeting',
    'Local LLM Deployment (Ollama/vLLM)',
    'GPU Memory Optimization (KVCache)',
    'Enterprise RAG System Architecture',
    'Production AI Monitoring & Drift Detection',
    'Capstone: End-to-End Autonomous AI Agent',
  ]
  return titles[day - 1] || `AI Engineering Day ${day}`
}

export function loadUserCandidateData(userId: string, userName: string, userEmail?: string): UserCandidateData {
  const key = `ai_interview_candidate_${userId}`
  try {
    const existing = localStorage.getItem(key)
    if (existing) {
      const parsed = JSON.parse(existing)
      return {
        ...parsed,
        name: userName || parsed.name,
        email: userEmail || parsed.email,
      }
    }
  } catch (err) {
    console.error('Error reading candidate store', err)
  }

  // Initial candidate profile
  const initialData: UserCandidateData = {
    userId,
    name: userName || 'Candidate',
    email: userEmail,
    jobRole: 'AI Engineer',
    yearsExperience: 3,
    education: 'B.S. Computer Science / AI',
    sessions: [
      {
        id: 'SESS-101',
        date: 'Aug 09, 2026',
        role: 'AI Engineer',
        score: 82,
        technicalKnowledge: 86,
        communication: 88,
        status: 'Completed',
        questionsCount: 10,
        strengths: ['RAG Pipeline Architecture', 'Vector Search (HNSW)', 'Prompt Engineering'],
        drawbacks: ['Retrieval Evaluation (Recall@K)', 'Model Context Protocol (MCP)'],
      },
      {
        id: 'SESS-102',
        date: 'Aug 05, 2026',
        role: 'Data Engineer',
        score: 75,
        technicalKnowledge: 78,
        communication: 82,
        status: 'Completed',
        questionsCount: 8,
        strengths: ['SQL Query Optimization', 'ETL Pipeline Design'],
        drawbacks: ['Streaming Data Processing'],
      },
    ],
    lastResumeScore: 79,
    lastResumeRole: 'AI Engineer',
    missions: DEFAULT_MISSIONS,
  }

  saveUserCandidateData(initialData)
  return initialData
}

export function saveUserCandidateData(data: UserCandidateData) {
  const key = `ai_interview_candidate_${data.userId}`
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.error('Error saving candidate store', err)
  }
}

export function addFinishedSession(userId: string, userName: string, feedback: Feedback, targetRole: string) {
  const data = loadUserCandidateData(userId, userName)
  const scoreMatch = feedback.summary.match(/(\d{1,3})\s*\/\s*100/)
  const score = feedback.overallScore ?? (scoreMatch ? parseInt(scoreMatch[1], 10) : 80)

  const newSession: SavedSession = {
    id: `SESS-${Date.now().toString().slice(-4)}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    role: targetRole || 'AI Engineer',
    score,
    technicalKnowledge: feedback.technicalKnowledge ?? 80,
    communication: feedback.communication ?? 85,
    status: 'Completed',
    questionsCount: 10,
    strengths: feedback.strengths || [],
    drawbacks: feedback.drawbacks || feedback.gaps || [],
  }

  data.sessions = [newSession, ...data.sessions]
  saveUserCandidateData(data)
  return data
}

export function updateResumeScore(userId: string, userName: string, score: number, role: string) {
  const data = loadUserCandidateData(userId, userName)
  data.lastResumeScore = score
  data.lastResumeRole = role
  saveUserCandidateData(data)
  return data
}

export function calculateCandidateMetrics(data: UserCandidateData): Candidate {
  const sessions = data.sessions
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length) : 80
  const avgTech = sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.technicalKnowledge, 0) / sessions.length) : 82
  const avgComm = sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.communication, 0) / sessions.length) : 85

  return {
    member: {
      id: data.userId,
      name: data.name,
      jobRole: data.lastResumeRole || data.jobRole,
      yearsExperience: data.yearsExperience,
      education: data.education,
      status: `Active Candidate (${avgScore}% Score, ${avgTech}% Tech, ${avgComm}% Comm)`,
    },
    missions: data.missions,
    signals: {
      commitDays: data.missions.filter(m => m.passed).length + 4,
      missionsCompleted: data.missions.filter(m => m.passed).length,
      missionsFirstTry: Math.max(1, data.missions.filter(m => m.passed).length - 2),
    },
  }
}

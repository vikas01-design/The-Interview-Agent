import type { Candidate, Feedback, Mission, MissionStatus } from '../types'

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
  jobDescription?: string
  education: string
  sessions: SavedSession[]
  lastResumeScore: number | null
  lastResumeRole: string | null
  lastResumeDate?: string | null
  resumeText?: string
  hasRealUserActivity?: boolean
  missions: Mission[]
  profileCreatedAt?: string
  updatedAt?: string
}

// Full 31-Day AI & Tech Engineering Curriculum Dataset
const CURRICULUM_DATA: Omit<Mission, 'passed' | 'skipped' | 'attempts' | 'status'>[] = [
  {
    day: 1,
    module: 'Foundations & Data Structures',
    title: 'Python Memory & Data Structures Refresher',
    topics: ['Lists vs Tuples', 'Dict Hashing', 'Time Complexity', 'Memory Profiling'],
    learningObjectives: ['Master O(1) hash lookups', 'Optimize Python memory usage', 'Analyze algorithm trade-offs'],
    tools: ['Python 3.11', 'sys.getsizeof', 'cProfile'],
  },
  {
    day: 2,
    module: 'LLMs & Prompting',
    title: 'LLM API Integration & Advanced Prompting',
    topics: ['Structured Output', 'Few-Shot Learning', 'System Prompts', 'Rate Limiting'],
    learningObjectives: ['Design robust JSON schemas', 'Implement retry backoff logic', 'Prevent prompt drift'],
    tools: ['OpenAI SDK', 'Pydantic', 'Tenacity'],
  },
  {
    day: 3,
    module: 'Embeddings & Tokenization',
    title: 'Tokenization & Embeddings Deep Dive',
    topics: ['BPE Tokenization', 'Cosine Similarity', 'Dense Embeddings', 'Dimensionality'],
    learningObjectives: ['Calculate vector distances', 'Handle token context limits', 'Compare embedding models'],
    tools: ['Tiktoken', 'Sentence-Transformers', 'NumPy'],
  },
  {
    day: 4,
    module: 'Vector Databases',
    title: 'Vector Database Fundamentals (ChromaDB)',
    topics: ['Vector Indexes', 'Distance Metrics', 'Metadata Filtering', 'Collection Design'],
    learningObjectives: ['Setup local vector DB', 'Perform similarity search', 'Apply payload filters'],
    tools: ['ChromaDB', 'Python API'],
  },
  {
    day: 5,
    module: 'RAG Architecture',
    title: 'RAG Pipeline Construction from Scratch',
    topics: ['Naive RAG', 'Context Assembly', 'Citation Tracking', 'Hallucination Checks'],
    learningObjectives: ['Build end-to-end RAG', 'Format augmented prompts', 'Ensure source attribution'],
    tools: ['Python', 'ChromaDB', 'OpenAI'],
  },
  {
    day: 6,
    module: 'RAG Architecture',
    title: 'Chunking Strategies & Document Loaders',
    topics: ['Recursive Chunking', 'Semantic Chunking', 'Overlap Optimization', 'PDF Parsing'],
    learningObjectives: ['Evaluate chunk sizes vs latency', 'Extract structured text', 'Preserve table layout'],
    tools: ['LangChain TextSplitters', 'PyPDF', 'Unstructured'],
  },
  {
    day: 7,
    module: 'RAG Evaluation',
    title: 'Retrieval Evaluation (Recall@K, MRR)',
    topics: ['Recall@K', 'Mean Reciprocal Rank', 'Precision@K', 'Golden Datasets'],
    learningObjectives: ['Measure retrieval accuracy', 'Generate evaluation datasets', 'Tune similarity thresholds'],
    tools: ['Ragas', 'Evaluation Datasets', 'Pandas'],
  },
  {
    day: 8,
    module: 'Search Optimization',
    title: 'Semantic Search & Hybrid Keyword Search',
    topics: ['BM25 Keyword Search', 'Hybrid RRF Reciprocal Rank', 'Sparse Vectors'],
    learningObjectives: ['Combine keyword and vector search', 'Balance precision & recall'],
    tools: ['BM25Okapi', 'Qdrant / Elasticsearch'],
  },
  {
    day: 9,
    module: 'Search Optimization',
    title: 'Reranking Models & Cross-Encoders',
    topics: ['Cross-Encoder Architecture', 'Cohere Rerank', 'Re-scoring Top-N'],
    learningObjectives: ['Improve top-3 retrieval quality', 'Measure reranker latency impact'],
    tools: ['Cohere AI API', 'HuggingFace Cross-Encoder'],
  },
  {
    day: 10,
    module: 'Agentic AI',
    title: 'Agentic AI Architectures & Tools',
    topics: ['Agent Loops', 'State Management', 'Tool Definition', 'Control Flow'],
    learningObjectives: ['Architect autonomous agents', 'Implement stateful execution'],
    tools: ['LangGraph', 'Python'],
  },
  {
    day: 11,
    module: 'Agentic AI',
    title: 'ReAct Framework & Tool Calling',
    topics: ['Reasoning & Action Loop', 'JSON Tool Payloads', 'Error Correction'],
    learningObjectives: ['Implement ReAct pattern', 'Handle tool execution exceptions'],
    tools: ['OpenAI Function Calling', 'Custom Tools'],
  },
  {
    day: 12,
    module: 'Agentic AI',
    title: 'LangChain & LlamaIndex Frameworks',
    topics: ['Index Structures', 'Query Engines', 'Router Engines', 'Chain Composition'],
    learningObjectives: ['Compare framework trade-offs', 'Build production query chains'],
    tools: ['LlamaIndex', 'LangChain'],
  },
  {
    day: 13,
    module: 'Agentic AI',
    title: 'Model Context Protocol (MCP) Integration',
    topics: ['MCP Server Specification', 'Resource Providers', 'Tool Registration'],
    learningObjectives: ['Build custom MCP servers', 'Connect external data sources'],
    tools: ['MCP SDK', 'TypeScript / Python'],
  },
  {
    day: 14,
    module: 'Vector DB Advanced',
    title: 'Advanced Vector Indexes (HNSW, IVFFlat)',
    topics: ['HNSW Graphs', 'M & efConstruction Parameters', 'Quantization (PQ/SQ)'],
    learningObjectives: ['Tune indexing parameters for throughput vs recall'],
    tools: ['Qdrant', 'FAISS'],
  },
  {
    day: 15,
    module: 'Fine-Tuning',
    title: 'Fine-Tuning Foundations (LoRA / QLoRA)',
    topics: ['Parameter-Efficient Fine-Tuning', 'Quantized LoRA', 'Base Model Selection'],
    learningObjectives: ['Format instruction datasets', 'Train domain-specific adapter weights'],
    tools: ['Unsloth', 'PEFT', 'TRL', 'HuggingFace'],
  },
  {
    day: 16,
    module: 'Fine-Tuning',
    title: 'Dataset Curation & Evaluation Models',
    topics: ['Instruction Formatting', 'Synthetic Data Gen', 'LLM-as-a-Judge'],
    learningObjectives: ['Clean domain training data', 'Setup LLM evaluation benchmarks'],
    tools: ['Distilabel', 'OpenAI API'],
  },
  {
    day: 17,
    module: 'Observability',
    title: 'LLM Observability & Tracing (LangSmith)',
    topics: ['Span Tracing', 'Token Cost Tracking', 'Latency Breakdown', 'Feedback Logging'],
    learningObjectives: ['Trace complex agent runs', 'Identify bottleneck steps'],
    tools: ['LangSmith', 'Arize Phoenix', 'OpenTelemetry'],
  },
  {
    day: 18,
    module: 'AI Security',
    title: 'Prompt Injection & AI Security',
    topics: ['Direct Injection', 'Indirect Injection', 'Guardrails', 'Pertaining Filtering'],
    learningObjectives: ['Secure LLM apps against attacks', 'Validate input/output safety'],
    tools: ['NeMo Guardrails', 'Llama Guard'],
  },
  {
    day: 19,
    module: 'Backend Microservices',
    title: 'Async Python & FastAPI Microservices',
    topics: ['Asyncio Loops', 'FastAPI Endpoints', 'Dependency Injection', 'CORS'],
    learningObjectives: ['Build async high-throughput APIs', 'Handle non-blocking IO'],
    tools: ['FastAPI', 'Uvicorn', 'Pydantic v2'],
  },
  {
    day: 20,
    module: 'Infrastructure',
    title: 'Dockerization of AI Microservices',
    topics: ['Multi-Stage Builds', 'GPU Container Runtimes', 'Base Image Tuning'],
    learningObjectives: ['Containerize Python LLM apps', 'Optimize image sizes under 500MB'],
    tools: ['Docker', 'Docker Compose'],
  },
  {
    day: 21,
    module: 'Infrastructure',
    title: 'Kubernetes Deployment for LLM Apps',
    topics: ['Pods & Deployments', 'Horizontal Pod Autoscalers', 'Health Checks'],
    learningObjectives: ['Deploy scalable AI endpoints', 'Configure readiness probes'],
    tools: ['Kubectl', 'Helm', 'Minikube'],
  },
  {
    day: 22,
    module: 'Caching & Speed',
    title: 'Caching Strategies (Redis & Semantic Cache)',
    topics: ['Exact Match Caching', 'Semantic Vector Cache', 'TTL Invalidation'],
    learningObjectives: ['Reduce LLM API costs by 40%', 'Achieve sub-50ms cache hits'],
    tools: ['Redis', 'GPTCache'],
  },
  {
    day: 23,
    module: 'Streaming & Real-Time',
    title: 'Streaming API Responses & WebSockets',
    topics: ['Server-Sent Events (SSE)', 'WebSocket Protocols', 'Chunk Buffering'],
    learningObjectives: ['Stream token responses live', 'Build interactive UI stream listeners'],
    tools: ['FastAPI EventSource', 'WebSockets'],
  },
  {
    day: 24,
    module: 'Multi-Agent Systems',
    title: 'Multi-Agent System Orchestration',
    topics: ['Supervisor Agent', 'Hierarchical Teams', 'Message Passing'],
    learningObjectives: ['Coordinate worker agents', 'Resolve inter-agent conflicts'],
    tools: ['AutoGen', 'CrewAI', 'LangGraph'],
  },
  {
    day: 25,
    module: 'Testing & QA',
    title: 'Automated Testing for LLM Pipelines',
    topics: ['Regression Testing', 'Deterministic Assertions', 'CI Integration'],
    learningObjectives: ['Build pytest suites for LLM pipelines', 'Run nightly evaluation runs'],
    tools: ['Pytest', 'DeepEval'],
  },
  {
    day: 26,
    module: 'Cost & Budgeting',
    title: 'Cost Optimization & Token Budgeting',
    topics: ['Prompt Truncation', 'Model Routing (GPT-4o vs Flash)', 'Context Caching'],
    learningObjectives: ['Implement dynamic model selection based on task complexity'],
    tools: ['LiteLLM', 'OpenAI Context Caching'],
  },
  {
    day: 27,
    module: 'Local Inference',
    title: 'Local LLM Deployment (Ollama / vLLM)',
    topics: ['vLLM PagedAttention', 'GGUF Quantization', 'Inference Throughput'],
    learningObjectives: ['Host open source LLMs locally', 'Benchmark tokens/second'],
    tools: ['Ollama', 'vLLM', 'LM Studio'],
  },
  {
    day: 28,
    module: 'GPU Optimization',
    title: 'GPU Memory Optimization (KVCache)',
    topics: ['KV Cache Allocation', 'Batching Strategies', 'FlashAttention-2'],
    learningObjectives: ['Understand memory bandwidth vs compute bound operations'],
    tools: ['PyTorch', 'CUDA'],
  },
  {
    day: 29,
    module: 'Enterprise System Design',
    title: 'Enterprise RAG System Architecture',
    topics: ['High Availability', 'Multi-Tenant Isolation', 'Data Compliance'],
    learningObjectives: ['Design enterprise-grade AI architecture blueprints'],
    tools: ['System Architecture Diagramming'],
  },
  {
    day: 30,
    module: 'Production Operations',
    title: 'Production AI Monitoring & Drift Detection',
    topics: ['Data Drift', 'Concept Drift', 'Latency SLA Alarms', 'User Feedback Loops'],
    learningObjectives: ['Monitor live production LLMs', 'Set up automated alert channels'],
    tools: ['Prometheus', 'Grafana', 'Evidently AI'],
  },
  {
    day: 31,
    module: 'Capstone Project',
    title: 'Capstone: End-to-End Autonomous AI Agent',
    topics: ['System Integration', 'Live Console UI', 'RAG + Tools + Evaluation'],
    learningObjectives: ['Deploy production AI agent platform', 'Present final system architecture'],
    tools: ['Full Stack AI Interview Platform'],
  },
]

export function createDefaultMissions(): Mission[] {
  return CURRICULUM_DATA.map((item) => ({
    ...item,
    status: item.day <= 5 ? 'AVAILABLE' : (item.day > 15 ? 'LOCKED' : 'AVAILABLE'),
    passed: false,
    skipped: false,
    attempts: 0,
  }))
}

// Scoped User Candidate Data Loader & Saver with Auto-Sanitization of Legacy Seed Data
export function loadUserCandidateData(userId: string, userName: string, userEmail?: string): UserCandidateData {
  const key = `ai_interview_candidate_${userId}`
  try {
    const existing = localStorage.getItem(key)
    if (existing) {
      const parsed = JSON.parse(existing)
      
      // Purge any session that contains mock seed identifiers or legacy preset scores
      const realSessions = Array.isArray(parsed.sessions)
        ? parsed.sessions.filter((s: any) => {
            if (!s || typeof s !== 'object') return false
            const isMockId = s.id === 'SESS-101' || s.id === 'SESS-102' || String(s.id).startsWith('SESS-10')
            const isMockScoreCombination = (s.score === 82 && s.technicalKnowledge === 86) || (s.score === 76 && s.technicalKnowledge === 78)
            return !isMockId && !isMockScoreCombination
          })
        : []

      // Purge legacy mock resume score 79 if no real uploaded resume text
      const isLegacyMockResume = parsed.lastResumeScore === 79 || !parsed.resumeText
      const realResumeScore = (isLegacyMockResume || !parsed.resumeText) ? 0 : (parsed.lastResumeScore || 0)
      const realResumeRole = (realResumeScore > 0 && parsed.resumeText) ? parsed.lastResumeRole : null

      const cleanedData: UserCandidateData = {
        ...parsed,
        name: userName || parsed.name || 'Candidate',
        email: userEmail || parsed.email,
        sessions: realSessions,
        lastResumeScore: realResumeScore,
        lastResumeRole: realResumeRole,
        hasRealUserActivity: realSessions.length > 0 || (realResumeScore > 0 && !!parsed.resumeText),
        missions: Array.isArray(parsed.missions) && parsed.missions.length === 31 ? parsed.missions : createDefaultMissions(),
      }

      saveUserCandidateData(cleanedData)
      return cleanedData
    }
  } catch (err) {
    console.error('Error reading candidate store from localStorage', err)
  }

  // Initial user data instance for a fresh candidate (Strictly 0 sessions & 0% resume score)
  const initialData: UserCandidateData = {
    userId,
    name: userName || 'Candidate User',
    email: userEmail,
    jobRole: 'AI Engineer',
    yearsExperience: 3,
    education: 'B.S. Computer Science / AI',
    sessions: [], // Strictly empty for un-interviewed candidates
    lastResumeScore: 0, // Strictly 0% if no resume uploaded
    lastResumeRole: null,
    lastResumeDate: null,
    hasRealUserActivity: false,
    missions: createDefaultMissions(),
    profileCreatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  saveUserCandidateData(initialData)
  return initialData
}

export function saveUserCandidateData(data: UserCandidateData) {
  data.updatedAt = new Date().toISOString()
  const key = `ai_interview_candidate_${data.userId}`
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.error('Error saving candidate store to localStorage', err)
  }
}

import { updateUserProfileBackend, updateUserCurriculumBackend } from '../api'

// Update User Profile Target Role, Experience & Job Description
export function updateUserProfile(
  userId: string,
  userName: string,
  updates: {
    targetRole?: string
    yearsExperience?: number
    jobDescription?: string
  }
): UserCandidateData {
  const data = loadUserCandidateData(userId, userName)
  
  if (updates.targetRole !== undefined && updates.targetRole !== data.jobRole) {
    data.jobRole = updates.targetRole
    if (data.lastResumeRole && data.lastResumeRole !== updates.targetRole) {
      data.lastResumeScore = 0
      data.lastResumeRole = null
    }
  }
  
  if (updates.yearsExperience !== undefined) {
    data.yearsExperience = updates.yearsExperience
  }
  
  if (updates.jobDescription !== undefined) {
    data.jobDescription = updates.jobDescription
  }

  saveUserCandidateData(data)
  updateUserProfileBackend(userId, updates.targetRole, updates.yearsExperience, updates.jobDescription).catch(() => {})
  return data
}

// Update Mission / Curriculum Day Status
export function updateMissionStatus(
  userId: string,
  userName: string,
  day: number,
  newStatus: MissionStatus,
  score?: number
): UserCandidateData {
  const data = loadUserCandidateData(userId, userName)
  const index = data.missions.findIndex((m) => m.day === day)
  
  if (index !== -1) {
    const current = data.missions[index]
    const attempts = (current.attempts || 0) + 1
    const passed = newStatus === 'COMPLETED'
    const skipped = newStatus === 'SKIPPED'
    const bestScore = score !== undefined ? Math.max(current.bestScore || 0, score) : current.bestScore || (passed ? 85 : undefined)

    data.missions[index] = {
      ...current,
      status: newStatus,
      passed,
      skipped,
      attempts,
      bestScore,
      completionDate: passed ? new Date().toISOString().split('T')[0] : current.completionDate,
    }

    saveUserCandidateData(data)
    updateUserCurriculumBackend(userId, day, newStatus, score).catch(() => {})
  }

  return data
}

// Add completed interview session
export function addFinishedSession(userId: string, userName: string, feedback: Feedback, targetRole: string) {
  const data = loadUserCandidateData(userId, userName)
  const scoreMatch = feedback.summary ? feedback.summary.match(/(\d{1,3})\s*\/\s*100/) : null
  const score = feedback.overallScore ?? (scoreMatch ? parseInt(scoreMatch[1], 10) : 80)

  const newSession: SavedSession = {
    id: `REAL-SESS-${Date.now()}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    role: targetRole || data.jobRole,
    score,
    technicalKnowledge: feedback.technicalKnowledge ?? 80,
    communication: feedback.communication ?? 85,
    status: 'Completed',
    questionsCount: 10,
    strengths: feedback.strengths || [],
    drawbacks: feedback.drawbacks || feedback.gaps || [],
  }

  data.sessions = [newSession, ...data.sessions]
  data.hasRealUserActivity = true
  saveUserCandidateData(data)
  return data
}

// Update Resume AI Score
export function updateResumeScore(userId: string, userName: string, score: number, role: string, resumeText?: string) {
  const data = loadUserCandidateData(userId, userName)
  data.lastResumeScore = score
  data.lastResumeRole = role
  if (resumeText) data.resumeText = resumeText
  data.hasRealUserActivity = true
  data.lastResumeDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  saveUserCandidateData(data)
  return data
}

const ROLE_SKILLS_MAP: Record<string, { strengths: string[]; weaknesses: string[] }> = {
  'AI Engineer': {
    strengths: ['RAG Pipeline Architecture', 'Vector Search (HNSW)', 'Prompt Engineering'],
    weaknesses: ['Retrieval Evaluation (Recall@K)', 'Model Context Protocol (MCP)', 'Streaming Data Processing'],
  },
  'Data Engineer': {
    strengths: ['SQL Query Optimization', 'ETL Pipeline Design', 'Data Warehousing (Snowflake)'],
    weaknesses: ['Apache Spark Tuning', 'Real-Time Streaming (Kafka)', 'Data Governance'],
  },
  'Backend Engineer': {
    strengths: ['Microservices Architecture', 'Database Indexing & Queries', 'Caching Strategies (Redis)'],
    weaknesses: ['System Scalability under 100k QPS', 'Async Event Loops', 'gRPC Protocol Buffers'],
  },
  'ML Engineer': {
    strengths: ['PyTorch Model Training', 'Feature Engineering', 'Model Quantization (INT8)'],
    weaknesses: ['MLOps Pipeline Deployment', 'GPU Memory Management', 'Distributed Training'],
  },
  'Software Engineer': {
    strengths: ['Object-Oriented Design', 'Algorithms & Data Structures', 'CI/CD Pipelines'],
    weaknesses: ['Distributed System Design', 'High Concurrency Locks', 'Performance Profiling'],
  },
}

export function getRoleSkills(role: string) {
  const matchedKey = Object.keys(ROLE_SKILLS_MAP).find(
    (k) => role.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(role.toLowerCase())
  )
  return ROLE_SKILLS_MAP[matchedKey || 'AI Engineer'] || ROLE_SKILLS_MAP['AI Engineer']
}

export function calculateCandidateMetrics(data: UserCandidateData): Candidate {
  const sessions = data.sessions
  const completedMissions = data.missions.filter((m) => m.status === 'COMPLETED' || m.passed)

  return {
    member: {
      id: data.userId,
      name: data.name,
      jobRole: data.jobRole,
      yearsExperience: data.yearsExperience,
      education: data.education,
      status: `Active Candidate (${sessions.length} sessions, ${completedMissions.length}/31 days)`,
    },
    missions: data.missions,
    signals: {
      commitDays: completedMissions.length + (data.missions.some(m => m.status === 'IN_PROGRESS') ? 1 : 0),
      missionsCompleted: completedMissions.length,
      missionsFirstTry: Math.max(0, completedMissions.length - 1),
    },
  }
}

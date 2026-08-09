export interface CandidateMember {
  id: string
  name: string
  jobRole: string
  yearsExperience: number
  education: string
  status: string
}

export interface Mission {
  day: number
  title: string
  passed?: boolean
  skipped?: boolean
  attempts?: number
}

export interface CandidateSignals {
  commitDays: number
  missionsCompleted: number
  missionsFirstTry: number
}

export interface Candidate {
  member: CandidateMember
  missions: Mission[]
  signals: CandidateSignals
}

export interface CommunicationMetrics {
  communicationScore: number
  clarity: number
  confidence: number
  structure: number
  conciseness: number
  technicalCommunication: number
  observations: string[]
  improvements: string[]
}

export interface ResumeAlignmentItem {
  topic: string
  resumeEvidence: string
  status: 'Strong' | 'Moderate' | 'Weak' | 'Missing'
}

export interface WeakPointEnhancement {
  weakStatement: string
  enhancedStatement: string
  rationale: string
}

export interface SubScoreBreakdown {
  skillsMatch: number
  experienceMatch: number
  projectRelevance: number
  technologyMatch: number
  seniorityMatch: number
  impactScore: number
}

export interface RoleCategoryScore {
  categoryName: string
  weightPct: number
  scorePct: number
}

export interface RoleScoreReport {
  targetRole: string
  seniorityLevel: string
  overallMatchScore: number
  subScores: SubScoreBreakdown
  categories: RoleCategoryScore[]
  matchedEvidence: string[]
  missingEvidence: string[]
  whySummary: string
  recommendations: string[]
}

export interface RoleComparisonItem {
  role: string
  score: number
  isBestMatch: boolean
  why: string
}

export interface RoleComparisonResponse {
  bestMatchRole: string
  bestMatchScore: number
  comparisons: RoleComparisonItem[]
  summary: string
}

export interface ResumeAnalysis {
  resumeStrengthScore: number
  targetRole?: string
  seniorityLevel?: string
  positioning: Record<string, number>
  curriculumAlignment: ResumeAlignmentItem[]
  interviewConsistency: string[]
  weakPointEnhancements: WeakPointEnhancement[]
  recommendations: string[]
  roleReport?: RoleScoreReport
}

export interface UnifiedCandidateIntelligence {
  technicalStrengths: string[]
  technicalWeaknesses: string[]
  communicationStrengths: string[]
  communicationWeaknesses: string[]
  resumeStrengths: string[]
  resumeGaps: string[]
  recommendedFocus: string[]
}

export interface TopicMastery {
  topic: string
  day: number
  scorePct: number
}

export interface Feedback {
  summary: string
  overallScore?: number
  grade?: string
  technicalKnowledge?: number
  problemSolving?: number
  systemDesign?: number
  communication?: number
  confidenceScore?: number
  strengths: string[]
  drawbacks?: string[]
  improvements?: string[]
  gaps: string[]
  next: string[]
  communicationMetrics?: CommunicationMetrics
  resumeAnalysis?: ResumeAnalysis
  unifiedIntelligence?: UnifiedCandidateIntelligence
  topicMastery?: TopicMastery[]
  difficultyProgression?: string[]
}

export interface InterviewProgress {
  questionNumber: number
  minQuestions: number
  coveredDays: number[]
  minDays: number
  coveredTopics: string[]
  currentDay: number | null
  currentTopic: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  isFollowUp: boolean
}

export interface InterviewResponse {
  reply: string
  done: boolean
  feedback?: Feedback
  progress?: InterviewProgress
}

export interface ChatMessage {
  role: 'interviewer' | 'candidate'
  content: string
  isFollowUp?: boolean
  topic?: string
  difficulty?: string
}

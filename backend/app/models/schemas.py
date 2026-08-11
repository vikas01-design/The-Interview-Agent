from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class InterviewRequest(BaseModel):
    sessionId: str
    candidate: dict[str, Any] | None = None
    message: str | None = None


class QuestionType(str, Enum):
    CONCEPT = "concept"
    EXPLANATION = "explanation"
    IMPLEMENTATION = "implementation"
    WHY = "why"
    TRADEOFF = "tradeoff"
    DEBUGGING = "debugging"
    ARCHITECTURE = "architecture"
    SCENARIO = "scenario"
    PRODUCTION = "production"
    FOLLOW_UP = "follow_up"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class CommunicationMetrics(BaseModel):
    communicationScore: int = 80
    clarity: float = Field(default=0.8, ge=0, le=1)
    confidence: float = Field(default=0.8, ge=0, le=1)
    structure: float = Field(default=0.8, ge=0, le=1)
    conciseness: float = Field(default=0.8, ge=0, le=1)
    technicalCommunication: float = Field(default=0.8, ge=0, le=1)
    observations: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)


class ResumeAlignmentItem(BaseModel):
    topic: str
    resumeEvidence: str
    status: str = "Moderate"  # Strong, Moderate, Weak, Missing


class WeakPointEnhancement(BaseModel):
    weakStatement: str
    enhancedStatement: str
    rationale: str


class TargetRole(str, Enum):
    AI_ENGINEER = "AI Engineer"
    DATA_ENGINEER = "Data Engineer"
    ML_ENGINEER = "ML Engineer"
    SOFTWARE_ENGINEER = "Software Engineer"
    BACKEND_ENGINEER = "Backend Engineer"
    DATA_SCIENTIST = "Data Scientist"
    DEVOPS_ENGINEER = "DevOps Engineer"
    OTHER = "Other"


class SeniorityLevel(str, Enum):
    JUNIOR = "Junior"
    MID = "Mid-Level"
    SENIOR = "Senior"
    LEAD = "Lead / Staff"


class SubScoreBreakdown(BaseModel):
    skillsMatch: int = Field(default=80, ge=0, le=100)
    experienceMatch: int = Field(default=80, ge=0, le=100)
    projectRelevance: int = Field(default=80, ge=0, le=100)
    technologyMatch: int = Field(default=80, ge=0, le=100)
    seniorityMatch: int = Field(default=80, ge=0, le=100)
    impactScore: int = Field(default=80, ge=0, le=100)


class RoleCategoryScore(BaseModel):
    categoryName: str
    weightPct: int
    scorePct: int


class RoleScoreReport(BaseModel):
    targetRole: str
    seniorityLevel: str
    overallMatchScore: int = Field(default=80, ge=0, le=100)
    subScores: SubScoreBreakdown
    categories: list[RoleCategoryScore] = Field(default_factory=list)
    matchedEvidence: list[str] = Field(default_factory=list)
    missingEvidence: list[str] = Field(default_factory=list)
    whySummary: str
    recommendations: list[str] = Field(default_factory=list)


class RoleComparisonItem(BaseModel):
    role: str
    score: int
    isBestMatch: bool = False
    why: str


class RoleComparisonResponse(BaseModel):
    bestMatchRole: str
    bestMatchScore: int
    comparisons: list[RoleComparisonItem] = Field(default_factory=list)
    summary: str


class ResumeAnalysis(BaseModel):
    resumeStrengthScore: int = 80
    targetRole: str = "AI Engineer"
    seniorityLevel: str = "Mid-Level"
    positioning: dict[str, int] = Field(default_factory=dict)
    curriculumAlignment: list[ResumeAlignmentItem] = Field(default_factory=list)
    interviewConsistency: list[str] = Field(default_factory=list)
    weakPointEnhancements: list[WeakPointEnhancement] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    roleReport: RoleScoreReport | None = None


class UnifiedCandidateIntelligence(BaseModel):
    technicalStrengths: list[str] = Field(default_factory=list)
    technicalWeaknesses: list[str] = Field(default_factory=list)
    communicationStrengths: list[str] = Field(default_factory=list)
    communicationWeaknesses: list[str] = Field(default_factory=list)
    resumeStrengths: list[str] = Field(default_factory=list)
    resumeGaps: list[str] = Field(default_factory=list)
    recommendedFocus: list[str] = Field(default_factory=list)


class TopicMastery(BaseModel):
    topic: str
    day: int
    scorePct: int


class Feedback(BaseModel):
    summary: str
    overallScore: int = 80
    grade: str = "B+"
    technicalKnowledge: int = 80
    problemSolving: int = 80
    systemDesign: int = 80
    communication: int = 80
    confidenceScore: int = 80
    strengths: list[str] = Field(default_factory=list)
    drawbacks: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    next: list[str] = Field(default_factory=list)
    communicationMetrics: CommunicationMetrics | None = None
    resumeAnalysis: ResumeAnalysis | None = None
    unifiedIntelligence: UnifiedCandidateIntelligence | None = None
    topicMastery: list[TopicMastery] = Field(default_factory=list)
    difficultyProgression: list[str] = Field(default_factory=list)


class AnswerClassification(BaseModel):
    answerType: str = "valid_technical"  # greeting_only, greeting_with_answer, valid_technical, irrelevant, knowledge_gap, empty_or_short, unclear
    technicalAnswer: bool = True
    accepted: bool = True
    isGreetingOnly: bool = False
    hasGreeting: bool = False
    warningMessage: str | None = None
    retryAllowed: bool = False
    confidence: float = 1.0


class QuestionMeta(BaseModel):
    day: int
    topic: str
    question_type: QuestionType
    difficulty: Difficulty
    is_follow_up: bool = False
    expectedConcepts: list[str] = Field(default_factory=list)
    evaluationCriteria: dict[str, float] = Field(default_factory=dict)
    selectionReason: str | None = None


class InterviewProgress(BaseModel):
    """Real-time interview progress exposed to the frontend."""
    questionNumber: int = 0
    totalQuestions: int = 10
    attemptNumber: int = 1
    minQuestions: int = 10
    coveredDays: list[int] = Field(default_factory=list)
    minDays: int = 4
    coveredTopics: list[str] = Field(default_factory=list)
    currentDay: int | None = None
    currentTopic: str | None = None
    difficulty: str = "medium"
    isFollowUp: bool = False
    warningMessage: str | None = None
    retryAllowed: bool = False
    selectionReason: str | None = None


class InterviewResponse(BaseModel):
    reply: str
    done: bool = False
    feedback: Feedback | None = None
    progress: InterviewProgress | None = None
    answerClassification: AnswerClassification | None = None


class CodeExecutionResult(BaseModel):
    executed: bool = False
    extractedCode: str | None = None
    syntaxValid: bool = True
    passed: bool = True
    stdout: str = ""
    stderr: str = ""
    errorType: str | None = None
    executionTimeMs: float = 0.0


class TelemetryEvent(BaseModel):
    timestamp: str
    eventType: str  # DIFFICULTY_SHIFT, FOLLOW_UP_TRIGGER, CODE_EXECUTION, TOPIC_PIVOT, FALLBACK_TRIGGER, ANSWER_VALIDATION
    title: str
    description: str
    details: dict[str, Any] = Field(default_factory=dict)


class EvaluationDimensions(BaseModel):
    correctness: int = Field(default=80, ge=0, le=100)
    relevance: int = Field(default=80, ge=0, le=100)
    depth: int = Field(default=75, ge=0, le=100)
    completeness: int = Field(default=75, ge=0, le=100)
    conceptualUnderstanding: int = Field(default=80, ge=0, le=100)
    reasoning: int = Field(default=78, ge=0, le=100)
    practicalUnderstanding: int = Field(default=75, ge=0, le=100)
    accuracy: int = Field(default=80, ge=0, le=100)
    communication: int = Field(default=80, ge=0, le=100)
    confidence: int = Field(default=80, ge=0, le=100)


class AnswerEvaluation(BaseModel):
    score: float = Field(ge=0, le=10)
    overallScore: int = Field(default=70, ge=0, le=100)
    dimensions: EvaluationDimensions = Field(default_factory=EvaluationDimensions)
    relevance: float = Field(default=0.8, ge=0, le=1)
    technicalCorrectness: float = Field(default=0.8, ge=0, le=1)
    correctness: float = Field(default=0.8, ge=0, le=1)
    depth: float = Field(default=0.7, ge=0, le=1)
    structure: float = Field(default=0.8, ge=0, le=1)
    reasoning: float = Field(default=0.75, ge=0, le=1)
    clarity: float = Field(default=0.8, ge=0, le=1)
    partA_demonstrated: str | None = None
    partB_missing: str | None = None
    partC_strengthen: str | None = None
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    misconceptions: list[str] = Field(default_factory=list)
    missingConcepts: list[str] = Field(default_factory=list)
    missing_concepts: list[str] = Field(default_factory=list)
    recommendedFollowUp: str | None = None
    recommended_followup: str | None = None
    candidate_claims: list[str] = Field(default_factory=list)
    communication: CommunicationMetrics | None = None
    codeExecution: CodeExecutionResult | None = None
    classification: AnswerClassification | None = None


class TopicKnowledge(BaseModel):
    knowledge: float = 0.5
    depth: float = 0.5
    reasoning: float = 0.5
    evidence: list[str] = Field(default_factory=list)
    misconceptions: list[str] = Field(default_factory=list)


class TranscriptEntry(BaseModel):
    role: str
    content: str
    question_meta: QuestionMeta | None = None


class CandidateAnalysis(BaseModel):
    completed_days: list[int] = Field(default_factory=list)
    skipped_days: list[int] = Field(default_factory=list)
    failed_days: list[int] = Field(default_factory=list)
    struggle_days: list[int] = Field(default_factory=list)
    strong_days: list[int] = Field(default_factory=list)
    inferred_strengths: list[str] = Field(default_factory=list)
    inferred_weaknesses: list[str] = Field(default_factory=list)
    target_days: list[int] = Field(default_factory=list)


class InterviewSession(BaseModel):
    session_id: str
    candidate: dict[str, Any]
    candidate_analysis: CandidateAnalysis
    status: str = "active"
    question_number: int = 0
    total_questions: int = 10
    attempt_number: int = 1
    covered_days: list[int] = Field(default_factory=list)
    covered_topics: list[str] = Field(default_factory=list)
    question_types_used: list[str] = Field(default_factory=list)
    current_day: int | None = None
    current_topic: str | None = None
    difficulty: Difficulty = Difficulty.MEDIUM
    follow_up_depth: int = 0
    pending_follow_up: bool = False
    consecutive_idks_on_topic: int = 0
    abandoned_days: list[int] = Field(default_factory=list)
    transcript: list[TranscriptEntry] = Field(default_factory=list)
    knowledge_model: dict[str, TopicKnowledge] = Field(default_factory=dict)
    evaluations: list[AnswerEvaluation] = Field(default_factory=list)
    classifications: list[AnswerClassification] = Field(default_factory=list)
    last_evaluation: AnswerEvaluation | None = None
    asked_questions: list[str] = Field(default_factory=list)
    last_question_meta: QuestionMeta | None = None
    awaiting_answer: bool = False
    telemetry: list[TelemetryEvent] = Field(default_factory=list)



# TECH REALMS — AI Interview Agent

**ABTalks Vibe Code Hackathon · "Build the Interviewer, Not the Interview"**

> *"Our system builds a dynamic candidate knowledge model from their cohort journey, grounds questions in the curriculum, evaluates every answer, and continuously adapts question difficulty and follow-ups to conduct a personalized technical interview."*

---

## Architecture

```
React + Vite + Tailwind
        │ HTTP
        ▼
FastAPI Backend (POST /api/interview)
        │
        ├─ Interview Orchestrator (deterministic state machine)
        │     ├─ Candidate Profile Analyzer
        │     ├─ Interview Planner (priority-based question selection)
        │     └─ Session State (knowledge model, transcript, coverage tracking)
        │
        ├─ AI Agents
        │     ├─ Question Generator (LLM + TheBreeth context)
        │     ├─ Answer Evaluator (LLM structured output)
        │     └─ Feedback Generator (evidence-based)
        │
        └─ TheBreeth Knowledge Layer
              ├─ Curriculum ingestion (async, startup)
              ├─ Context-aware retrieval (per question)
              └─ Local fallback (always reliable)
```

### Key Design Decisions

| Concern | Deterministic Logic | AI (LLM) |
|---|---|---|
| Min question count | ✓ | |
| Min curriculum day coverage | ✓ | |
| Session state management | ✓ | |
| Follow-up depth limiting | ✓ | |
| Candidate profile analysis | ✓ | |
| Question selection priority | ✓ | |
| Duplicate prevention | ✓ | |
| Question wording | | ✓ |
| Answer evaluation | | ✓ |
| Follow-up generation | AI guided by deterministic signals | |
| Feedback writing | | ✓ |

---

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add OPENAI_API_KEY and optionally BREETH_API_KEY
uvicorn app.main:app --reload --port 8000
```

Works without API keys using deterministic fallback questions and evaluations.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## API Contract

```
POST /api/interview
```

**Start interview:**
```json
{ "sessionId": "uuid", "candidate": { ... } }
```

**Continue interview:**
```json
{ "sessionId": "uuid", "message": "candidate answer" }
```

**Response:**
```json
{
  "reply": "interviewer question or closing message",
  "done": false,
  "feedback": null,
  "progress": {
    "questionNumber": 3,
    "minQuestions": 8,
    "coveredDays": [7, 12],
    "minDays": 4,
    "currentTopic": "Embeddings Explained",
    "currentDay": 7,
    "difficulty": "hard",
    "isFollowUp": false
  }
}
```

**Complete (done=true):**
```json
{
  "reply": "Thank you for the interview...",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": ["..."],
    "gaps": ["..."],
    "next": ["..."]
  }
}
```

---

## TheBreeth Integration

TheBreeth (intent-aware memory for AI agents) is used as the curriculum knowledge layer.

- **Write**: Each of the 31 curriculum days is ingested as a structured episode at startup using `AsyncBreethClient.write()`.
- **Retrieve**: Before each question generation, `AsyncBreethClient.retrieve()` is called with a query enriched by current interview state (topic + weakness + misconceptions). The returned `EdgeHit.fact` values are passed as grounding context to the LLM.
- **Fallback**: If TheBreeth is unavailable (no API key or network error), the system falls back to local curriculum search — the interview continues uninterrupted.

---

## Hackathon Requirements Checklist

- [x] Conversational technical interview (multi-turn, natural, no "Question X of Y")
- [x] Minimum 8 questions (deterministically enforced)
- [x] Minimum 4 curriculum days (deterministically enforced, forced at Q6+)
- [x] Follow-up questions based on previous answers (evaluation → planner → generator)
- [x] Context maintained throughout (full transcript in every LLM call)
- [x] Structured feedback at end (summary, strengths, gaps, next steps)
- [x] Exact HTTP endpoint: `POST /api/interview`
- [x] Exact request/response schema

---

## Team

**TECH REALMS** — ABTalks Vibe Code Hackathon

from __future__ import annotations

import logging
import re
from app.models.schemas import AnswerClassification, QuestionMeta

logger = logging.getLogger(__name__)

# Common greeting phrases
GREETING_PHRASES = {
    "hi", "hello", "hey", "hi there", "hello sir", "good morning",
    "good afternoon", "good evening", "how are you", "how are you?",
    "i'm good", "im good", "nice to meet you", "hi, how are you",
    "hello, i'm fine", "hello, im fine", "hey there", "namaste",
    "good day", "hi interviewer", "hello interviewer", "hi team",
}

KNOWLEDGE_GAP_PHRASES = {
    "i don't know", "i dont know", "idk", "no idea", "not sure",
    "i can't remember", "i cant remember", "skip", "pass",
    "i don't understand", "i dont understand", "can you explain",
    "nothing", "no clue", "haven't studied this", "havent studied this",
    "no background", "no experience", "haven't used it", "havent used it",
}

SHORT_NON_ANSWER_PHRASES = {"ok", "okay", "yes", "no", "yeah", "yep", "sure", "fine", "a", "b", "c"}


def classify_candidate_answer(
    message: str,
    question_meta: QuestionMeta | None = None,
) -> AnswerClassification:
    """
    Classify candidate message into 7 distinct categories.

    Distinguishes:
    - GREETING_ONLY (e.g., "Hi", "Good morning") -> Warning generated, not accepted, retry allowed.
    - GREETING_WITH_ANSWER (e.g., "Hi, RAG is...") -> ACCEPTED! Greeting stripped for technical scoring.
    - VALID_TECHNICAL -> ACCEPTED.
    - IRRELEVANT -> Classified as irrelevant, feedback guidance provided.
    - KNOWLEDGE_GAP -> "I don't know", "Pass".
    - EMPTY_OR_SHORT -> Extremely short non-answer.
    - UNCLEAR -> Unclear.
    """
    text = message.strip().lower()
    words = text.split()

    if not text or len(text) == 0:
        return _build_classification(
            answer_type="empty_or_short",
            technical_answer=False,
            accepted=False,
            is_greeting_only=False,
            has_greeting=False,
            warning="You provided an empty response. Please share your technical answer in detail.",
            retry_allowed=True,
        )

    # Clean text punctuation for matching
    clean_text = re.sub(r"[^\w\s]", "", text).strip()

    # 1. Check Greeting-Only Response
    if clean_text in GREETING_PHRASES or any(clean_text == p for p in GREETING_PHRASES):
        topic_str = question_meta.topic if question_meta else "the technical topic"
        warning = (
            f"Your response doesn't address the technical question about {topic_str} yet. "
            f"Please explain {topic_str} in your own words so I can evaluate your understanding."
        )
        return _build_classification(
            answer_type="greeting_only",
            technical_answer=False,
            accepted=False,
            is_greeting_only=True,
            has_greeting=True,
            warning=warning,
            retry_allowed=True,
        )

    # Check if text STARTS with a greeting phrase
    has_greeting_prefix = False
    technical_body = text
    for phrase in sorted(GREETING_PHRASES, key=len, reverse=True):
        if text.startswith(phrase):
            has_greeting_prefix = True
            # Strip prefix
            technical_body = text[len(phrase):].lstrip(",.!;: ")
            break

    # If greeting prefix present, check if remaining body has actual content
    body_word_count = len(technical_body.split())
    if has_greeting_prefix and body_word_count <= 2:
        # Greeting + 1 superficial word -> treat as Greeting Only
        topic_str = question_meta.topic if question_meta else "the technical topic"
        warning = (
            f"Your response doesn't address the question about {topic_str}. "
            f"Please explain what {topic_str} is and how it functions."
        )
        return _build_classification(
            answer_type="greeting_only",
            technical_answer=False,
            accepted=False,
            is_greeting_only=True,
            has_greeting=True,
            warning=warning,
            retry_allowed=True,
        )

    # 2. Check Knowledge Gap ("I don't know", "Pass")
    if clean_text in KNOWLEDGE_GAP_PHRASES or any(clean_text.startswith(p) for p in KNOWLEDGE_GAP_PHRASES):
        return _build_classification(
            answer_type="knowledge_gap",
            technical_answer=False,
            accepted=True,  # Processed as evaluated 0-score or diagnostic
            is_greeting_only=False,
            has_greeting=has_greeting_prefix,
            warning=None,
            retry_allowed=False,
        )

    # 3. Check Extremely Short Non-Answer
    if body_word_count <= 2 and clean_text in SHORT_NON_ANSWER_PHRASES:
        topic_str = question_meta.topic if question_meta else "the question"
        warning = (
            f"That answer is too brief to evaluate your technical understanding of {topic_str}. "
            f"Please provide a more detailed technical explanation."
        )
        return _build_classification(
            answer_type="empty_or_short",
            technical_answer=False,
            accepted=False,
            is_greeting_only=False,
            has_greeting=has_greeting_prefix,
            warning=warning,
            retry_allowed=True,
        )

    # 4. Check Irrelevant Response (Heuristic matching against expected topic concepts if available)
    if question_meta and body_word_count >= 5:
        topic_keywords = set(question_meta.topic.lower().split())
        expected_kw = set(k.lower() for k in question_meta.expectedConcepts)
        all_topic_kw = topic_keywords.union(expected_kw)

        # Check if candidate is talking about completely unrelated topic (e.g. favorite programming language in college when asked about RAG)
        if "favorite" in text and "programming language" in text and not any(k in text for k in all_topic_kw):
            return _build_classification(
                answer_type="irrelevant",
                technical_answer=False,
                accepted=True,  # Evaluated with feedback pointing out irrelevance
                is_greeting_only=False,
                has_greeting=has_greeting_prefix,
                warning=None,
                retry_allowed=False,
            )

    # 5. Greeting + Valid Technical Answer OR Valid Technical Answer
    if has_greeting_prefix:
        return _build_classification(
            answer_type="greeting_with_answer",
            technical_answer=True,
            accepted=True,
            is_greeting_only=False,
            has_greeting=True,
            warning=None,
            retry_allowed=False,
        )

    return _build_classification(
        answer_type="valid_technical",
        technical_answer=True,
        accepted=True,
        is_greeting_only=False,
        has_greeting=False,
        warning=None,
        retry_allowed=False,
    )


def extract_technical_content(message: str) -> str:
    """Strip greeting prefixes so technical evaluation is performed purely on the content."""
    text = message.strip()
    lower_text = text.lower()
    for phrase in sorted(GREETING_PHRASES, key=len, reverse=True):
        if lower_text.startswith(phrase):
            stripped = text[len(phrase):].lstrip(",.!;: ")
            if len(stripped.split()) >= 3:
                return stripped
    return text


def _build_classification(
    *,
    answer_type: str,
    technical_answer: bool,
    accepted: bool,
    is_greeting_only: bool,
    has_greeting: bool,
    warning: str | None,
    retry_allowed: bool,
) -> AnswerClassification:
    return AnswerClassification(
        answerType=answer_type,
        technicalAnswer=technical_answer,
        accepted=accepted,
        isGreetingOnly=is_greeting_only,
        hasGreeting=has_greeting,
        warningMessage=warning,
        retryAllowed=retry_allowed,
        confidence=1.0,
    )

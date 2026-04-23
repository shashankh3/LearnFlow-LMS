import json
import logging
import re
from dataclasses import dataclass, field

import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)


class QuizGenerationError(Exception):
    pass

class InsufficientContentError(QuizGenerationError):
    pass


@dataclass
class QuizOptionData:
    key:  str
    text: str

@dataclass
class QuizQuestionData:
    id:             int
    question_text:  str
    options:        list
    correct_option: str
    explanation:    str

@dataclass
class GeneratedQuiz:
    questions:    list = field(default_factory=list)
    raw_response: dict = field(default_factory=dict)


QUIZ_GENERATION_SYSTEM_PROMPT = """You are an expert instructional designer and technical educator. Your task is to analyze the provided lesson text and generate exactly 3 high-quality, challenging multiple-choice practice questions that test the core concepts of the material.

CRITICAL INSTRUCTIONS:
1. You must output ONLY valid, parsable JSON. Do not include any markdown formatting (e.g., no ```json blocks), no conversational filler, and no introductory text.
2. The questions must not be trivial. They must test comprehension and real-world application, not just rote memorization.
3. If the provided lesson text is too short, nonsensical, or lacks sufficient educational content to generate 3 distinct questions, you MUST return the explicit Error Fallback Schema instead of hallucinating.

REQUIRED JSON SCHEMA (Success):
{
  "status": "success",
  "questions": [
    {
      "id": 1,
      "question_text": "Clear, unambiguous question.",
      "options": {
        "A": "Plausible distractor",
        "B": "Correct answer",
        "C": "Plausible distractor",
        "D": "Plausible distractor"
      },
      "correct_option": "B",
      "explanation": "A concise explanation of why B is correct and the other options are incorrect."
    }
  ]
}

REQUIRED JSON SCHEMA (Error Fallback):
{
  "status": "error",
  "message": "Insufficient educational content to generate practice questions."
}"""

VALID_OPTION_KEYS = {"A", "B", "C", "D"}


def _strip_markdown_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    return text.strip()


def _validate_and_parse(raw_dict: dict) -> GeneratedQuiz:
    if not isinstance(raw_dict, dict):
        raise QuizGenerationError(f"Expected a JSON object, got {type(raw_dict).__name__}.")
    status = raw_dict.get("status")
    if status == "error":
        raise InsufficientContentError(raw_dict.get("message", "Insufficient content."))
    if status != "success":
        raise QuizGenerationError(f"Unexpected status value: '{status}'.")
    questions_raw = raw_dict.get("questions")
    if not isinstance(questions_raw, list) or len(questions_raw) != 3:
        raise QuizGenerationError(f"Expected exactly 3 questions, got {len(questions_raw) if isinstance(questions_raw, list) else 0}.")
    parsed = []
    for i, q in enumerate(questions_raw, 1):
        q_text = q.get("question_text", "").strip()
        if not q_text:
            raise QuizGenerationError(f"Question {i} has an empty 'question_text'.")
        options_raw = q.get("options", {})
        missing = VALID_OPTION_KEYS - set(options_raw.keys())
        if missing:
            raise QuizGenerationError(f"Question {i} is missing option keys: {missing}.")
        correct = str(q.get("correct_option", "")).strip().upper()
        if correct not in VALID_OPTION_KEYS:
            raise QuizGenerationError(f"Question {i} has invalid 'correct_option': '{correct}'.")
        options = sorted(
            [QuizOptionData(key=k, text=str(v).strip()) for k, v in options_raw.items() if k in VALID_OPTION_KEYS],
            key=lambda o: o.key
        )
        parsed.append(QuizQuestionData(
            id=i, question_text=q_text, options=options,
            correct_option=correct, explanation=q.get("explanation", "").strip()
        ))
    return GeneratedQuiz(questions=parsed, raw_response=raw_dict)


def generate_quiz_from_lesson(lesson_content: str) -> GeneratedQuiz:
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        raise QuizGenerationError("GEMINI_API_KEY is not set in your .env file.")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=QUIZ_GENERATION_SYSTEM_PROMPT,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.4,
            top_p=0.95,
            max_output_tokens=2048,
        ),
    )
    user_prompt = f"Generate a quiz for the following lesson content:\n\n---\n{lesson_content}\n---"
    logger.info("Calling Gemini API. Content length: %d chars.", len(lesson_content))
    try:
        response = model.generate_content(user_prompt)
    except Exception as exc:
        raise QuizGenerationError(f"Gemini API call failed: {type(exc).__name__}: {exc}") from exc
    try:
        response_text = response.text
    except Exception as exc:
        finish = getattr(response.candidates, "finish_reason", "unknown") if response.candidates else "unknown"
        raise QuizGenerationError(f"Gemini response has no text. finish_reason={finish}.") from exc
    cleaned = _strip_markdown_fences(response_text)
    try:
        parsed_dict = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise QuizGenerationError(f"Gemini response is not valid JSON: {exc}. Snippet: {cleaned[:200]}") from exc
    result = _validate_and_parse(parsed_dict)
    logger.info("Quiz generated successfully. %d questions.", len(result.questions))
    return result
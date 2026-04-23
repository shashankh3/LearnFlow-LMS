import pytest
from unittest.mock import MagicMock, patch
from lms_core.services.ai_service import (
    GeneratedQuiz, InsufficientContentError,
    QuizGenerationError, _validate_and_parse, _strip_markdown_fences,
)


class TestStripMarkdownFences:
    def test_removes_json_fence(self):
        text = "```json\n{\"status\": \"success\"}\n```"
        assert _strip_markdown_fences(text) == '{"status": "success"}'

    def test_plain_text_unchanged(self):
        text = '{"status": "success"}'
        assert _strip_markdown_fences(text) == text

    def test_strips_whitespace(self):
        assert _strip_markdown_fences("  hello  ") == "hello"


VALID_PAYLOAD = {
    "status": "success",
    "questions": [
        {
            "id": i, "question_text": f"Question {i}?",
            "options": {"A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4"},
            "correct_option": "A", "explanation": f"Explanation {i}",
        }
        for i in range(1, 4)
    ],
}


class TestValidateAndParse:
    def test_valid_payload_returns_generated_quiz(self):
        result = _validate_and_parse(VALID_PAYLOAD)
        assert isinstance(result, GeneratedQuiz)
        assert len(result.questions) == 3

    def test_error_status_raises_insufficient_content(self):
        with pytest.raises(InsufficientContentError):
            _validate_and_parse({"status": "error", "message": "Not enough content."})

    def test_wrong_question_count_raises_error(self):
        bad = {**VALID_PAYLOAD, "questions": VALID_PAYLOAD["questions"][:2]}
        with pytest.raises(QuizGenerationError):
            _validate_and_parse(bad)

    def test_missing_option_key_raises_error(self):
        bad_q = {**VALID_PAYLOAD["questions"], "options": {"A": "x", "B": "y", "C": "z"}}
        bad   = {**VALID_PAYLOAD, "questions": [bad_q] + VALID_PAYLOAD["questions"][1:]}
        with pytest.raises(QuizGenerationError):
            _validate_and_parse(bad)

    def test_invalid_correct_option_raises_error(self):
        bad_q = {**VALID_PAYLOAD["questions"], "correct_option": "Z"}
        bad   = {**VALID_PAYLOAD, "questions": [bad_q] + VALID_PAYLOAD["questions"][1:]}
        with pytest.raises(QuizGenerationError):
            _validate_and_parse(bad)

    def test_empty_question_text_raises_error(self):
        bad_q = {**VALID_PAYLOAD["questions"], "question_text": ""}
        bad   = {**VALID_PAYLOAD, "questions": [bad_q] + VALID_PAYLOAD["questions"][1:]}
        with pytest.raises(QuizGenerationError):
            _validate_and_parse(bad)
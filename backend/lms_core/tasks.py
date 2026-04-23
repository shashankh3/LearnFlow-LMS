import logging
from celery import shared_task
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=30,
             name="lms_core.tasks.generate_quiz_for_lesson",
             soft_time_limit=55, time_limit=60)
def generate_quiz_for_lesson(self, lesson_id: str, quiz_id: str) -> dict:
    from .models import Lesson, Quiz, QuizOption, QuizQuestion
    from .services.ai_service import InsufficientContentError, QuizGenerationError, generate_quiz_from_lesson

    logger.info("[TASK] Started. lesson=%s quiz=%s", lesson_id, quiz_id)

    try:
        lesson = Lesson.objects.select_related("course").get(pk=lesson_id)
        quiz   = Quiz.objects.get(pk=quiz_id)
    except (Lesson.DoesNotExist, Quiz.DoesNotExist) as exc:
        logger.error("[TASK] Record not found: %s", exc)
        return {"status": "error", "error": str(exc)}

    quiz.generation_status = Quiz.GenerationStatus.PROCESSING
    quiz.save(update_fields=["generation_status", "updated_at"])
    lesson.ai_processing_status = Lesson.AIStatus.PROCESSING
    lesson.save(update_fields=["ai_processing_status", "updated_at"])

    try:
        generated_quiz = generate_quiz_from_lesson(lesson.content)

    except InsufficientContentError as exc:
        logger.info("[TASK] InsufficientContent for lesson %s: %s", lesson_id, exc)
        _mark_skipped(quiz, lesson, str(exc))
        return {"status": "skipped", "quiz_id": quiz_id, "reason": str(exc)}

    except QuizGenerationError as exc:
        logger.warning("[TASK] QuizGenerationError attempt %d: %s", self.request.retries + 1, exc)
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error("[TASK] Max retries exceeded for lesson %s.", lesson_id)
            _mark_failed(quiz, lesson, str(exc))
            return {"status": "failed", "quiz_id": quiz_id, "error": str(exc)}

    except Exception as exc:
        logger.exception("[TASK] Unexpected error: %s", exc)
        _mark_failed(quiz, lesson, f"Unexpected error: {exc}")
        return {"status": "failed", "quiz_id": quiz_id, "error": str(exc)}

    try:
        with transaction.atomic():
            quiz.questions.all().delete()
            for q_data in generated_quiz.questions:
                question = QuizQuestion.objects.create(
                    quiz=quiz, position=q_data.id,
                    question_text=q_data.question_text,
                    correct_option=q_data.correct_option,
                    explanation=q_data.explanation,
                )
                QuizOption.objects.bulk_create([
                    QuizOption(question=question, key=opt.key, text=opt.text)
                    for opt in q_data.options
                ])
            quiz.generation_status = Quiz.GenerationStatus.SUCCESS
            quiz.raw_ai_response   = generated_quiz.raw_response
            quiz.error_message     = ""
            quiz.generated_at      = timezone.now()
            quiz.save(update_fields=["generation_status", "raw_ai_response", "error_message", "generated_at", "updated_at"])
            lesson.ai_processing_status = Lesson.AIStatus.SUCCESS
            lesson.ai_error_message     = ""
            lesson.save(update_fields=["ai_processing_status", "ai_error_message", "updated_at"])
    except Exception as exc:
        logger.exception("[TASK] DB write failed: %s", exc)
        _mark_failed(quiz, lesson, f"DB write error: {exc}")
        return {"status": "failed", "quiz_id": quiz_id, "error": str(exc)}

    logger.info("[TASK] SUCCESS. lesson=%s questions=%d", lesson_id, len(generated_quiz.questions))
    return {"status": "success", "quiz_id": quiz_id, "question_count": len(generated_quiz.questions)}


def _mark_failed(quiz, lesson, error_message: str):
    from .models import Lesson, Quiz
    quiz.generation_status = Quiz.GenerationStatus.FAILED
    quiz.error_message     = error_message[:2000]
    quiz.generated_at      = timezone.now()
    quiz.save(update_fields=["generation_status", "error_message", "generated_at", "updated_at"])
    lesson.ai_processing_status = Lesson.AIStatus.FAILED
    lesson.ai_error_message     = error_message[:2000]
    lesson.save(update_fields=["ai_processing_status", "ai_error_message", "updated_at"])

def _mark_skipped(quiz, lesson, error_message: str):
    from .models import Lesson, Quiz
    quiz.generation_status = Quiz.GenerationStatus.SKIPPED
    quiz.error_message     = error_message
    quiz.generated_at      = timezone.now()
    quiz.save(update_fields=["generation_status", "error_message", "generated_at", "updated_at"])
    lesson.ai_processing_status = Lesson.AIStatus.SKIPPED
    lesson.ai_error_message     = error_message
    lesson.save(update_fields=["ai_processing_status", "ai_error_message", "updated_at"])
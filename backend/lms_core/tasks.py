import logging
from celery import shared_task
from django.db import transaction

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=30,
             name="lms_core.tasks.generate_quiz_for_lesson",
             soft_time_limit=55, time_limit=60)
def generate_quiz_for_lesson(self, lesson_id: str, quiz_id: str) -> dict:
    from .models import Lesson, Quiz, Question, Choice
    from .services.ai_service import InsufficientContentError, QuizGenerationError, generate_quiz_from_lesson

    logger.info("[TASK] Started. lesson=%s quiz=%s", lesson_id, quiz_id)

    try:
        lesson = Lesson.objects.select_related("course").get(pk=lesson_id)
        quiz   = Quiz.objects.get(pk=quiz_id)
    except (Lesson.DoesNotExist, Quiz.DoesNotExist) as exc:
        logger.error("[TASK] Record not found: %s", exc)
        return {"status": "error", "error": str(exc)}

    try:
        generated_quiz = generate_quiz_from_lesson(lesson.content)

    except InsufficientContentError as exc:
        logger.info("[TASK] InsufficientContent for lesson %s: %s", lesson_id, exc)
        return {"status": "skipped", "quiz_id": quiz_id, "reason": str(exc)}

    except QuizGenerationError as exc:
        logger.warning("[TASK] QuizGenerationError attempt %d: %s", self.request.retries + 1, exc)
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error("[TASK] Max retries exceeded for lesson %s.", lesson_id)
            return {"status": "failed", "quiz_id": quiz_id, "error": str(exc)}

    except Exception as exc:
        logger.exception("[TASK] Unexpected error: %s", exc)
        return {"status": "failed", "quiz_id": quiz_id, "error": str(exc)}

    try:
        with transaction.atomic():
            quiz.questions.all().delete()
            for q_data in generated_quiz.questions:
                question = Question.objects.create(
                    quiz=quiz,
                    text=q_data.question_text,
                )
                Choice.objects.bulk_create([
                    Choice(
                        question=question, 
                        text=f"{opt.key}: {opt.text}", 
                        is_correct=(opt.key == q_data.correct_option)
                    )
                    for opt in q_data.options
                ])
    except Exception as exc:
        logger.exception("[TASK] DB write failed: %s", exc)
        return {"status": "failed", "quiz_id": quiz_id, "error": str(exc)}

    logger.info("[TASK] SUCCESS. lesson=%s questions=%d", lesson_id, len(generated_quiz.questions))
    return {"status": "success", "quiz_id": quiz_id, "question_count": len(generated_quiz.questions)}
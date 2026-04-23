from django.db import models
from django.db.models import Count, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce
from lms_core.models import Course, Enrollment, Lesson, LessonProgress


def _completed_subquery(ref="pk"):
    return Subquery(
        LessonProgress.objects.filter(
            enrollment_id=OuterRef(ref), lesson__is_active=True, is_completed=True
        ).values("enrollment_id").annotate(c=Count("id")).values("c"),
        output_field=models.IntegerField(),
    )

def _total_subquery(ref="course_id"):
    return Subquery(
        Lesson.objects.filter(course_id=OuterRef(ref), is_active=True)
        .values("course_id").annotate(c=Count("id")).values("c"),
        output_field=models.IntegerField(),
    )


def get_course_progress(enrollment):
    total    = Lesson.objects.filter(course=enrollment.course, is_active=True).count()
    records  = LessonProgress.objects.filter(enrollment=enrollment, lesson__is_active=True).select_related("lesson")
    prog_map = {p.lesson_id: p for p in records}
    lessons  = Lesson.objects.filter(course=enrollment.course, is_active=True).order_by("order")
    details, done = [], 0
    for lesson in lessons:
        rec = prog_map.get(lesson.id)
        ok  = bool(rec and rec.is_completed)
        if ok: done += 1
        details.append({
            "lesson_id": str(lesson.id), "title": lesson.title, "order": lesson.order,
            "is_completed": ok, "completed_at": rec.completed_at if rec else None,
        })
    pct = round((done / total) * 100, 1) if total else 0.0
    return {
        "enrollment_id": str(enrollment.id), "course_id": str(enrollment.course_id),
        "course_title": enrollment.course.title, "course_slug": enrollment.course.slug,
        "total_lessons": total, "completed_lessons": done, "completion_percentage": pct,
        "remaining_lessons": total - done, "status": enrollment.status,
        "enrolled_at": enrollment.enrolled_at, "completed_at": enrollment.completed_at,
        "lesson_details": details,
    }


def get_student_dashboard(student):
    enrollments = (
        Enrollment.objects.filter(student=student)
        .select_related("course", "course__instructor")
        .annotate(
            total_c=Coalesce(_total_subquery("course_id"), 0),
            done_c=Coalesce(_completed_subquery("pk"), 0),
        ).order_by("-enrolled_at")
    )
    courses, total_completed = [], 0
    for e in enrollments:
        pct = round((e.done_c / e.total_c) * 100, 1) if e.total_c else 0.0
        if pct == 100.0: total_completed += 1
        courses.append({
            "enrollment_id": str(e.id), "course_id": str(e.course_id),
            "course_title": e.course.title, "course_slug": e.course.slug,
            "course_thumbnail": e.course.thumbnail_url,
            "instructor_name": e.course.instructor.get_full_name() or e.course.instructor.username,
            "status": e.status, "enrolled_at": e.enrolled_at, "completed_at": e.completed_at,
            "total_lessons": e.total_c, "completed_lessons": e.done_c, "completion_percentage": pct,
        })
    n = enrollments.count()
    return {
        "student_id": str(student.id), "username": student.username,
        "total_enrolled": n, "total_completed": total_completed,
        "in_progress": n - total_completed, "courses": courses,
    }


def get_instructor_dashboard(course):
    enrollments = (
        Enrollment.objects.filter(course=course).select_related("student")
        .annotate(
            total_c=Coalesce(_total_subquery("course_id"), 0),
            done_c=Coalesce(_completed_subquery("pk"), 0),
        ).order_by("-enrolled_at")
    )
    rows, vals = [], []
    for e in enrollments:
        pct = round((e.done_c / e.total_c) * 100, 1) if e.total_c else 0.0
        vals.append(pct)
        rows.append({
            "enrollment_id": str(e.id), "student_id": str(e.student_id),
            "username": e.student.username, "email": e.student.email,
            "avatar_url": e.student.avatar_url, "status": e.status,
            "enrolled_at": e.enrolled_at, "completed_at": e.completed_at,
            "total_lessons": e.total_c, "completed_lessons": e.done_c,
            "completion_percentage": pct,
        })
    rows.sort(key=lambda r: -r["completion_percentage"])
    n    = len(rows)
    full = sum(1 for p in vals if p == 100.0)
    avg  = round(sum(vals) / n, 1) if n else 0.0
    return {
        "course_id": str(course.id), "course_title": course.title, "course_slug": course.slug,
        "total_lessons": course.lessons.filter(is_active=True).count(),
        "total_enrolled": n, "fully_completed": full,
        "in_progress": n - full, "average_completion_pct": avg, "students": rows,
    }


def get_course_completion_stats(instructor):
    courses = (
        Course.objects.filter(instructor=instructor, is_active=True)
        .annotate(
            total_enrolled=Count("enrollments", distinct=True),
            total_lesson_count=Count("lessons", filter=Q(lessons__is_active=True), distinct=True),
            fully_completed_count=Count("enrollments",
                filter=Q(enrollments__status=Enrollment.Status.COMPLETED), distinct=True),
        ).order_by("-total_enrolled")
    )
    return [{
        "course_id": str(c.id), "title": c.title, "slug": c.slug,
        "is_published": c.is_published, "total_lessons": c.total_lesson_count,
        "total_enrolled": c.total_enrolled, "fully_completed": c.fully_completed_count,
        "completion_rate_pct": round((c.fully_completed_count / c.total_enrolled) * 100, 1) if c.total_enrolled else 0.0,
        "created_at": c.created_at,
    } for c in courses]
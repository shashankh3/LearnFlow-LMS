import json
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils.translation import gettext_lazy as _

from .models import Course, Lesson, Enrollment, User
from .serializers import (
    CourseSerializer, LessonSerializer, EnrollmentSerializer,
    UserSerializer, CustomTokenObtainPairSerializer
)


# ==========================================
# 1. AUTHENTICATION & REGISTRATION
# ==========================================

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data.copy()
    is_inst = data.get('is_instructor', False)
    role = data.get('role', '').lower()
    data['is_instructor'] = True if (is_inst == 'true' or is_inst is True or role == 'instructor') else False
    serializer = UserSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            "message": _("User registered successfully!"),
            "username": user.username,
            "is_instructor": user.is_instructor
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_data(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# ==========================================
# 2. CORE DASHBOARD VIEWS
# ==========================================

class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        qs = Course.objects.select_related('instructor').prefetch_related('lessons').all()
        from django.db.models import Q
        if user.is_authenticated and getattr(user, 'is_instructor', False):
            qs = qs.filter(Q(status='published') | Q(instructor=user))
        else:
            qs = qs.filter(status='published')

        search = self.request.query_params.get('search')
        difficulty = self.request.query_params.get('difficulty')

        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        if difficulty and difficulty != "All":
            qs = qs.filter(difficulty__iexact=difficulty)

        return qs.distinct()

    @action(detail=False, methods=['get'], url_path='explore')
    def explore(self, request):
        enrolled_ids = Enrollment.objects.filter(
            user=request.user
        ).values_list('course_id', flat=True)
        courses = self.get_queryset().exclude(id__in=enrolled_ids)
        
        page = self.paginate_queryset(courses)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    def destroy(self, request, *args, **kwargs):
        course = self.get_object()
        if course.instructor != request.user:
            return Response({"error": _("Only the course creator can delete this course.")}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        course = self.get_object()
        if course.instructor != request.user:
            return Response({"error": _("Only the course creator can edit this course.")}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        course_identifier = data.get('course_id') or data.get('courseId') or data.get('course_slug') or data.get('courseSlug')
        if course_identifier and not data.get('course'):
            try:
                if str(course_identifier).isdigit():
                    data['course'] = int(course_identifier)
                else:
                    course_obj = Course.objects.get(slug=course_identifier)
                    data['course'] = course_obj.id
            except Exception:
                pass
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        course_obj = Course.objects.get(id=serializer.validated_data['course'].id)
        if course_obj.instructor != request.user:
            return Response({"error": _("Only the course creator can add lessons.")}, status=status.HTTP_403_FORBIDDEN)
            
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()

    def update(self, request, *args, **kwargs):
        lesson = self.get_object()
        if lesson.course.instructor != request.user:
            return Response({"error": _("Only the course creator can edit this lesson.")}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        lesson = self.get_object()
        if lesson.course.instructor != request.user:
            return Response({"error": _("Only the course creator can delete this lesson.")}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user).select_related('course', 'course__instructor').prefetch_related('completed_lessons')

    def create(self, request, *args, **kwargs):
        course_id = request.data.get('course')
        if course_id:
            enrollment, created = Enrollment.objects.get_or_create(user=request.user, course_id=course_id)
            serializer = self.get_serializer(enrollment)
            if created:
                headers = self.get_success_headers(serializer.data)
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        enrollment = self.get_object()
        if enrollment.user != request.user:
            return Response({"error": _("You can only unenroll yourself.")}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


# ==========================================
# 3. EXTRA FEATURES (ANALYTICS, PROGRESS & AI)
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_instructor_analytics(request):
    if not getattr(request.user, 'is_instructor', False):
        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
    
    courses = Course.objects.filter(instructor=request.user).prefetch_related(
        'lessons',
        'enrollments__user',
        'enrollments__completed_lessons'
    )
    analytics_data = []
    
    for course in courses:
        enrollments = course.enrollments.all()
        total_students = len(enrollments)
        completed_students = sum(1 for e in enrollments if e.is_completed)
        total_lessons = course.lessons.count()
        
        students_list = []
        total_progress = 0
        
        for enroll in enrollments:
            completed_cnt = enroll.completed_lessons.count()
            progress_pct = int((completed_cnt / total_lessons) * 100) if total_lessons > 0 else 0
            total_progress += progress_pct
            
            students_list.append({
                "username": enroll.user.username,
                "enrolled_at": enroll.enrolled_at.strftime('%b %d, %Y') if enroll.enrolled_at else "",
                "percentage": progress_pct,
                "completed_lessons": completed_cnt,
                "total_lessons": total_lessons,
                "is_completed": enroll.is_completed
            })
            
        avg_progress = int(total_progress / total_students) if total_students > 0 else 0
        
        analytics_data.append({
            "id": course.id,
            "title": course.title,
            "slug": course.slug,
            "difficulty": course.difficulty,
            "total_lessons": total_lessons,
            "total_students": total_students,
            "completed_students": completed_students,
            "avg_progress": avg_progress,
            "students": students_list
        })
        
    return Response(analytics_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_lesson_completed(request, course_slug, lesson_id):
    try:
        course = Course.objects.get(slug=course_slug)
        lesson = Lesson.objects.get(id=lesson_id, course=course)
        enrollment = Enrollment.objects.get(user=request.user, course=course)

        enrollment.completed_lessons.add(lesson)
        enrollment.resume_lesson = lesson

        total = course.lessons.count()
        completed = enrollment.completed_lessons.count()
        progress = int((completed / total) * 100) if total > 0 else 0

        if progress == 100 and not enrollment.is_completed:
            from django.utils import timezone
            enrollment.is_completed = True
            enrollment.completed_at = timezone.now()
        
        enrollment.save()

        return Response({
            "message": _("Lesson completed!"),
            "progress": progress,
            "is_completed": enrollment.is_completed,
            "completed_lessons": list(enrollment.completed_lessons.values_list('id', flat=True))
        })

    except Course.DoesNotExist:
        return Response({"error": _("Course not found.")}, status=status.HTTP_404_NOT_FOUND)
    except Lesson.DoesNotExist:
        return Response({"error": _("Lesson not found.")}, status=status.HTTP_404_NOT_FOUND)
    except Enrollment.DoesNotExist:
        return Response({"error": "You are not enrolled in this course."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request, lesson_id):
    from .models import Quiz, Question, Choice

    try:
        lesson = Lesson.objects.get(id=lesson_id)
        
        content = lesson.content if getattr(lesson, 'content', None) else "General overview of the lesson topics."

        from .services.ai_service import generate_quiz_from_lesson
        generated_quiz = generate_quiz_from_lesson(content)

        quiz = Quiz.objects.create(lesson=lesson, title=f"Quiz for {lesson.title}", status='published')

        response_data = []
        for i, q_data in enumerate(generated_quiz.questions):
            question_obj = Question.objects.create(quiz=quiz, text=q_data.question_text)
            options_texts = []
            correct_index = 0
            for j, opt in enumerate(q_data.options):
                Choice.objects.create(
                    question=question_obj,
                    text=opt.text,
                    is_correct=(opt.key == q_data.correct_option)
                )
                options_texts.append(opt.text)
                if opt.key == q_data.correct_option:
                    correct_index = j
            
            response_data.append({
                "id": i + 1,
                "question": q_data.question_text,
                "options": options_texts,
                "correctIndex": correct_index
            })

        return Response(response_data)

    except Lesson.DoesNotExist:
        return Response({"error": _("Lesson not found.")}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": _("Quiz generation failed: {error}").format(error=str(e))}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_quiz(request, quiz_id):
    from .models import Quiz
    try:
        quiz = Quiz.objects.get(id=quiz_id)
        if not getattr(request.user, 'is_instructor', False) and quiz.lesson.course.instructor != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        quiz.status = 'published'
        quiz.save()
        return Response({"message": "Quiz published successfully"})
    except Quiz.DoesNotExist:
        return Response({"error": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request, quiz_id):
    from .models import Quiz, QuizAttempt, QuizAnswer, Choice
    from django.utils import timezone
    try:
        quiz = Quiz.objects.get(id=quiz_id)
    except Quiz.DoesNotExist:
        return Response({"error": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

    attempts = QuizAttempt.objects.filter(user=request.user, quiz=quiz).order_by('-started_at')
    # Limit removed for demo purposes

    attempt = QuizAttempt.objects.create(user=request.user, quiz=quiz, submitted_at=timezone.now())
    answers_data = request.data.get('answers', {})
    
    score = 0
    total = quiz.questions.count()
    
    for q in quiz.questions.all():
        choice_id = answers_data.get(str(q.id))
        if choice_id:
            try:
                choice = Choice.objects.get(id=choice_id, question=q)
                QuizAnswer.objects.create(attempt=attempt, question=q, selected_choice=choice)
                if choice.is_correct:
                    score += 1
            except Choice.DoesNotExist:
                pass
                
    attempt.score = score
    attempt.passed = (score / total) >= 0.7 if total > 0 else False
    attempt.save()
    
    return Response({
        "message": "Quiz submitted",
        "score": score,
        "total": total,
        "passed": attempt.passed
    })

@api_view(['GET'])
def health_check(request):
    return Response({"status": "healthy", "service": "LearnFlow-API"})
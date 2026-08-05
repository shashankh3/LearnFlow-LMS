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
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug'

    @action(detail=False, methods=['get'], url_path='explore')
    def explore(self, request):
        enrolled_ids = Enrollment.objects.filter(
            user=request.user
        ).values_list('course_id', flat=True)
        courses = Course.objects.exclude(id__in=enrolled_ids)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    def destroy(self, request, *args, **kwargs):
        course = self.get_object()
        if course.instructor != request.user:
            return Response({"error": _("Only the course creator can delete this course.")}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


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
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        course = serializer.validated_data.get('course')
        if course and 'order' not in serializer.validated_data:
            last_lesson = Lesson.objects.filter(course=course).order_by('order').last()
            next_order = (getattr(last_lesson, 'order', 0) or 0) + 1
            serializer.save(order=next_order)
        else:
            serializer.save()


class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

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
    courses = Course.objects.filter(instructor=request.user)
    return Response({
        "total_courses": courses.count(),
        "total_students": Enrollment.objects.filter(course__in=courses).count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_lesson_completed(request, course_slug, lesson_id):
    try:
        course = Course.objects.get(slug=course_slug)
        lesson = Lesson.objects.get(id=lesson_id, course=course)
        enrollment = Enrollment.objects.get(user=request.user, course=course)

        enrollment.completed_lessons.add(lesson)

        total = course.lessons.count()
        completed = enrollment.completed_lessons.count()
        progress = int((completed / total) * 100) if total > 0 else 0

        if progress == 100:
            enrollment.is_completed = True
            enrollment.save()

        return Response({"message": _("Lesson completed!"), "progress": progress})

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
    import re
    import time
    import os
    from .models import Quiz, Question, Choice

    sync_ai = os.getenv('SYNC_AI_GENERATION', 'True').lower() == 'true'

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
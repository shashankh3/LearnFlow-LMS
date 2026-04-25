import json
import google.generativeai as genai
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

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
            "message": "User registered successfully!",
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
            return Response({"error": "Only the course creator can delete this course."}, status=status.HTTP_403_FORBIDDEN)
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
            return Response({"error": "You can only unenroll yourself."}, status=status.HTTP_403_FORBIDDEN)
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

        return Response({"message": "Lesson completed!", "progress": progress})

    except Course.DoesNotExist:
        return Response({"error": "Course not found."}, status=status.HTTP_404_NOT_FOUND)
    except Lesson.DoesNotExist:
        return Response({"error": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)
    except Enrollment.DoesNotExist:
        return Response({"error": "You are not enrolled in this course."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request, lesson_id):
    import re
    import time

    try:
        lesson = Lesson.objects.get(id=lesson_id)
        content = lesson.content if getattr(lesson, 'content', None) else "General overview of the lesson topics."

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash')

        prompt = f"""
You are a quiz generator. Create exactly 3 multiple choice questions based on the text below.
Return ONLY a raw JSON array with no explanation, no markdown, no code fences.
Each object must have these exact keys: "question", "options" (array of 4 strings), "correctIndex" (0-based integer index of correct option).
Example format: [{{"question": "What is X?", "options": ["A", "B", "C", "D"], "correctIndex": 2}}]

Text: {content[:3000]}
"""
        last_error = None
        response = None
        for attempt in range(3):
            try:
                response = model.generate_content(prompt)
                break
            except Exception as e:
                last_error = e
                if any(x in str(e).lower() for x in ["quota", "rate", "429", "busy"]):
                    time.sleep(3)
                    continue
                raise e

        if response is None:
            raise last_error

        raw_text = response.text.strip()

        json_match = re.search(r'\[.*\]', raw_text, re.DOTALL)
        if not json_match:
            return Response(
                {"error": "Gemini returned unexpected format. Try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        quiz_data = json.loads(json_match.group())

        for q in quiz_data:
            if 'correctIndex' not in q and 'answer' in q:
                answer = str(q['answer']).strip().upper()
                letter_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
                q['correctIndex'] = letter_map.get(answer[0], 0)

        return Response(quiz_data)

    except Lesson.DoesNotExist:
        return Response({"error": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": f"Quiz generation failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
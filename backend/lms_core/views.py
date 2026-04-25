import os
import json
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from google import genai

from .models import Course, Lesson, Enrollment
from .serializers import (
    CourseSerializer, 
    LessonSerializer, 
    EnrollmentSerializer, 
    UserSerializer,
    CustomTokenObtainPairSerializer
)

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')
        role = request.data.get('role', 'STUDENT').upper()
        user = User.objects.create_user(
            username=username, password=password, email=email,
            is_instructor=(role == 'INSTRUCTOR')
        )
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_data(request):
    return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_instructor_analytics(request):
    courses = Course.objects.filter(instructor=request.user)
    data = []
    for course in courses:
        enrollments = Enrollment.objects.filter(course=course).select_related('user')
        student_list = []
        for enrollment in enrollments:
            total = course.lessons.count()
            comp = enrollment.completed_lessons.count()
            perc = int((comp / total) * 100) if total > 0 else 0
            
            student_list.append({
                "username": enrollment.user.username,
                "enrolled_at": enrollment.enrolled_at.strftime("%Y-%m-%d"),
                "percentage": perc
            })
        data.append({
            "id": course.id,
            "title": course.title,
            "difficulty": course.difficulty,
            "total_lessons": course.lessons.count(),
            "students": student_list
        })
    return Response(data, status=status.HTTP_200_OK)

class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = Course.objects.all()
        if self.request.query_params.get('instructor') == 'true':
            return queryset.filter(instructor=self.request.user)
        
        if 'student/dashboard' in self.request.path or self.request.query_params.get('enrolled') == 'true':
            if self.request.user.is_authenticated:
                return queryset.filter(enrollments__user=self.request.user)
            return Course.objects.none()
            
        return queryset
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        course_slug = self.kwargs.get('course_slug')
        if course_slug:
            course = get_object_or_404(Course, slug=course_slug)
            serializer.save(course=course)
        else:
            serializer.save()

class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Enrollment.objects.filter(user=self.request.user)
        return Enrollment.objects.none()

    def create(self, request):
        course_id = request.data.get('course')
        course = get_object_or_404(Course, id=course_id)
        en, _ = Enrollment.objects.get_or_create(user=request.user, course=course)
        return Response(EnrollmentSerializer(en).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_lesson_completed(request, course_slug, lesson_id):
    course = get_object_or_404(Course, slug=course_slug)
    lesson = get_object_or_404(Lesson, id=lesson_id, course=course)
    
    enrollment, created = Enrollment.objects.get_or_create(user=request.user, course=course)
    enrollment.completed_lessons.add(lesson)

    total_lessons = course.lessons.count()
    if enrollment.completed_lessons.count() == total_lessons:
        enrollment.is_completed = True
        enrollment.certificate_url = f"https://learnflow-lms.com/certificates/{enrollment.id}"
    
    enrollment.save()
    return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request, lesson_id):
    try:
        lesson = get_object_or_404(Lesson, id=lesson_id)
        api_key = os.getenv("GEMINI_API_KEY")
        client = genai.Client(api_key=api_key)
        
        prompt = "Create a 3-question quiz based on the lesson content. Return ONLY a raw JSON array. Format: [{\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctIndex\": 0}]"
        
        response = client.models.generate_content(model="gemini-2.0-flash-exp", contents=prompt)
        
        backticks = chr(96) * 3
        raw_text = response.text.strip()
        raw_text = raw_text.replace(backticks + "json", "").replace(backticks, "").strip()
        
        return Response({"quiz": raw_text}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
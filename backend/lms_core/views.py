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

from .models import Course, Lesson, Enrollment, Quiz, Question, Choice
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

        if not username or not password:
            return Response({"error": "Missing credentials"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username, 
            password=password, 
            email=email,
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

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    lookup_field = 'slug'
    
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

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request):
        course_id = request.data.get('course')
        course = get_object_or_404(Course, id=course_id)
        en, _ = Enrollment.objects.get_or_create(user=request.user, course=course)
        return Response(EnrollmentSerializer(en).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request, lesson_id):
    try:
        lesson = get_object_or_404(Lesson, id=lesson_id)
        api_key = os.getenv("GEMINI_API_KEY")
        client = genai.Client(api_key=api_key)
        
        prompt = f"Generate 5 MCQs for: {lesson.content}. Return ONLY JSON list: [{{'question_text': '', 'choices': [], 'correct_answer': ''}}]"
        
        response = client.models.generate_content(model="gemini-3-flash", contents=prompt)
        raw = response.text.strip()
        
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        
        quiz_data = json.loads(raw.strip())
        quiz = Quiz.objects.create(lesson=lesson, title=f"Quiz: {lesson.title}")
        for it in quiz_data:
            q = Question.objects.create(quiz=quiz, text=it['question_text'])
            for c in it['choices']:
                Choice.objects.create(question=q, text=c, is_correct=(c == it['correct_answer']))
        
        return Response({"message": "Generated", "quiz_id": quiz.id}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
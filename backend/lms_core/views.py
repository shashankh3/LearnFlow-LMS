import json
import google.generativeai as genai
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User, Course, Lesson, Enrollment, Progress
from .serializers import UserSerializer, CourseSerializer, LessonSerializer, EnrollmentSerializer

# ---> PASTE YOUR FREE GEMINI API KEY HERE <---
genai.configure(api_key="AIzaSyCR9lUf7YD38RHIugNxi2bml8lhpdsKiCU")

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return self.request.user

class CourseListView(generics.ListCreateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    lookup_field = 'slug'

class LessonCreateView(generics.CreateAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    def perform_create(self, serializer):
        course = Course.objects.get(slug=self.kwargs['slug'])
        serializer.save(course=course)

class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    lookup_url_kwarg = 'lesson_id'

class EnrollmentListCreateView(generics.ListCreateAPIView, generics.DestroyAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user)
        
    def post(self, request, *args, **kwargs):
        course_id = request.data.get('course') or request.data.get('course_id')
        try:
            course = Course.objects.get(id=course_id)
            # Safe manual save to completely bypass the old serializer bug
            if not Enrollment.objects.filter(user=request.user, course=course).exists():
                Enrollment.objects.bulk_create([Enrollment(user=request.user, course=course)])
            return Response({"status": "enrolled"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        course_id = request.data.get('course_id')
        enrollment = Enrollment.objects.filter(user=request.user, course_id=course_id).first()
        if enrollment:
            enrollment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"error": "Enrollment not found"}, status=status.HTTP_404_NOT_FOUND)

class ToggleLessonProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(id=lesson_id)
            enrollment = Enrollment.objects.get(user=request.user, course=lesson.course)
            progress, created = Progress.objects.get_or_create(enrollment=enrollment, lesson=lesson)
            progress.completed = not progress.completed
            progress.save()
            return Response({"completed": progress.completed})
        except Enrollment.DoesNotExist:
            return Response({"error": "You must be enrolled to track progress"}, status=400)

class StudentDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        enrollments = Enrollment.objects.filter(user=request.user).select_related('course')
        data = []
        for enr in enrollments:
            total_lessons = enr.course.lessons.count()
            completed = Progress.objects.filter(enrollment=enr, completed=True).count()
            percentage = int((completed / total_lessons) * 100) if total_lessons > 0 else 0
            first_vid = enr.course.lessons.first().video_url if enr.course.lessons.first() else None
            data.append({
                "id": enr.course.id, "slug": enr.course.slug, "title": enr.course.title,
                "difficulty": enr.course.difficulty, "description": enr.course.description,
                "percentage": percentage, "video_url": first_vid
            })
        return Response(data)

class InstructorAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        courses = Course.objects.filter(instructor=request.user)
        data = []
        for course in courses:
            total_lessons = course.lessons.count()
            course_data = {
                "id": course.id, "title": course.title, "difficulty": course.difficulty,
                "total_lessons": total_lessons, "students": []
            }
            for enrollment in course.enrolled_students.all():
                completed = Progress.objects.filter(enrollment=enrollment, completed=True).count()
                percentage = int((completed / total_lessons) * 100) if total_lessons > 0 else 0
                course_data["students"].append({
                    "username": enrollment.user.username,
                    "enrolled_at": enrollment.enrolled_at.strftime("%b %d, %Y"),
                    "completed_lessons": completed, "percentage": percentage
                })
            data.append(course_data)
        return Response(data)

class AILessonQuizView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(id=lesson_id)
            content_to_test = lesson.content if lesson.content else lesson.title
            
            # UPGRADED TO THE CURRENT FREE TIER MODEL
            model = genai.GenerativeModel('gemini-3.1-flash-lite-preview')
            
            prompt = f"""
            You are a grandmaster tutor. Create a 7-question multiple choice quiz to "Test the Might" of a student.
            Base the questions on this content: "{content_to_test}"
            
            Return ONLY a raw JSON array. No markdown, no triple backticks.
            JSON structure:
            [
              {{
                "id": 1,
                "question": "text",
                "options": ["a", "b", "c", "d"],
                "correctIndex": 0,
                "explanation": "text"
              }}
            ]
            """
            
            response = model.generate_content(prompt)
            raw_json = response.text.strip()
            
            if "```" in raw_json:
                parts = raw_json.split("```")
                if len(parts) >= 3:
                    raw_json = parts[1]
                    if raw_json.strip().startswith("json"):
                        raw_json = raw_json.strip()[4:]

            quiz_data = json.loads(raw_json.strip())
            return Response({"quiz": quiz_data[:7]})
            
        except Exception as e:
            print(f"GEMINI ERROR: {str(e)}")
            return Response({"error": str(e)}, status=500)
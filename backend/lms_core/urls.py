from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, UserDetailView, CourseListView, CourseDetailView, 
    LessonDetailView, EnrollmentListCreateView, LessonCreateView, 
    InstructorAnalyticsView, StudentDashboardView, ToggleLessonProgressView,
    AILessonQuizView
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view()),
    path('auth/token/', TokenObtainPairView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('auth/me/', UserDetailView.as_view()),
    path('courses/', CourseListView.as_view()),
    path('courses/<slug:slug>/', CourseDetailView.as_view()),
    path('courses/<slug:slug>/lessons/', LessonCreateView.as_view()),
    path('courses/<slug:slug>/lessons/<int:lesson_id>/', LessonDetailView.as_view()),
    path('enrollments/', EnrollmentListCreateView.as_view()),
    path('lessons/<int:lesson_id>/toggle-progress/', ToggleLessonProgressView.as_view()),
    path('student/dashboard/', StudentDashboardView.as_view()),
    path('instructor/analytics/', InstructorAnalyticsView.as_view()),
    path('lessons/<int:lesson_id>/generate-quiz/', AILessonQuizView.as_view()),
]
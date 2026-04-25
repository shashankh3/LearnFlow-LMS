from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CourseViewSet, 
    LessonViewSet, 
    EnrollmentViewSet,
    register_user,
    get_user_data,
    get_instructor_analytics,
    generate_quiz,
    mark_lesson_completed,
    CustomTokenObtainPairView
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', register_user, name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', get_user_data, name='user_data'),
    
    path('instructor/analytics/', get_instructor_analytics, name='instructor_analytics'),
    path('student/dashboard/', CourseViewSet.as_view({'get': 'list'}), name='student_dashboard_api'),
    
    path('courses/<slug:course_slug>/lessons/', LessonViewSet.as_view({'post': 'create'}), name='nested_lesson_create'),
    
    # NEW: Progress Tracker Endpoint
    path('courses/<slug:course_slug>/lessons/<int:lesson_id>/complete/', mark_lesson_completed, name='mark_lesson_completed'),
    
    # AI Endpoint
    path('lessons/<int:lesson_id>/generate-quiz/', generate_quiz, name='generate_quiz'),
]
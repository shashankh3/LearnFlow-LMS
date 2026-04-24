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
    CustomTokenObtainPairView
)

# Initialize the router for standard ViewSets
router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    # 1. Include the router-generated URLs (courses, lessons, enrollments)
    path('', include(router.urls)),
    
    # 2. Authentication Endpoints
    path('auth/register/', register_user, name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', get_user_data, name='user_data'),
    
    # 3. Instructor-Specific Endpoints (Crucial for your Analytics page)
    path('instructor/analytics/', get_instructor_analytics, name='instructor_analytics'),
    
    # 4. Nested Lesson Creation (Used by your Lesson Create page)
    path('courses/<slug:course_slug>/lessons/', LessonViewSet.as_view({'post': 'create'}), name='nested_lesson_create'),
    
    # 5. Student Dashboard Alias
    path('student/dashboard/', CourseViewSet.as_view({'get': 'list'}), name='student_dashboard_api'),
    
    # 6. AI Features
    path('lessons/<int:lesson_id>/generate-quiz/', generate_quiz, name='generate_quiz'),
]
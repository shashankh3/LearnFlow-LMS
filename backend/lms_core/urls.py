from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CourseViewSet, 
    LessonViewSet, 
    EnrollmentViewSet,
    register_user,
    get_user_data,
    generate_quiz,
    CustomTokenObtainPairView
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'lessons', LessonViewSet)
router.register(r'enrollments', EnrollmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    path('auth/register/', register_user, name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # FIXED: Matches the Next.js frontend exact requirement
    path('auth/me/', get_user_data, name='user_data'),
    
    path('lessons/<int:lesson_id>/generate-quiz/', generate_quiz, name='generate_quiz'),
]
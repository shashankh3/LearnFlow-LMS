from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Course, Lesson, Enrollment

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_instructor']

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'course', 'title', 'content', 'video_url']

class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.ReadOnlyField(source='instructor.username')
    lessons = LessonSerializer(many=True, read_only=True)
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 
            'instructor_name', 'difficulty', 'lessons', 
            'instructor', 'thumbnail', 'progress_percentage'
        ]
        extra_kwargs = {'instructor': {'read_only': True}}
        
    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            enrollment = Enrollment.objects.filter(user=request.user, course=obj).first()
            if enrollment:
                total = obj.lessons.count()
                if total == 0: return 0
                return int((enrollment.completed_lessons.count() / total) * 100)
        return 0

class EnrollmentSerializer(serializers.ModelSerializer):
    course_details = CourseSerializer(source='course', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    completed_lesson_ids = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id', 'user', 'course', 'enrolled_at', 'course_details', 
            'is_completed', 'certificate_url', 'progress_percentage', 'completed_lesson_ids'
        ]

    def get_progress_percentage(self, obj):
        total = obj.course.lessons.count()
        if total == 0: return 0
        return int((obj.completed_lessons.count() / total) * 100)
        
    def get_completed_lesson_ids(self, obj):
        return list(obj.completed_lessons.values_list('id', flat=True))

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username = serializers.CharField(required=False)
    email = serializers.CharField(required=False)

    def validate(self, attrs):
        email = attrs.get('email')
        username = attrs.get('username')
        if email and not username:
            try:
                user = User.objects.get(email=email)
                attrs['username'] = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError("No account found.")
        elif not email and not username:
            raise serializers.ValidationError("Credentials required.")
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
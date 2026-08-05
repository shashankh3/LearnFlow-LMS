from django.contrib import admin
from .models import User, Course, Lesson, Enrollment, Quiz, Question, Choice
admin.site.register(User)
admin.site.register(Course)
admin.site.register(Lesson)
admin.site.register(Enrollment)
admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Choice)
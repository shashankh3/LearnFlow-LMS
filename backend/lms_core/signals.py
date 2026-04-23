from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Enrollment, Lesson, Progress

@receiver(post_save, sender=Enrollment)
def create_initial_progress(sender, instance, created, **kwargs):
    if created:
        for lesson in Lesson.objects.filter(course=instance.course):
            Progress.objects.get_or_create(user=instance.user, lesson=lesson)
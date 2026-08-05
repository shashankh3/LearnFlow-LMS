from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Enrollment, Lesson

@receiver(post_save, sender=Enrollment)
def create_initial_progress(sender, instance, created, **kwargs):
    pass
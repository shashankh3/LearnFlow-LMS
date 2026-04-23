from django.apps import AppConfig

class LmsCoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "lms_core"

    def ready(self):
        import lms_core.signals  # noqa
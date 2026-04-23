from rest_framework.permissions import BasePermission

class IsInstructor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "INSTRUCTOR"

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "STUDENT"

class IsInstructorOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        instructor = getattr(obj, "instructor", None)
        if instructor is None:
            instructor = getattr(getattr(obj, "course", None), "instructor", None)
        return instructor == request.user

class IsEnrollmentOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.student == request.user
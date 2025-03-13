# api/permissions.py
# Centralized permission file for handling custom access rules

from rest_framework import viewsets, permissions

# Custom permission class to control access to machines
class IsMachineOwnerOrTemplate(permissions.BasePermission):
    """
    Custom permission to:
    - Allow viewing for all authenticated users
    - Allow copying templates for all authenticated users
    - Allow full control for machine owners
    """
    
    def has_permission(self, request, view):
        # Check if the user is authenticated
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Allow read-only access (GET, HEAD, OPTIONS) for any machine
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Allow the copy_template action if the machine is a template
        if request.method == 'POST' and view.action == 'copy_template' and obj.is_template:
            return True
            
        # For other actions, only the machine owner has permission
        return obj.owner == request.user

# Custom permission to control who can update their account
class CanUpdateUserProfile(permissions.BasePermission):
    """
    Permission class to control user profile updates based on account type.
    """
    def has_object_permission(self, request, view, obj):
        # Allow read-only access (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Users can only edit their own profile
        if obj.id != request.user.id:
            return False

        # PRO_MEMBER and ENTERPRISE_MEMBER users have restrictions
        if request.user.account_type in ['PRO_MEMBER', 'ENTERPRISE_MEMBER']:
            # Check which fields the user is trying to update
            restricted_fields = {'role', 'email', 'first_name', 'last_name'}
            requested_changes = set(request.data.keys())
            
             # Deny access if restricted fields are being updated
            if restricted_fields & requested_changes:
                return False
                
        return True
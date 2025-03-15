# repairmate_backend/api/views/user_views.py

import logging
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from ..models import (
    CustomUser, UserPreferences, UserActivityLog, UserNote,
    SubscriptionPlan, Organization
)
from ..serializers import (
    UserProfileSerializer, UserPreferencesSerializer, UserActivityLogSerializer,
    UserNoteSerializer, UserSerializer, SubscriptionPlanSerializer,
    OrganizationSerializer, TeamMemberSerializer
)
from ..permissions import CanUpdateUserProfile

logger = logging.getLogger(__name__)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated, CanUpdateUserProfile])
def user_profile(request):
    def handle_restricted_update(user):
        if user.account_type in ['PRO_MEMBER', 'ENTERPRISE_MEMBER']:
            return {
                'message': 'As a team member, you can only update your password and preferences.',
                'allowed_updates': ['password', 'preferences'],
                'restricted_fields': ['role', 'email', 'first_name', 'last_name']
            }
        return None

    if request.method == 'GET':
        serializer = UserProfileSerializer(request.user, context={'request': request})
        response_data = serializer.data
        
        # Add restriction information if applicable
        restrictions = handle_restricted_update(request.user)
        if restrictions:
            response_data['update_restrictions'] = restrictions
            
        return Response(response_data)
    
    elif request.method == 'PUT':
        # Check restrictions before processing the update
        restrictions = handle_restricted_update(request.user)
        if restrictions:
            restricted_fields = set(restrictions['restricted_fields'])
            requested_changes = set(request.data.keys())
            
            if restricted_fields & requested_changes:
                return Response({
                    'error': 'Permission denied',
                    'update_restrictions': restrictions
                }, status=403)

        serializer = UserProfileSerializer(
            request.user, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing subscription plans"""
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Restrict queryset based on user's organization
        user = self.request.user
        if user.account_type == 'ENTERPRISE_ADMIN':
            return Organization.objects.filter(id=user.organization.id)
        return Organization.objects.none()

    def perform_create(self, serializer):
        if not self.request.user.account_type == 'ENTERPRISE_ADMIN':
            raise PermissionDenied("Only enterprise admins can create organizations")
        serializer.save()

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        organization = self.get_object()
        if request.user.account_type != 'ENTERPRISE_ADMIN' or request.user.organization != organization:
            raise PermissionDenied("Only organization admins can add members")

        serializer = TeamMemberSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            with transaction.atomic():
                user = serializer.save(
                    organization=organization,
                    account_type='ENTERPRISE_MEMBER',
                    created_by=request.user
                )
                return Response(TeamMemberSerializer(user).data)
        return Response(serializer.errors, status=400)

class CustomUserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.account_type in ['PRO', 'ENTERPRISE_ADMIN']:
            return CustomUser.objects.filter(created_by=user)
        return CustomUser.objects.filter(id=user.id)

    @action(detail=False, methods=['get'])
    def team_members(self, request):
        user = request.user
        if user.account_type not in ['PRO', 'ENTERPRISE_ADMIN']:
            raise PermissionDenied("Only Pro and Enterprise admins can view team members")
        
        team_members = CustomUser.objects.filter(created_by=user)
        serializer = TeamMemberSerializer(team_members, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_team_member(self, request):
        user = request.user
        if user.account_type not in ['PRO', 'ENTERPRISE_ADMIN']:
            raise PermissionDenied("Only Pro and Enterprise admins can add team members")

        serializer = TeamMemberSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            with transaction.atomic():
                new_member = serializer.save()
                return Response(TeamMemberSerializer(new_member).data)
        return Response(serializer.errors, status=400)

    @action(detail=True, methods=['delete'])
    def remove_team_member(self, request, pk=None):
        user = request.user
        if user.account_type not in ['PRO', 'ENTERPRISE_ADMIN']:
            raise PermissionDenied("Only Pro and Enterprise admins can remove team members")

        try:
            team_member = CustomUser.objects.get(pk=pk, created_by=user)
            team_member.delete()
            user.team_members_count -= 1
            user.save()
            return Response(status=204)
        except CustomUser.DoesNotExist:
            return Response({"detail": "Team member not found"}, status=404)

class UserPreferencesViewSet(viewsets.ModelViewSet):
    serializer_class = UserPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        logger.info(f'Getting preferences for user: {self.request.user.username}')
        return UserPreferences.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        logger.info(f'Creating/Updating preferences for user: {self.request.user.username}')
        logger.info(f'Data: {serializer.validated_data}')
        
        try:
            preferences = UserPreferences.objects.get(user=self.request.user)
            logger.info('Found existing preferences, updating...')
            for attr, value in serializer.validated_data.items():
                setattr(preferences, attr, value)
            preferences.save()
            logger.info('Preferences updated successfully')
        except UserPreferences.DoesNotExist:
            logger.info('No existing preferences found, creating new...')
            serializer.save(user=self.request.user)
            logger.info('New preferences created successfully')

    def update(self, request, *args, **kwargs):
        logger.info(f'Update request received for user: {request.user.username}')
        logger.info(f'Update data: {request.data}')
        return super().update(request, *args, **kwargs)

    def list(self, request):
        logger.info(f'List request received for user: {request.user.username}')
        preferences, created = UserPreferences.objects.get_or_create(
            user=request.user,
            defaults={
                'email_notifications': True,
                'language': 'en',
                'timezone': 'America/Puerto_Rico',
                'dark_mode': False
            }
        )
        logger.info(f'Preferences found/created: {preferences.__dict__}')
        logger.info(f'Was created: {created}')
        
        serializer = self.get_serializer(preferences)
        return Response(serializer.data)

class UserActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = UserActivityLog.objects.filter(user=self.request.user)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
            
        return queryset

class UserNoteViewSet(viewsets.ModelViewSet):
    serializer_class = UserNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserNote.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        if request.method == 'PATCH' and set(request.data.keys()) == {'is_completed'}:
            serializer = self.get_serializer(instance, data=request.data, partial=True)
        else:
            serializer = self.get_serializer(instance, data=request.data, partial=partial)

        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)
    
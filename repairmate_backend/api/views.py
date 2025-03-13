# repairmate_backend/api/views.py

import os
import logging
import mimetypes # New
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status, generics
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action, parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db import transaction

# Utility functions for email and file management
from .utils.email_utils import send_welcome_email
from file_manager.services import save_file, get_files, delete_file
from file_manager.models import ManagedFile
from django.http import FileResponse
from django.conf import settings
from .permissions import IsMachineOwnerOrTemplate, CanUpdateUserProfile

# Import necessary models and serializers
from .models import (
    Machine, Manufacturer, EquipmentCategory, Department, MachineType, Issue, CustomUser,
    Solution, TroubleshootingGuide, Step, HiddenTemplate, SubscriptionPlan, Organization,
    UserNote, UserPreferences, UserActivityLog, TrainingWorkspace, TrainingDocument, MachineCopy
)
from .serializers import (
    MachineSerializer, ManufacturerSerializer,
    EquipmentCategorySerializer, UserSerializer, DepartmentSerializer, MachineTypeSerializer, 
    UserProfileSerializer, IssueSerializer, SolutionSerializer, TroubleshootingGuideSerializer,
    StepSerializer, SubscriptionPlanSerializer, OrganizationSerializer, TeamMemberSerializer,
    UserNoteSerializer, UserPreferencesSerializer, UserActivityLogSerializer,
    TrainingDocumentSerializer, TrainingWorkspaceSerializer
)


# Function to serve images directly from the file system
# It was change to detect automatically the type of image
def serve_image(request, image_name):
    image_path = os.path.join(settings.MEDIA_ROOT, 'managed_files', image_name)
    # Detectar el tipo de contenido basado en la extensión del archivo
    content_type, _ = mimetypes.guess_type(image_path)
    if not content_type:
        content_type = 'application/octet-stream'
    return FileResponse(open(image_path, 'rb'), content_type=content_type)


logger = logging.getLogger(__name__)

# Custom authentication class to handle token-based authentication
class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        # Validate the user's credentials and generate a token
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        })

# Function for user registration with optional email notification
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        try:            
            user = serializer.save()# Save the user
            token, created = Token.objects.get_or_create(user=user)
            
            # Send a welcome email if email sending is enabled
            if settings.SEND_EMAILS:
                email_result = send_welcome_email(user.email, user.username)
                if email_result is None:
                    logger.warning(f"Failed to send welcome email to {user.email}")
            
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error during user registration: {str(e)}")
            return Response({
                'error': 'An error occurred during registration'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Endpoint to view or update the authenticated user's profile
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
        
        # Agregar información sobre restricciones si aplica
        restrictions = handle_restricted_update(request.user)
        if restrictions:
            response_data['update_restrictions'] = restrictions
            
        return Response(response_data)
    
    elif request.method == 'PUT':
        # Verificar restricciones antes de procesar la actualización
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

# Read-only viewset for subscription plans, accessible to authenticated users
class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing subscription plans.
    Create/Update/Delete should be handled through admin interface.
    """
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

# ViewSet for managing organizations, restricted to enterprise admins
class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Restrict the queryset based on the user's organization
        user = self.request.user
        if user.account_type == 'ENTERPRISE_ADMIN':
            return Organization.objects.filter(id=user.organization.id)
        return Organization.objects.none()

    def perform_create(self, serializer):
        if not self.request.user.account_type == 'ENTERPRISE_ADMIN':
            raise PermissionDenied("Only enterprise admins can create organizations")
        serializer.save()

    # Custom action to add a member to the organization
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


# Modificar tu CustomUserViewSet existente o agregar estas acciones:
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
    # This view set handles user preferences using the Django REST Framework. It uses authentication permissions.
    serializer_class = UserPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Logs and returns preferences for the currently authenticated user.
        logger.info(f'Getting preferences for user: {self.request.user.username}')
        return UserPreferences.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Handles the creation or updating of user preferences.
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
        # List method to handle the creation or retrieval of preferences.
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
    # A read-only view set for user activity logs, using authentication permissions.
    serializer_class = UserActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Retrieves activity logs for the authenticated user, optionally filtered by date.
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
     # Manages user notes with authentication. Includes CRUD operations.
    serializer_class = UserNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Fetches notes for the authenticated user.
        queryset = UserNote.objects.filter(user=self.request.user)
        return UserNote.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Saves a new note linked to the user.
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        # Custom update logic, checking if the update is partial (e.g., PATCH method).
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # If updating only the 'is_completed' field, use a partial update.
        if request.method == 'PATCH' and set(request.data.keys()) == {'is_completed'}:
            serializer = self.get_serializer(instance, data=request.data, partial=True)
        else:
            serializer = self.get_serializer(instance, data=request.data, partial=partial)

        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)


class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all()  # Do not remove this - . Django REST Framework needs this to no the basename for the urls
    serializer_class = MachineSerializer
    permission_classes = [permissions.IsAuthenticated, IsMachineOwnerOrTemplate]

    def get_queryset(self):
        """
        Filter machines to show:
        1. User's own machines
        2. Template machines that aren't hidden by the user
        """
        hidden_templates = HiddenTemplate.objects.filter(
            user=self.request.user
        ).values_list('machine_id', flat=True)

        return Machine.objects.filter(
            Q(owner=self.request.user) |  # User's own machines
            (Q(is_template=True) & ~Q(id__in=hidden_templates))  # Visible templates
        ).exclude(  # Exclude hidden templates
            id__in=hidden_templates
        )

    def create(self, request, *args, **kwargs):
        logger.info(f"Received data for machine creation: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            logger.info(f"Machine created successfully: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Error creating machine: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        instance = serializer.save(owner=self.request.user)
        logger.info(f"Machine saved to database: {instance.__dict__}")

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            if instance.is_template:
                # If the instance is a template, hide it from this user's view only
                HiddenTemplate.objects.create(
                    user=request.user,
                    machine=instance
                )
                return Response(
                    {"detail": "Template removed from your view"}, 
                    status=status.HTTP_200_OK
                )
            
            # If the instance is not a template, proceed with the normal deletion
            # Permissions have already ensured that the user is the owner
            self.perform_destroy(instance)
            return Response(
                {"detail": "Machine deleted successfully"}, 
                status=status.HTTP_204_NO_CONTENT
            )
                
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['POST'])
    def copy_template(self, request, pk=None):
        """
        Creates a customizable copy of a template for the user,
        including all associated issues, solutions, and guides
        """
        try:
            original_machine = self.get_object()
            
            if not original_machine.is_template:
                return Response(
                    {"detail": "Only template machines can be copied"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if the original machine is a template
            existing_copy = MachineCopy.objects.filter(
                user=request.user,
                original_template=original_machine
            ).first()

            if existing_copy:
                return Response(
                    {"detail": "You already have a copy of this template",
                    "machine_id": existing_copy.machine.id}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create a new copy of the machine
            new_machine = Machine.objects.create(
                name=original_machine.name,
                model=original_machine.model,
                series=original_machine.series,
                description=original_machine.description,
                category=original_machine.category,
                manufacturer=original_machine.manufacturer,
                department=original_machine.department,
                machine_type=original_machine.machine_type,
                owner=request.user,
                is_template=False
            )

            # Register the new copy in the MachineCopy table
            MachineCopy.objects.create(
                original_template=original_machine,
                user=request.user,
                machine=new_machine
            )

            # Copy images and manual files if they exist
            for managed_file in ManagedFile.objects.filter(
                associated_model='Machine',
                associated_id=original_machine.id
            ):
                save_file(
                    managed_file.file,
                    managed_file.file_type,
                    'Machine',
                    new_machine.id
                )

            # For each issue in the original machine
            for original_issue in original_machine.issues.all():
                # Create a new copy of the issue
                new_issue = Issue.objects.create(
                    machine=new_machine,
                    title=original_issue.title,
                    description=original_issue.description,
                    error_code=original_issue.error_code,
                    keywords=original_issue.keywords,
                    created_by=request.user
                )

                # Copy images for the issue if they exist
                for issue_file in ManagedFile.objects.filter(
                    associated_model='Issue',
                    associated_id=original_issue.id
                ):
                    save_file(
                        issue_file.file,
                        issue_file.file_type,
                        'Issue',
                        new_issue.id
                    )

               
                for original_solution in original_issue.solutions.all():
                    new_solution = Solution.objects.create(
                        issue=new_issue,
                        description=original_solution.description,
                        created_by=request.user
                    )


                    if hasattr(original_solution, 'guide'):
                        original_guide = original_solution.guide
                        new_guide = TroubleshootingGuide.objects.create(
                            solution=new_solution,
                            title=original_guide.title,
                            created_by=request.user
                        )


                        for original_step in original_guide.steps.all():
                            new_step = Step.objects.create(
                                guide=new_guide,
                                step_number=original_step.step_number,
                                description=original_step.description,
                                video_urls=original_step.video_urls
                            )


                            for step_file in ManagedFile.objects.filter(
                                associated_model='Step',
                                associated_id=original_step.id
                            ):
                                save_file(
                                    step_file.file,
                                    step_file.file_type,
                                    'Step',
                                    new_step.id
                                )

            return Response(
                {"detail": "Template copied successfully",
                "machine_id": new_machine.id},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    # Snippet for the file manager
    @action(detail=True, methods=['POST'])
    def upload_image(self, request, pk=None):
        machine = self.get_object()
        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
        
        managed_file = save_file(file, 'IMAGE', 'Machine', machine.id)
        return Response({'message': 'File uploaded successfully', 'file_id': managed_file.id})

    @action(detail=True, methods=['GET'])
    def get_images(self, request, pk=None):
        machine = self.get_object()
        files = get_files('Machine', machine.id)
        serializer = MachineSerializer(machine, context={'request': request})
        return Response(serializer.data['images'])

    @action(detail=True, methods=['DELETE'])
    def delete_image(self, request, pk=None):
        file_id = request.data.get('file_id')
        if not file_id:
            return Response({'error': 'No file_id provided'}, status=400)
        
        success = delete_file(file_id)
        if success:
            return Response({'message': 'File deleted successfully'})
        else:
            return Response({'error': 'File not found'}, status=404)

    # To retrieve info for the dashboards
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        request.user.log_activity(
            'MACHINE_VIEW',
            f"Viewed machine: {instance.name}",
            machine=instance
        )
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        instance = serializer.save(owner=self.request.user)
        self.request.user.log_activity(
            'MACHINE_CREATE',
            f"Created new machine: {instance.name}",
            machine=instance
        )


# The following 4 classes are Filters for the machines classification
class ManufacturerViewSet(viewsets.ModelViewSet):
    queryset = Manufacturer.objects.all()
    serializer_class = ManufacturerSerializer
    permission_classes = [permissions.IsAuthenticated]


class EquipmentCategoryViewSet(viewsets.ModelViewSet):
    queryset = EquipmentCategory.objects.all()
    serializer_class = EquipmentCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class MachineTypeViewSet(viewsets.ModelViewSet):
    queryset = MachineType.objects.all()
    serializer_class = MachineTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


# ViewSet to handle files and operations related to Issue
class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    @action(detail=True, methods=['POST'])
    def upload_image(self, request, pk=None):
        issue = self.get_object()
        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
        
        managed_file = save_file(file, 'IMAGE', 'Issue', issue.id)
        return Response({'message': 'File uploaded successfully', 'file_id': managed_file.id})

    @action(detail=True, methods=['GET'])
    def get_images(self, request, pk=None):
        issue = self.get_object()
        files = get_files('Issue', issue.id)
        serializer = IssueSerializer(issue, context={'request': request})
        return Response(serializer.data['images'])

    @action(detail=True, methods=['DELETE'])
    def delete_image(self, request, pk=None):
        file_id = request.data.get('file_id')
        if not file_id:
            return Response({'error': 'No file_id provided'}, status=400)
        
        issue = self.get_object()
        try:
            file = ManagedFile.objects.get(id=file_id, associated_model='Issue', associated_id=issue.id)
            success = delete_file(file_id)
            if success:
                return Response({'message': 'File deleted successfully'})
            else:
                return Response({'error': 'File deletion failed'}, status=500)
        except ManagedFile.DoesNotExist:
            return Response({'error': 'File not found or not associated with this issue'}, status=404)

    # for the dashboard cards
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        request.user.log_activity(
            'ISSUE_VIEW',
            f"Viewed issue: {instance.title}",
            issue=instance,
            machine=instance.machine
        )
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        self.request.user.log_activity(
            'ISSUE_CREATE',
            f"Created new issue: {instance.title}",
            issue=instance,
            machine=instance.machine
        )


# Class to list all issues - Now works for specific machines
class AllIssuesView(generics.ListAPIView):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# New ViewSet to fix the issue with SolutionEditor - Images do not pass, causing the app to break
class StepViewSet(viewsets.ModelViewSet):
    queryset = Step.objects.all()
    serializer_class = StepSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    @action(detail=True, methods=['GET'])
    def images(self, request, pk=None):
        step = self.get_object()
        files = get_files('Step', step.id)
        return Response([{'id': f.id, 'url': request.build_absolute_uri(f.file.url)} for f in files])

    @action(detail=True, methods=['POST'])
    def upload_image(self, request, pk=None):
        step = self.get_object()
        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
        
        managed_file = save_file(file, 'IMAGE', 'Step', step.id)
        return Response({'message': 'File uploaded successfully', 'file_id': managed_file.id})


    @action(detail=True, methods=['DELETE'])
    def delete_image(self, request, pk=None):
        step = self.get_object()
        file_name = request.data.get('file_name')
        
        if not file_name:
            return Response({'error': 'No file_name provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            image = ManagedFile.objects.get(
                file__endswith=file_name,
                associated_model='Step',
                associated_id=step.id
            )
            image.delete()
            return Response({'message': 'Image deleted successfully'}, status=status.HTTP_200_OK)
        except ManagedFile.DoesNotExist:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)


# Important - Match_issues function -TroubleshootDetail.js
# This fuction is essential to filter out user consults by keywords (Verified)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_issues(request):
    description = request.data.get('description', '')
    machine_id = request.data.get('machine_id')
    
    keywords = description.lower().split()
    
    query = Q()
    for keyword in keywords:
        query |= Q(keywords__icontains=keyword) | Q(title__icontains=keyword) | Q(description__icontains=keyword)
    
    matching_issues = Issue.objects.filter(machine_id=machine_id).filter(query).distinct()
    
    # Added request to prevent issues
    serializer = IssueSerializer(matching_issues, many=True, context={'request': request})
    
    return Response({
        "message": "Troubleshoot request received",
        "matching_issues": serializer.data
    })


# Necessary to fetch and create machine issues
# Used in TroubleshootDetails.js; without this, the page won't load (Verified)

# Modified this snippet because adding the file manager for issue images caused issues
# The request was not passing correctly.

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def machine_issues(request, machine_id):
    try:
        machine = Machine.objects.get(id=machine_id)
    except Machine.DoesNotExist:
        return Response({"error": "Machine not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        issues = Issue.objects.filter(machine=machine)
        serializer = IssueSerializer(issues, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = IssueSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(machine=machine, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Important for edit issue
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_issue(request, machine_id):
    print(f"Received request to create issue for machine {machine_id}")
    print(f"Request data: {request.data}")
    try:
        machine = Machine.objects.get(id=machine_id)
        serializer = IssueSerializer(data=request.data)
        if serializer.is_valid():
            issue = serializer.save(machine=machine, created_by=request.user)
            return Response(IssueSerializer(issue).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Machine.DoesNotExist:
        return Response({"error": "Machine not found"}, status=status.HTTP_404_NOT_FOUND)


# Necessary for IssuePage.js to retrieve info of Description & Possible Solution
@api_view(['GET', 'PUT', 'DELETE'])
def issue_detail(request, issue_id):
    try:
        issue = Issue.objects.get(pk=issue_id)
    except Issue.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = IssueSerializer(issue)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = IssueSerializer(issue, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Necessary to retrieve and update Solution info on IssuePage.js - used for the step guide (Verified)
# Centralized this function to handle GET, POST, and PUT in one snippet
# If the machine issue has a StepGuide, this allows the program to retrieve the information

# Check this in more detail for the issue where adding StepGuides to a solution doesn't work.
@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def solution_operations(request, issue_id=None, solution_id=None):
    if request.method == 'GET':
        try:
            issue = Issue.objects.get(pk=issue_id)
            solutions = Solution.objects.filter(issue=issue)
            serializer = SolutionSerializer(solutions, many=True)
            return Response(serializer.data)
        except Issue.DoesNotExist:
            return Response({"error": "Issue not found"}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'POST':
        try:
            issue = Issue.objects.get(pk=issue_id)
            serializer = SolutionSerializer(
                data=request.data,
                context={
                    'request': request,
                    'issue_id': issue_id
                }
            )
            
            if serializer.is_valid():
                solution = serializer.save()
                return Response(
                    SolutionSerializer(solution).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Issue.DoesNotExist:
            return Response(
                {"error": "Issue not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    elif request.method == 'PUT':
        try:
            solution = Solution.objects.get(pk=solution_id)
            print(f"Received data for solution update: {request.data}")  # For debugging
            print(f"Guide data: {request.data.get('guide')}")  # For debugging
            print(f"Steps data: {request.data.get('guide', {}).get('steps')}")  # For debugging

            serializer = SolutionSerializer(solution, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                updated_solution = serializer.save()
                print(f"Updated solution: {updated_solution}")
                
                # Only try to print info if the guide exist
                try:
                    if hasattr(updated_solution, 'guide') and updated_solution.guide:
                        print(f"Updated guide: {updated_solution.guide}")
                        print(f"Updated steps: {updated_solution.guide.steps.all()}")
                except Exception as e:
                    print(f"No guide information available: {str(e)}")
                
                return Response(SolutionSerializer(updated_solution).data)
                
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Solution.DoesNotExist:
            return Response({"error": "Solution not found"}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'DELETE':
        try:
            solution = Solution.objects.get(pk=solution_id)
            
            # Safely delete guide if it exists
            try:
                guide = getattr(solution, 'guide', None)
                if guide and guide.id:
                    guide.delete()
            except Exception as e:
                print(f"Warning: Error deleting guide: {e}")
                # Continue with solution deletion even if guide deletion fails
            
            # Delete the solution
            solution.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Solution.DoesNotExist:
            return Response(
                {"error": "Solution not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to delete solution: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_guide(request, solution_id):
    try:
        solution = Solution.objects.get(id=solution_id)
    except Solution.DoesNotExist:
        return Response({"error": "Solution not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = TroubleshootingGuideSerializer(data=request.data)
    if serializer.is_valid():
        guide = serializer.save(solution=solution, created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Custom to upload images
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def upload_step_image(request, step_id):
    try:
        step = Step.objects.get(id=step_id)
        
        if 'image' not in request.FILES:
            return Response({"error": "No image file provided"}, status=status.HTTP_400_BAD_REQUEST)
            
        print("Files received:", request.FILES)  # Debug
        image = request.FILES['image']
        managed_file = save_file(image, 'IMAGE', 'Step', step_id)
        
        # Build absolute URLs
        full_url = request.build_absolute_uri(managed_file.file.url)
        print(f"Generated URL: {full_url}")  # Debug
        
        response_data = {
            "message": "File uploaded successfully",
            "file_id": managed_file.id,
            "url": full_url
        }
        print("Response data:", response_data)  # Debug
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Step.DoesNotExist:
        return Response({"error": "Step not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print("Error in upload_step_image:", str(e))  # Debug
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# for debug
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_step_images(request, step_id):
    try:
        step = Step.objects.get(id=step_id)
        files = get_files('Step', step_id)
        data = [{
            'id': f.id,
            'url': request.build_absolute_uri(f.file.url)
        } for f in files]
        print(f"Returning images for step {step_id}:", data)
        return Response(data)
    except Step.DoesNotExist:
        return Response({'error': 'Step not found'}, status=404)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])  # Importante: añadir estos decoradores
@permission_classes([IsAuthenticated])
def upload_machine_manual(request, machine_id):
    try:
        machine = Machine.objects.get(id=machine_id)
        manual_file = request.FILES.get('manual')
        
        if not manual_file:
            return Response({'error': 'No manual file provided'}, status=400)
        
        if not manual_file.name.endswith('.pdf'):
            return Response({'error': 'File must be a PDF'}, status=400)
        
        # Delete existing manual if present
        existing_manual = ManagedFile.objects.filter(
            associated_model='Machine',
            associated_id=machine_id,
            file_type='MANUAL'
        ).first()
        
        if existing_manual:
            existing_manual.delete()
        
        # Save new manual
        managed_file = save_file(manual_file, 'MANUAL', 'Machine', machine_id)
        return Response({
            'message': 'Manual uploaded successfully',
            'file_id': managed_file.id,
            'url': request.build_absolute_uri(managed_file.file.url)
            #'url': managed_file.file.url
        })
    except Machine.DoesNotExist:
        return Response({'error': 'Machine not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_machine_manual(request, machine_id):
    try:
        machine = Machine.objects.get(id=machine_id)
        manual = ManagedFile.objects.filter(
            associated_model='Machine',
            associated_id=machine_id,
            file_type='MANUAL'
        ).first()
        
        if not manual:
            return Response({'error': 'No manual found'}, status=404)

        # Open file and retreive it as FileResponse
        response = FileResponse(
            open(manual.file.path, 'rb'),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'inline; filename="{manual.file.name}"'
        return response
        
    except Machine.DoesNotExist:
        return Response({'error': 'Machine not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_machine_manual(request, machine_id):
    try:
        machine = Machine.objects.get(id=machine_id)
        manual = ManagedFile.objects.filter(
            associated_model='Machine',
            associated_id=machine_id,
            file_type='MANUAL'
        ).first()
        
        if not manual:
            return Response({'error': 'No manual found'}, status=404)
        
        manual.delete()
        return Response({'message': 'Manual deleted successfully'})
    except Machine.DoesNotExist:
        return Response({'error': 'Machine not found'}, status=404)
    
# Trainig module now called Workspaces
class TrainingWorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = TrainingWorkspaceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TrainingWorkspace.objects.filter(
            Q(created_by=self.request.user) | 
            Q(is_public=True)
        )
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # Testing it 
    def destroy(self, request, *args, **kwargs):
        workspace = self.get_object()
        
        # Check that the user has permission to delete
        if workspace.created_by != request.user:
            return Response(
                {"error": "You don't have permission to delete this workspace"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        try:
            workspace.delete()
            return Response(
                {"message": "Workspace deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['POST'], parser_classes=[MultiPartParser, FormParser])
    def upload_document(self, request, pk=None):
        workspace = self.get_object()
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response(
                {'error': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not file_obj.name.endswith('.pdf'):
            return Response(
                {'error': 'Only PDF files are allowed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        document = TrainingDocument.objects.create(
            workspace=workspace,
            title=request.data.get('title', file_obj.name),
            description=request.data.get('description', ''),
            file=file_obj,
            uploaded_by=request.user
        )
        
        return Response(
            TrainingDocumentSerializer(document).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['DELETE'], url_path='documents/(?P<document_id>[^/.]+)')
    def delete_document(self, request, pk=None, document_id=None):
        workspace = self.get_object()
        try:
            document = TrainingDocument.objects.get(
                workspace=workspace,
                id=document_id
            )
            
            # Check that the user has permission to delete
            if document.uploaded_by != request.user and workspace.created_by != request.user:
                return Response(
                    {"error": "Permission denied"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Delete the document and its associated file
            document.file.delete(save=False)  # Deletes the physical file
            document.delete()  # Deletes the database record
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except TrainingDocument.DoesNotExist:
            return Response(
                {"error": "Document not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
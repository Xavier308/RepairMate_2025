# repairmate_backend/api/views/machine_views.py

import logging
import os
from django.db.models import Q
from django.http import FileResponse
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from ..models import (
    Machine, Manufacturer, EquipmentCategory, Department, MachineType,
    HiddenTemplate, MachineCopy, Solution, Issue, Step, TroubleshootingGuide
)
from ..serializers import (
    MachineSerializer, ManufacturerSerializer, EquipmentCategorySerializer,
    DepartmentSerializer, MachineTypeSerializer
)
from ..permissions import IsMachineOwnerOrTemplate
from file_manager.services import save_file, get_files, delete_file
from file_manager.models import ManagedFile

logger = logging.getLogger(__name__)

class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer
    permission_classes = [permissions.IsAuthenticated, IsMachineOwnerOrTemplate]

    def retrieve(self, request, *args, **kwargs):
        self.queryset = Machine.objects.select_related(
            'category', 'manufacturer', 'department', 'machine_type'
        ).prefetch_related(
            'issues', 
            'issues__solutions',
            'issues__solutions__guide',
            'issues__solutions__guide__steps'
        )
        # Call the standard retrieve method
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        # Log the activity
        request.user.log_activity(
            'MACHINE_VIEW',
            f"Viewed machine: {instance.name}",
            machine=instance
        )
        return Response(serializer.data)

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
        self.request.user.log_activity(
            'MACHINE_CREATE',
            f"Created new machine: {instance.name}",
            machine=instance
        )
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
        queryset = self.get_queryset().select_related(
            'category', 'manufacturer', 'department', 'machine_type'
        )
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

# Departments
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

# Newest snippet to try to improve performance
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsMachineOwnerOrTemplate])
def optimized_machine_detail(request, machine_id):
    """
    Optimized endpoint to retrieve machine details with related data preloaded.
    Uses select_related and prefetch_related to reduce database queries.
    """
    try:
        # Use select_related for ForeignKey relationships
        # and prefetch_related for reverse relationships
        machine = Machine.objects.select_related(
            'category', 'manufacturer', 'department', 'machine_type'
        ).prefetch_related(
            'issues',
            'issues__solutions',
            'issues__solutions__guide',
            'issues__solutions__guide__steps'
        ).get(id=machine_id)
        
        # Check permissions
        permission_check = IsMachineOwnerOrTemplate()
        if not permission_check.has_object_permission(request, None, machine):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        # Log the activity
        request.user.log_activity(
            'MACHINE_VIEW',
            f"Viewed machine: {machine.name}",
            machine=machine
        )
        
        # Serialize and return the machine data
        serializer = MachineSerializer(machine, context={'request': request})
        return Response(serializer.data)
    except Machine.DoesNotExist:
        return Response({"error": "Machine not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
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

        # Open file and retrieve it as FileResponse
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

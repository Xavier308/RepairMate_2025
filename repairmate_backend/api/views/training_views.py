# repairmate_backend/api/views/training_views.py

from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from ..models import TrainingWorkspace, TrainingDocument
from ..serializers import TrainingWorkspaceSerializer, TrainingDocumentSerializer

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

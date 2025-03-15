# repairmate_backend/api/views/issue_views.py

from django.db.models import Q
from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from ..models import Issue, Machine
from ..serializers import IssueSerializer
from file_manager.services import save_file, get_files, delete_file
from file_manager.models import ManagedFile

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

class AllIssuesView(generics.ListAPIView):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_issue(request, machine_id):
    try:
        machine = Machine.objects.get(id=machine_id)
        serializer = IssueSerializer(data=request.data)
        if serializer.is_valid():
            issue = serializer.save(machine=machine, created_by=request.user)
            return Response(IssueSerializer(issue).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Machine.DoesNotExist:
        return Response({"error": "Machine not found"}, status=status.HTTP_404_NOT_FOUND)

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
 
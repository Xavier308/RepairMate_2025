# repairmate_backend/api/views/solution_views.py

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from ..models import Solution, Issue, Step, TroubleshootingGuide
from ..serializers import SolutionSerializer, TroubleshootingGuideSerializer, StepSerializer
from file_manager.services import save_file, get_files, delete_file
from file_manager.models import ManagedFile

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
            serializer = SolutionSerializer(solution, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                updated_solution = serializer.save()
                
                return Response(SolutionSerializer(updated_solution).data)
                
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
                # Continue with solution deletion even if guide deletion fails
                pass
            
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

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def upload_step_image(request, step_id):
    try:
        step = Step.objects.get(id=step_id)
        
        if 'image' not in request.FILES:
            return Response({"error": "No image file provided"}, status=status.HTTP_400_BAD_REQUEST)
            
        image = request.FILES['image']
        managed_file = save_file(image, 'IMAGE', 'Step', step_id)
        
        # Build absolute URLs
        full_url = request.build_absolute_uri(managed_file.file.url)
        
        response_data = {
            "message": "File uploaded successfully",
            "file_id": managed_file.id,
            "url": full_url
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Step.DoesNotExist:
        return Response({"error": "Step not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        return Response(data)
    except Step.DoesNotExist:
        return Response({'error': 'Step not found'}, status=404)

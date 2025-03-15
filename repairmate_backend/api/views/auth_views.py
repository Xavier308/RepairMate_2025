# repairmate_backend/api/views/auth_views.py

import logging
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.conf import settings
from ..utils.email_utils import send_welcome_email
from ..serializers import UserSerializer

logger = logging.getLogger(__name__)

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

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        try:            
            user = serializer.save()  # Save the user
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

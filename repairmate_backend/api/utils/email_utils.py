# api/utils/email_utils.py
import requests
import logging
from django.conf import settings
from decouple import config

logger = logging.getLogger(__name__)

def send_welcome_email(user_email, username):
    """
    Send a welcome email to newly registered users.
    """
    try:
        # Obtener API key directamente de .env como respaldo
        api_key = settings.EMAILIT_API_KEY or config('EMAILIT_API_KEY', default='')
        
        if not api_key:
            logger.error("API key not found")
            return None

        url = 'https://api.emailit.com/v1/emails'
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        html_body = f"""
        <html>
            <body>
                <h1>Welcome to RepairMate!</h1>
                <p>Hello {username},</p>
                <p>Thank you for registering with RepairMate. We're excited to have you on board!</p>
                <p>You can now:</p>
                <ul>
                    <li>Add your machines</li>
                    <li>Create troubleshooting guides</li>
                    <li>Access our comprehensive training materials</li>
                </ul>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Best regards,<br>The RepairMate Team</p>
            </body>
        </html>
        """
        
        data = {
            'from': settings.EMAILIT_FROM_EMAIL,
            'to': user_email,
            'subject': 'Welcome to RepairMate!',
            'html': html_body
        }

        # Get API key directly from .env as a fallback
        logger.debug(f"Sending email to {user_email}")
        logger.debug(f"Using API key: {api_key[:8]}...")
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 401:
            logger.error(f"Authentication failed. Status code: {response.status_code}")
            logger.error(f"Response: {response.text}")
            return None
            
        response.raise_for_status()
        
        logger.info(f"Welcome email sent successfully to {user_email}")
        return response.json()
        
    except Exception as e:
        logger.exception(f"Error sending welcome email to {user_email}: {str(e)}")
        return None
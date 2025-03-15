# repairmate_backend/api/views/file_views.py

import os
import mimetypes
from django.http import FileResponse
from django.conf import settings

def serve_image(request, image_name):
    """
    Serves an image file from the file system with proper content type detection.
    """
    image_path = os.path.join(settings.MEDIA_ROOT, 'managed_files', image_name)
    # Detect content type based on file extension
    content_type, _ = mimetypes.guess_type(image_path)
    if not content_type:
        content_type = 'application/octet-stream'
    return FileResponse(open(image_path, 'rb'), content_type=content_type)

# management/commands/migrate_to_s3.py
# python3 manage.py migrate_to_s3

from django.core.management.base import BaseCommand
from django.conf import settings
import boto3
import os
from pathlib import Path

class Command(BaseCommand):
    help = 'Migrate existing media files to S3'

    def handle(self, *args, **options):
        # Initialize S3 client
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )
        
        media_root = Path(settings.MEDIA_ROOT)
        
        # Process files in chunks to avoid memory issues
        for file_path in media_root.rglob('*.*'):
            if file_path.is_file():
                relative_path = str(file_path.relative_to(media_root))
                s3_key = f'media/{relative_path}'
                
                try:
                    s3_client.upload_file(
                        str(file_path),
                        settings.AWS_STORAGE_BUCKET_NAME,
                        s3_key
                    )
                    self.stdout.write(f'Migrated {relative_path}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error migrating {relative_path}: {e}'))
                    
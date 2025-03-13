# file_manager/models.py
from django.db import models
import os

class ManagedFile(models.Model):
    # This model manages files uploaded to the Django application. It handles file storage and relationships to other models.
    file = models.FileField(
        upload_to='managed_files/',  # Specifies the directory where files are stored.
        max_length=255  # Defines the maximum length of the file path.
    )
    file_type = models.CharField(max_length=50)
    associated_model = models.CharField(max_length=255)
    associated_id = models.IntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Returns a string representation combining the associated model, ID, and file name.
        return f"{self.associated_model}_{self.associated_id}_{self.file.name}"

    def get_absolute_url(self):
        # Provides the URL to access the file directly.
        return self.file.url

    def delete(self, *args, **kwargs):
        # Custom delete method to remove the file from the filesystem upon deletion of the model instance.
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super(ManagedFile, self).delete(*args, **kwargs)

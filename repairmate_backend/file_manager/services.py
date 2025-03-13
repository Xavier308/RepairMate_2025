# file_manager/services.py
from .models import ManagedFile
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)

def save_file(file, file_type, associated_model, associated_id):
    # Logs the operation of saving a file.
    print(f"Saving file: {file.name} for {associated_model} {associated_id}")  # Debug
    
    # Creates a new ManagedFile instance.
    managed_file = ManagedFile(
        file_type=file_type,
        associated_model=associated_model,
        associated_id=associated_id
    )

    # Constructs a file name that reflects its association.
    file_name = f"{associated_model}_{associated_id}_{file.name}"
    # Saves the file to the designated storage and obtains the path.
    file_path = default_storage.save(f'managed_files/{file_name}', ContentFile(file.read()))
    
    # Assigns the stored file path to the managed file object and saves it to the database.
    managed_file.file.name = file_path
    managed_file.save()
    
    # Logs details about the saved file.
    print(f"File saved as: {file_path}")  # Debug
    print(f"File URL: {managed_file.file.url}")  # Debug
    
    return managed_file


def get_files(associated_model, associated_id):
    # Logs retrieval of files associated with a specific model and ID.
    print(f"\n--- get_files() called for {associated_model} with ID {associated_id} ---")
    
    # Fetches files matching the provided model and ID.
    files = ManagedFile.objects.filter(associated_model=associated_model, associated_id=associated_id)
    
    print(f"Number of files found: {files.count()}")
    
    for file in files:
        print(f"File ID: {file.id}")
        print(f"File name: {file.file.name}")
        print(f"File URL: {file.file.url}")
        print(f"File path: {file.file.path}")
        print(f"File type: {file.file_type}")
        print(f"Upload date: {file.uploaded_at}")
        print("---")
    
    # Logs if no files were found.
    if not files:
        print("No files found for this machine.")
    
    print("--- End of get_files() ---\n")
    
    return files

def delete_file(file_id, file_type=None):
    try:
        # Si se especifica file_type, solo borra archivos de ese tipo
        query = {'id': file_id}
        if file_type:
            query['file_type'] = file_type

        file = ManagedFile.objects.get(**query)
        file.delete()
        return True
    except ManagedFile.DoesNotExist:
        return False
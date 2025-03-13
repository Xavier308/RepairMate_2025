# repairmate_backend/api/models.py

import os
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import JSONField
from django.contrib.postgres.fields import ArrayField
from django.conf import settings
from file_manager.models import ManagedFile
from django.core.exceptions import ValidationError # New
from django.utils import timezone
import pytz

# Defines the different subscription plans that a user or organization can have
class SubscriptionPlan(models.Model):
    """Defines the different subscription plans available"""
    PLAN_TYPES = [
        ('FREE', 'Free Plan'),
        ('PRO', 'Professional Plan'),
        ('ENTERPRISE', 'Enterprise Plan')
    ]

    name = models.CharField(max_length=50, choices=PLAN_TYPES, unique=True)
    max_machines = models.IntegerField()  # Max number of machines allowed for the plan
    max_team_members = models.IntegerField()  # Max number of team members allowed
    features = models.JSONField()  # Plan-specific features stored in JSON
    
    def __str__(self):
        return self.name

# Represents an enterprise organization with a subscription plan
class Organization(models.Model):
    """Represents an enterprise organization"""
    name = models.CharField(max_length=100)
    subscription_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    admin_email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

# Custom user model extending Django's AbstractUser
class CustomUser(AbstractUser):
    # Define user roles and account types
    ROLE_CHOICES = [
        ('TECHNICIAN', 'Technician'),
        ('MECHANIC', 'Mechanic'),
        ('HOBBYIST', 'Hobbyist'),
        ('SUPERVISOR', 'Supervisor'),
        ('ADMINISTRATOR', 'Administrator'),
        ('REGULAR', 'Regular'),
    ]

    ACCOUNT_TYPES = [
        ('FREE', 'Free User'),
        ('PRO', 'Pro User'),
        ('PRO_MEMBER', 'Pro Team Member'),  # Created by Pro users
        ('ENTERPRISE_ADMIN', 'Enterprise Admin'),
        ('ENTERPRISE_MEMBER', 'Enterprise Team Member'),  # Created by Enterprise admins
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='REGULAR')
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='FREE')
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    subscription_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True)
    team_members_count = models.IntegerField(default=0)

    # Validates the model before saving
    def clean(self):
        if self.account_type in ['PRO_MEMBER', 'ENTERPRISE_MEMBER'] and not self.created_by:
            raise ValidationError('Team members must have a creating user')
        
        if self.account_type == 'ENTERPRISE_ADMIN' and not self.organization:
            raise ValidationError('Enterprise admin must be associated with an organization')

    def save(self, *args, **kwargs):
        # Call the clean method to validate the object before saving
        self.clean()
        super().save(*args, **kwargs)

    # Checks if the user can create additional team members based on their plan
    def can_create_team_member(self):
        if self.account_type == 'PRO':
            max_members = self.subscription_plan.max_team_members
            return self.team_members_count < max_members
        elif self.account_type == 'ENTERPRISE_ADMIN':
            max_members = self.organization.subscription_plan.max_team_members
            return self.team_members_count < max_members
        return False
    # Creates a new team member for Pro or Enterprise accounts
    def create_team_member(self, username, email, password, **extra_fields):
        if not self.can_create_team_member():
            raise ValidationError('Maximum team members limit reached')

        account_type = 'PRO_MEMBER' if self.account_type == 'PRO' else 'ENTERPRISE_MEMBER'
        
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            account_type=account_type,
            created_by=self,
            organization=self.organization,
            **extra_fields
        )
        
        self.team_members_count += 1
        self.save()
        
        return user

    def __str__(self):
        return self.username

    class Meta:
        permissions = [
            ("can_create_team_members", "Can create team members"),
            ("can_manage_organization", "Can manage organization settings"),
        ]
    
    # Logs user activity with a helper method
    def log_activity(self, activity_type, description, machine=None, issue=None):
        """Helper method to log user activity"""
        return UserActivityLog.objects.create(
            user=self,
            activity_type=activity_type,
            description=description,
            machine=machine,
            issue=issue
        )

# Stores user preferences like notification settings and language
class UserPreferences(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='preferences')
    email_notifications = models.BooleanField(default=True)
    language = models.CharField(
        max_length=5,
        choices=[
            ('en', 'English'),
            ('es', 'Español'),
            ('fr', 'Français')
        ],
        default='en'
    )
    timezone = models.CharField(
        max_length=50,
        default='America/Puerto_Rico',
        choices=[(tz, tz) for tz in pytz.common_timezones]
    )
    dark_mode = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.username}"

    # Returns the timezone object for the user
    def get_timezone(self):
        return pytz.timezone(self.timezone)

# Logs user activities like viewing or creating issues
class UserActivityLog(models.Model):
    ACTIVITY_TYPES = [
        ('ISSUE_VIEW', 'Viewed Issue'),
        ('ISSUE_CREATE', 'Created Issue'),
        ('ISSUE_UPDATE', 'Updated Issue'),
        ('MACHINE_VIEW', 'Viewed Machine'),
        ('MACHINE_CREATE', 'Created Machine'),
        ('MACHINE_UPDATE', 'Updated Machine'),
        ('SOLUTION_CREATE', 'Created Solution'),
        ('SOLUTION_UPDATE', 'Updated Solution'),
        ('GUIDE_CREATE', 'Created Guide'),
        ('GUIDE_UPDATE', 'Updated Guide'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='activity_logs')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    machine = models.ForeignKey('Machine', on_delete=models.SET_NULL, null=True, blank=True)
    issue = models.ForeignKey('Issue', on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.activity_type} - {self.created_at}"

# Stores notes with optional reminders for a user
class UserNote(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High')
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=200)
    content = models.TextField()
    priority = models.CharField(max_length=6, choices=PRIORITY_CHOICES, default='MEDIUM')
    is_reminder = models.BooleanField(default=False)
    reminder_date = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    machine = models.ForeignKey('Machine', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Validates that reminder_date is in the future
    def clean(self):
        if self.is_reminder and self.reminder_date and (
            not self.pk or  # es un nuevo objeto
            UserNote.objects.filter(pk=self.pk).values('reminder_date').first()['reminder_date'] != self.reminder_date
        ):
            current_time = timezone.now()
            if self.reminder_date <= current_time:
                raise ValidationError({
                    'reminder_date': 'Reminder date must be in the future'
                })

    def save(self, *args, **kwargs):
        if not kwargs.pop('skip_validation', False):
            self.clean()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.username}"

    # Returns the reminder date in the user's timezone
    def get_reminder_date_user_timezone(self):
        if self.reminder_date:
            user_tz = self.user.preferences.get_timezone()
            return self.reminder_date.astimezone(user_tz)
        return None

# Represents the manufacturer of a machine
class Manufacturer(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

# Defines a category of equipment, like 'Hydraulic Press'
class EquipmentCategory(models.Model):
    category_name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.category_name

# Represents a department within an organization, like 'Production'
class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

# Specifies the type of a machine, like 'Heavy Machinery'
class MachineType(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

# Check this snippet. I think we don't need it anymore**

# Model for users to hide machines, but this may be removable
class HiddenTemplate(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    machine = models.ForeignKey('Machine', on_delete=models.CASCADE)
    hidden_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'machine')

# Model to create copies of machine templates for customization
class MachineCopy(models.Model):
    """
    Represents a customized copy of a machine template
    """
    original_template = models.ForeignKey('Machine', on_delete=models.SET_NULL, null=True, related_name='copies')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    machine = models.ForeignKey('Machine', on_delete=models.CASCADE, related_name='custom_version')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'original_template')
        db_table = 'machine_copies'
        verbose_name = 'Machine Copy'
        verbose_name_plural = 'Machine Copies'

    def __str__(self):
        return f"Copy of {self.original_template.name} for {self.user.username}"


# Represents a machine, including its details and owner
class Machine(models.Model):
    name = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    series = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(EquipmentCategory, on_delete=models.SET_NULL, null=True, blank=True)
    manufacturer = models.ForeignKey(Manufacturer, on_delete=models.SET_NULL, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    machine_type = models.ForeignKey(MachineType, on_delete=models.SET_NULL, null=True, blank=True)

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='machines')
    is_public = models.BooleanField(default=False)
    is_template = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.name} - {self.model}"

    # Returns the image URL for the machine
    def get_image_url(self):
        image = ManagedFile.objects.filter(associated_model='Machine', associated_id=self.id, file_type='IMAGE').first()
        return image.file.url if image else 'https://img.perceptpixel.com/bibawdef/RepairMate/default_machine.png'

    @property
    def images(self):
        return ManagedFile.objects.filter(associated_model='Machine', associated_id=self.id, file_type='IMAGE')
    
    # Returns the URL for the machine's manual
    def get_manual_url(self):
        manual = ManagedFile.objects.filter(
            associated_model='Machine',
            associated_id=self.id,
            file_type='MANUAL'
        ).first()
        return manual.file.url if manual else None

    @property
    def manual(self):
        return ManagedFile.objects.filter(
            associated_model='Machine',
            associated_id=self.id,
            file_type='MANUAL'
        ).first()


# Represents an issue associated with a machine, including description and error code
class Issue(models.Model):
    machine = models.ForeignKey('Machine', on_delete=models.CASCADE, related_name='issues')
    title = models.CharField(max_length=200)
    description = models.TextField()
    error_code = models.CharField(max_length=50, blank=True, null=True)
    keywords = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.machine.name} - {self.title}"

    # Returns the image URL associated with the issue
    def get_image_url(self):
        image = ManagedFile.objects.filter(associated_model='Issue', associated_id=self.id, file_type='IMAGE').first()
        return image.file.url if image else None

    @property
    def images(self):
        return ManagedFile.objects.filter(associated_model='Issue', associated_id=self.id, file_type='IMAGE')


# Represents a solution for a specific issue
class Solution(models.Model):
    issue = models.ForeignKey(Issue, related_name='solutions', on_delete=models.CASCADE)
    description = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Solution for {self.issue.title}"

    # New
    def delete(self, *args, **kwargs):
        # Safely delete associated guide if it exists and has a valid ID
        try:
            if hasattr(self, 'guide') and self.guide and self.guide.id:
                self.guide.delete()
        except Exception as e:
            print(f"Error deleting guide: {e}")
            # Continue with solution deletion even if guide deletion fails
        
        super().delete(*args, **kwargs)

# Represents a troubleshooting guide linked to a solution
class TroubleshootingGuide(models.Model):
    solution = models.OneToOneField(Solution, on_delete=models.CASCADE, related_name='guide')
    title = models.CharField(max_length=200, default='Default Guide Title') # Check this, it was used for migration purposes
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Guide for {self.solution.issue.title} - {self.title}"

# Represents a step in a troubleshooting guide
class Step(models.Model):
    guide = models.ForeignKey(TroubleshootingGuide, related_name='steps', on_delete=models.CASCADE)
    step_number = models.PositiveIntegerField()
    description = models.TextField()
    video_urls = ArrayField(models.URLField(), blank=True, default=list)

    class Meta:
        ordering = ['step_number']

    def __str__(self):
        return f"Step {self.step_number} for {self.guide.title}"

    # Returns a list of image URLs associated with the step
    def get_image_urls(self):
        images = ManagedFile.objects.filter(associated_model='Step', associated_id=self.id, file_type='IMAGE')
        return [image.file.url for image in images]

    @property
    def images(self):
        return ManagedFile.objects.filter(associated_model='Step', associated_id=self.id, file_type='IMAGE')


# Represents a training workspace where users can upload and manage documents
class TrainingWorkspace(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_public = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    # Deletes all associated documents and their physical files before deleting the workspace
    def delete(self, *args, **kwargs):
        for document in self.documents.all():
            if document.file:
                if os.path.isfile(document.file.path):
                    os.remove(document.file.path)
        super().delete(*args, **kwargs)

# Represents a document uploaded to a training workspace
class TrainingDocument(models.Model):
    workspace = models.ForeignKey(TrainingWorkspace, related_name='documents', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='training_documents/')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

    # Deletes the physical file before deleting the document record    
    def delete(self, *args, **kwargs):
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)
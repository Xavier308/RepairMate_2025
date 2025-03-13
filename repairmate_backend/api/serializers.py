# repairmate_backend/api/serializers.py

import logging
from rest_framework import serializers
from django.utils import timezone
from .models import (
    Machine, TroubleshootingGuide, Manufacturer, EquipmentCategory,Department,
    MachineType, Issue, Solution, CustomUser, Step, SubscriptionPlan, Organization,
    UserPreferences, UserActivityLog, UserNote, TrainingWorkspace, TrainingDocument,
    MachineCopy
)
from file_manager.services import get_files
from file_manager.models import ManagedFile

logger = logging.getLogger(__name__)

# Serializer for SubscriptionPlan model
class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'max_machines', 'max_team_members', 'features']

# Serializer for Organization model, including subscription plan details
class OrganizationSerializer(serializers.ModelSerializer):
    subscription_plan_details = SubscriptionPlanSerializer(source='subscription_plan', read_only=True)
    
    class Meta:
        model = Organization
        fields = ['id', 'name', 'subscription_plan', 'subscription_plan_details', 
                 'admin_email', 'created_at']
        read_only_fields = ['created_at']

# Serializer for CustomUser model, with password validation and additional details
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    organization_details = OrganizationSerializer(source='organization', read_only=True)
    subscription_plan_details = SubscriptionPlanSerializer(source='subscription_plan', read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'password', 'confirm_password',
            'role', 'account_type', 'organization', 'organization_details',
            'subscription_plan', 'subscription_plan_details', 'team_members_count'
        ]
        read_only_fields = ['team_members_count']
        extra_kwargs = {
            'username': {'error_messages': {'required': 'Username is required'}},
            'email': {'error_messages': {'required': 'Email is required'}},
            'password': {'error_messages': {'required': 'Password is required'}}
        }

    # Validate passwords match and are of sufficient length
    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"password": "Passwords do not match"})
        
        if len(data.get('password', '')) < 8:
            raise serializers.ValidationError(
                {"password": "Password must be at least 8 characters long"}
            )
        
        data.pop('confirm_password', None)
        return data

    # Custom create method to handle user creation with additional fields
    def create(self, validated_data):
        account_type = validated_data.pop('account_type', 'FREE')
        subscription_plan = validated_data.pop('subscription_plan', None)
        organization = validated_data.pop('organization', None)
        role = validated_data.pop('role', 'REGULAR')
        
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            account_type=account_type,
            subscription_plan=subscription_plan,
            organization=organization,
            role=role
        )
        return user


# Serializer for creating and handling team members
class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'account_type', 'created_at']
        read_only_fields = ['account_type', 'created_at']

    # Custom create method to enforce team member limits
    def create(self, validated_data):
        creating_user = self.context['request'].user
        
        if not creating_user.can_create_team_member():
            raise serializers.ValidationError(
                "You have reached the maximum number of team members for your plan."
            )
        
        return creating_user.create_team_member(**validated_data)
    
# Serializer for user profile, including restrictions for certain user types
class UserProfileSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(required=False, allow_blank=True)
    subscription_plan_details = SubscriptionPlanSerializer(source='subscription_plan', read_only=True)
    organization_details = OrganizationSerializer(source='organization', read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'name', 'first_name', 'last_name', 
            'name', 'role', 'account_type', 'organization', 'organization_details',
            'subscription_plan', 'subscription_plan_details', 'team_members_count'
        ]
        
        read_only_fields = ['account_type', 'organization', 'team_members_count']


    # Initialize method to make fields read-only for certain user types
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context['request'].user if 'request' in self.context else None
        
        if user and user.account_type in ['PRO_MEMBER', 'ENTERPRISE_MEMBER']:
            self.fields['role'].read_only = True
            self.fields['email'].read_only = True
            self.fields['first_name'].read_only = True
            self.fields['last_name'].read_only = True

    # Custom validation to restrict role and email updates for specific user types
    def validate(self, data):
        user = self.context['request'].user
        
        if 'role' in data and user.account_type in ['PRO_MEMBER', 'ENTERPRISE_MEMBER']:
            raise serializers.ValidationError({
                'role': 'Team members cannot change their role.'
            })
            
        if 'email' in data and user.account_type in ['PRO_MEMBER', 'ENTERPRISE_MEMBER']:
            raise serializers.ValidationError({
                'email': 'Team members cannot change their email.'
            })

        return data

    # Method to get the full name of the user
    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    # Custom update method to handle user profile updates
    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.role = validated_data.get('role', instance.role)
        instance.save()
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        print('Serialized user data:', representation) # Debug
        return representation

# Serializer for user preferences
class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = ['id', 'email_notifications', 'language', 'timezone', 'dark_mode', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

# Serializer for logging user activity
class UserActivityLogSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source='machine.name', read_only=True)
    issue_title = serializers.CharField(source='issue.title', read_only=True)

    class Meta:
        model = UserActivityLog
        fields = ['activity_type', 'description', 'machine_name', 'issue_title', 'created_at']
        read_only_fields = ['created_at']

# Serializer for user notes, including validation for reminder dates
class UserNoteSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source='machine.name', read_only=True)

    class Meta:
        model = UserNote
        fields = ['id', 'title', 'content', 'priority', 'is_reminder', 'reminder_date',
                 'is_completed', 'machine', 'machine_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

     # Custom validation for reminder dates
    def validate(self, data):
        if self.partial:
            if set(data.keys()) == {'is_completed'}:
                return data

        if 'is_reminder' in data or 'reminder_date' in data:
            is_reminder = data.get('is_reminder', self.instance.is_reminder if self.instance else False)
            reminder_date = data.get('reminder_date', self.instance.reminder_date if self.instance else None)

            if is_reminder and reminder_date:
                if reminder_date <= timezone.now():
                    raise serializers.ValidationError({
                        'reminder_date': 'Reminder date must be in the future'
                    })

        return data

# Serializers for filters and related models
class ManufacturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manufacturer
        fields = ['id', 'name']


class EquipmentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentCategory
        fields = ['id', 'category_name']


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

class MachineTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MachineType
        fields = ['id', 'name']


# Serializer for managed files
class ManagedFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagedFile
        fields = ['id', 'file']

# Serializer for step objects, including images
class StepSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()

    class Meta:
        model = Step
        fields = ['id', 'step_number', 'description', 'video_urls', 'images']

    # Method to get associated images for a step
    def get_images(self, obj):
        files = ManagedFile.objects.filter(associated_model='Step', associated_id=obj.id)
        return [{'id': f.id, 'url': f.file.url} for f in files]

# Serializer for troubleshooting guides, including steps
class TroubleshootingGuideSerializer(serializers.ModelSerializer):
    steps = StepSerializer(many=True, required=False)

    
    class Meta:
        model = TroubleshootingGuide
        fields = ['id', 'title', 'steps', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at'] #New

    def get_steps(self, obj):
        steps = obj.steps.all()
        return StepSerializer(steps, many=True, context=self.context).data

    # Custom methods to create or update a troubleshooting guide with steps
    def create(self, validated_data):
        steps_data = validated_data.pop('steps', [])
        guide = TroubleshootingGuide.objects.create(**validated_data)
        for step_data in steps_data:
            Step.objects.create(guide=guide, **step_data)
        return guide

    def update(self, instance, validated_data):
        steps_data = validated_data.pop('steps', None)
        instance = super().update(instance, validated_data)

        if steps_data is not None:
            instance.steps.all().delete()
            for step_data in steps_data:
                Step.objects.create(guide=instance, **step_data)

        return instance

# Serializer for solutions, including the associated guide
class SolutionSerializer(serializers.ModelSerializer):
    guide = TroubleshootingGuideSerializer(required=False)

    class Meta:
        model = Solution
        fields = ['id', 'description', 'guide', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    # Custom methods to create or update a solution with an optional guide
    def create(self, validated_data):
        guide_data = validated_data.pop('guide', None)
        issue_id = self.context.get('issue_id')
        request = self.context.get('request')
        
        try:
            issue = Issue.objects.get(id=issue_id)
            solution = Solution.objects.create(
                issue=issue,
                created_by=request.user if request else None,
                **validated_data
            )
            
            if guide_data:
                TroubleshootingGuide.objects.create(solution=solution, **guide_data)
            
            return solution
            
        except Issue.DoesNotExist:
            raise serializers.ValidationError({'error': 'Issue not found'})

    # Custom to_representation method to include the guide
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if hasattr(instance, 'guide') and instance.guide is not None:
            representation['guide'] = TroubleshootingGuideSerializer(
                instance.guide,
                context=self.context
            ).data
        return representation

    def get_guide(self, obj):
        if hasattr(obj, 'guide') and obj.guide is not None:
            return TroubleshootingGuideSerializer(obj.guide, context=self.context).data
        return None

    def update(self, instance, validated_data):
        guide_data = validated_data.pop('guide', None)
        instance = super().update(instance, validated_data)

        if guide_data:
            guide_instance = instance.guide
            guide_serializer = TroubleshootingGuideSerializer(guide_instance, data=guide_data, partial=True)
            if guide_serializer.is_valid():
                guide_serializer.save()
            else:
                raise serializers.ValidationError(guide_serializer.errors)

        return instance

# Serializer for issues, including associated solutions and images
class IssueSerializer(serializers.ModelSerializer):
    solutions = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = ['id', 'title', 'description', 'error_code', 'keywords', 
                  'solutions', 'created_by', 'created_at', 'updated_at', 'images']

    # Method to get associated solutions
    def get_solutions(self, obj):
        solutions = obj.solutions.all()
        return SolutionSerializer(solutions, many=True, context=self.context).data

    # Method to get associated images
    def get_images(self, obj):
        request = self.context.get('request')
        files = ManagedFile.objects.filter(associated_model='Issue', associated_id=obj.id)
        return [{'id': f.id, 'url': request.build_absolute_uri(f.file.url)} for f in files]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        possible_solutions = representation.get('possible_solutions', [])
        if isinstance(possible_solutions, str):
            representation['possible_solutions'] = [possible_solutions]
        return representation

    def create(self, validated_data):
        possible_solutions = validated_data.pop('possible_solutions', [])
        issue = Issue.objects.create(**validated_data)
        issue.possible_solutions = possible_solutions
        issue.save()
        return issue

    def update(self, instance, validated_data):
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.error_code = validated_data.get('error_code', instance.error_code)
        
        possible_solutions = validated_data.get('possible_solutions')
        if possible_solutions is not None:
            instance.possible_solutions = possible_solutions

        instance.save()
        return instance

# Serializer for copying machine templates
class MachineCopySerializer(serializers.ModelSerializer):
    class Meta:
        model = MachineCopy
        fields = ['id', 'original_template', 'user', 'machine', 'created_at']
        read_only_fields = ['created_at']


# Serializer for the Machine model, including details and related fields
class MachineSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    manufacturer_name = serializers.CharField(source='manufacturer.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    machine_type_name = serializers.CharField(source='machine_type.name', read_only=True)
    issues = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    manual_url = serializers.SerializerMethodField()

    is_copy = serializers.SerializerMethodField() # New
    original_template_id = serializers.SerializerMethodField() # New

    category = serializers.CharField(allow_null=True, required=False)
    manufacturer = serializers.CharField(allow_null=True, required=False)
    department = serializers.CharField(allow_null=True, required=False)
    machine_type = serializers.CharField(allow_null=True, required=False)

    class Meta:
        model = Machine
        fields = ['id', 'name', 'model', 'series', 'description', 'category', 'category_name', 
                  'manufacturer', 'manufacturer_name', 'department', 'department_name', 
                  'machine_type', 'machine_type_name', 'issues', 'images', 'manual_url',
                  'is_template', 'is_copy', 'original_template_id']

    # Method to check if the machine is a copy
    def get_is_copy(self, obj):
        return MachineCopy.objects.filter(machine=obj).exists()

    # Method to get the original template ID if the machine is a copy
    def get_original_template_id(self, obj):
        copy = MachineCopy.objects.filter(machine=obj).first()
        return copy.original_template.id if copy else None

    # Method to get associated issues
    def get_issues(self, obj):
        issues = obj.issues.all()
        return IssueSerializer(issues, many=True, context=self.context).data

    def get_images(self, obj):
        request = self.context.get('request')
        files = ManagedFile.objects.filter(associated_model='Machine', associated_id=obj.id)
        return [{'id': f.id, 'url': request.build_absolute_uri(f.file.url)} for f in files]

    # Check this later***
    def get_image_url(self, obj): # new to debug el fetch de imagenes
        image = ManagedFile.objects.filter(associated_model='Machine', associated_id=obj.id).first()
        if image:
            return image.file.url
        return None
    
    # Method to get the manual URL
    def get_manual_url(self, obj):
        request = self.context.get('request')
        if not request:
            return None
            
        manual = ManagedFile.objects.filter(
            associated_model='Machine',
            associated_id=obj.id,
            file_type='MANUAL'
        ).first()
        
        if manual:
            return request.build_absolute_uri(manual.file.url)
        return None

    def create(self, validated_data):
        category = validated_data.pop('category', None)
        manufacturer = validated_data.pop('manufacturer', None)
        department = validated_data.pop('department', None)
        machine_type = validated_data.pop('machine_type', None)

        if category:
            category_instance, _ = EquipmentCategory.objects.get_or_create(category_name=category)
            validated_data['category'] = category_instance
        
        if manufacturer:
            manufacturer_instance, _ = Manufacturer.objects.get_or_create(name=manufacturer)
            validated_data['manufacturer'] = manufacturer_instance
        
        if department:
            department_instance, _ = Department.objects.get_or_create(name=department)
            validated_data['department'] = department_instance
        
        if machine_type:
            machine_type_instance, _ = MachineType.objects.get_or_create(name=machine_type)
            validated_data['machine_type'] = machine_type_instance


        return super().create(validated_data)
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['category'] = instance.category.category_name if instance.category else None
        representation['manufacturer'] = instance.manufacturer.name if instance.manufacturer else None
        representation['department'] = instance.department.name if instance.department else None
        representation['machine_type'] = instance.machine_type.name if instance.machine_type else None
        return representation

    def update(self, instance, validated_data):
        category_name = validated_data.pop('category', None)
        manufacturer_name = validated_data.pop('manufacturer', None)
        department_name = validated_data.pop('department', None)
        machine_type_name = validated_data.pop('machine_type', None)

        if category_name:
            category, _ = EquipmentCategory.objects.get_or_create(category_name=category_name)
            instance.category = category
        elif category_name == '':
            instance.category = None

        if manufacturer_name:
            manufacturer, _ = Manufacturer.objects.get_or_create(name=manufacturer_name)
            instance.manufacturer = manufacturer
        elif manufacturer_name == '':
            instance.manufacturer = None

        if department_name:
            department, _ = Department.objects.get_or_create(name=department_name)
            instance.department = department
        elif department_name == '':
            instance.department = None

        if machine_type_name:
            machine_type, _ = MachineType.objects.get_or_create(name=machine_type_name)
            instance.machine_type = machine_type
        elif machine_type_name == '':
            instance.machine_type = None

        return super().update(instance, validated_data)
    
# Serializer for training documents
class TrainingDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingDocument
        fields = ['id', 'title', 'description', 'file', 'uploaded_by', 'uploaded_at']
        read_only_fields = ['uploaded_by', 'uploaded_at']

# Serializer for training workspaces, including documents
class TrainingWorkspaceSerializer(serializers.ModelSerializer):
    documents = TrainingDocumentSerializer(many=True, read_only=True)
    
    class Meta:
        model = TrainingWorkspace
        fields = ['id', 'title', 'description', 'created_by', 'created_at', 
                 'updated_at', 'is_public', 'documents']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
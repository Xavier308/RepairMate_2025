# repairmate_backend/api/management/commands/populate_test_data.py

import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from file_manager.services import save_file
from django.core.files import File
from django.conf import settings

from api.models import (
    Manufacturer, EquipmentCategory, Machine, Issue, Solution,
    TroubleshootingGuide, Department, MachineType, Step,
    SubscriptionPlan, Organization
)

# New modules to make populate_test_data more maintaneble - We separate the data of the machines in individual files.

# Base Data
from .machine_data.base_data import get_base_data
# Machine Data
from .machine_data.breville_data import get_breville_data
from .machine_data.ars_data import get_ars_data
from .machine_data.bambu_data import get_bambu_data
from .machine_data.cobas_data import get_cobas_data
from .machine_data.haas_data import get_haas_data


# This command is used to populate the database with initial test data
class Command(BaseCommand):
    # Provides a description of the command
    help = 'Populates the database with test data'

    def __init__(self):
        super().__init__()
        self.manufacturers_map = {}
        self.categories_map = {}
        self.departments_map = {}
        self.machine_types_map = {}
        self.testuser = None  # Inicializamos testuser


    def handle(self, *args, **kwargs):
        # Get the user model to create and manage user accounts
        User = get_user_model()

        # Create subscription plans with various features
        self.stdout.write('Creating subscription plans...')
        free_plan = SubscriptionPlan.objects.create(
            name='FREE',
            max_machines=3,
            max_team_members=0,
            features={
                'can_create_machines': True,
                'can_create_guides': True,
                'advanced_analytics': False,
                'team_management': False,
            }
        )

        pro_plan = SubscriptionPlan.objects.create(
            name='PRO',
            max_machines=20,
            max_team_members=5,
            features={
                'can_create_machines': True,
                'can_create_guides': True,
                'advanced_analytics': True,
                'team_management': True,
                'priority_support': True,
            }
        )

        enterprise_plan = SubscriptionPlan.objects.create(
            name='ENTERPRISE',
            max_machines=100,
            max_team_members=50,
            features={
                'can_create_machines': True,
                'can_create_guides': True,
                'advanced_analytics': True,
                'team_management': True,
                'priority_support': True,
                'custom_branding': True,
                'api_access': True,
                'dedicated_support': True,
            }
        )

        # Create a test organization for the enterprise plan
        test_org = Organization.objects.create(
            name='Test Enterprise Corp',
            subscription_plan=enterprise_plan,
            admin_email='enterprise@test.com'
        )

        # Create a test user (enterprise admin) or update if it already exists
        self.testuser, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'xavierj.cruz@yahoo.com',
                'first_name': 'Test',
                'last_name': 'User',
                'role': 'ADMINISTRATOR',
                'account_type': 'ENTERPRISE_ADMIN',
                'organization': test_org,
                'subscription_plan': enterprise_plan
            }
        )
        # Set and save the password if the user was created
        if created:
            self.testuser.set_password('testpassword')
            self.testuser.save()
            self.stdout.write(self.style.SUCCESS('Created enterprise admin test user'))
        else:
            self.stdout.write(self.style.SUCCESS('Updated existing test user to enterprise admin'))

        # List of additional user accounts to create with specific roles and plans
        user_data = [
            {
                'username': 'demoday2024',
                'password': 'demoday2024',
                'first_name': 'Demo',
                'last_name': 'Day',
                'role': 'ADMINISTRATOR',
                'account_type': 'ENTERPRISE_ADMIN',
                'subscription_plan': enterprise_plan,
                'email': 'demoday2024@test.com',
                'organization': test_org
            },
            {
                'username': 'abimael',
                'password': 'abimaelpass',
                'first_name': 'Abimael',
                'last_name': 'Pérez',
                'role': 'SUPERVISOR',
                'account_type': 'ENTERPRISE_ADMIN',
                'subscription_plan': enterprise_plan,
                'email': 'abimael@test.com',
                'organization': test_org
            },
            {
                'username': 'john',
                'password': 'johnpass',
                'first_name': 'John',
                'last_name': 'López',
                'role': 'ADMINISTRATOR',
                'account_type': 'ENTERPRISE_ADMIN',
                'subscription_plan': enterprise_plan,
                'email': 'admin@test.com',
                'organization': test_org
            }
        ]

        # List of additional user accounts to create with specific roles and plans
        for data in user_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': data['role'],
                    'account_type': data['account_type'],
                    'subscription_plan': data['subscription_plan'],
                    'email': data['email'],
                    'organization': data['organization']
                }
            )
            # Set the password and save the user if created
            if created:
                user.set_password(data['password'])
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f"Created user: {user.username} with role: {user.role} and plan: {user.account_type}")
                )
            else:
                self.stdout.write(self.style.SUCCESS(f"User {user.username} already exists"))

        # Create team members for the PRO user
        pro_user = User.objects.get(username='abimael')
        team_members_data = [
            {
                'username': 'team_member1',
                'email': 'team1@test.com',
                'role': 'TECHNICIAN',
                'first_name': 'Team',
                'last_name': 'Member1'
            },
            {
                'username': 'team_member2',
                'email': 'team2@test.com',
                'role': 'MECHANIC',
                'first_name': 'Team',
                'last_name': 'Member2'
            }
        ]

        # Loop through team members data and create or update team members
        for member_data in team_members_data:
            try:
                pro_user.create_team_member(
                    username=member_data['username'],
                    email=member_data['email'],
                    password='teampass123',
                    first_name=member_data['first_name'],
                    last_name=member_data['last_name'],
                    role=member_data['role']
                )
                self.stdout.write(
                    self.style.SUCCESS(f"Created team member: {member_data['username']}")
                )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"Could not create team member {member_data['username']}: {str(e)}")
                )


        #  Nuevas funciones - Cambiamos el populate_test_data ***

        # Crear datos base
        base_data = get_base_data()


        # Crear manufacturers
        for i, mfg_data in enumerate(base_data['manufacturers']):
            mfg, _ = Manufacturer.objects.get_or_create(name=mfg_data['name'])
            self.manufacturers_map[i] = mfg
            self.stdout.write(self.style.SUCCESS(f'Created/updated manufacturer: {mfg.name}'))

        # Crear categories
        for i, cat_data in enumerate(base_data['categories']):
            cat, _ = EquipmentCategory.objects.get_or_create(category_name=cat_data['category_name'])
            self.categories_map[i] = cat
            self.stdout.write(self.style.SUCCESS(f'Created/updated category: {cat.category_name}'))

        # Crear departments
        for i, dept_data in enumerate(base_data['departments']):
            dept, _ = Department.objects.get_or_create(name=dept_data['name'])
            self.departments_map[i] = dept
            self.stdout.write(self.style.SUCCESS(f'Created/updated department: {dept.name}'))

        # Crear machine types
        for i, type_data in enumerate(base_data['machine_types']):
            mtype, _ = MachineType.objects.get_or_create(name=type_data['name'])
            self.machine_types_map[i] = mtype
            self.stdout.write(self.style.SUCCESS(f'Created/updated machine type: {mtype.name}'))


        # Create machine data
        self.create_machine_data(get_breville_data())
        self.create_machine_data(get_ars_data())
        self.create_machine_data(get_bambu_data())
        self.create_machine_data(get_cobas_data())
        self.create_machine_data(get_haas_data())

        self.stdout.write(self.style.SUCCESS('Successfully populated all test data'))


    def create_machine_data(self, machine_data):
        """Helper method to create a machine and its related data"""
        machine = machine_data['machine']
        
        # Crear la máquina
        machine_obj, created = Machine.objects.update_or_create(
            name=machine['name'],
            defaults={
                'model': machine['model'],
                'series': machine['series'],
                'description': machine['description'],
                'category': self.categories_map[machine['category_id']],
                'manufacturer': self.manufacturers_map[machine['manufacturer_id']],
                'department': self.departments_map[machine['department_id']],
                'machine_type': self.machine_types_map[machine['machine_type_id']],
                'is_template': machine['is_template'],
                'is_public': machine['is_public'],
                'owner': self.testuser
            }
        )
        self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} machine: {machine_obj.name}"))

        # Subir imagen de la máquina
        image_path = os.path.join(settings.BASE_DIR, 'initial_data', 'machine_images', machine['image_name'])
        with open(image_path, 'rb') as img_file:
            managed_file = save_file(
                file=File(img_file),
                file_type='IMAGE',
                associated_model='Machine',
                associated_id=machine_obj.id
            )
        self.stdout.write(self.style.SUCCESS(f"Added image for machine: {machine_obj.name}"))

        # Subir manual de la máquina
        if 'manual_name' in machine:
            manual_path = os.path.join(settings.BASE_DIR, 'initial_data', 'machine_images', machine['manual_name'])
            try:
                with open(manual_path, 'rb') as manual_file:
                    managed_file = save_file(
                        file=File(manual_file),
                        file_type='MANUAL',
                        associated_model='Machine',
                        associated_id=machine_obj.id
                    )
                self.stdout.write(self.style.SUCCESS(f"Added manual for machine: {machine_obj.name}"))
            except FileNotFoundError:
                self.stdout.write(self.style.WARNING(f"Manual file not found for machine: {machine_obj.name}"))

        # Crear issues, solutions y guides
        for issue_data in machine_data['issues']:
            self.create_issue_data(issue_data, machine_obj, self.testuser)

    def create_issue_data(self, issue_data, machine, user):
        """Helper method to create issues and related data"""
        issue = Issue.objects.create(
            machine=machine,
            title=issue_data['title'],
            description=issue_data['description'],
            error_code=issue_data['error_code'],
            keywords=issue_data['keywords'],
            created_by=user
        )
        self.stdout.write(self.style.SUCCESS(f"Created issue: {issue.title}"))

        # Crear imagen del issue
        image_path = os.path.join(settings.BASE_DIR, 'initial_data', 'machine_images', issue_data['image_name'])
        with open(image_path, 'rb') as img_file:
            managed_file = save_file(
                file=File(img_file),
                file_type='IMAGE',
                associated_model='Issue',
                associated_id=issue.id
            )
        self.stdout.write(self.style.SUCCESS(f"Added image for issue: {issue.title}"))

        # Crear solutions y guides
        for solution_data in issue_data['solutions']:
            self.create_solution_data(solution_data, issue, user)

    def create_solution_data(self, solution_data, issue, user):
        """Helper method to create solutions and guides"""
        solution = Solution.objects.create(
            issue=issue,
            description=solution_data['description'],
            created_by=user
        )
        self.stdout.write(self.style.SUCCESS(f"Created solution for issue: {issue.title}"))

        if 'guide' in solution_data and solution_data['guide']:
            guide = TroubleshootingGuide.objects.create(
                solution=solution,
                title=f"Guide for {issue.title}",
                created_by=user
            )
            self.stdout.write(self.style.SUCCESS(f"Created guide for solution"))

            for step_data in solution_data['guide']:
                step = Step.objects.create(
                    guide=guide,
                    step_number=step_data['step_number'],
                    description=step_data['description']
                )

                if 'image_name' in step_data:
                    image_path = os.path.join(
                        settings.BASE_DIR, 
                        'initial_data', 
                        'machine_images', 
                        step_data['image_name']
                    )
                    with open(image_path, 'rb') as img_file:
                        managed_file = save_file(
                            file=File(img_file),
                            file_type='IMAGE',
                            associated_model='Step',
                            associated_id=step.id
                        )
                    self.stdout.write(self.style.SUCCESS(f"Added image for step {step.step_number}"))


# repairmate_backend/api/views/__init__.py

# Authentication views
from .auth_views import CustomAuthToken, register_user

# User related views
from .user_views import (
    user_profile, UserPreferencesViewSet, UserActivityLogViewSet, 
    UserNoteViewSet, CustomUserViewSet, SubscriptionPlanViewSet,
    OrganizationViewSet
)

# Machine related views
from .machine_views import (
    MachineViewSet, ManufacturerViewSet, EquipmentCategoryViewSet,
    DepartmentViewSet, MachineTypeViewSet, optimized_machine_detail,
    upload_machine_manual, get_machine_manual, delete_machine_manual
)

# Issue related views
from .issue_views import (
    IssueViewSet, AllIssuesView, match_issues,
    machine_issues, create_issue, issue_detail
)

# Solution related views
from .solution_views import (
    StepViewSet, solution_operations, create_guide,
    upload_step_image, get_step_images
)

# File related views
from .file_views import serve_image

# Training related views
from .training_views import TrainingWorkspaceViewSet

# repairmate_backend/api/admin.py
from django.contrib import admin

# Register models here.
from .models import Machine, MachineCopy

# Register the Machine model with the admin site
admin.site.register(Machine)

# Register the MachineCopy model with custom admin options
# This snippet was added to support the functionality of copying machines
@admin.register(MachineCopy)
class MachineCopyAdmin(admin.ModelAdmin):
    list_display = ('id', 'original_template', 'user', 'machine', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('original_template__name', 'user__username')
    date_hierarchy = 'created_at'
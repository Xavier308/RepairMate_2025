# repairmate_backend/core/views.py
import logging
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from django.contrib.auth.forms import UserCreationForm
from django.urls import reverse_lazy
from django.views.generic.edit import CreateView
from django.db.models import Q
from api.models import Machine, TroubleshootingGuide

logger = logging.getLogger(__name__)

class RegisterView(CreateView):
    form_class = UserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'registration/register.html'

    def form_valid(self, form):
        logger.info(f"User registration attempt: {form.cleaned_data.get('username')}")
        response = super().form_valid(form)
        logger.info(f"User registered successfully: {self.object.username}")
        return response

    def form_invalid(self, form):
        logger.error(f"User registration failed. Errors: {form.errors}")
        return super().form_invalid(form)

def home(request):
    return render(request, 'core/home.html')

def about(request):
    return render(request, 'core/about.html')

def machines_list(request):
    machines = Machine.objects.all()
    return render(request, 'core/machines_list.html', {'machines': machines})

def machine_detail(request, machine_id):
    machine = get_object_or_404(Machine, id=machine_id)
    search_query = request.GET.get('search', '')
    
    if search_query:
        guides = TroubleshootingGuide.objects.filter(
            Q(machine=machine) & 
            (Q(problem_description__icontains=search_query) | 
             Q(possible_solutions__icontains=search_query))
        )
    else:
        guides = TroubleshootingGuide.objects.filter(machine=machine)
    
    return render(request, 'core/machine_detail.html', {
        'machine': machine,
        'guides': guides,
        'search_query': search_query
    })

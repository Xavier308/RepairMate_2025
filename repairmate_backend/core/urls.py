# repairmate_backend/core/urls.py
from django.urls import path
from django.contrib.auth.views import LoginView, LogoutView
from .views import RegisterView, home, about, machines_list, machine_detail

urlpatterns = [
    path('', home, name='home'),
    path('about/', about, name='about'),
    path('machines/', machines_list, name='machines_list'),
    path('machines/<int:machine_id>/', machine_detail, name='machine_detail'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(next_page='home'), name='logout'),
    path('register/', RegisterView.as_view(), name='register'),
]

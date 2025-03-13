# repairmate_backend/repairmate/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework.authtoken.views import obtain_auth_token
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
import os

# Definir la ruta del build de React/Vite si no está en settings
REACT_BUILD_DIR = getattr(settings, 'VITE_APP_BUILD_DIR', 
                          os.path.join(settings.BASE_DIR, 'repairmate', 'static', 'react', 'build'))

urlpatterns = [
    path('admin/', admin.site.urls),
    # path('', include('core.urls')), # New line
    path('api/', include('api.urls')),

    #path('', TemplateView.as_view(template_name='index.html'), name='react-app'),  # estaba funcionando
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'), # si la elimino  no me deja hacer loging (en api.url hay otra linea de esta)
    # Serve the manifest.json
    #re_path(r'^manifest\.json$', serve, {'document_root': settings.REACT_APP_DIR, 'path': 'manifest.json'}), # funciona bien
    
    # Do not use  this line, it doesnt let React render media/images
    #Serve the index.html of React
    #re_path(r'^.*', TemplateView.as_view(template_name='index.html'), name='react-app'), # this give problems 

    #re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT,},),   #funciona bien

    # Servir manifest.json (puede ser tanto de CRA como de Vite)
    re_path(r'^manifest\.json$', serve, {
        'document_root': REACT_BUILD_DIR, 
        'path': 'manifest.json'
    }),
    
    # Servir archivos estáticos de Vite
    re_path(r'^assets/(?P<path>.*)$', serve, {
        'document_root': os.path.join(REACT_BUILD_DIR, 'assets'),
    }),
    
    # Servir .vite/manifest.json para debugging si es necesario
    re_path(r'^\.vite/manifest\.json$', serve, {
        'document_root': REACT_BUILD_DIR,
        'path': '.vite/manifest.json'
    }),
    
    # Servir archivos multimedia
    re_path(r'^media/(?P<path>.*)$', serve, {
        'document_root': settings.MEDIA_ROOT,
    }),
    
    # Handle all other routes with React
    re_path(r'^(?!api/)(?!admin/)(?!media/)(?!static/).*$', 
        TemplateView.as_view(template_name='index.html'), 
        name='react-app'
    ),    

]


if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


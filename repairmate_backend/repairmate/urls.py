# repairmate_backend/repairmate/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework.authtoken.views import obtain_auth_token
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
import os

# Defined Build's route of React/Vite if its'n present in settings.py
REACT_BUILD_DIR = getattr(settings, 'VITE_APP_BUILD_DIR', 
                          os.path.join(settings.BASE_DIR, 'repairmate', 'static', 'react', 'build'))

urlpatterns = [
    path('admin/', admin.site.urls),
    # path('', include('core.urls')),
    path('api/', include('api.urls')),

    #path('', TemplateView.as_view(template_name='index.html'), name='react-app'),  # estaba funcionando
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'), # Necessary for make loging (en api.url hay otra linea de esta)


    # Serve manifest.json (It can be CRA or Vite)
    re_path(r'^manifest\.json$', serve, {
        'document_root': REACT_BUILD_DIR, 
        'path': 'manifest.json'
    }),
    
    # Serve static files of Vite
    re_path(r'^assets/(?P<path>.*)$', serve, {
        'document_root': os.path.join(REACT_BUILD_DIR, 'assets'),
    }),
    
    # Serve .vite/manifest.json for debugging if necessary
    re_path(r'^\.vite/manifest\.json$', serve, {
        'document_root': REACT_BUILD_DIR,
        'path': '.vite/manifest.json'
    }),
    
    # Serve mulitmedia files
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
    import debug_toolbar # New
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # New
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns

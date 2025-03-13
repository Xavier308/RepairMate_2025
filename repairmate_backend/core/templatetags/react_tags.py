# RepairMate/repairmate_backend/core/templatetags/react_tags.py
import json
import os
import glob
from django import template
from django.conf import settings
from django.templatetags.static import static

register = template.Library()

@register.simple_tag
def react_asset(asset_name):
    """
    Encuentra un archivo estático de React basado en el nombre del activo.
    Funciona tanto con manifiestos de Vite como de CRA.
    """
    # Primero intentamos con el manifiesto de Vite
    vite_manifest_path = os.path.join(settings.BASE_DIR, 'repairmate', 'static', 'react', 'build', '.vite', 'manifest.json')
    try:
        with open(vite_manifest_path, 'r') as f:
            vite_manifest = json.load(f)
            
        # Si es index.html, devolvemos los scripts principales
        if asset_name == 'index.html' or asset_name == 'main.js':
            # Buscamos el punto de entrada principal
            for key, info in vite_manifest.items():
                if info.get('isEntry', False):
                    return static(f'react/build/{info["file"]}')
            
        # Buscar activos específicos
        for key, info in vite_manifest.items():
            if asset_name in key:
                return static(f'react/build/{info["file"]}')
                
    except (FileNotFoundError, KeyError):
        pass
    
    # Fallback a CRA manifest
    cra_manifest_path = os.path.join(settings.BASE_DIR, 'repairmate', 'static', 'react', 'build', 'asset-manifest.json')
    try:
        with open(cra_manifest_path, 'r') as f:
            cra_manifest = json.load(f)
        
        if asset_name in cra_manifest.get('files', {}):
            return static(f'react/build/{cra_manifest["files"][asset_name]}')
    except (FileNotFoundError, KeyError):
        pass
    
    # Si todo falla, intentamos buscar directamente el archivo
    if asset_name == 'main.js' or asset_name == 'index.html':
        # Buscar archivos JS en el directorio build/assets
        js_files = glob.glob(os.path.join(settings.BASE_DIR, 'repairmate', 'static', 'react', 'build', 'assets', 'index.*.js'))
        if js_files:
            # Tomar el primer archivo que cumple el patrón
            js_file = os.path.basename(js_files[0])
            return static(f'react/build/assets/{js_file}')
    
    # No se encontró el activo
    return ''

@register.simple_tag
def vite_css():
    """
    Devuelve etiquetas link para todos los archivos CSS generados por Vite.
    """
    css_files = glob.glob(os.path.join(settings.BASE_DIR, 'repairmate', 'static', 'react', 'build', 'assets', '*.css'))
    links = []
    for css_file in css_files:
        filename = os.path.basename(css_file)
        links.append(f'<link rel="stylesheet" href="{static(f"react/build/assets/{filename}")}">')
    
    return '\n'.join(links)

@register.simple_tag
def vite_js():
    """
    Devuelve etiquetas script para todos los archivos JS generados por Vite.
    """
    js_files = glob.glob(os.path.join(settings.BASE_DIR, 'repairmate', 'static', 'react', 'build', 'assets', '*.js'))
    scripts = []
    for js_file in js_files:
        filename = os.path.basename(js_file)
        scripts.append(f'<script type="module" src="{static(f"react/build/assets/{filename}")}">')
    
    return '\n'.join(scripts)

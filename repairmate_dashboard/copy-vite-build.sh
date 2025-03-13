#!/bin/bash

# Script para copiar build de Vite a Django
echo "Copiando build de Vite a Django..."

# Ruta del frontend (la carpeta actual)
FRONTEND_PATH="."

# Ruta del backend (ajusta según tu estructura)
BACKEND_PATH="../repairmate_backend"

# Ruta de destino en Django (ajusta según tu estructura)
DJANGO_STATIC_PATH="${BACKEND_PATH}/repairmate/static/react"

# Ruta de templates de Django
DJANGO_TEMPLATES_PATH="${BACKEND_PATH}/repairmate/templates"

# Verificar que el build existe
if [ ! -d "${FRONTEND_PATH}/build" ]; then
  echo "Error: No se encontró la carpeta build. Ejecuta 'npm run build' primero."
  exit 1
fi

# Crear directorio de destino si no existe
mkdir -p "${DJANGO_STATIC_PATH}"
mkdir -p "${DJANGO_TEMPLATES_PATH}"

# Limpiar build anterior
echo "Limpiando build anterior..."
rm -rf "${DJANGO_STATIC_PATH}/build"

# Copiar nuevo build
echo "Copiando nueva build..."
cp -r "${FRONTEND_PATH}/build" "${DJANGO_STATIC_PATH}/"

# Copiar manifest de Vite (.vite/manifest.json)
if [ -f "${FRONTEND_PATH}/build/.vite/manifest.json" ]; then
  # Asegurar que el directorio existe
  mkdir -p "${DJANGO_STATIC_PATH}/build/.vite"
  cp "${FRONTEND_PATH}/build/.vite/manifest.json" "${DJANGO_STATIC_PATH}/build/.vite/"
  echo "Manifest de Vite copiado."
else
  echo "Advertencia: No se encontró el manifest de Vite."
fi

# Crear template para Django
echo "Creando template para Django..."
cat > "${DJANGO_TEMPLATES_PATH}/index.html" << END_HTML
{% load static %}
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="{% static 'react/build/favicon.ico' %}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Smart Solution to Troubleshoot Machine Issues Fast"
    />
    <link rel="manifest" href="{% static 'react/build/manifest.json' %}" />
    <title>RepairMate</title>
  </head>
  <body>
    <noscript>Troubleshoot machine issues fast</noscript>
    <div id="root"></div>
    
    <!-- Scripts y CSS se cargarán dinámicamente -->
    {% load react_tags %}
    <!-- JS principal -->
    <script type="module" src="{% react_asset 'index.html' %}"></script>
END_HTML

# Buscar archivos CSS en el directorio build/assets y agregar enlaces a ellos
CSSFILES=$(find "${FRONTEND_PATH}/build/assets" -name "*.css")
for cssfile in $CSSFILES; do
  filename=$(basename "$cssfile")
  echo "    <link rel=\"stylesheet\" href=\"{% static 'react/build/assets/${filename}' %}\" />" >> "${DJANGO_TEMPLATES_PATH}/index.html"
done

# Cerrar el template HTML
echo "  </body>
</html>" >> "${DJANGO_TEMPLATES_PATH}/index.html"

echo "Template creado exitosamente."

# Crear manifest compatible con CRA (para compatibilidad durante la transición)
echo "Creando manifest compatible..."

# Pasamos las rutas como variables al script de Python
VITE_MANIFEST_PATH="${DJANGO_STATIC_PATH}/build/.vite/manifest.json"
CRA_MANIFEST_PATH="${DJANGO_STATIC_PATH}/build/asset-manifest.json"

python3 - << END_PYTHON
import json
import os
import sys

# Usamos las variables de entorno que pasamos desde bash
vite_manifest_path = "${VITE_MANIFEST_PATH}"
cra_manifest_path = "${CRA_MANIFEST_PATH}"

try:
    with open(vite_manifest_path, 'r') as f:
        vite_manifest = json.load(f)
    
    # Crear estructura compatible con CRA
    cra_manifest = {
        "files": {},
        "entrypoints": []
    }
    
    # Convertir entradas de Vite a formato CRA
    for key, info in vite_manifest.items():
        # Quitar el prefijo '/' si existe
        clean_key = key.lstrip('/')
        # Añadir al diccionario de files
        cra_manifest["files"][clean_key] = info["file"]
        
        # Si es un punto de entrada, añadirlo a entrypoints
        if info.get("isEntry", False):
            cra_manifest["entrypoints"].append(info["file"])
    
    # Guardar el manifest compatible
    with open(cra_manifest_path, 'w') as f:
        json.dump(cra_manifest, f, indent=2)
    
    print("Manifest compatible con CRA creado exitosamente.")
except Exception as e:
    print(f"Error al crear manifest compatible: {e}")
    sys.exit(1)
END_PYTHON

# Colectar archivos estáticos de Django
echo "Ejecutando collectstatic de Django..."
cd "${BACKEND_PATH}"
python3 manage.py collectstatic --noinput

echo "Build copiado exitosamente a Django."

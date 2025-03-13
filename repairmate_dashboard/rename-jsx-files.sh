#!/bin/bash

# Script para renombrar archivos .js que contienen JSX a .jsx
echo "Renombrando archivos .js que contienen JSX a .jsx..."

# Directorio donde buscar archivos
SRC_DIR="./src"

# Buscar archivos .js que contengan código JSX (buscamos etiquetas como <div>, <Route>, etc.)
FILES_TO_RENAME=$(grep -l -E '<[A-Za-z]+[^>]*>' --include="*.js" -r $SRC_DIR)

# Contador de archivos renombrados
COUNT=0

# Renombrar cada archivo encontrado
for file in $FILES_TO_RENAME; do
  # Nuevo nombre con extensión .jsx
  new_file="${file%.js}.jsx"
  
  # Renombrar el archivo
  mv "$file" "$new_file"
  
  echo "Renombrado: $file → $new_file"
  
  COUNT=$((COUNT+1))
done

echo "Proceso completado. $COUNT archivo(s) renombrado(s)."

# Actualizar importaciones en todos los archivos JS y JSX
echo "Actualizando importaciones..."

# Buscar todos los archivos JS y JSX
ALL_FILES=$(find $SRC_DIR -type f -name "*.js" -o -name "*.jsx")

# Contador de archivos actualizados
UPDATE_COUNT=0

for file in $ALL_FILES; do
  # Flag para indicar si el archivo ha sido modificado
  MODIFIED=false
  
  # Crear archivo temporal
  temp_file=$(mktemp)
  
  # Copiar contenido original
  cp "$file" "$temp_file"
  
  # Buscar importaciones que necesiten ser actualizadas
  for renamed_file in $FILES_TO_RENAME; do
    # Obtener solo el nombre del archivo sin la ruta completa
    base_renamed=$(basename "$renamed_file" .js)
    
    # Buscar importaciones de este archivo y actualizarlas
    if grep -q "from ['\"].*/${base_renamed}['\"]" "$file"; then
      # Reemplazar la importación manteniendo la ruta
      sed -i "s|from \\(['\"]\\)\\(.*\\)/${base_renamed}\\(['\"]\\)|from \\1\\2/${base_renamed}.jsx\\3|g" "$file"
      MODIFIED=true
    fi
  done
  
  # Si el archivo fue modificado, incrementar contador
  if $MODIFIED; then
    UPDATE_COUNT=$((UPDATE_COUNT+1))
    echo "Actualizadas importaciones en: $file"
  fi
  
  # Eliminar archivo temporal
  rm "$temp_file"
done

echo "Proceso de actualización completado. $UPDATE_COUNT archivo(s) actualizados."

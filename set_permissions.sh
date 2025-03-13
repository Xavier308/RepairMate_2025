#!/bin/bash

# Script para establecer permisos de carpetas. Solo para entorno de testing

# Colores para los mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando configuración de permisos...${NC}"

# Definir la ruta base del proyecto
PROJECT_PATH="/home/ubuntu/RepairMate"
BACKEND_PATH="$PROJECT_PATH/repairmate_backend"

# Crear directorios si no existen
echo -e "${GREEN}Creando directorios necesarios...${NC}"
mkdir -p $BACKEND_PATH/staticfiles
mkdir -p $BACKEND_PATH/media
mkdir -p $BACKEND_PATH/media/managed_files
mkdir -p $BACKEND_PATH/media/machine_images

# Establecer propietario para todos los archivos del proyecto
echo -e "${GREEN}Estableciendo propietario para archivos del proyecto...${NC}"
sudo chown -R ubuntu:ubuntu $PROJECT_PATH

# Establecer permisos para directorios
echo -e "${GREEN}Estableciendo permisos para directorios...${NC}"
sudo find $PROJECT_PATH -type d -exec chmod 755 {} \;

# Establecer permisos para archivos
echo -e "${GREEN}Estableciendo permisos para archivos...${NC}"
sudo find $PROJECT_PATH -type f -exec chmod 644 {} \;

# Dar permisos de ejecución a los scripts
echo -e "${GREEN}Estableciendo permisos de ejecución para scripts...${NC}"
chmod +x $PROJECT_PATH/*.sh
chmod +x $BACKEND_PATH/manage.py

# Permisos especiales para directorios de media y static
echo -e "${GREEN}Configurando permisos especiales para media y static...${NC}"
sudo chmod -R 775 $BACKEND_PATH/media
sudo chmod -R 775 $BACKEND_PATH/staticfiles

echo -e "${GREEN}¡Permisos establecidos correctamente!${NC}"

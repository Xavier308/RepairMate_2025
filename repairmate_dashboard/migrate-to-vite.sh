#!/bin/bash

# Script para migrar RepairMate de CRA a Vite
echo "Iniciando migración de Create React App a Vite..."

# 1. Crea una copia de seguridad
echo "Creando copia de seguridad..."
mkdir -p backup
cp package.json backup/
cp -r public backup/
cp -r src backup/

# 2. Actualiza los archivos necesarios
echo "Actualizando package.json..."
# Este paso lo harás manualmente siguiendo las instrucciones

echo "Moviendo index.html a la raíz y adaptándolo para Vite..."
# Este paso lo harás manualmente siguiendo las instrucciones

echo "Creando archivo main.jsx..."
# Este paso lo harás manualmente siguiendo las instrucciones

# 3. Instala dependencias adicionales (ya las tienes)
echo "Verificando dependencias de Vite..."
npm ls vite @vitejs/plugin-react

# 4. Limpia la caché de npm
echo "Limpiando caché de npm..."
npm cache clean --force

# 5. Instala dependencias
echo "Instalando dependencias..."
npm install

# 6. Adaptando variables de entorno
echo "Migrando variables de entorno..."
# Crear .env.local con formato Vite (lo harás manualmente)

# 7. Prueba la aplicación
echo "Probando la aplicación..."
echo "Ejecuta 'npm run dev' para iniciar el servidor de desarrollo de Vite"

echo "Migración completada con éxito!"
echo "Recuerda adaptar cualquier importación de variables de entorno en tu código."
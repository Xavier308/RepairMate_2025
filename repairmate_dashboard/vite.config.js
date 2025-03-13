import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Habilitar JSX en archivos .js
      include: "**/*.{jsx,js,ts,tsx}",
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'], // Asegura que Vite resuelva estas extensiones
  },
  // Para integración con Django
  build: {
    // Directorio de salida - mantener el mismo que CRA para compatibilidad con Django
    outDir: 'build',
    assetsDir: 'assets',
    // Genera un manifiesto para que Django pueda acceder a los archivos
    manifest: true,
    // Asegurarse de que los hashes sean consistentes
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/chunk.[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'assets/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        }
      }
    },
    // Importante para Django: No eliminar los comentarios en HTML
    minify: 'terser',
    terserOptions: {
      format: {
        comments: true
      }
    }
  },
  // Configuración para desarrollo
  server: {
    // Mantener el puerto 3000 como en CRA para compatibilidad con CORS de Django
    port: 3000,
    // Configuración de proxy para API de Django
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  // Hace que las variables de entorno sean compatibles con las de CRA
  define: {
    // Emula el comportamiento de CRA con variables de entorno REACT_APP_*
    'process.env': Object.fromEntries(
      Object.entries(process.env)
        .filter(([key]) => key.startsWith('REACT_APP_'))
    )
  }
});

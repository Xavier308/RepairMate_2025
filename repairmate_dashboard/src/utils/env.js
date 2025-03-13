/**
 * Utilidad para manejar variables de entorno en la transición de CRA a Vite
 * 
 * En CRA: process.env.REACT_APP_API_URL
 * En Vite: import.meta.env.VITE_API_URL
 * 
 * Esta utilidad permite usar ambos formatos durante la transición
 */

// Función que intenta obtener variables de entorno de cualquier formato
export function getEnv(key) {
    // Si estamos en Vite, usa import.meta.env
    if (import.meta && import.meta.env) {
      // Comprueba primero el formato VITE_*
      const viteKey = `VITE_${key.replace('REACT_APP_', '')}`;
      if (import.meta.env[viteKey] !== undefined) {
        return import.meta.env[viteKey];
      }
      
      // Comprueba el formato REACT_APP_* (por si acaso)
      if (import.meta.env[key] !== undefined) {
        return import.meta.env[key];
      }
    }
    
    // Si estamos en CRA o hay process.env disponible
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[key] !== undefined) {
        return process.env[key];
      }
    }
    
    // Valor predeterminado para API_URL
    if (key === 'REACT_APP_API_URL' || key === 'VITE_API_URL') {
      return 'http://localhost:8000';
    }
    
    return undefined;
  }
  
  // Acceso directo para API_URL
  export const API_URL = getEnv('REACT_APP_API_URL') || getEnv('VITE_API_URL');
  
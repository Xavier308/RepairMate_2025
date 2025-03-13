// src/translations/translations.js

/*
 * This file contains an object that holds translations for different languages used in the app.
 * 
 * - `translations`: An object that maps language codes (e.g., 'en' for English, 'es' for Spanish) 
 *   to corresponding translation strings.
 * - Each language section has keys for various UI elements, such as sidebar items and header labels.
 * 
 * Example:
 * - The `en` object defines the English translations for the sidebar and header.
 * - The `es` object defines the Spanish translations for the same elements.
 * 
 * This structure allows for easy access to translated text based on the selected language in the app.
 */

export const translations = {
    en: {
      sidebar: {
        repairIt: 'Repair It',
        dashboard: 'Dashboard',
        machines: 'Machines',
        workspaces: 'Workspaces',
        settings: 'Settings'
      },
      header: {
        account: 'Account',
        logout: 'Logout'
      }
    },
    es: {
      sidebar: {
        repairIt: 'Reparar',
        dashboard: 'Panel',
        machines: 'Máquinas',
        workspaces: 'Espacios',
        settings: 'Ajustes'
      },
      header: {
        account: 'Cuenta',
        logout: 'Salir'
      }
    }
  };
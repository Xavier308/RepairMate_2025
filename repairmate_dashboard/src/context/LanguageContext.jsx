// src/context/LanguageContext.js

/*
 * This file defines a LanguageContext using React's Context API.
 * It provides a way to manage and share the language state across the entire application.
 * 
 * - LanguageContext: A context object created to handle the language settings.
 * - LanguageProvider: A component that wraps around parts of the app where language state is needed.
 *   - Uses useState to store the current language, defaulting to English ('en').
 *   - useEffect: Fetches user language preferences from an API on the initial load and updates the language state.
 * - useLanguage: A custom hook to easily access and update the language context throughout the app.
 * 
 * This setup allows components to consume and change the language setting without prop drilling.
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchUserPreferences } from '@/services/api';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const preferences = await fetchUserPreferences();
        if (preferences) {
          setLanguage(preferences.language);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadLanguagePreference();
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
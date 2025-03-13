import React, { useState, useEffect } from 'react';
import { fetchUserPreferences, updateUserPreferences } from '../services/api';
import { useLanguage } from '../context/LanguageContext.jsx';
import './Settings.css';

function Settings() {
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    language: 'en',
    dark_mode: false,
    timezone: 'America/Puerto_Rico'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { setLanguage } = useLanguage(); // New

  // Lista de zonas horarias comunes para América
  const commonTimezones = [
    { value: 'America/Puerto_Rico', label: 'Puerto Rico (AST)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Phoenix', label: 'Arizona (MST)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
    { value: 'America/Mexico_City', label: 'Ciudad de México (CST)' },
    { value: 'America/Bogota', label: 'Colombia (COT)' },
    { value: 'America/Lima', label: 'Perú (PET)' },
    { value: 'America/Santiago', label: 'Chile (CLT)' },
    { value: 'America/Buenos_Aires', label: 'Argentina (ART)' },
    { value: 'America/Sao_Paulo', label: 'Brasil (BRT)' }
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching preferences...');
      const userPreferences = await fetchUserPreferences();
      console.log('Received preferences:', userPreferences);
      
      if (userPreferences) {
        const newPrefs = {
          id: userPreferences.id,
          email_notifications: userPreferences.email_notifications ?? true,
          language: userPreferences.language ?? 'en',
          timezone: userPreferences.timezone ?? 'America/Puerto_Rico',
          dark_mode: userPreferences.dark_mode ?? false
        };
        console.log('Setting preferences to:', newPrefs);
        setPreferences(newPrefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setError('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await updateUserPreferences(preferences);
      if (response.data) {
        setPreferences(response.data);
        // Actualizar el contexto de idioma cuando cambie
        setLanguage(response.data.language);
      }
      setSuccessMessage('Settings updated successfully');
    } catch (error) {
      setError('Failed to update settings');
      console.error('Error updating settings:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (isLoading) return <div className="settings">Loading...</div>;

  return (
    <div className="settings-container">
      <div className="settings-content">
        <h1>Settings</h1>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <form onSubmit={handleSubmit} className="settings-form">

          {/* Notifications Section */}
          <div className="settings-section">
            <h2>Notifications</h2>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="email_notifications"
                  checked={preferences.email_notifications}
                  onChange={handleInputChange}
                />
                Enable Email Notifications
              </label>
              <p className="setting-description">
                Receive email notifications about updates, reminders, and important changes.
              </p>
            </div>
          </div>

          {/* Language Section */}
          <div className="settings-section">
            <h2>Language</h2>
            <div className="form-group">
              <select
                name="language"
                value={preferences.language}
                onChange={handleInputChange}
                className="language-select"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
              <p className="setting-description">
                Select your preferred language for the interface.
              </p>
            </div>
          </div>

          {/* Timezone Section - New */}
          <div className="settings-section">
            <h2>Time Zone</h2>
            <div className="form-group">
              <select
                name="timezone"
                value={preferences.timezone}
                onChange={handleInputChange}
                className="timezone-select"
              >
                {commonTimezones.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="setting-description">
                Select your time zone to ensure all dates and times are displayed correctly.
              </p>
            </div>
          </div>

          {/* Theme Section 
          <div className="settings-section">
            <h2>Theme</h2>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="dark_mode"
                  checked={preferences.dark_mode}
                  onChange={handleInputChange}
                />
                Dark Mode
              </label>
              <p className="setting-description">
                Switch between light and dark themes.
              </p>
            </div>
          </div> */}

          <div className="settings-actions">
            <button type="submit" className="save-button">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
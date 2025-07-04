'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserSettings {
  // Appearance
  darkMode: boolean;
  primaryColor: string;
  compactMode: boolean;
  animations: boolean;
  
  // Dashboard
  refreshInterval: number;
  defaultView: 'grid' | 'list';
  showMetrics: boolean;
  autoRefresh: boolean;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationSound: boolean;
  
  // Privacy
  dataSharing: boolean;
  analytics: boolean;
  
  // Advanced
  developerMode: boolean;
  betaFeatures: boolean;
}

interface SettingsContextType {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

const defaultSettings: UserSettings = {
  darkMode: false,
  primaryColor: '#1976d2',
  compactMode: false,
  animations: true,
  refreshInterval: 30,
  defaultView: 'grid',
  showMetrics: true,
  autoRefresh: true,
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  notificationSound: true,
  dataSharing: false,
  analytics: true,
  developerMode: false,
  betaFeatures: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('locall-user-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('locall-user-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('locall-user-settings');
  };

  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = (settingsJson: string): boolean => {
    try {
      const imported = JSON.parse(settingsJson);
      if (typeof imported === 'object' && imported !== null) {
        setSettings({ ...defaultSettings, ...imported });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const value: SettingsContextType = {
    settings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

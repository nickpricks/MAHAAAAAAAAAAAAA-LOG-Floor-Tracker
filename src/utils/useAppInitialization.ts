import React from 'react';
import { DailyRecord } from '../types';
import { isDevModeEnabled } from './dev';
import { initializeFirebaseSession, syncAllLocalToCloud, subscribeToUserLogs, subscribeToUserSettings, UserSettings, saveUserSettings } from './firebase';
import { mergeCloudIntoLocal } from './mergeRecords';

type UseAppInitializationResult = {
  isDevUrl: boolean;
  userId: string | null;
  showWarning: boolean;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
  settings: UserSettings;
  updateSettings: (newSettings: UserSettings) => void;
};

/**
 * Primary initialization hook for the MAHA LOG application.
 * Handles:
 * 1. Developer Mode feature flags
 * 2. Frictionless UUID routing (stripping out base domains for static hosts)
 * 3. Initializing anonymous cloud sessions via Firebase
 * 4. Merging local cache data with cloud data
 * 5. Real-time data and settings synchronization
 */
export const useAppInitialization = (
  setRecords: React.Dispatch<React.SetStateAction<Record<string, DailyRecord>>>,
  uuid?: string
): UseAppInitializationResult => {
  const [isDevUrl, setIsDevUrl] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [showWarning, setShowWarning] = React.useState<boolean>(false);
  const [settings, setSettings] = React.useState<UserSettings>({});

  const updateSettingsLocal = (newSettings: UserSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    if (userId) {
      saveUserSettings(userId, newSettings);
    }
  };

  React.useEffect(() => {
    // 1. Dev Mode Check
    if (isDevModeEnabled()) {
      setIsDevUrl(true);
    }

    // 2. Logic handled by react-router-dom (uuid passed in)
    if (!uuid) return;

    const storedId = localStorage.getItem('maha_user_id');
    const activeId = uuid;

    setUserId(activeId);
    if (storedId !== activeId && storedId !== null) {
      // Switched to a shared link?
      localStorage.setItem('maha_user_id', activeId);
    }

    // 3. Initialize Firebase Anonymous Session
    initializeFirebaseSession(activeId);

    // 4. Setup Real-time Listeners
    const unsubscribeLogs = subscribeToUserLogs(activeId, (cloudData) => {
      setRecords((prev) => mergeCloudIntoLocal(prev, cloudData));
    });

    const unsubscribeSettings = subscribeToUserSettings(activeId, (cloudSettings) => {
      setSettings(prev => ({ ...prev, ...cloudSettings }));
    });

    // Handle warning for brand new users (no stored ID yet)
    if (!storedId && activeId) {
      setShowWarning(true);
    }

    return () => {
      unsubscribeLogs();
      unsubscribeSettings();
    };
  }, [setRecords, uuid]);

  // Sync back to localStorage if warning is dismissed or if we have a valid UserId
  React.useEffect(() => {
    if (userId && !localStorage.getItem('maha_user_id') && !showWarning) {
      localStorage.setItem('maha_user_id', userId);
    }
  }, [userId, showWarning]);

  return { isDevUrl, userId, showWarning, setShowWarning, settings, updateSettings: updateSettingsLocal };
};

import React from 'react';
import { DailyRecord } from '../types';
import { isDevModeEnabled } from './dev';
import { initializeFirebaseSession, syncAllLocalToCloud } from './firebase';

type UseAppInitializationResult = {
  isDevUrl: boolean;
  userId: string | null;
  showWarning: boolean;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * Primary initialization hook for the MAHA LOG application.
 * Handles:
 * 1. Developer Mode feature flags
 * 2. Frictionless UUID routing (stripping out base domains for static hosts)
 * 3. Initializing anonymous cloud sessions via Firebase
 * 4. Merging local cache data with cloud data
 */
export const useAppInitialization = (
  setRecords: React.Dispatch<React.SetStateAction<Record<string, DailyRecord>>>
): UseAppInitializationResult => {
  const [isDevUrl, setIsDevUrl] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [showWarning, setShowWarning] = React.useState<boolean>(false);

  React.useEffect(() => {
    // 1. Dev Mode Check
    if (isDevModeEnabled()) {
      setIsDevUrl(true);
    }

    // 2. Standard UUID Routing Logic
    const baseUrl = import.meta.env.BASE_URL; // Handles '/' in dev or '/RepoName/' in prod
    let currentPath = window.location.pathname;

    // Strip out the base path to extract just the UUID
    if (currentPath.startsWith(baseUrl)) {
      currentPath = currentPath.substring(baseUrl.length);
    }
    currentPath = currentPath.replace(/^\/+|\/+$/g, ''); // cleanly trim slashes

    const storedId = localStorage.getItem('maha_user_id');
    let activeId = currentPath;

    if (currentPath && currentPath.length > 10) {
      // User came via a valid URL /uuid
      setUserId(currentPath);
      if (storedId !== currentPath) {
        localStorage.setItem('maha_user_id', currentPath);
      }
    } else if (storedId) {
      // User has been here before but visited root URL, silently rewrite their URL correctly
      window.history.replaceState(null, '', `${baseUrl}${storedId}`);
      setUserId(storedId);
      activeId = storedId;
    } else {
      // Brand new user
      const newId = crypto.randomUUID();
      localStorage.setItem('maha_user_id', newId);
      window.history.replaceState(null, '', `${baseUrl}${newId}`);
      setUserId(newId);
      setShowWarning(true); // Show the risk mitigation warning
      activeId = newId;
    }

    // 3. Initialize Firebase Anonymous Session
    if (activeId) {
      initializeFirebaseSession(activeId).then((cloudData) => {
        if (cloudData && Object.keys(cloudData).length > 0) {
          // Cloud has data, merge it into local records (cloud wins conflicts)
          setRecords((prev) => ({ ...prev, ...cloudData }));
        } else {
          // New cloud session, let's sync up any existing local storage they might have
          // (This handles migrating pre-firebase local users to the cloud)
          setRecords((currentRecords) => {
            if (Object.keys(currentRecords).length > 0) {
              syncAllLocalToCloud(activeId, currentRecords);
            }
            return currentRecords;
          });
        }
      });
    }
  }, [setRecords]);

  return { isDevUrl, userId, showWarning, setShowWarning };
};

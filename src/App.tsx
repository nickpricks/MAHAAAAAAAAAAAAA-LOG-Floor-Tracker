import React from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import HelpTab from '@components/HelpTab';
import NavigationTabs from '@components/NavigationTabs';
import OnboardingWarning from '@components/OnboardingWarning';
import ProfileTab from '@components/ProfileTab';
import StatsTab from '@components/StatsTab';
import TrackerTab from '@components/TrackerTab';
import UpdatePrompt from '@components/UpdatePrompt';
import { BENCHMARK_UUID, TABS, TabType } from '@/constants';
import { DailyRecord } from '@/types';
import { calculateTapUpdate, sortRecordsDesc } from '@utils/appHelpers';
import { getTodayKey } from '@utils/date';
import { confirmResetData, generateDummyData } from '@utils/dev';
import { syncAllLocalToCloud, useSyncStatus } from '@utils/firebase';
import { loadRecords, useThrottledPersistence } from '@utils/storage';
import { useAppInitialization } from '@utils/useAppInitialization';


function MainApp() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<TabType>(TABS.TRACKER);
  const [records, setRecords] = React.useState<Record<string, DailyRecord>>(loadRecords);
  const [devMode, setDevMode] = React.useState(false);

  // Custom hook manages Firebase Auth, Database Syncing, and DevMode checking
  const { isDevUrl, userId, showWarning, setShowWarning, settings, updateSettings } = useAppInitialization(setRecords, uuid);
  const syncStatus = useSyncStatus();

  const handleManualSync = async () => {
    if (!uuid) return;
    await syncAllLocalToCloud(uuid, records);
  };

  // Throttled persistence (debounce 2s)
  useThrottledPersistence(records);

  const injectDummyData = () => {
    setRecords(generateDummyData());
  };

  const handleRunBench = () => {
    if (confirmResetData()) {
      const data = generateDummyData(1000);
      setRecords(data);
      navigate(`/${BENCHMARK_UUID}`);
    }
  };

  const resetData = () => {
    if (confirmResetData()) {
      setRecords({});
    }
  };

  const handleTap = (type: 'up' | 'down') => {
    setRecords((prev) => calculateTapUpdate(prev, type, userId));
  };

  const [todayKey, setTodayKey] = React.useState(getTodayKey);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newKey = getTodayKey();
      if (newKey !== todayKey) {
        setTodayKey(newKey);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [todayKey]);
  const todayTotal = records[todayKey]?.total || 0;
  const sortedRecords = sortRecordsDesc(records);

  // Theme monitoring
  React.useEffect(() => {
    const theme = settings.theme || 'system';
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    }
  }, [settings.theme]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 bg-topo flex flex-col items-center py-8 px-4 font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Navigation Tabs */}
      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} syncStatus={syncStatus} />
      <OnboardingWarning showWarning={showWarning} setShowWarning={setShowWarning} />
      <UpdatePrompt />

      {
        activeTab === TABS.TRACKER && (
          <TrackerTab
            todayTotal={todayTotal}
            handleTap={handleTap}
            sortedRecords={sortedRecords}
          />
        )
      }

      {
        activeTab === TABS.STATS && (
          <StatsTab
            records={records}
            todayKey={todayKey}
            defaultChallengeId={settings.defaultChallenge}
            onManualSync={handleManualSync}
          />
        )
      }

      {
        activeTab === TABS.HELP && <HelpTab />}

      {
        activeTab === TABS.PROFILE && (
          <ProfileTab 
            userId={userId} 
            settings={settings} 
            updateSettings={updateSettings} 
          />
        )
      }

      {/* Dev Mode Toggle (Only visible if ?devMode=true) */}
      {
        isDevUrl && (
          <div className="mt-12 w-full max-w-sm flex flex-col items-center">
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-600 transition-colors">
              <input
                type="checkbox"
                checked={devMode}
                onChange={(e) => setDevMode(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              Developer Mode
            </label>

            {
              devMode && (
                <div className="mt-4 w-full bg-zinc-900 text-zinc-300 p-4 rounded-xl text-xs font-mono shadow-inner flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={injectDummyData}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded-lg font-bold transition-colors"
                      >
                        Inject Dummy Data
                      </button>
                      <button
                        onClick={resetData}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 px-3 rounded-lg font-bold transition-colors"
                      >
                        Reset Data
                      </button>
                    </div>
                    <button
                      onClick={handleRunBench}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-3 rounded-lg font-bold transition-colors border border-zinc-700"
                    >
                      🚀 Run 1000-Day Bench
                    </button>
                  </div>
                  <div className="overflow-x-auto text-green-400 pt-2 border-t border-zinc-700">
                    <pre>{JSON.stringify(records, null, 2)}</pre>
                  </div>
                </div>
              )
            }
          </div>
        )
      }
    </div>
  );
}

export default function App() {
  const storedId = localStorage.getItem('maha_user_id');
  // Generate a temporary ID if none exists, but DON'T save it to localStorage yet.
  // This allows useAppInitialization to detect that it's a first-time visit.
  const tempId = React.useMemo(() => crypto.randomUUID(), []);
  const defaultId = storedId || tempId;

  return (
    <Routes>
      <Route path="/:uuid" element={<MainApp />} />
      <Route path="/" element={<Navigate to={`/${defaultId}`} replace />} />
      <Route path="*" element={<Navigate to={`/${defaultId}`} replace />} />
    </Routes>
  );
}

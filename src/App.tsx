import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import HelpTab from '@components/HelpTab';
import LoadingScreen from '@components/LoadingScreen';
import NavigationTabs from '@components/NavigationTabs';
import OnboardingWarning from '@components/OnboardingWarning';
import ProfileTab from '@components/ProfileTab';
import StatsTab from '@components/StatsTab';
import TrackerTab from '@components/TrackerTab';
import UpdatePrompt from '@components/UpdatePrompt';
import UsernamePopup from '@components/UsernamePopup';
import { BENCHMARK_UUID, DEFAULT_THEME_ID, TABS, TabType } from '@/constants';
import { DailyRecord } from '@/types';
import { calculateTapUpdate, sortRecordsDesc } from '@utils/appHelpers';
import { getTodayKey } from '@utils/date';
import { confirmResetData, generateDummyData } from '@utils/dev';
import { getShortDate } from '@utils/date';
import { deleteRecordFromCloud, lookupUsername, syncAllLocalToCloud, syncRecordToCloud, useSyncStatus } from '@utils/firebase';
import { loadRecords, useThrottledPersistence } from '@utils/storage';
import { applyTheme, isValidThemeId } from '@utils/themes';
import type { ThemeId } from '@utils/themes';
import { useAppInitialization } from '@utils/useAppInitialization';
import { migrateDefaultChallenge, DEFAULT_FLOOR_HEIGHT, type ActiveChallenge } from '@utils/challenges';


const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function MainApp() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [resolvedUuid, setResolvedUuid] = React.useState<string | null>(null);
  const [resolving, setResolving] = React.useState(true);
  const [themePreview, setThemePreview] = React.useState<ThemeId | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabType>(TABS.TRACKER);
  const [records, setRecords] = React.useState<Record<string, DailyRecord>>(loadRecords);
  const [devMode, setDevMode] = React.useState(false);
  const [editingDate, setEditingDate] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<{
    dateKey: string;
    record: DailyRecord;
    timeoutId: number;
  } | null>(null);

  React.useEffect(() => {
    if (!identifier) return;

    if (UUID_REGEX.test(identifier)) {
      setResolvedUuid(identifier);
      setResolving(false);
    } else if (isValidThemeId(identifier)) {
      // Theme preview mode: force this theme, use a demo UUID
      setThemePreview(identifier as ThemeId);
      applyTheme(identifier as ThemeId, 'dark');
      const demoId = 'theme-preview-' + identifier;
      setResolvedUuid(demoId);
      setResolving(false);
    } else {
      lookupUsername(identifier).then((uuid) => {
        if (uuid) {
          setResolvedUuid(uuid);
        } else {
          navigate('/', { replace: true });
        }
        setResolving(false);
      });
    }
  }, [identifier, navigate]);

  React.useEffect(() => {
    if (resolvedUuid && identifier && !UUID_REGEX.test(identifier) && !isValidThemeId(identifier)) {
      localStorage.setItem('maha_username', identifier);
    }
  }, [resolvedUuid, identifier]);

  // Custom hook manages Firebase Auth, Database Syncing, and DevMode checking
  const { isDevUrl, userId, showWarning, setShowWarning, settings, updateSettings } = useAppInitialization(setRecords, themePreview ? undefined : resolvedUuid ?? undefined);
  const syncStatus = useSyncStatus();
  const [showUsernamePopup, setShowUsernamePopup] = React.useState(false);

  // Derived challenge/floor height from settings
  const activeChallenge: ActiveChallenge = settings.activeChallenge ?? migrateDefaultChallenge(settings.defaultChallenge);
  const floorHeight = settings.floorHeight ?? DEFAULT_FLOOR_HEIGHT;

  const handleManualSync = async () => {
    if (!resolvedUuid) return;
    await syncAllLocalToCloud(resolvedUuid, records);
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

  const commitPendingDelete = React.useCallback((pd: { dateKey: string; record: DailyRecord; timeoutId: number }) => {
    clearTimeout(pd.timeoutId);
    if (userId) {
      deleteRecordFromCloud(userId, pd.dateKey);
    }
    setPendingDelete(null);
  }, [userId]);

  const handleTap = (type: 'up' | 'down') => {
    setRecords((prev) => calculateTapUpdate(prev, type, userId, editingDate ?? undefined));
  };

  const handleSelectDate = (dateStr: string | null) => {
    setEditingDate(dateStr);
    if (dateStr && !records[dateStr]) {
      setRecords((prev) => ({
        ...prev,
        [dateStr]: { dateStr, up: 0, down: 0, total: 0 },
      }));
    }
  };

  const handleDelete = () => {
    if (!editingDate) return;
    const dateKey = editingDate;
    const record = records[dateKey];
    if (!record) return;

    if (pendingDelete) {
      commitPendingDelete(pendingDelete);
    }

    const isToday = dateKey === todayKey;

    if (isToday) {
      // Reset today to zero instead of removing
      const zeroRecord = { dateStr: dateKey, up: 0, down: 0, total: 0 };
      setRecords((prev) => ({ ...prev, [dateKey]: zeroRecord }));
    } else {
      // Remove past day entirely
      setRecords((prev) => {
        const next = { ...prev };
        delete next[dateKey];
        return next;
      });
    }

    setEditingDate(null);

    const timeoutId = window.setTimeout(() => {
      if (userId) {
        if (isToday) {
          // Sync the zeroed record to cloud
          syncRecordToCloud(userId, dateKey, { dateStr: dateKey, up: 0, down: 0, total: 0 });
        } else {
          deleteRecordFromCloud(userId, dateKey);
        }
      }
      setPendingDelete(null);
    }, 10_000);

    setPendingDelete({ dateKey, record, timeoutId });
  };

  const handleUndo = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timeoutId);
    setRecords((prev) => ({
      ...prev,
      [pendingDelete.dateKey]: pendingDelete.record,
    }));
    setPendingDelete(null);
  };

  React.useEffect(() => {
    if (activeTab !== TABS.TRACKER && pendingDelete) {
      commitPendingDelete(pendingDelete);
    }
  }, [activeTab, pendingDelete, commitPendingDelete]);

  const displayTotal = editingDate
    ? (records[editingDate]?.total || 0)
    : (records[todayKey]?.total || 0);
  const sortedRecords = sortRecordsDesc(records);

  // Theme monitoring
  React.useEffect(() => {
    // Theme preview from URL takes priority over settings
    if (themePreview) {
      applyTheme(themePreview, 'dark');
      return;
    }
    const themeId: ThemeId = isValidThemeId(settings.theme ?? '') ? (settings.theme as ThemeId) : DEFAULT_THEME_ID;
    const colorMode = settings.colorMode || 'system';
    applyTheme(themeId, colorMode);
  }, [settings.theme, settings.colorMode, themePreview]);

  // Show username popup for first-time users after warning is dismissed
  React.useEffect(() => {
    if (!showWarning && userId && !settings.username && localStorage.getItem('maha_user_id') === userId) {
      const isNewUser = !localStorage.getItem('maha_username_prompted');
      if (isNewUser) {
        setShowUsernamePopup(true);
      }
    }
  }, [showWarning, userId, settings.username]);

  if (resolving) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-surface bg-topo flex flex-col items-center py-8 px-4 font-sans text-fg transition-colors duration-300">
      {/* Ambient effects layer (bubbles, embers, scanlines — theme-dependent) */}
      <div className="fx-ambient" />
      {/* Navigation Tabs */}
      <NavigationTabs activeTab={activeTab} setActiveTab={(tab) => { setEditingDate(null); setActiveTab(tab); }} syncStatus={syncStatus} />
      <OnboardingWarning showWarning={showWarning} setShowWarning={setShowWarning} />
      <UpdatePrompt />

      {showUsernamePopup && userId && (
        <UsernamePopup
          userId={userId}
          onComplete={(username) => {
            setShowUsernamePopup(false);
            localStorage.setItem('maha_username_prompted', 'true');
            if (username) {
              navigate(`/${username}`, { replace: true });
            }
          }}
        />
      )}

      {
        activeTab === TABS.TRACKER && (
          <TrackerTab
            displayTotal={displayTotal}
            editingDate={editingDate}
            handleTap={handleTap}
            onSelectDate={handleSelectDate}
            onDelete={handleDelete}
            sortedRecords={sortedRecords}
          />
        )
      }

      {
        activeTab === TABS.STATS && (
          <StatsTab
            records={records}
            todayKey={todayKey}
            floorHeight={floorHeight}
            activeChallenge={activeChallenge}
            onChallengeChange={(ac: ActiveChallenge) => updateSettings({ activeChallenge: ac })}
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
            floorHeight={floorHeight}
          />
        )
      }

      {/* Undo Delete Toast */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface-card border border-line rounded-full px-5 py-3 shadow-lg flex items-center gap-3 text-sm"
          >
            <span className="text-fg">
              Deleted <span className="font-semibold">{getShortDate(pendingDelete.dateKey)}</span>
            </span>
            <button
              onClick={handleUndo}
              className="font-bold text-accent hover:text-accent/80 transition-colors"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
  React.useEffect(() => {
    const root = document.documentElement;
    if (!root.className.includes('theme-')) {
      root.classList.add('theme-summit-instrument');
    }
  }, []);

  const storedId = localStorage.getItem('maha_user_id');
  const storedUsername = localStorage.getItem('maha_username');
  const tempId = React.useMemo(() => crypto.randomUUID(), []);
  const defaultRoute = storedUsername || storedId || tempId;

  return (
    <Routes>
      <Route path="/:identifier" element={<MainApp />} />
      <Route path="/" element={<Navigate to={`/${defaultRoute}`} replace />} />
      <Route path="*" element={<Navigate to={`/${defaultRoute}`} replace />} />
    </Routes>
  );
}

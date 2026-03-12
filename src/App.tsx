import React from 'react';
import HelpTab from './components/HelpTab';
import NavigationTabs from './components/NavigationTabs';
import OnboardingWarning from './components/OnboardingWarning';
import StatsTab from './components/StatsTab';
import TrackerTab from './components/TrackerTab';
import { DailyRecord } from './types';
import { getTodayKey } from './utils/date';
import { confirmResetData, generateDummyData } from './utils/dev';
import { syncRecordToCloud } from './utils/firebase';
import { loadRecords, saveRecords } from './utils/storage';
import { useAppInitialization } from './utils/useAppInitialization';


export default function App() {
  const [activeTab, setActiveTab] = React.useState<'tracker' | 'stats' | 'help'>('tracker');
  const [records, setRecords] = React.useState<Record<string, DailyRecord>>(loadRecords);
  const [devMode, setDevMode] = React.useState(false);

  // Custom hook manages UUID routing, Firebase Auth, Database Syncing, and DevMode checking
  const { isDevUrl, userId, showWarning, setShowWarning } = useAppInitialization(setRecords);

  React.useEffect(() => {
    saveRecords(records);
  }, [records]);

  const injectDummyData = () => {
    setRecords(generateDummyData());
  };

  const resetData = () => {
    if (confirmResetData()) {
      setRecords({});
    }
  };

  const handleTap = (type: 'up' | 'down') => {
    const today = getTodayKey();
    setRecords((prev) => {
      const todayRecord = prev[today] || { dateStr: today, up: 0, down: 0, total: 0 };
      const newUp = type === 'up' ? todayRecord.up + 1 : todayRecord.up;
      const newDown = type === 'down' ? todayRecord.down + 1 : todayRecord.down;
      const newTotal = newUp * 1 + newDown * 0.5;

      const updatedRecord = {
        ...todayRecord,
        up: newUp,
        down: newDown,
        total: newTotal
      };

      // Fire and forget sync to cloud
      if (userId) {
        syncRecordToCloud(userId, today, updatedRecord);
      }

      return {
        ...prev,
        [today]: updatedRecord
      };
    });
  };

  const todayKey = getTodayKey();
  const todayTotal = records[todayKey]?.total || 0;
  const sortedRecords = Object.values(records).sort((a, b) => b.dateStr.localeCompare(a.dateStr));

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center py-8 px-4 font-sans text-zinc-900">
      {/* Navigation Tabs */}
      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <OnboardingWarning showWarning={showWarning} setShowWarning={setShowWarning} />

      {
        activeTab === 'tracker' && (
          <TrackerTab
            todayTotal={todayTotal}
            handleTap={handleTap}
            sortedRecords={sortedRecords}
          />
        )
      }

      {
        activeTab === 'stats' && (
          <StatsTab
            records={records}
            todayKey={todayKey}
          />
        )
      }

      {
        activeTab === 'help' && <HelpTab />}

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

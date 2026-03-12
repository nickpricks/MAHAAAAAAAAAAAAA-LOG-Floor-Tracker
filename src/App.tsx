import { useState, useEffect } from 'react';
import { DEV_MODE_QUERY_PARAM } from './constants';
import { DailyRecord } from './types';
import { loadRecords, saveRecords } from './utils/storage';
import { initializeFirebaseSession, syncRecordToCloud, syncAllLocalToCloud } from './utils/firebase';
import { isDevModeEnabled, generateDummyData, confirmResetData } from './utils/dev';
import { getTodayKey } from './utils/date';
import TrackerTab from './components/TrackerTab';
import StatsTab from './components/StatsTab';
import HelpTab from './components/HelpTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'stats' | 'help'>('tracker');
  const [records, setRecords] = useState<Record<string, DailyRecord>>(loadRecords);
  const [devMode, setDevMode] = useState(false);
  const [isDevUrl, setIsDevUrl] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState<boolean>(false);

  useEffect(() => {
    // 1. Dev Mode Check
    if (isDevModeEnabled()) {
      setIsDevUrl(true);
    }

    // 2. Standard UUID Routing Logic
    const baseUrl = import.meta.env.BASE_URL; // Handles '/' in dev or '/RepoName/' in prod
    let currentPath = window.location.pathname;
    
    // Srtip out the base path to extract just the UUID
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
  }, []);

  useEffect(() => {
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
      <div className="flex gap-1 mb-8 bg-white p-1.5 rounded-full shadow-sm border border-zinc-200 overflow-x-auto max-w-full">
        <button 
          onClick={() => setActiveTab('tracker')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'tracker' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
        >
          Tracker
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
        >
          Stats
        </button>
        <button 
          onClick={() => setActiveTab('help')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'help' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
        >
          Help & Docs
        </button>
      </div>

      {showWarning && (
        <div className="mb-6 w-full max-w-sm bg-red-100 border border-red-200 text-red-800 p-4 rounded-xl shadow-sm text-sm relative animate-in fade-in slide-in-from-top-4 duration-500">
           <button 
             onClick={() => setShowWarning(false)} 
             className="absolute top-2 right-2 text-red-400 hover:text-red-700 font-bold p-1"
           >
             ✕
           </button>
           <strong className="block mb-1">⚠️ Unsaved Changes Risk</strong>
           Your progress is currently saved <b>only on this device</b> via this unique URL: <br/>
           <code className="text-xs bg-red-200/50 px-1 py-0.5 rounded mt-1 block mb-2 break-all">{window.location.href}</code>
           Please <b>bookmark this URL</b> or open it on your phone to ensure you don't lose your data!
        </div>
      )}

      {activeTab === 'tracker' && (
        <TrackerTab 
          todayTotal={todayTotal} 
          handleTap={handleTap} 
          sortedRecords={sortedRecords} 
        />
      )}

      {activeTab === 'stats' && (
        <StatsTab 
          records={records} 
          todayKey={todayKey} 
        />
      )}

      {activeTab === 'help' && <HelpTab />}

      {/* Dev Mode Toggle (Only visible if ?devMode=true) */}
      {isDevUrl && (
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
          
          {devMode && (
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
          )}
        </div>
      )}
    </div>
  );
}

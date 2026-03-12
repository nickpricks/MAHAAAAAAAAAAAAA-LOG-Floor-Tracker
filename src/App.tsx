import { useState, useEffect } from 'react';
import { DEV_MODE_QUERY_PARAM } from './constants';
import { DailyRecord } from './types';
import { loadRecords, saveRecords } from './utils/storage';
import TrackerTab from './components/TrackerTab';
import StatsTab from './components/StatsTab';
import HelpTab from './components/HelpTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'stats' | 'help'>('tracker');
  const [records, setRecords] = useState<Record<string, DailyRecord>>(loadRecords);
  const [devMode, setDevMode] = useState(false);
  const [isDevUrl, setIsDevUrl] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get(DEV_MODE_QUERY_PARAM) === 'true') {
      setIsDevUrl(true);
    }
  }, []);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const injectDummyData = () => {
    const dummy: Record<string, DailyRecord> = {};
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const up = Math.floor(Math.random() * 20) + 5; // 5 to 24
      const down = Math.floor(Math.random() * 10); // 0 to 9
      dummy[dateStr] = {
        dateStr,
        up,
        down,
        total: up * 1 + down * 0.5
      };
    }
    setRecords(dummy);
  };

  const resetData = () => {
    if (window.confirm("Are you sure you want to delete all data?")) {
      setRecords({});
    }
  };

  const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleTap = (type: 'up' | 'down') => {
    const today = getTodayKey();
    setRecords((prev) => {
      const todayRecord = prev[today] || { dateStr: today, up: 0, down: 0, total: 0 };
      const newUp = type === 'up' ? todayRecord.up + 1 : todayRecord.up;
      const newDown = type === 'down' ? todayRecord.down + 1 : todayRecord.down;
      const newTotal = newUp * 1 + newDown * 0.5;
      
      return {
        ...prev,
        [today]: {
          ...todayRecord,
          up: newUp,
          down: newDown,
          total: newTotal
        }
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

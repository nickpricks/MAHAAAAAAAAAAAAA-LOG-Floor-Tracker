import React from 'react';
import { useSyncStatus } from '../utils/firebase';
import { Cloud, CloudOff, RefreshCw, AlertCircle, User } from 'lucide-react';
import { TABS, TabType } from '../constants';

type Props = {
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
};

export default function NavigationTabs({ activeTab, setActiveTab }: Props) {
  const syncStatus = useSyncStatus();

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin-slow" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'offline':
        return <CloudOff className="w-4 h-4 text-zinc-400" />;
      default:
        return <Cloud className="w-4 h-4 text-zinc-300" />;
    }
  };

  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="flex gap-1 bg-white dark:bg-zinc-900 p-1.5 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab(TABS.TRACKER)}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === TABS.TRACKER ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md dark:shadow-zinc-800' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          Tracker
        </button>
        <button
          onClick={() => setActiveTab(TABS.STATS)}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === TABS.STATS ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md dark:shadow-zinc-800' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          Stats
        </button>
        <button
          onClick={() => setActiveTab(TABS.HELP)}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === TABS.HELP ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md dark:shadow-zinc-800' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          Help
        </button>
        <button
          onClick={() => setActiveTab(TABS.PROFILE)}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === TABS.PROFILE ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md dark:shadow-zinc-800' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          <User size={14} />
          Profile
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-2 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-center" title={`Sync Status: ${syncStatus}`}>
        {getSyncIcon()}
      </div>
    </div>
  );
}

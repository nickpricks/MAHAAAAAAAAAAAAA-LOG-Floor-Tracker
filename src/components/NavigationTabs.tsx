import React from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle, User } from 'lucide-react';
import { TABS, TabType } from '@/constants';
import type { SyncStatus } from '@utils/firebase';

type Props = {
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
  syncStatus: SyncStatus;
};

const syncDot: Record<SyncStatus, string> = {
  synced: 'bg-emerald-400',
  syncing: 'bg-blue-400 animate-pulse',
  error: 'bg-red-400',
  offline: 'bg-zinc-400',
};

export default function NavigationTabs({ activeTab, setActiveTab, syncStatus }: Props) {

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin-slow" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'offline':
        return <CloudOff className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <Cloud className="w-3.5 h-3.5 text-fg-subtle" />;
    }
  };

  const tabClass = (tab: TabType) =>
    `px-3 sm:px-5 py-2 rounded-full text-sm font-display font-bold transition-all whitespace-nowrap ${
      activeTab === tab
        ? 'bg-accent text-surface shadow-md shadow-accent/20'
        : 'text-fg-muted hover:text-fg hover:bg-surface-hover'
    }`;

  return (
    <div className="flex items-center gap-1.5 bg-surface-card p-1.5 rounded-full shadow-sm border border-line mb-8 max-w-full">
      {/* Sync status indicator — compact dot on mobile, icon on larger screens */}
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        title={`Sync: ${syncStatus}`}
      >
        <span className="sm:hidden relative flex h-2.5 w-2.5">
          {syncStatus === 'syncing' && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${syncDot[syncStatus]}`} />
        </span>
        <span className="hidden sm:flex">
          {getSyncIcon()}
        </span>
      </div>

      <button onClick={() => setActiveTab(TABS.TRACKER)} className={tabClass(TABS.TRACKER)}>
        Tracker
      </button>
      <button onClick={() => setActiveTab(TABS.STATS)} className={tabClass(TABS.STATS)}>
        Stats
      </button>
      <button onClick={() => setActiveTab(TABS.HELP)} className={tabClass(TABS.HELP)}>
        Help
      </button>
      <button
        onClick={() => setActiveTab(TABS.PROFILE)}
        className={`${tabClass(TABS.PROFILE)} flex items-center gap-1.5`}
      >
        <User size={14} />
        <span className="hidden sm:inline">Profile</span>
      </button>
    </div>
  );
}

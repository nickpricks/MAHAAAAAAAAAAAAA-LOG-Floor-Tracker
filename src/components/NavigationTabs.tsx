import React from 'react';


type Props = {
  activeTab: 'tracker' | 'stats' | 'help';
  setActiveTab: React.Dispatch<React.SetStateAction<'tracker' | 'stats' | 'help'>>;
};


export default function NavigationTabs({ activeTab, setActiveTab }: Props) {
  return (
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
  );
}

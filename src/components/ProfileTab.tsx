import React from 'react';
import { User, Moon, Sun, Monitor, Hash, ShieldCheck, Trophy } from 'lucide-react';
import { CHALLENGES, THEMES, TabType } from '../constants';
import { UserSettings } from '../utils/firebase';

type Props = {
  userId: string | null;
  settings: UserSettings;
  updateSettings: (newSettings: UserSettings) => void;
};

export default function ProfileTab({ userId, settings, updateSettings }: Props) {
  const currentTheme = settings.theme || THEMES.SYSTEM;
  const currentChallenge = settings.defaultChallenge || CHALLENGES[4].id;

  const themes = [
    { id: THEMES.LIGHT, name: 'Light', icon: Sun },
    { id: THEMES.DARK, name: 'Dark', icon: Moon },
    { id: THEMES.SYSTEM, name: 'Device', icon: Monitor },
  ];

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-200 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-200 text-zinc-400">
          <User size={40} />
        </div>
        <h2 className="text-2xl font-black text-zinc-800">Your Profile</h2>
        <p className="text-sm text-zinc-500 mt-1">Synced across your devices</p>
      </div>

      {/* User ID Section */}
      <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
        <div className="flex items-center gap-2 mb-2 text-zinc-400">
          <Hash size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Unique Identifier</span>
        </div>
        <code className="text-[10px] break-all text-zinc-600 font-mono bg-white p-2 rounded-lg border border-zinc-200 block">
          {userId || 'Loading...'}
        </code>
        <div className="flex items-center gap-1.5 mt-3 text-green-600">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-bold">Cloud Synced & Anonymous</span>
        </div>
      </div>

      {/* Theme Selection */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
          <Monitor size={14} /> Appearance
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => {
            const Icon = t.icon;
            const active = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => updateSettings({ theme: t.id as any })}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  active
                    ? 'bg-zinc-900 border-zinc-900 text-white shadow-md'
                    : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] font-bold">{t.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Default Challenge */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
          <Trophy size={14} /> Default Goal
        </h3>
        <select
          value={currentChallenge}
          onChange={(e) => updateSettings({ defaultChallenge: e.target.value })}
          className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 text-sm font-bold rounded-xl focus:ring-zinc-500 focus:border-zinc-500 block p-3 cursor-pointer shadow-sm"
        >
          {CHALLENGES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name} ({c.meters}m)
            </option>
          ))}
        </select>
        <p className="text-[10px] text-zinc-400 mt-2 px-1">
          This challenge will be shown by default on your stats dashboard.
        </p>
      </section>

      <div className="mt-4 pt-6 border-t border-zinc-100 text-center">
        <p className="text-[10px] text-zinc-300 font-medium">
          Floor Tracker v0.0.3 • Open Source Refactoring
        </p>
      </div>
    </div>
  );
}

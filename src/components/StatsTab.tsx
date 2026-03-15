import React from 'react';
import { Info, X } from 'lucide-react';
import { CHALLENGES, METERS_PER_FLOOR } from '../constants';
import { DailyRecord } from '../types';
import { getLast7DaysKeys } from '../utils/date';


type Props = {
  records: Record<string, DailyRecord>;
  todayKey: string;
};


export default function StatsTab({ records, todayKey }: Props) {
  const [challengeId, setChallengeId] = React.useState(CHALLENGES[4].id); // Default to Everest
  const [showInfo, setShowInfo] = React.useState(false);

  const currentMonthPrefix = todayKey.substring(0, 7); // YYYY-MM
  const last7Days = getLast7DaysKeys();

  let todayFloors = 0;
  let weekFloors = 0;
  let monthFloors = 0;
  let totalFloors = 0;

  Object.values(records).forEach(record => {
    totalFloors += record.total;
    if (record.dateStr === todayKey) todayFloors += record.total;
    if (last7Days.includes(record.dateStr)) weekFloors += record.total;
    if (record.dateStr.startsWith(currentMonthPrefix)) monthFloors += record.total;
  });

  const todayMeters = todayFloors * METERS_PER_FLOOR;
  const weekMeters = weekFloors * METERS_PER_FLOOR;
  const monthMeters = monthFloors * METERS_PER_FLOOR;
  const totalMeters = totalFloors * METERS_PER_FLOOR;

  const activeChallenge = CHALLENGES.find(c => c.id === challengeId) || CHALLENGES[4];
  const remainingMeters = Math.max(0, activeChallenge.meters - totalMeters);
  const progressPercent = Math.min(100, (totalMeters / activeChallenge.meters) * 100);

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-200 flex flex-col gap-6">
      <div className="text-center">
        <div className="text-5xl mb-2">⛰️</div>
        <h2 className="text-2xl font-black text-zinc-800">Leaderboard</h2>
        <p className="text-sm text-zinc-500 mt-1">1 floor ≈ 3 meters</p>
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <div className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
          <span className="font-bold text-zinc-600">Today</span>
          <span className="text-xl font-black text-zinc-800 tabular-nums">{todayMeters.toLocaleString()} <span className="text-sm text-zinc-400 font-bold">m</span></span>
        </div>
        <div className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
          <span className="font-bold text-zinc-600">This Week</span>
          <span className="text-xl font-black text-zinc-800 tabular-nums">{weekMeters.toLocaleString()} <span className="text-sm text-zinc-400 font-bold">m</span></span>
        </div>
        <div className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
          <span className="font-bold text-zinc-600">This Month</span>
          <span className="text-xl font-black text-zinc-800 tabular-nums">{monthMeters.toLocaleString()} <span className="text-sm text-zinc-400 font-bold">m</span></span>
        </div>
      </div>

      <div className="mt-4 pt-6 border-t border-zinc-100 relative">
        <div className="flex justify-between items-center mb-4">
          <select
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 text-zinc-800 text-sm font-bold rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer shadow-sm pr-8"
          >
            {
              CHALLENGES.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))
            }
          </select>
          <button
            onClick={() => setShowInfo(true)}
            className="text-zinc-400 hover:text-blue-500 transition-colors p-1"
          >
            <Info size={20} />
          </button>
        </div>

        <div className="flex justify-between items-end mb-2">
          <span className="font-bold text-zinc-500 text-sm">Progress</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600 tracking-tighter">{progressPercent.toFixed(1)}%</span>
            <span className="text-sm font-bold text-zinc-400 tabular-nums">({totalMeters.toLocaleString()} / {activeChallenge.meters.toLocaleString()} m)</span>
          </div>
        </div>

        <div className="w-full bg-zinc-100 rounded-full h-6 mb-3 overflow-hidden shadow-inner border border-zinc-200/50">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 h-6 rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-2"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          >
            {
              progressPercent >= 10 &&
              <span className="text-[10px] font-bold text-white/90 drop-shadow-sm">🚀</span>
            }
          </div>
        </div>

        <p className="text-sm font-medium text-zinc-500 text-center mt-4">
          {
            remainingMeters > 0
              ? `${remainingMeters.toLocaleString()} m remaining to summit!`
              : '🎉 You reached the top!'
          }
        </p>
      </div>

      {/* Info Modal */}
      {
        showInfo && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 rounded-[2rem] p-8 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-700 p-2 bg-zinc-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-black text-zinc-800 mb-6 text-center">Fun Facts 💡</h3>

            <div className="flex flex-col gap-4">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center gap-4">
                <span className="text-3xl">🦒</span>
                <div>
                  <p className="font-bold text-orange-900">Adult Giraffes</p>
                  <p className="text-sm text-orange-700">You've climbed the equivalent of <b>{Math.floor(totalMeters / 5).toLocaleString()}</b> stacked giraffes.</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center gap-4">
                <span className="text-3xl">🍕</span>
                <div>
                  <p className="font-bold text-yellow-900">Pizza Boxes</p>
                  <p className="text-sm text-yellow-700">That's about <b>{Math.floor(totalMeters / 0.045).toLocaleString()}</b> stacked pizza boxes!</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
                <span className="text-3xl">🗽</span>
                <div>
                  <p className="font-bold text-blue-900">Statue of Liberty</p>
                  <p className="text-sm text-blue-700">You've scaled lady liberty <b>{(totalMeters / 93).toFixed(1)}</b> times.</p>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}

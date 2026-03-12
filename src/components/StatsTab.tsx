import { DailyRecord } from '../types';
import { METERS_PER_FLOOR, EVEREST_METERS } from '../constants';

type Props = {
  records: Record<string, DailyRecord>;
  todayKey: string;
};

export default function StatsTab({ records, todayKey }: Props) {
  const currentMonthPrefix = todayKey.substring(0, 7); // YYYY-MM
  
  // Calculate dates for the last 7 days
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

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
  const remainingEverest = Math.max(0, EVEREST_METERS - totalMeters);
  const everestProgress = Math.min(100, (totalMeters / EVEREST_METERS) * 100);

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

      <div className="mt-4 pt-6 border-t border-zinc-100">
        <div className="flex justify-between items-end mb-3">
          <span className="font-bold text-zinc-800">Everest Challenge</span>
          <span className="text-sm font-bold text-zinc-400 tabular-nums">{totalMeters.toLocaleString()} / {EVEREST_METERS.toLocaleString()} m</span>
        </div>
        
        <div className="w-full bg-zinc-100 rounded-full h-4 mb-3 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${everestProgress}%` }}
          ></div>
        </div>
        
        <p className="text-sm font-medium text-zinc-500 text-center">
          {remainingEverest > 0 
            ? `${remainingEverest.toLocaleString()} m remaining to summit!` 
            : '🎉 You reached the summit!'}
        </p>
      </div>
    </div>
  );
}

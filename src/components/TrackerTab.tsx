import { DailyRecord } from '../types';

type Props = {
  todayTotal: number;
  handleTap: (type: 'up' | 'down') => void;
  sortedRecords: DailyRecord[];
};

export default function TrackerTab({ todayTotal, handleTap, sortedRecords }: Props) {
  const getDayName = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getFormattedDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <>
      {/* Main Tracker */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-200 flex flex-col items-center gap-2 w-full max-w-sm mb-8">
        <div className="text-5xl mb-2">🏢</div>
        <div className="text-sm font-bold tracking-[0.2em] text-zinc-400 uppercase">
          Today's Floors
        </div>
        <div className="text-7xl font-black text-zinc-800 tabular-nums my-4">
          {todayTotal}
        </div>
        
        <div className="flex gap-4 w-full mt-4">
          <button
            onClick={() => handleTap('up')}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white rounded-2xl text-lg font-bold shadow-md flex flex-col items-center justify-center gap-1"
          >
            <span className="text-2xl">⬆️</span>
            <span>UP</span>
          </button>
          <button
            onClick={() => handleTap('down')}
            className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all text-white rounded-2xl text-lg font-bold shadow-md flex flex-col items-center justify-center gap-1"
          >
            <span className="text-2xl">⬇️</span>
            <span>DOWN</span>
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="w-full max-w-sm">
        <h2 className="text-lg font-bold text-zinc-700 mb-4 px-2">History</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          {sortedRecords.length === 0 ? (
            <div className="p-6 text-center text-zinc-400 text-sm">No floors tracked yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="p-4 font-semibold">Day</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold text-right">Floors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sortedRecords.map((record) => (
                  <tr key={record.dateStr} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-zinc-700">{getDayName(record.dateStr)}</td>
                    <td className="p-4 text-sm text-zinc-500">{getFormattedDate(record.dateStr)}</td>
                    <td className="p-4 text-base font-bold text-zinc-800 text-right tabular-nums">{record.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

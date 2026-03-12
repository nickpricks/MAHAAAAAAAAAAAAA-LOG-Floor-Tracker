import { motion, useAnimationControls } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { DailyRecord } from '../types';
import { getDayName, getFormattedDate } from '../utils/date';
import { TRACKER_UI } from '../constants';

type Props = {
  todayTotal: number;
  handleTap: (type: 'up' | 'down') => void;
  sortedRecords: DailyRecord[];
};

export default function TrackerTab({ todayTotal, handleTap, sortedRecords }: Props) {
  const counterControls = useAnimationControls();
  const upControls = useAnimationControls();
  const downControls = useAnimationControls();

  // Scale font from MIN_FONT_REM (0 floors) to MAX_FONT_REM (MAX_SCALE_FLOORS+ floors)
  const { MIN_FONT_REM, MAX_FONT_REM, MAX_SCALE_FLOORS } = TRACKER_UI;
  const fontSize = `${MIN_FONT_REM + (MAX_FONT_REM - MIN_FONT_REM) * (Math.min(todayTotal, MAX_SCALE_FLOORS) / MAX_SCALE_FLOORS)}rem`;

  const onTap = (type: 'up' | 'down') => {
    navigator.vibrate?.(20);
    counterControls.start({ scale: [1, 1.15, 1], transition: { duration: 0.25 } });
    const btnControls = type === 'up' ? upControls : downControls;
    btnControls.start({
      boxShadow: [
        '0 0 0 2px rgba(250,204,21,0), 0 0 0px rgba(250,204,21,0)',
        '0 0 0 3px rgba(250,204,21,0.9), 0 0 20px rgba(250,204,21,0.5)',
        '0 0 0 2px rgba(250,204,21,0), 0 0 0px rgba(250,204,21,0)',
      ],
      transition: { duration: 0.6 },
    });
    handleTap(type);
  };

  return (
    <>
      {/* Main Tracker */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-200 flex flex-col items-center w-full max-w-sm mb-8">
        <div className="text-5xl mb-4">🏢</div>
        <div className="text-sm font-bold tracking-[0.2em] text-zinc-400 uppercase mb-2">
          Today's Floors
        </div>

        <motion.button
          onClick={() => onTap('up')}
          animate={upControls}
          className="w-20 h-20 bg-zinc-800 hover:bg-zinc-700 active:scale-90 transition-transform text-zinc-300 rounded-full border-2 border-zinc-600 flex items-center justify-center"
        >
          <ChevronUp size={28} strokeWidth={2.5} />
        </motion.button>

        <div className="h-40 flex items-center justify-center my-2">
          <motion.div
            animate={counterControls}
            style={{ fontSize }}
            className="leading-none font-bold text-zinc-800 tabular-nums transition-all duration-300"
          >
            {todayTotal}
          </motion.div>
        </div>

        <motion.button
          onClick={() => onTap('down')}
          animate={downControls}
          className="w-20 h-20 bg-zinc-800 hover:bg-zinc-700 active:scale-90 transition-transform text-zinc-300 rounded-full border-2 border-zinc-600 flex items-center justify-center"
        >
          <ChevronDown size={28} strokeWidth={2.5} />
        </motion.button>
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

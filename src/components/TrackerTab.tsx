import { motion, useAnimationControls } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { DailyRecord } from '@/types';
import { getDayName, getFormattedDate } from '@utils/date';
import { TRACKER_UI } from '@/constants';


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
    counterControls.start({ scale: [1, 1.12, 1], transition: { duration: 0.2, ease: 'easeOut' } });
    const btnControls = type === 'up' ? upControls : downControls;
    btnControls.start({
      scale: [1, 0.92, 1],
      transition: { duration: 0.25 },
    });
    handleTap(type);
  };

  return (
    <>
      {/* Main Tracker */}
      <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center w-full max-w-sm mb-8 overflow-hidden">
        {/* Decorative contour rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] dark:opacity-[0.06]">
          <div className="w-[500px] h-[500px] rounded-full border border-amber-500" />
          <div className="absolute w-[400px] h-[400px] rounded-full border border-amber-500" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-amber-500" />
          <div className="absolute w-[200px] h-[200px] rounded-full border border-amber-500" />
        </div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <div className="font-display text-[10px] font-bold tracking-[0.3em] text-zinc-400 dark:text-zinc-500 uppercase mb-6">
            Today&rsquo;s Altitude
          </div>

          <motion.button
            onClick={() => onTap('up')}
            animate={upControls}
            className="btn-brass w-16 h-16 rounded-full flex items-center justify-center text-zinc-900"
          >
            <ChevronUp size={26} strokeWidth={2.5} />
          </motion.button>

          <div className="h-40 flex items-center justify-center my-3">
            <motion.div
              animate={counterControls}
              style={{ fontSize }}
              className="altitude-readout altitude-glow leading-none font-bold text-zinc-800 dark:text-zinc-100 transition-all duration-300"
            >
              {todayTotal}
            </motion.div>
          </div>

          <motion.button
            onClick={() => onTap('down')}
            animate={downControls}
            className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors shadow-sm border border-zinc-300 dark:border-zinc-700"
          >
            <ChevronDown size={26} strokeWidth={2.5} />
          </motion.button>

          <div className="mt-6 font-mono text-[10px] text-zinc-400 dark:text-zinc-600 tracking-widest uppercase">
            floors
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="w-full max-w-sm">
        <h2 className="font-display text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-4 px-2 tracking-wide uppercase">Log</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {
            sortedRecords.length === 0 &&
            <div className="p-6 text-center text-zinc-400 dark:text-zinc-500 text-sm font-mono">No entries yet.</div>
          }
          {
            sortedRecords.length !== 0 &&
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="p-4 font-semibold font-display">Day</th>
                  <th className="p-4 font-semibold font-display">Date</th>
                  <th className="p-4 font-semibold font-display text-right">Floors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {sortedRecords.map((record) => (
                  <tr key={record.dateStr} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">{getDayName(record.dateStr)}</td>
                    <td className="p-4 text-sm text-zinc-500 dark:text-zinc-400 font-mono">{getFormattedDate(record.dateStr)}</td>
                    <td className="p-4 text-base font-bold text-amber-600 dark:text-amber-400 text-right font-mono tabular-nums">{record.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      </div>
    </>
  );
}

import React from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, ArrowBigUp, ArrowBigDown, ArrowUp, ArrowDown, Plus, Minus, type LucideIcon } from 'lucide-react';
import type { ThemeId } from '@utils/themes';
import { DailyRecord } from '@/types';
import { getDayName, getFormattedDate } from '@utils/date';
import { TRACKER_UI } from '@/constants';
import { useActiveThemeId } from '@utils/themes';

type Props = {
  todayTotal: number;
  handleTap: (type: 'up' | 'down') => void;
  sortedRecords: DailyRecord[];
};

type TrackerVariantProps = {
  todayTotal: number;
  handleTap: (type: 'up' | 'down') => void;
  counterControls: ReturnType<typeof useAnimationControls>;
  upControls: ReturnType<typeof useAnimationControls>;
  downControls: ReturnType<typeof useAnimationControls>;
  fontSize: string;
};

const THEME_ICONS: Record<ThemeId, { up: LucideIcon; down: LucideIcon }> = {
  'summit-instrument': { up: ChevronUp, down: ChevronDown },
  'night-city-elevator': { up: ChevronUp, down: ChevronDown },
  'night-city-apartment': { up: Plus, down: Minus },
  'deep-mariana': { up: ChevronsUp, down: ChevronsDown },
  'industrial-furnace': { up: ArrowBigUp, down: ArrowBigDown },
  'corporate-glass': { up: ArrowUp, down: ArrowDown },
};

function useClickGlow() {
  const upRef = React.useRef<HTMLButtonElement>(null);
  const downRef = React.useRef<HTMLButtonElement>(null);

  const triggerGlow = (ref: React.RefObject<HTMLButtonElement | null>) => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('btn-click-glow');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('btn-click-glow');
  };

  return { upRef, downRef, triggerGlow };
}

function DefaultTracker({ todayTotal, handleTap, counterControls, upControls, downControls, fontSize, themeId }: TrackerVariantProps & { themeId: ThemeId }) {
  const { upRef, downRef, triggerGlow } = useClickGlow();
  const icons = THEME_ICONS[themeId] || THEME_ICONS['summit-instrument'];
  const UpIcon = icons.up;
  const DownIcon = icons.down;

  const onTap = (type: 'up' | 'down') => {
    navigator.vibrate?.(20);
    counterControls.start({ scale: [1, 1.12, 1], transition: { duration: 0.2, ease: 'easeOut' } });
    const btnControls = type === 'up' ? upControls : downControls;
    btnControls.start({ scale: [1, 0.92, 1], transition: { duration: 0.25 } });
    triggerGlow(type === 'up' ? upRef : downRef);
    handleTap(type);
  };

  return (
    <div className="relative bg-surface-card p-8 rounded-[2rem] shadow-sm border border-line flex flex-col items-center w-full max-w-sm mb-8 overflow-hidden">
      {/* Decorative accent rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
        <div className="w-[500px] h-[500px] rounded-full border border-accent" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-accent" />
        <div className="absolute w-[300px] h-[300px] rounded-full border border-accent" />
        <div className="absolute w-[200px] h-[200px] rounded-full border border-accent" />
      </div>
      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="font-display text-[10px] font-bold tracking-[0.3em] text-fg-subtle uppercase mb-6">
          Today&rsquo;s Altitude
        </div>
        <motion.button
          ref={upRef}
          onClick={() => onTap('up')}
          animate={upControls}
          className="btn-theme-up btn-uniform w-16 h-16 rounded-full flex items-center justify-center text-fg-muted"
        >
          <UpIcon size={26} strokeWidth={2.5} />
        </motion.button>
        <div className="h-40 flex items-center justify-center my-3">
          <motion.div
            animate={counterControls}
            style={{ fontSize }}
            className="altitude-readout altitude-glow leading-none font-bold text-fg-heading transition-all duration-300"
          >
            {todayTotal}
          </motion.div>
        </div>
        <motion.button
          ref={downRef}
          onClick={() => onTap('down')}
          animate={downControls}
          className="btn-theme-down btn-uniform w-16 h-16 rounded-full flex items-center justify-center text-fg-muted"
        >
          <DownIcon size={26} strokeWidth={2.5} />
        </motion.button>
        <div className="mt-6 font-mono text-[10px] text-fg-subtle tracking-widest uppercase">floors</div>
      </div>
    </div>
  );
}

function ElevatorTracker({ todayTotal, handleTap, counterControls, upControls, downControls, fontSize }: TrackerVariantProps) {
  const { upRef, downRef, triggerGlow } = useClickGlow();

  const onTap = (type: 'up' | 'down') => {
    navigator.vibrate?.(20);
    counterControls.start({ scale: [1, 1.12, 1], transition: { duration: 0.2, ease: 'easeOut' } });
    const btnControls = type === 'up' ? upControls : downControls;
    btnControls.start({ scale: [1, 0.92, 1], transition: { duration: 0.25 } });
    triggerGlow(type === 'up' ? upRef : downRef);
    handleTap(type);
  };

  return (
    <div className="relative bg-surface-card p-8 rounded-2xl shadow-lg border border-line flex flex-col items-center w-full max-w-sm mb-8 overflow-hidden">
      <div className="absolute inset-0 bg-topo pointer-events-none" />
      <div className="elevator-seam" />
      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="font-display text-[10px] font-bold tracking-[0.3em] text-fg-subtle uppercase mb-6">
          Floor Indicator
        </div>
        <motion.button
          ref={upRef}
          onClick={() => onTap('up')}
          animate={upControls}
          className="btn-elevator btn-elevator-up w-14 h-14 flex items-center justify-center text-accent"
        >
          <ChevronUp size={24} strokeWidth={2.5} />
        </motion.button>
        <div className="h-40 flex items-center justify-center my-3">
          <motion.div
            animate={counterControls}
            style={{ fontSize }}
            className="altitude-readout altitude-glow leading-none font-bold text-accent transition-all duration-300"
          >
            {todayTotal}
          </motion.div>
        </div>
        <motion.button
          ref={downRef}
          onClick={() => onTap('down')}
          animate={downControls}
          className="btn-elevator btn-elevator-down w-14 h-14 flex items-center justify-center text-accent-secondary"
        >
          <ChevronDown size={24} strokeWidth={2.5} />
        </motion.button>
        <div className="mt-6 font-mono text-[10px] text-fg-subtle tracking-widest uppercase">floors</div>
      </div>
    </div>
  );
}

export default function TrackerTab({ todayTotal, handleTap, sortedRecords }: Props) {
  const counterControls = useAnimationControls();
  const upControls = useAnimationControls();
  const downControls = useAnimationControls();
  const themeId = useActiveThemeId();

  const { MIN_FONT_REM, MAX_FONT_REM, MAX_SCALE_FLOORS } = TRACKER_UI;
  const fontSize = `${MIN_FONT_REM + (MAX_FONT_REM - MIN_FONT_REM) * (Math.min(todayTotal, MAX_SCALE_FLOORS) / MAX_SCALE_FLOORS)}rem`;

  const trackerProps = { todayTotal, handleTap, counterControls, upControls, downControls, fontSize };

  return (
    <>
      {themeId === 'night-city-elevator'
        ? <ElevatorTracker {...trackerProps} />
        : <DefaultTracker {...trackerProps} themeId={themeId} />
      }

      <div className="w-full max-w-sm">
        <h2 className="font-display text-sm font-bold text-fg-muted mb-4 px-2 tracking-wide uppercase">Log</h2>
        <div className="bg-surface-card rounded-2xl shadow-sm border border-line overflow-hidden">
          {sortedRecords.length === 0 && (
            <div className="p-6 text-center text-fg-subtle text-sm font-mono">No entries yet.</div>
          )}
          {sortedRecords.length !== 0 && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-raised border-b border-line text-[10px] uppercase tracking-wider text-fg-muted">
                  <th className="p-4 font-semibold font-display">Day</th>
                  <th className="p-4 font-semibold font-display">Date</th>
                  <th className="p-4 font-semibold font-display text-right">Floors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {sortedRecords.map((record) => (
                  <tr key={record.dateStr} className="hover:bg-surface-hover transition-colors">
                    <td className="p-4 text-sm font-medium text-fg">{getDayName(record.dateStr)}</td>
                    <td className="p-4 text-sm text-fg-muted font-mono">{getFormattedDate(record.dateStr)}</td>
                    <td className="p-4 text-base font-bold text-accent text-right font-mono tabular-nums">{record.total}</td>
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

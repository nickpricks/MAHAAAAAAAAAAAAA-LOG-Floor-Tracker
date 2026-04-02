import React from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, ArrowBigUp, ArrowBigDown, ArrowUp, ArrowDown, Plus, Minus, Edit3, Check, X as XIcon, type LucideIcon } from 'lucide-react';
import type { ThemeId } from '@utils/themes';
import { DailyRecord } from '@/types';
import { getDayName, getFormattedDate } from '@utils/date';
import { TRACKER_UI } from '@/constants';
import { useActiveThemeId } from '@utils/themes';

const PAGE_SIZE = 10;

type Props = {
  todayTotal: number;
  handleTap: (type: 'up' | 'down') => void;
  sortedRecords: DailyRecord[];
  onUpdateRecord: (dateStr: string, up: number, down: number) => void;
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

export default function TrackerTab({ todayTotal, handleTap, sortedRecords, onUpdateRecord }: Props) {
  const counterControls = useAnimationControls();
  const upControls = useAnimationControls();
  const downControls = useAnimationControls();
  const themeId = useActiveThemeId();

  // Pagination
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const visibleRecords = sortedRecords.slice(0, visibleCount);
  const hasMore = visibleCount < sortedRecords.length;

  // Inline editing
  const [editingDate, setEditingDate] = React.useState<string | null>(null);
  const [editUp, setEditUp] = React.useState(0);
  const [editDown, setEditDown] = React.useState(0);

  const startEdit = (record: DailyRecord) => {
    setEditingDate(record.dateStr);
    setEditUp(record.up);
    setEditDown(record.down);
  };

  const saveEdit = () => {
    if (editingDate) {
      onUpdateRecord(editingDate, editUp, editDown);
      setEditingDate(null);
    }
  };

  const cancelEdit = () => {
    setEditingDate(null);
  };

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
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-raised border-b border-line text-[10px] uppercase tracking-wider text-fg-muted">
                    <th className="p-4 font-semibold font-display">Day</th>
                    <th className="p-4 font-semibold font-display">Date</th>
                    <th className="p-4 font-semibold font-display text-right">Floors</th>
                    <th className="p-4 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {visibleRecords.map((record) => (
                    editingDate === record.dateStr ? (
                      <tr key={record.dateStr} className="bg-surface-hover">
                        <td colSpan={4} className="p-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-fg-muted font-medium">{getDayName(record.dateStr)}</span>
                              <span className="text-fg-subtle font-mono text-xs">{getFormattedDate(record.dateStr)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 text-xs text-fg-muted font-bold">
                                <ChevronUp size={14} />
                                <input
                                  type="number"
                                  value={editUp}
                                  onChange={(e) => setEditUp(Math.max(0, parseInt(e.target.value) || 0))}
                                  min="0"
                                  className="w-16 bg-surface border border-line text-fg text-sm font-mono rounded-lg p-1.5 text-center focus:ring-accent focus:border-accent"
                                  autoFocus
                                />
                              </label>
                              <label className="flex items-center gap-1.5 text-xs text-fg-muted font-bold">
                                <ChevronDown size={14} />
                                <input
                                  type="number"
                                  value={editDown}
                                  onChange={(e) => setEditDown(Math.max(0, parseInt(e.target.value) || 0))}
                                  min="0"
                                  className="w-16 bg-surface border border-line text-fg text-sm font-mono rounded-lg p-1.5 text-center focus:ring-accent focus:border-accent"
                                />
                              </label>
                              <div className="ml-auto flex gap-1.5">
                                <button
                                  onClick={saveEdit}
                                  className="p-1.5 rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1.5 rounded-lg bg-surface border border-line text-fg-muted hover:text-fg transition-colors"
                                >
                                  <XIcon size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={record.dateStr} className="hover:bg-surface-hover transition-colors group">
                        <td className="p-4 text-sm font-medium text-fg">{getDayName(record.dateStr)}</td>
                        <td className="p-4 text-sm text-fg-muted font-mono">{getFormattedDate(record.dateStr)}</td>
                        <td className="p-4 text-base font-bold text-accent text-right font-mono tabular-nums">{record.total}</td>
                        <td className="p-4">
                          <button
                            onClick={() => startEdit(record)}
                            className="opacity-0 group-hover:opacity-100 text-fg-subtle hover:text-accent transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="w-full py-3 text-sm font-bold text-accent hover:bg-surface-hover transition-colors border-t border-line"
                >
                  Load More ({sortedRecords.length - visibleCount} remaining)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

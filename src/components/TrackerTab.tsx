import React from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, ArrowBigUp, ArrowBigDown, ArrowUp, ArrowDown, Plus, Minus, Trash2, RotateCcw, type LucideIcon } from 'lucide-react';
import type { ThemeId } from '@utils/themes';
import { DailyRecord } from '@/types';
import { getDayName, getFormattedDate, getShortDate, getTodayKey } from '@utils/date';
import { TRACKER_UI } from '@/constants';
import { useActiveThemeId } from '@utils/themes';

type Props = {
  displayTotal: number;
  editingDate: string | null;
  handleTap: (type: 'up' | 'down') => void;
  onSelectDate: (dateStr: string | null) => void;
  onDelete: () => void;
  sortedRecords: DailyRecord[];
};

type TrackerVariantProps = {
  displayTotal: number;
  editingDate: string | null;
  onBackToToday: () => void;
  onDelete: () => void;
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

function EditModeHeader({ editingDate, onBackToToday, onDelete }: { editingDate: string; onBackToToday: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="font-display text-[10px] font-bold tracking-[0.3em] uppercase bg-accent/15 text-accent px-3 py-1 rounded-full">
        {getShortDate(editingDate)}
      </span>
      <button onClick={onBackToToday} className="text-fg-muted hover:text-fg transition-colors" title="Back to Today">
        <RotateCcw size={14} />
      </button>
      <button onClick={onDelete} className="text-fg-muted hover:text-red-400 transition-colors" title="Delete this day">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function DefaultTracker({ displayTotal, editingDate, onBackToToday, onDelete, handleTap, counterControls, upControls, downControls, fontSize, themeId }: TrackerVariantProps & { themeId: ThemeId }) {
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
        {editingDate ? (
          <EditModeHeader editingDate={editingDate} onBackToToday={onBackToToday} onDelete={onDelete} />
        ) : (
          <div className="font-display text-[10px] font-bold tracking-[0.3em] text-fg-subtle uppercase mb-6">
            Today&rsquo;s Altitude
          </div>
        )}
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
            {displayTotal}
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

function ElevatorTracker({ displayTotal, editingDate, onBackToToday, onDelete, handleTap, counterControls, upControls, downControls, fontSize }: TrackerVariantProps) {
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
        {editingDate ? (
          <EditModeHeader editingDate={editingDate} onBackToToday={onBackToToday} onDelete={onDelete} />
        ) : (
          <div className="font-display text-[10px] font-bold tracking-[0.3em] text-fg-subtle uppercase mb-6">
            Floor Indicator
          </div>
        )}
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
            {displayTotal}
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

export default function TrackerTab({ displayTotal, editingDate, handleTap, onSelectDate, onDelete, sortedRecords }: Props) {
  const counterControls = useAnimationControls();
  const upControls = useAnimationControls();
  const downControls = useAnimationControls();
  const themeId = useActiveThemeId();
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const { MIN_FONT_REM, MAX_FONT_REM, MAX_SCALE_FLOORS } = TRACKER_UI;
  const fontSize = `${MIN_FONT_REM + (MAX_FONT_REM - MIN_FONT_REM) * (Math.min(displayTotal, MAX_SCALE_FLOORS) / MAX_SCALE_FLOORS)}rem`;

  const onBackToToday = () => onSelectDate(null);

  const trackerProps = {
    displayTotal,
    editingDate,
    onBackToToday,
    onDelete,
    handleTap,
    counterControls,
    upControls,
    downControls,
    fontSize,
  };

  const handleAddPastDay = () => {
    dateInputRef.current?.showPicker();
  };

  const handleDatePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // YYYY-MM-DD
    if (value) {
      onSelectDate(value);
    }
    e.target.value = ''; // reset so same date can be re-picked
  };


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
                {sortedRecords.map((record) => {
                  const isActive = editingDate === record.dateStr;
                  return (
                    <tr
                      key={record.dateStr}
                      onClick={() => onSelectDate(record.dateStr)}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-accent/10 border-l-2 border-l-accent'
                          : 'hover:bg-surface-hover'
                      }`}
                    >
                      <td className="p-4 text-sm font-medium text-fg">{getDayName(record.dateStr)}</td>
                      <td className="p-4 text-sm text-fg-muted font-mono">{getFormattedDate(record.dateStr)}</td>
                      <td className="p-4 text-base font-bold text-accent text-right font-mono tabular-nums">{record.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Past Day */}
        <div className="mt-3 flex justify-center">
          <button
            onClick={handleAddPastDay}
            className="text-xs text-fg-muted hover:text-accent transition-colors font-mono tracking-wide"
          >
            + Add Past Day
          </button>
          <input
            ref={dateInputRef}
            type="date"
            max={getTodayKey()}
            onChange={handleDatePicked}
            className="sr-only"
            tabIndex={-1}
            aria-label="Pick a past date"
          />
        </div>
      </div>
    </>
  );
}

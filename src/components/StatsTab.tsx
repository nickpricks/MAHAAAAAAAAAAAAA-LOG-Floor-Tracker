import React from 'react';
import { Info, X, Share2, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { DailyRecord } from '@/types';
import { getLast7DaysKeys } from '@utils/date';
import { calculateMetrics, calculateProgress, formatMeters } from '@utils/statsHelpers';
import {
  CHALLENGES,
  FEATURED_IDS,
  getChallengeById,
  getChallengesByCategory,
  formatDistance,
  type ActiveChallenge,
  type ChallengeCategory,
} from '@utils/challenges';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_ORDER: ChallengeCategory[] = [
  'landmarks',
  'towers',
  'mountains',
  'milestones',
  'journeys',
  'space',
];

const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  landmarks: 'Landmarks',
  towers: 'Towers',
  mountains: 'Mountains',
  milestones: 'Milestones',
  journeys: 'Journeys',
  space: 'Space',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  records: Record<string, DailyRecord>;
  todayKey: string;
  floorHeight: number;
  activeChallenge: ActiveChallenge;
  onChallengeChange: (ac: ActiveChallenge) => void;
  onManualSync: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StatsTab({
  records,
  todayKey,
  floorHeight,
  activeChallenge,
  onChallengeChange,
  onManualSync,
}: Props) {
  const [showInfo, setShowInfo] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Picker state
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  // Reset picker state when picker closes
  React.useEffect(() => {
    if (!pickerOpen) {
      setPendingId(null);
      setShowAll(false);
    }
  }, [pickerOpen]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await onManualSync();
    setIsSyncing(false);
  };

  const handleSelectChallenge = (id: string) => {
    if (id === activeChallenge.id && !pendingId) {
      // Already active and nothing pending — toggle off
      setPendingId(null);
    } else {
      setPendingId(id);
    }
  };

  const handleSetGoal = () => {
    if (!pendingId) return;
    onChallengeChange({
      id: pendingId,
      resetPeriod: 'lifetime',
      currentPeriodKey: 'lifetime',
    });
    setPickerOpen(false);
  };

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const currentMonthPrefix = todayKey.substring(0, 7);
  const last7Days = React.useMemo(() => getLast7DaysKeys(), [todayKey]);

  const { todayFloors, weekFloors, monthFloors, totalFloors } = React.useMemo(
    () => calculateMetrics(records, todayKey, last7Days, currentMonthPrefix),
    [records, todayKey, last7Days, currentMonthPrefix],
  );

  const todayMeters = todayFloors * floorHeight;
  const weekMeters = weekFloors * floorHeight;
  const monthMeters = monthFloors * floorHeight;
  const totalMeters = totalFloors * floorHeight;

  const challenge = getChallengeById(activeChallenge.id) ?? CHALLENGES[0];
  const { remainingMeters, progressPercent } = calculateProgress(totalMeters, challenge.meters);

  const selectedId = pendingId ?? activeChallenge.id;
  const hasPendingChange = pendingId !== null && pendingId !== activeChallenge.id;

  const featuredChallenges = FEATURED_IDS.map((id) => getChallengeById(id)).filter(Boolean) as NonNullable<
    ReturnType<typeof getChallengeById>
  >[];

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="w-full max-w-sm bg-surface-card p-8 rounded-[2rem] shadow-sm border border-line flex flex-col gap-6">
      {/* Header */}
      <div className="text-center relative">
        <div className="absolute -top-2 -right-2 flex gap-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`p-2 bg-surface-raised border border-line rounded-full text-fg-subtle hover:text-accent hover:border-accent/40 transition-all shadow-sm ${isSyncing ? 'animate-spin' : ''}`}
            title="Sync all data to cloud"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleCopyLink}
            className="p-2 bg-surface-raised border border-line rounded-full text-fg-subtle hover:text-accent hover:border-accent/40 transition-all shadow-sm"
            title="Copy shareable link"
          >
            {copied ? <Check size={16} className="text-accent" /> : <Share2 size={16} />}
          </button>
        </div>
        <div className="text-5xl mb-2">{challenge.emoji}</div>
        <h2 className="text-2xl font-display font-extrabold text-fg-heading">Leaderboard</h2>
        <p className="text-sm text-fg-muted mt-1 font-mono">
          1 floor ≈ {floorHeight} meters
        </p>
      </div>

      {/* Metric cards */}
      <div className="flex flex-col gap-4 mt-2">
        {[
          { label: 'Today', value: todayMeters },
          { label: 'This Week', value: weekMeters },
          { label: 'This Month', value: monthMeters },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex justify-between items-center p-4 bg-surface-raised rounded-2xl border border-line-subtle"
          >
            <span className="font-bold text-fg">{label}</span>
            <span className="text-xl font-bold font-mono text-fg-heading tabular-nums">
              {formatMeters(value)}{' '}
              <span className="text-sm text-fg-subtle font-bold">m</span>
            </span>
          </div>
        ))}
      </div>

      {/* Challenge progress section */}
      <div className="mt-4 pt-6 border-t border-line-subtle relative">
        {/* Challenge picker toggle */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setPickerOpen((o) => !o)}
            className="flex items-center gap-2 bg-surface-raised border border-line text-fg text-sm font-bold rounded-xl px-3 py-2 cursor-pointer shadow-sm hover:border-accent/40 transition-all"
          >
            <span className="text-lg leading-none">{challenge.emoji}</span>
            <span className="truncate max-w-[140px]">{challenge.name}</span>
            {pickerOpen ? <ChevronUp size={14} className="text-fg-subtle" /> : <ChevronDown size={14} className="text-fg-subtle" />}
          </button>
          <button
            onClick={() => setShowInfo(true)}
            className="text-fg-subtle hover:text-accent transition-colors p-1"
          >
            <Info size={20} />
          </button>
        </div>

        {/* Expanded picker */}
        {pickerOpen && (
          <div className="mb-5 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Featured row */}
            <div className="grid grid-cols-3 gap-2">
              {featuredChallenges.map((c) => {
                const isSelected = selectedId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectChallenge(c.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-accent bg-accent/10 shadow-md'
                        : 'border-line-subtle bg-surface-raised hover:border-accent/30'
                    }`}
                  >
                    <span className="text-2xl leading-none">{c.emoji}</span>
                    <span className="text-[10px] font-bold text-fg-heading leading-tight text-center truncate w-full">
                      {c.name}
                    </span>
                    <span className="text-[9px] text-fg-muted font-mono">
                      {formatDistance(c.meters)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Show all toggle */}
            <button
              onClick={() => setShowAll((s) => !s)}
              className="text-accent text-xs font-bold hover:underline self-center py-1"
            >
              {showAll ? 'Show less' : 'Show all challenges'}
            </button>

            {/* Full category grid */}
            {showAll && (
              <div className="max-h-64 overflow-y-auto rounded-xl border border-line-subtle bg-surface p-3 flex flex-col gap-3">
                {CATEGORY_ORDER.map((cat) => {
                  const items = getChallengesByCategory(cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h4 className="text-[10px] font-bold text-fg-muted uppercase tracking-widest mb-1.5">
                        {CATEGORY_LABELS[cat]}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((c) => {
                          const isSelected = selectedId === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => handleSelectChallenge(c.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-accent bg-accent/10 text-fg-heading shadow-sm'
                                  : 'border-line-subtle bg-surface-raised text-fg hover:border-accent/30'
                              }`}
                            >
                              <span className="leading-none">{c.emoji}</span>
                              <span className="truncate max-w-[80px]">{c.name}</span>
                              <span className="text-fg-subtle font-mono text-[10px]">
                                {formatDistance(c.meters)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Set Goal button — only when user picked something different */}
            {hasPendingChange && (
              <button
                onClick={handleSetGoal}
                className="w-full py-2.5 rounded-xl bg-accent text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
              >
                Set Goal
              </button>
            )}
          </div>
        )}

        {/* Progress display */}
        <div className="flex justify-between items-end mb-2">
          <span className="font-bold text-fg-muted text-sm">Progress</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-accent tracking-tighter">
              {progressPercent.toFixed(1)}%
            </span>
            <span className="text-sm font-bold text-fg-subtle tabular-nums">
              ({formatDistance(totalMeters)} / {formatDistance(challenge.meters)})
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface-raised rounded-full h-6 mb-3 overflow-hidden shadow-inner border border-line/50">
          <div
            className="bg-gradient-to-r from-accent via-accent to-accent h-6 rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-2"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          >
            {progressPercent >= 10 && (
              <span className="text-[10px] font-bold text-white/90 drop-shadow-sm">
                🚀
              </span>
            )}
          </div>
        </div>

        <p className="text-sm font-medium text-fg-muted text-center mt-4">
          {remainingMeters > 0
            ? `${formatDistance(remainingMeters)} remaining to summit!`
            : '🎉 You reached the top!'}
        </p>
      </div>

      {/* Fun Facts modal */}
      {showInfo && (
        <div className="absolute inset-0 bg-surface-card/90 backdrop-blur-sm z-10 rounded-[2rem] p-8 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => setShowInfo(false)}
            className="absolute top-6 right-6 text-fg-subtle hover:text-fg p-2 bg-surface-raised rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          <h3 className="text-2xl font-black text-fg-heading mb-6 text-center">
            Fun Facts 💡
          </h3>

          <div className="flex flex-col gap-4">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center gap-4">
              <span className="text-3xl">🦒</span>
              <div>
                <p className="font-bold text-orange-900">Adult Giraffes</p>
                <p className="text-sm text-orange-700">
                  You've climbed the equivalent of{' '}
                  <b>{formatMeters(Math.floor(totalMeters / 5))}</b> stacked
                  giraffes.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center gap-4">
              <span className="text-3xl">🍕</span>
              <div>
                <p className="font-bold text-yellow-900">Pizza Boxes</p>
                <p className="text-sm text-yellow-700">
                  That's about{' '}
                  <b>{formatMeters(Math.floor(totalMeters / 0.045))}</b> stacked
                  pizza boxes!
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
              <span className="text-3xl">🗽</span>
              <div>
                <p className="font-bold text-blue-900">Statue of Liberty</p>
                <p className="text-sm text-blue-700">
                  You've scaled lady liberty{' '}
                  <b>{(totalMeters / 93).toFixed(1)}</b> times.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

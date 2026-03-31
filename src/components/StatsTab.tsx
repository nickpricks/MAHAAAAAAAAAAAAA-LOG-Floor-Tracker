import React from 'react';
import { Info, X, Share2, Check, RefreshCw } from 'lucide-react';
import { CHALLENGES, METERS_PER_FLOOR, DEFAULT_CHALLENGE_ID } from '@/constants';
import { DailyRecord } from '@/types';
import { getLast7DaysKeys } from '@utils/date';
import { calculateMetrics, calculateProgress, formatMeters } from '@utils/statsHelpers';

type Props = {
  records: Record<string, DailyRecord>;
  todayKey: string;
  defaultChallengeId?: string;
  onManualSync: () => Promise<void>;
};

export default function StatsTab({ records, todayKey, defaultChallengeId, onManualSync }: Props) {
  const [challengeId, setChallengeId] = React.useState(defaultChallengeId || DEFAULT_CHALLENGE_ID);

  React.useEffect(() => {
    if (defaultChallengeId) {
      setChallengeId(defaultChallengeId);
    }
  }, [defaultChallengeId]);
  const [showInfo, setShowInfo] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

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

  const currentMonthPrefix = todayKey.substring(0, 7); // YYYY-MM
  const last7Days = React.useMemo(() => getLast7DaysKeys(), [todayKey]);

  const { todayFloors, weekFloors, monthFloors, totalFloors } = React.useMemo(() => 
    calculateMetrics(records, todayKey, last7Days, currentMonthPrefix),
  [records, todayKey, last7Days, currentMonthPrefix]);

  const todayMeters = todayFloors * METERS_PER_FLOOR;
  const weekMeters = weekFloors * METERS_PER_FLOOR;
  const monthMeters = monthFloors * METERS_PER_FLOOR;
  const totalMeters = totalFloors * METERS_PER_FLOOR;

  const activeChallenge = CHALLENGES.find(c => c.id === challengeId) || CHALLENGES[4];
  const { remainingMeters, progressPercent } = calculateProgress(totalMeters, activeChallenge.meters);

  return (
    <div className="w-full max-w-sm bg-surface-card p-8 rounded-[2rem] shadow-sm border border-line flex flex-col gap-6">
      <div className="text-center relative">
        <div className="absolute -top-2 -right-2 flex gap-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`p-2 bg-surface-raised border border-line rounded-full text-fg-subtle hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm ${isSyncing ? 'animate-spin' : ''}`}
            title="Sync all data to cloud"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleCopyLink}
            className="p-2 bg-surface-raised border border-line rounded-full text-fg-subtle hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm"
            title="Copy shareable link"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
          </button>
        </div>
        <div className="text-5xl mb-2">⛰️</div>
        <h2 className="text-2xl font-display font-extrabold text-fg-heading">Leaderboard</h2>
        <p className="text-sm text-fg-muted mt-1 font-mono">1 floor ≈ {METERS_PER_FLOOR} meters</p>
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <div className="flex justify-between items-center p-4 bg-surface-raised rounded-2xl border border-line-subtle">
          <span className="font-bold text-fg">Today</span>
          <span className="text-xl font-bold font-mono text-fg-heading tabular-nums">{formatMeters(todayMeters)} <span className="text-sm text-fg-subtle font-bold">m</span></span>
        </div>
        <div className="flex justify-between items-center p-4 bg-surface-raised rounded-2xl border border-line-subtle">
          <span className="font-bold text-fg">This Week</span>
          <span className="text-xl font-bold font-mono text-fg-heading tabular-nums">{formatMeters(weekMeters)} <span className="text-sm text-fg-subtle font-bold">m</span></span>
        </div>
        <div className="flex justify-between items-center p-4 bg-surface-raised rounded-2xl border border-line-subtle">
          <span className="font-bold text-fg">This Month</span>
          <span className="text-xl font-bold font-mono text-fg-heading tabular-nums">{formatMeters(monthMeters)} <span className="text-sm text-fg-subtle font-bold">m</span></span>
        </div>
      </div>

      <div className="mt-4 pt-6 border-t border-line-subtle relative">
        <div className="flex justify-between items-center mb-4">
          <select
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
            className="bg-surface-raised border border-line text-fg text-sm font-bold rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer shadow-sm pr-8"
          >
            {
              CHALLENGES.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))
            }
          </select>
          <button
            onClick={() => setShowInfo(true)}
            className="text-fg-subtle hover:text-blue-500 transition-colors p-1"
          >
            <Info size={20} />
          </button>
        </div>

        <div className="flex justify-between items-end mb-2">
          <span className="font-bold text-fg-muted text-sm">Progress</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-accent tracking-tighter">{progressPercent.toFixed(1)}%</span>
            <span className="text-sm font-bold text-fg-subtle tabular-nums">({formatMeters(totalMeters)} / {formatMeters(activeChallenge.meters)} m)</span>
          </div>
        </div>

        <div className="w-full bg-surface-raised rounded-full h-6 mb-3 overflow-hidden shadow-inner border border-line/50">
          <div
            className="bg-gradient-to-r from-accent via-accent to-accent h-6 rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-2"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          >
            {
              progressPercent >= 10 &&
              <span className="text-[10px] font-bold text-white/90 drop-shadow-sm">🚀</span>
            }
          </div>
        </div>

        <p className="text-sm font-medium text-fg-muted text-center mt-4">
          {
            remainingMeters > 0
              ? `${formatMeters(remainingMeters)} m remaining to summit!`
              : '🎉 You reached the top!'
          }
        </p>
      </div>

      {/* Info Modal */}
      {
        showInfo && (
          <div className="absolute inset-0 bg-surface-card/90 backdrop-blur-sm z-10 rounded-[2rem] p-8 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-6 right-6 text-fg-subtle hover:text-fg p-2 bg-surface-raised rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-black text-fg-heading mb-6 text-center">Fun Facts 💡</h3>

            <div className="flex flex-col gap-4">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center gap-4">
                <span className="text-3xl">🦒</span>
                <div>
                  <p className="font-bold text-orange-900">Adult Giraffes</p>
                  <p className="text-sm text-orange-700">You've climbed the equivalent of <b>{formatMeters(Math.floor(totalMeters / 5))}</b> stacked giraffes.</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center gap-4">
                <span className="text-3xl">🍕</span>
                <div>
                  <p className="font-bold text-yellow-900">Pizza Boxes</p>
                  <p className="text-sm text-yellow-700">That's about <b>{formatMeters(Math.floor(totalMeters / 0.045))}</b> stacked pizza boxes!</p>
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

import { DailyRecord } from '@/types';
import { calculateTotal } from '@utils/appHelpers';

/**
 * Merges cloud records into local state using per-field max strategy.
 * Returns the same reference if nothing changed (avoids unnecessary re-renders).
 */
export const mergeCloudIntoLocal = (
  local: Record<string, DailyRecord>,
  cloud: Record<string, DailyRecord>
): Record<string, DailyRecord> => {
  let changed = false;
  const merged = { ...local };

  for (const [date, cloudRecord] of Object.entries(cloud)) {
    const localRecord = local[date];

    if (!localRecord) {
      merged[date] = cloudRecord;
      changed = true;
      continue;
    }

    const maxUp = Math.max(localRecord.up, cloudRecord.up);
    const maxDown = Math.max(localRecord.down, cloudRecord.down);

    if (maxUp !== localRecord.up || maxDown !== localRecord.down) {
      merged[date] = {
        dateStr: date,
        up: maxUp,
        down: maxDown,
        total: calculateTotal(maxUp, maxDown),
      };
      changed = true;
    }
  }

  return changed ? merged : local;
};

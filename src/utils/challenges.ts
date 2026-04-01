export type ChallengeCategory = 'landmarks' | 'towers' | 'mountains' | 'milestones' | 'journeys' | 'space';

export type Challenge = {
  id: string;
  name: string;
  category: ChallengeCategory;
  meters: number;
  emoji: string;
  featured: boolean;
};

export type ActiveChallenge = {
  id: string;
  resetPeriod: 'week' | 'month' | '3month' | 'year' | 'lifetime';
  currentPeriodKey: string;
};

export type FloorHeightPreset = {
  id: string;
  label: string;
  meters: 2.5 | 3.0 | 3.5;
};

export const DEFAULT_FLOOR_HEIGHT = 3.0;

export const FLOOR_HEIGHT_PRESETS: FloorHeightPreset[] = [
  { id: 'residential', label: 'Residential 2.5m', meters: 2.5 },
  { id: 'standard', label: 'Standard 3.0m', meters: 3.0 },
  { id: 'commercial', label: 'Commercial 3.5m', meters: 3.5 },
];

export const FEATURED_IDS = ['burj', 'everest', 'marathon'] as const;

export const CHALLENGES: Challenge[] = [
  // Landmarks
  { id: 'arc', name: 'Arc de Triomphe', category: 'landmarks', meters: 50, emoji: '🇫🇷', featured: false },
  { id: 'pisa', name: 'Leaning Tower of Pisa', category: 'landmarks', meters: 56, emoji: '🏛️', featured: false },
  { id: 'liberty', name: 'Statue of Liberty', category: 'landmarks', meters: 93, emoji: '🗽', featured: false },
  { id: 'bigben', name: 'Big Ben', category: 'landmarks', meters: 96, emoji: '🔔', featured: false },
  { id: 'eiffel', name: 'Eiffel Tower', category: 'landmarks', meters: 330, emoji: '🗼', featured: false },
  // Towers
  { id: 'empire', name: 'Empire State Building', category: 'towers', meters: 443, emoji: '🏙️', featured: false },
  { id: 'taipei', name: 'Taipei 101', category: 'towers', meters: 508, emoji: '🏯', featured: false },
  { id: 'cn', name: 'CN Tower', category: 'towers', meters: 553, emoji: '📡', featured: false },
  { id: 'burj', name: 'Burj Khalifa', category: 'towers', meters: 828, emoji: '🏢', featured: true },
  // Mountains
  { id: 'halfdome', name: 'Half Dome', category: 'mountains', meters: 1444, emoji: '🧗', featured: false },
  { id: 'fuji', name: 'Mount Fuji', category: 'mountains', meters: 3776, emoji: '🗻', featured: false },
  { id: 'montblanc', name: 'Mont Blanc', category: 'mountains', meters: 4808, emoji: '🏔️', featured: false },
  { id: 'kilimanjaro', name: 'Mount Kilimanjaro', category: 'mountains', meters: 5895, emoji: '🏔️', featured: false },
  { id: 'denali', name: 'Denali', category: 'mountains', meters: 6190, emoji: '🏔️', featured: false },
  { id: 'everest', name: 'Mount Everest', category: 'mountains', meters: 8848, emoji: '⛰️', featured: true },
  { id: 'mariana', name: 'Mariana Trench', category: 'mountains', meters: 10984, emoji: '🌊', featured: false },
  // Milestones
  { id: 'double-everest', name: 'Double Everest', category: 'milestones', meters: 17696, emoji: '⛰️⛰️', featured: false },
  { id: 'marathon', name: 'Marathon', category: 'milestones', meters: 42195, emoji: '🏃', featured: true },
  { id: '100km', name: '100 km Club', category: 'milestones', meters: 100000, emoji: '💯', featured: false },
  // Journeys
  { id: 'channel', name: 'English Channel', category: 'journeys', meters: 34000, emoji: '🏊', featured: false },
  { id: 'himalaya', name: 'Himalayan Range', category: 'journeys', meters: 2400000, emoji: '🏔️', featured: false },
  { id: 'sahara', name: 'Sahara Crossing', category: 'journeys', meters: 1800000, emoji: '🏜️', featured: false },
  { id: 'kashmir-kanyakumari', name: 'Kashmir to Kanyakumari', category: 'journeys', meters: 3500000, emoji: '🇮🇳', featured: false },
  { id: 'brahmaputra', name: 'Brahmaputra River', category: 'journeys', meters: 3848000, emoji: '🏞️', featured: false },
  { id: 'pct', name: 'Pacific Crest Trail', category: 'journeys', meters: 4265000, emoji: '🥾', featured: false },
  { id: 'amazon', name: 'Amazon River', category: 'journeys', meters: 6400000, emoji: '🌿', featured: false },
  { id: 'equator', name: 'Around the Equator', category: 'journeys', meters: 40075000, emoji: '🌍', featured: false },
  // Space
  { id: 'iss', name: 'ISS Orbit', category: 'space', meters: 408000, emoji: '🛸', featured: false },
  { id: 'moon', name: 'Earth to Moon', category: 'space', meters: 384400000, emoji: '🌙', featured: false },
  { id: 'mars', name: 'Earth to Mars', category: 'space', meters: 225000000000, emoji: '🔴', featured: false },
];

export const getChallengeById = (id: string): Challenge | undefined =>
  CHALLENGES.find((c) => c.id === id);

export const getChallengesByCategory = (category: ChallengeCategory): Challenge[] =>
  CHALLENGES.filter((c) => c.category === category);

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters} m`;
  }
  const km = meters / 1000;
  if (km === Math.floor(km)) {
    return `${km.toLocaleString()} km`;
  }
  return `${km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
};

const DEFAULT_CHALLENGE_ID = 'everest';

export const migrateDefaultChallenge = (defaultChallenge?: string): ActiveChallenge => {
  const id = defaultChallenge && getChallengeById(defaultChallenge)
    ? defaultChallenge
    : DEFAULT_CHALLENGE_ID;
  return {
    id,
    resetPeriod: 'lifetime',
    currentPeriodKey: 'lifetime',
  };
};

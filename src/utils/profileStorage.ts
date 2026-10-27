/**
 * Local-First Learner Profile and Storage System
 * Saves all user progress directly to the device storage (localStorage / phone data).
 * Zero server / cloud hosting costs, 100% private, instantaneous, and works fully offline.
 */

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  createdAt: string;
  targetExamDate?: string;
  // Progress & Mastery
  masteryScores: Record<string, number>; // questionId -> count (0-3)
  streakDays: number;
  todayCount: number;
  lastDate: string;
  goalMet: boolean;
  studyHistory: Record<string, number>; // 'YYYY-MM-DD' -> count
  examHistory: Array<{
    id: string;
    date: string;
    score: number;
    total: number;
    passed: boolean;
    durationSeconds?: number;
  }>;
}

const PROFILES_STORAGE_KEY = 'passin_bmv_profiles_v1';
const ACTIVE_PROFILE_ID_KEY = 'passin_bmv_active_profile_id_v1';

// Legacy keys for automatic migration
const LEGACY_STORAGE_KEY_ALL = 'indiana_bmv_mastery_500_v1_all';
const LEGACY_STORAGE_KEY_SIGNS = 'indiana_bmv_mastery_500_v1_signs';
const LEGACY_DAILY_STORAGE_KEY = 'indiana_bmv_daily_streak_v1';
const LEGACY_HISTORY_STORAGE_KEY = 'indiana_bmv_7day_history_v1';

export const AVATAR_OPTIONS = [
  '🚗', '🏎️', '⚡', '🌟', '🎓', '🚦', '🦅', '🏁', '🛣️', '🎯', '🔑', '🚘',
  '🛞', '🛡️', '🏆', '🚀'
];

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Loads all saved profiles from device storage.
 * Automatically performs legacy data migration if first run.
 */
export function getAllProfiles(): UserProfile[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse user profiles from localStorage', e);
  }

  // Create initial default profile, migrating any legacy standalone progress
  const initialProfile = createInitialMigratedProfile();
  saveProfilesList([initialProfile]);
  localStorage.setItem(ACTIVE_PROFILE_ID_KEY, initialProfile.id);
  return [initialProfile];
}

/**
 * Migrates existing single-user progress into the initial profile.
 */
function createInitialMigratedProfile(): UserProfile {
  let masteryScores: Record<string, number> = {};
  let streakDays = 1;
  let todayCount = 0;
  let lastDate = getTodayString();
  let goalMet = false;
  let studyHistory: Record<string, number> = {};

  if (typeof window !== 'undefined') {
    try {
      const savedMastery = localStorage.getItem(LEGACY_STORAGE_KEY_ALL) || localStorage.getItem(LEGACY_STORAGE_KEY_SIGNS);
      if (savedMastery) masteryScores = JSON.parse(savedMastery);

      const savedStreak = localStorage.getItem(LEGACY_DAILY_STORAGE_KEY);
      if (savedStreak) {
        const parsed = JSON.parse(savedStreak);
        streakDays = parsed.streakDays || 1;
        todayCount = parsed.todayCount || 0;
        lastDate = parsed.lastDate || getTodayString();
        goalMet = !!parsed.goalMet;
      }

      const savedHistory = localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY);
      if (savedHistory) studyHistory = JSON.parse(savedHistory);
    } catch {
      // ignore
    }
  }

  return {
    id: 'default_learner',
    name: 'Learner 1',
    avatar: '🚗',
    createdAt: new Date().toISOString(),
    masteryScores,
    streakDays,
    todayCount,
    lastDate,
    goalMet,
    studyHistory,
    examHistory: [],
  };
}

/**
 * Saves profile array to localStorage
 */
function saveProfilesList(profiles: UserProfile[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save profiles to localStorage', e);
  }
}

/**
 * Gets the current active profile.
 */
export function getActiveProfile(): UserProfile {
  const profiles = getAllProfiles();
  const activeId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_PROFILE_ID_KEY) : null;
  
  if (activeId) {
    const found = profiles.find((p) => p.id === activeId);
    if (found) return found;
  }

  return profiles[0];
}

/**
 * Sets the active profile by ID
 */
export function setActiveProfileId(id: string): UserProfile {
  const profiles = getAllProfiles();
  const found = profiles.find((p) => p.id === id);
  if (found && typeof window !== 'undefined') {
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, id);
    return found;
  }
  return profiles[0];
}

/**
 * Creates a new user profile on the phone
 */
export function createNewProfile(name: string, avatar: string, targetExamDate?: string): UserProfile {
  const profiles = getAllProfiles();
  const newProfile: UserProfile = {
    id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || `Learner ${profiles.length + 1}`,
    avatar: avatar || '🚗',
    createdAt: new Date().toISOString(),
    targetExamDate,
    masteryScores: {},
    streakDays: 1,
    todayCount: 0,
    lastDate: getTodayString(),
    goalMet: false,
    studyHistory: {},
    examHistory: [],
  };

  profiles.push(newProfile);
  saveProfilesList(profiles);
  setActiveProfileId(newProfile.id);
  return newProfile;
}

/**
 * Updates properties of the active profile
 */
export function updateActiveProfile(updates: Partial<UserProfile>): UserProfile {
  const profiles = getAllProfiles();
  const activeId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_PROFILE_ID_KEY) : null;
  const index = profiles.findIndex((p) => p.id === activeId);

  if (index !== -1) {
    profiles[index] = { ...profiles[index], ...updates };
    saveProfilesList(profiles);
    return profiles[index];
  } else if (profiles.length > 0) {
    profiles[0] = { ...profiles[0], ...updates };
    saveProfilesList(profiles);
    return profiles[0];
  }

  return createInitialMigratedProfile();
}

/**
 * Deletes a profile by ID. Prevents deleting the only profile.
 */
export function deleteProfile(id: string): { success: boolean; newActive: UserProfile } {
  let profiles = getAllProfiles();
  if (profiles.length <= 1) {
    return { success: false, newActive: profiles[0] };
  }

  profiles = profiles.filter((p) => p.id !== id);
  saveProfilesList(profiles);
  const newActive = profiles[0];
  setActiveProfileId(newActive.id);
  return { success: true, newActive };
}

/**
 * Exports all local profile data to a downloadable JSON string.
 */
export function exportAllDataAsJson(): string {
  const profiles = getAllProfiles();
  const activeId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_PROFILE_ID_KEY) : null;

  return JSON.stringify(
    {
      app: 'PassIN_Indiana_BMV',
      version: 1,
      exportedAt: new Date().toISOString(),
      activeProfileId: activeId,
      profiles,
    },
    null,
    2
  );
}

/**
 * Imports profile data from a JSON string.
 */
export function importDataFromJson(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data && Array.isArray(data.profiles) && data.profiles.length > 0) {
      saveProfilesList(data.profiles);
      if (data.activeProfileId && data.profiles.some((p: UserProfile) => p.id === data.activeProfileId)) {
        setActiveProfileId(data.activeProfileId);
      } else {
        setActiveProfileId(data.profiles[0].id);
      }
      return true;
    }
  } catch (err) {
    console.error('Failed to import profile data', err);
  }
  return false;
}

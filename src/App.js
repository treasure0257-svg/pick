import { PICK_DATA } from './data.js';

export const AppState = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

export const STORAGE_KEYS = {
  preferences: "pick.preferences",
  tournament:  "pick.tournament",
  saved:       "pick.saved",
  visited:     "pick.visited",
  recentRegions: "pick.recentRegions",
  pinnedRegions: "pick.pinnedRegions"
};

export function scorePlace(place, prefs) {
  let score = 0;
  const moodOverlap = (prefs.moods || []).filter(m => place.moods.includes(m)).length;
  score += moodOverlap * 2;
  if (prefs.categories?.length && prefs.categories.includes(place.category)) score += 3;
  if (prefs.budget && (prefs.budget === "flex" || prefs.budget === place.budget)) score += 1;
  if (prefs.duration && prefs.duration === place.duration) score += 1;
  if (prefs.drinks && prefs.drinks !== "flex") {
    if (prefs.drinks === "dry" && place.drinks === "party") score -= 99;
    else if (prefs.drinks === "party" && place.drinks === "dry") score -= 3;
    else if (prefs.drinks === place.drinks) score += 2;
    else if (place.drinks === "optional") score += 1;
  }
  score += (place.rating - 4) * 2;
  return score;
}

export function recommend(prefs, n = 6) {
  const list = PICK_DATA.places.map(p => ({
    place: p, score: scorePlace(p, prefs)
  }));
  list.sort((a, b) => b.score - a.score);
  return list.slice(0, n).map(x => x.place);
}

export function savePlace(id) {
  const saved = AppState.get(STORAGE_KEYS.saved, []);
  if (!saved.includes(id)) {
    saved.push(id);
    AppState.set(STORAGE_KEYS.saved, saved);
  }
}

export function unsavePlace(id) {
  const saved = AppState.get(STORAGE_KEYS.saved, []).filter(x => x !== id);
  AppState.set(STORAGE_KEYS.saved, saved);
}

export function isSaved(id) {
  return AppState.get(STORAGE_KEYS.saved, []).includes(id);
}

// --- 방문함 ---
export function markVisited(id) {
  const v = AppState.get(STORAGE_KEYS.visited, []);
  if (!v.includes(id)) {
    v.push(id);
    AppState.set(STORAGE_KEYS.visited, v);
  }
}

export function unmarkVisited(id) {
  const v = AppState.get(STORAGE_KEYS.visited, []).filter(x => x !== id);
  AppState.set(STORAGE_KEYS.visited, v);
}

export function isVisited(id) {
  return AppState.get(STORAGE_KEYS.visited, []).includes(id);
}

// --- 최근 본 권역 (LRU 5개) ---
export function pushRecentRegion(regionId, areaId) {
  if (!regionId) return;
  const key = areaId ? `${regionId}:${areaId}` : regionId;
  const list = AppState.get(STORAGE_KEYS.recentRegions, []);
  const next = [key, ...list.filter(x => x !== key)].slice(0, 5);
  AppState.set(STORAGE_KEYS.recentRegions, next);
}

export function getRecentRegions() {
  return AppState.get(STORAGE_KEYS.recentRegions, []);
}

// --- 즐겨찾기 권역 (시·도 단위, 별표 토글) ---
export function isRegionPinned(regionId) {
  return AppState.get(STORAGE_KEYS.pinnedRegions, []).includes(regionId);
}

export function togglePinnedRegion(regionId) {
  const list = AppState.get(STORAGE_KEYS.pinnedRegions, []);
  const next = list.includes(regionId)
    ? list.filter(x => x !== regionId)
    : [...list, regionId];
  AppState.set(STORAGE_KEYS.pinnedRegions, next);
  return next.includes(regionId);
}

export function getPinnedRegions() {
  return AppState.get(STORAGE_KEYS.pinnedRegions, []);
}

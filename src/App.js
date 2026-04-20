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
  saved:       "pick.saved"
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

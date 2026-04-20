// Shared utilities across pages.
(function () {
  const STORAGE_KEYS = {
    preferences: "pick.preferences",
    tournament:  "pick.tournament",
    saved:       "pick.saved"
  };

  const App = {
    storage: {
      get(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
      },
      set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
    },
    keys: STORAGE_KEYS,

    // Scoring: count overlapping moods + category/budget/duration bonuses.
    scorePlace(place, prefs) {
      let score = 0;
      const moodOverlap = (prefs.moods || []).filter(m => place.moods.includes(m)).length;
      score += moodOverlap * 2;
      if (prefs.categories?.length && prefs.categories.includes(place.category)) score += 3;
      if (prefs.budget && (prefs.budget === "flex" || prefs.budget === place.budget)) score += 1;
      if (prefs.duration && prefs.duration === place.duration) score += 1;
      // Drinks: hard-filter if user chose "dry" and place is party-only.
      // Soft-boost when preference and place align.
      if (prefs.drinks && prefs.drinks !== "flex") {
        if (prefs.drinks === "dry" && place.drinks === "party") score -= 99;
        else if (prefs.drinks === "party" && place.drinks === "dry") score -= 3;
        else if (prefs.drinks === place.drinks) score += 2;
        else if (place.drinks === "optional") score += 1;
      }
      score += (place.rating - 4) * 2;
      return score;
    },

    recommend(prefs, n = 6) {
      const list = (window.PICK_DATA?.places || []).map(p => ({
        place: p, score: App.scorePlace(p, prefs)
      }));
      list.sort((a, b) => b.score - a.score);
      return list.slice(0, n).map(x => x.place);
    },

    savePlace(id) {
      const saved = App.storage.get(STORAGE_KEYS.saved, []);
      if (!saved.includes(id)) {
        saved.push(id);
        App.storage.set(STORAGE_KEYS.saved, saved);
      }
    },
    unsavePlace(id) {
      const saved = App.storage.get(STORAGE_KEYS.saved, []).filter(x => x !== id);
      App.storage.set(STORAGE_KEYS.saved, saved);
    },
    isSaved(id) {
      return App.storage.get(STORAGE_KEYS.saved, []).includes(id);
    }
  };

  window.PickApp = App;
})();

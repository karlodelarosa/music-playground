/**
 * Local persistence for XP, level, streak, high score, unlocked modes.
 */
const Storage = (() => {
  const KEY = "musicQuest_v2";

  const DEFAULT = {
    xp: 0,
    level: 1,
    streak: 0,
    highScore: 0,
    unlockedModes: ["find", "echo"],
    unlockedTutorials: ["bpm", "notes"],
    completedTutorials: [],
  };

  const UNLOCK_XP = {
    memory: 100,
    chord: 100,
    ear: 250,
    progressions: 50,
    circle: 120,
    nashville: 150,
    chordtypes: 200,
    modes: 280,
    timesignatures: 260,
    intervals: 300,
  };

  const TUTORIAL_UNLOCK_XP = UNLOCK_XP;

  function load() {
    try {
      let raw = localStorage.getItem(KEY);
      if (!raw) {
        raw = localStorage.getItem("musicQuest_v1");
      }
      if (!raw) return { ...DEFAULT };
      const data = JSON.parse(raw);
      return {
        xp: data.xp ?? 0,
        level: data.level ?? 1,
        streak: data.streak ?? 0,
        highScore: data.highScore ?? 0,
        unlockedModes: Array.isArray(data.unlockedModes)
          ? data.unlockedModes
          : [...DEFAULT.unlockedModes],
        unlockedTutorials: Array.isArray(data.unlockedTutorials)
          ? data.unlockedTutorials
          : [...DEFAULT.unlockedTutorials],
        completedTutorials: Array.isArray(data.completedTutorials)
          ? data.completedTutorials
          : [],
      };
    } catch {
      return { ...DEFAULT };
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function syncUnlocks(state) {
    const modes = new Set(state.unlockedModes);
    modes.add("find");
    modes.add("echo");
    if (state.xp >= UNLOCK_XP.memory) modes.add("memory");
    if (state.xp >= UNLOCK_XP.chord) modes.add("chord");
    if (state.xp >= UNLOCK_XP.ear) modes.add("ear");
    state.unlockedModes = [...modes];

    const tutorials = new Set(state.unlockedTutorials || DEFAULT.unlockedTutorials);
    tutorials.add("bpm");
    tutorials.add("notes");
    if (state.xp >= UNLOCK_XP.progressions) tutorials.add("progressions");
    if (state.xp >= UNLOCK_XP.circle) tutorials.add("circle");
    if (state.xp >= UNLOCK_XP.nashville) tutorials.add("nashville");
    if (state.xp >= UNLOCK_XP.chordtypes) tutorials.add("chordtypes");
    if (state.xp >= UNLOCK_XP.timesignatures) tutorials.add("timesignatures");
    if (state.xp >= UNLOCK_XP.modes) tutorials.add("modes");
    if (state.xp >= UNLOCK_XP.intervals) tutorials.add("intervals");
    state.unlockedTutorials = [...tutorials];
    return state;
  }

  function xpToLevel(xp) {
    return Math.floor(xp / 100) + 1;
  }

  function xpInCurrentLevel(xp) {
    return xp % 100;
  }

  return {
    load,
    save,
    syncUnlocks,
    UNLOCK_XP,
    TUTORIAL_UNLOCK_XP,
    xpToLevel,
    xpInCurrentLevel,
    DEFAULT,
  };
})();

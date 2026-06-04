/**
 * Piano visibility — auto-hide when not needed, manual toggle in header.
 */
const PianoPanel = (() => {
  const STORAGE_KEY = "musicQuest_pianoVisible";

  const TUTORIAL_PIANO_IDS = new Set(["notes", "nashville", "chordtypes", "modes", "intervals"]);

  const SCREEN_DEFAULTS = {
    menu: false,
    game: true,
    tutorial: false,
    "tool-circle": false,
    "tool-progressions": false,
    "tool-nashville": false,
    "tool-bpm": false,
    "tool-chordstructure": false,
    "tool-modes": true,
    "tool-timesig": false,
    "tool-intervals": true,
  };

  let visible = false;
  let manualOverride = false;
  let currentScreen = "menu";

  function isVisible() {
    return visible;
  }

  function setVisible(show) {
    visible = !!show;
    document.body.classList.toggle("piano-hidden", !visible);
    syncToggleButton();
    if (!visible && typeof Piano !== "undefined") {
      Piano.setEnabled(false);
    }
  }

  function syncToggleButton() {
    const btn = document.getElementById("piano-toggle");
    if (!btn) return;
    btn.setAttribute("aria-pressed", visible ? "true" : "false");
    btn.setAttribute("aria-label", visible ? "Hide piano keyboard" : "Show piano keyboard");
    btn.title = visible ? "Hide piano" : "Show piano";
    btn.classList.toggle("active", visible);
    const label = btn.querySelector(".piano-toggle-label");
    if (label) label.textContent = visible ? "Piano on" : "Piano";
  }

  function applyForScreen(screen, options = {}) {
    currentScreen = screen;
    if (manualOverride) {
      if (!visible && typeof Piano !== "undefined") Piano.setEnabled(false);
      return;
    }

    let show = SCREEN_DEFAULTS[screen];
    if (screen === "tutorial" && options.tutorialId) {
      show = TUTORIAL_PIANO_IDS.has(options.tutorialId);
    }
    if (show === undefined) show = false;

    setVisible(show);
    if (show && typeof Piano !== "undefined") {
      Piano.setEnabled(true);
    }
  }

  function toggle() {
    manualOverride = true;
    const next = !visible;
    setVisible(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch (_) {}
    if (typeof Piano !== "undefined") {
      Piano.setEnabled(next);
    }
  }

  function init() {
    const btn = document.getElementById("piano-toggle");
    if (btn) btn.addEventListener("click", toggle);

    applyForScreen("menu");
  }

  function resetOverrideForNavigation() {
    manualOverride = false;
  }

  return {
    init,
    toggle,
    setVisible,
    isVisible,
    applyForScreen,
    resetOverrideForNavigation,
  };
})();

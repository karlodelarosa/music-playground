/**
 * Light / dark theme — default is light.
 */
const Theme = (() => {
  const KEY = "musicQuest_theme";

  function get() {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  }

  function apply(theme) {
    const next = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(KEY, next);
    syncToggle(next);
  }

  function toggle() {
    apply(get() === "light" ? "dark" : "light");
  }

  function syncToggle(theme) {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const isDark = theme === "dark";
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    btn.title = isDark ? "Light mode" : "Dark mode";
    btn.innerHTML = isDark
      ? '<span class="theme-icon" aria-hidden="true">☀️</span><span class="theme-label">Light</span>'
      : '<span class="theme-icon" aria-hidden="true">🌙</span><span class="theme-label">Dark</span>';
  }

  function init() {
    apply(get());
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.addEventListener("click", toggle);
  }

  return { get, apply, toggle, init };
})();

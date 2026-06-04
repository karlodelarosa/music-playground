/**
 * ELGC Playground — sound / instrument settings.
 */
const SoundSettings = (() => {
  const KEY = "elgc_instrument";
  const DEFAULT = "grand";
  let isOpen = false;

  function get() {
    try {
      const v = localStorage.getItem(KEY);
      if (v && Instruments.PRESETS[v]) return v;
    } catch (_) {}
    return DEFAULT;
  }

  function set(id) {
    if (!Instruments.PRESETS[id]) return;
    try {
      localStorage.setItem(KEY, id);
    } catch (_) {}
    AudioEngine.setInstrument(id);
    syncPanelSelection(id);
    document.dispatchEvent(new CustomEvent("elgc-instrument-change", { detail: id }));
  }

  function preview(id) {
    try {
      AudioEngine.unlockAudio();
      AudioEngine.setInstrument(id);
      const min = Instruments.getMinDuration(id);
      const gap = id === "pad" || id === "organ" ? 380 : 300;
      AudioEngine.playTone("C", min);
      setTimeout(() => AudioEngine.playTone("E", min), gap);
      setTimeout(() => AudioEngine.playTone("G", min), gap * 2);
    } catch (_) {}
  }

  function syncPanelSelection(id) {
    const panel = document.getElementById("sound-settings-panel");
    if (!panel) return;
    panel.querySelectorAll(".sound-option").forEach((btn) => {
      const on = btn.dataset.instrument === id;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const label = document.getElementById("sound-toggle-label");
    const preset = Instruments.getPreset(id);
    if (label) label.textContent = preset.name.split(" ")[0];
  }

  function buildCompatSection() {
    const on = AudioEngine.getCompatMode();
    return `<div class="sound-compat-block">
      <label class="sound-compat-toggle">
        <input type="checkbox" id="sound-compat-mode" ${on ? "checked" : ""}>
        <span class="sound-compat-label">iPhone compatibility audio</span>
      </label>
      <p class="sound-compat-hint">Enable if other online pianos work on your phone but this app is silent. Uses the same style of audio as most web pianos.</p>
    </div>`;
  }

  function wireCompatToggle() {
    const panel = document.getElementById("sound-settings-panel");
    if (!panel) return;
    const cb = panel.querySelector("#sound-compat-mode");
    if (!cb || cb.dataset.wired === "1") return;
    cb.dataset.wired = "1";

    const apply = (on) => {
      AudioEngine.setCompatMode(on);
      if (on) AudioEngine.enableCompatMode();
      else {
        AudioEngine.unlockAudio();
        AudioEngine.playTone("E", 0.3);
      }
      panel.querySelectorAll(".sound-settings-group").forEach((g) => {
        g.classList.toggle("sound-settings-dimmed", on);
      });
    };

    cb.addEventListener("change", () => apply(cb.checked));
    panel.querySelectorAll(".sound-settings-group").forEach((g) => {
      g.classList.toggle("sound-settings-dimmed", cb.checked);
    });
  }

  function buildPanel() {
    const byCat = {};
    Instruments.list().forEach((p) => {
      if (!byCat[p.category]) byCat[p.category] = [];
      byCat[p.category].push(p);
    });

    let html = "";
    Object.keys(byCat).forEach((cat) => {
      html += `<div class="sound-settings-group"><h4>${cat}</h4><div class="sound-options-grid">`;
      byCat[cat].forEach((p) => {
        html += `<button type="button" class="sound-option" data-instrument="${p.id}" aria-pressed="false">
          <span class="sound-option-icon">${p.icon}</span>
          <span class="sound-option-name">${p.name}</span>
          <span class="sound-option-desc">${p.desc}</span>
        </button>`;
      });
      html += `</div></div>`;
    });
    return html;
  }

  function ensurePanelBuilt() {
    const panel = document.getElementById("sound-settings-panel");
    if (!panel) return;
    const body = panel.querySelector(".sound-settings-body");
    if (!body || body.dataset.built === "1") return;

    body.innerHTML = buildCompatSection() + buildPanel();
    body.dataset.built = "1";
    wireCompatToggle();
    body.querySelectorAll(".sound-option").forEach((btn) => {
      AudioEngine.bindTap(btn, (e) => {
        e.stopPropagation();
        const id = btn.dataset.instrument;
        set(id);
        preview(id);
      });
    });
  }

  function setOpen(open) {
    const backdrop = document.getElementById("sound-settings-backdrop");
    const panel = document.getElementById("sound-settings-panel");
    if (!backdrop || !panel) return;

    isOpen = open;
    backdrop.hidden = !open;
    panel.hidden = !open;
    backdrop.classList.toggle("is-visible", open);
    panel.classList.toggle("is-visible", open);
    document.body.classList.toggle("sound-settings-open", open);
    panel.setAttribute("aria-modal", open ? "true" : "false");

    if (open) {
      ensurePanelBuilt();
      syncPanelSelection(get());
    }
  }

  function open() {
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function init() {
    if (typeof Instruments === "undefined" || typeof AudioEngine === "undefined") {
      console.warn("SoundSettings: Instruments or AudioEngine not loaded");
      return;
    }

    const current = get();
    AudioEngine.setInstrument(current);
    ensurePanelBuilt();

    const toggle = document.getElementById("sound-toggle");
    const backdrop = document.getElementById("sound-settings-backdrop");
    const closeBtn = document.getElementById("sound-settings-close");
    const panel = document.getElementById("sound-settings-panel");

    if (panel) {
      panel.addEventListener("click", (e) => e.stopPropagation());
    }

    if (toggle) {
      AudioEngine.bindTap(toggle, (e) => {
        e.stopPropagation();
        if (isOpen) close();
        else open();
      });
    }
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) close();
    });

    document.addEventListener("elgc-compat-audio-change", () => {
      const cb = document.getElementById("sound-compat-mode");
      if (cb) cb.checked = AudioEngine.getCompatMode();
      wireCompatToggle();
    });

    setOpen(false);
    syncPanelSelection(current);
  }

  return { get, set, preview, init, open, close };
})();

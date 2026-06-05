/**
 * Web Audio — notes, chords, metronome; instrument via Instruments presets.
 * Mobile (iOS): unlock + schedule audio synchronously inside the touch handler.
 */
const AudioEngine = (() => {
  const NOTE_FREQ = {
    C: 261.63,
    Cs: 277.18,
    D: 293.66,
    Ds: 311.13,
    E: 329.63,
    F: 349.23,
    Fs: 369.99,
    G: 392.0,
    Gs: 415.3,
    A: 440.0,
    As: 466.16,
    B: 493.88,
  };

  const DISPLAY = {
    C: "C", Cs: "C#", D: "D", Ds: "D#", E: "E", F: "F",
    Fs: "F#", G: "G", Gs: "G#", A: "A", As: "A#", B: "B",
  };

  const MIN_GAIN = 0.0001;

  const COMPAT_KEY = "elgc_compat_audio";

  function isIOS() {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }

  let ctx = null;
  let instrumentId = "grand";
  let primed = false;

  function useCompat() {
    try {
      return localStorage.getItem(COMPAT_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function setCompatMode(on) {
    try {
      localStorage.setItem(COMPAT_KEY, on ? "1" : "0");
    } catch (_) {}
    if (on && typeof Html5Audio !== "undefined") Html5Audio.unlock();
    document.dispatchEvent(new CustomEvent("elgc-compat-audio-change", { detail: !!on }));
  }

  function getCompatMode() {
    return useCompat();
  }

  function getContext() {
    if (!ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
      ctx.addEventListener("statechange", () => {
        if (ctx.state === "suspended") primed = false;
      });
    }
    return ctx;
  }

  /** Must run synchronously inside touchstart/click — do not await resume(). */
  function unlockAudio() {
    if (useCompat() && typeof Html5Audio !== "undefined") {
      Html5Audio.unlock();
      return true;
    }

    if (isIOS() && typeof Html5Audio !== "undefined") {
      Html5Audio.primeSpeakerRoute();
    }

    const audio = getContext();
    if (!audio) return false;

    if (audio.state === "suspended") {
      try {
        audio.resume();
      } catch (_) {}
    }

    if (!primed) {
      try {
        const buffer = audio.createBuffer(1, 1, audio.sampleRate);
        const source = audio.createBufferSource();
        source.buffer = buffer;
        source.connect(audio.destination);
        source.start(0);
        source.stop(audio.currentTime + 0.001);
        primed = true;
      } catch (_) {}
    }

    return audio.state === "running" || primed;
  }

  function isUnlocked() {
    const audio = ctx;
    return !!audio && (audio.state === "running" || primed);
  }

  function withAudio(fn) {
    unlockAudio();
    const audio = getContext();
    if (!audio) return;
    fn(audio);
  }

  function setInstrument(id) {
    instrumentId = Instruments.PRESETS[id] ? id : "grand";
  }

  function getInstrument() {
    return instrumentId;
  }

  function playTone(noteId, duration = 0.35, when = 0) {
    const freq = NOTE_FREQ[noteId];
    if (!freq) return;

    if (useCompat() && typeof Html5Audio !== "undefined") {
      unlockAudio();
      const minDur = Instruments.getMinDuration(instrumentId);
      Html5Audio.playTone(noteId, NOTE_FREQ, Math.max(duration, minDur), when);
      return;
    }

    withAudio((audio) => {
      const t = audio.currentTime + when;
      const minDur = Instruments.getMinDuration(instrumentId);
      const dur = Math.max(duration, minDur);
      const peak = Instruments.getPreset(instrumentId).peak;
      Instruments.play(audio, instrumentId, freq, t, dur, peak);
    });
  }

  function playSuccess() {
    if (useCompat() && typeof Html5Audio !== "undefined") {
      unlockAudio();
      Html5Audio.playSuccess();
      return;
    }
    withAudio((audio) => {
      const t = audio.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const at = t + i * 0.08;
        gain.gain.setValueAtTime(MIN_GAIN, at);
        gain.gain.linearRampToValueAtTime(0.15, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, at + 0.25);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(at);
        osc.stop(at + 0.3);
      });
    });
  }

  function playWrong() {
    if (useCompat() && typeof Html5Audio !== "undefined") {
      unlockAudio();
      Html5Audio.playWrong();
      return;
    }
    withAudio((audio) => {
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(165, t + 0.2);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(MIN_GAIN, t + 0.25);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  function playChord(noteIds, duration = 0.5, stagger = 0.05) {
    const minDur = Instruments.getMinDuration(instrumentId);
    const chordDur = Math.max(duration, minDur);
    const staggerSec = instrumentId === "pad" || instrumentId === "organ" ? 0.07 : stagger;
    noteIds.forEach((id, i) => playTone(id, chordDur, i * staggerSec));
  }

  function playClick(accent = false) {
    if (useCompat() && typeof Html5Audio !== "undefined") {
      unlockAudio();
      Html5Audio.playClick(accent);
      return;
    }
    withAudio((audio) => {
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.value = accent ? 880 : 660;
      gain.gain.setValueAtTime(accent ? 0.18 : 0.12, t);
      gain.gain.exponentialRampToValueAtTime(MIN_GAIN, t + 0.06);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    });
  }

  let metroTimer = null;
  let metroBeat = 0;
  let metroOptions = { subdivision: 1, accent: true };

  function startMetronome(bpm, options = {}) {
    stopMetronome();
    unlockAudio();
    metroOptions = {
      subdivision: options.subdivision ?? 1,
      accent: options.accent !== false,
      pattern: options.pattern ?? null,
      clickNote: options.clickNote ?? 1,
    };

    playClick(true);

    if (options.pattern && Array.isArray(options.pattern) && options.pattern.length > 0) {
      const len = options.pattern.length;
      const ms = (60000 / bpm) * (options.clickNote ?? 1);
      metroBeat = 0;
      metroTimer = setInterval(() => {
        const accent = options.pattern[metroBeat % len];
        playClick(!!accent);
        metroBeat += 1;
      }, ms);
      return;
    }

    const sub = metroOptions.subdivision;
    const ms = 60000 / bpm / sub;
    metroBeat = 0;
    metroTimer = setInterval(() => {
      metroBeat += 1;
      const clicksPerBar = 4 * sub;
      const isAccent = metroOptions.accent && metroBeat % clicksPerBar === 1;
      playClick(isAccent);
    }, ms);
  }

  function getMetronomeIntervalMs(bpm, subdivision = 1) {
    return 60000 / bpm / subdivision;
  }

  function stopMetronome() {
    if (metroTimer) {
      clearInterval(metroTimer);
      metroTimer = null;
    }
  }

  function markMobileUnlocked() {
    try {
      sessionStorage.setItem("elgc_audio_v3", "1");
    } catch (_) {}
  }

  function enableCompatMode() {
    setCompatMode(true);
    if (typeof Html5Audio !== "undefined") Html5Audio.testNote(NOTE_FREQ);
  }

  const TAP_MOVE_PX = 12;

  /**
   * Fire on finger release (or mouse click), not touchstart — so scrolling still works.
   * Audio unlock runs on touchstart; action runs on touchend when the finger didn't move much.
   */
  function bindTap(el, fn) {
    if (!el || typeof fn !== "function") return;

    let startX = 0;
    let startY = 0;
    let moved = false;
    let touchHandled = false;

    el.addEventListener(
      "touchstart",
      (e) => {
        moved = false;
        touchHandled = false;
        const t = e.touches[0];
        if (t) {
          startX = t.clientX;
          startY = t.clientY;
        }
        unlockAudio();
      },
      { passive: true }
    );

    el.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];
        if (!t || moved) return;
        if (
          Math.abs(t.clientX - startX) > TAP_MOVE_PX ||
          Math.abs(t.clientY - startY) > TAP_MOVE_PX
        ) {
          moved = true;
        }
      },
      { passive: true }
    );

    el.addEventListener(
      "touchend",
      (e) => {
        if (moved) return;
        const t = e.changedTouches[0];
        if (
          t &&
          (Math.abs(t.clientX - startX) > TAP_MOVE_PX ||
            Math.abs(t.clientY - startY) > TAP_MOVE_PX)
        ) {
          return;
        }
        touchHandled = true;
        unlockAudio();
        fn(e);
        window.setTimeout(() => {
          touchHandled = false;
        }, 450);
      },
      { passive: true }
    );

    el.addEventListener("click", (e) => {
      if (touchHandled) return;
      unlockAudio();
      fn(e);
    });
  }

  function initMobileUnlockUI() {
    if (useCompat()) return;

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem("elgc_audio_v3") === "1";
    } catch (_) {}

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!coarse && navigator.maxTouchPoints < 1) return;
    if (dismissed) return;

    const wrap = document.createElement("div");
    wrap.className = "audio-unlock-wrap";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Enable sound");

    const banner = document.createElement("button");
    banner.type = "button";
    banner.className = "audio-unlock-banner";
    banner.innerHTML =
      '<span class="audio-unlock-icon" aria-hidden="true">🔊</span>' +
      '<span class="audio-unlock-text">Tap to enable sound</span>';

    const help = document.createElement("button");
    help.type = "button";
    help.className = "audio-unlock-help";
    help.textContent = "Speaker silent? Tap here (earphones work?)";

    const enable = () => {
      unlockAudio();
      playTone("E", 0.3);
      markMobileUnlocked();
      wrap.classList.add("audio-unlock-hide");
      setTimeout(() => wrap.remove(), 350);
    };

    const enableCompat = (e) => {
      e.stopPropagation();
      enableCompatMode();
      help.textContent = "Compatibility mode on — try a note";
      markMobileUnlocked();
      setTimeout(() => {
        wrap.classList.add("audio-unlock-hide");
        setTimeout(() => wrap.remove(), 400);
      }, 1200);
    };

    bindTap(banner, enable);
    bindTap(help, enableCompat);

    wrap.appendChild(banner);
    wrap.appendChild(help);
    document.body.appendChild(wrap);
  }

  return {
    NOTE_FREQ,
    DISPLAY,
    ALL_NOTES: Object.keys(NOTE_FREQ),
    WHITE_NOTES: ["C", "D", "E", "F", "G", "A", "B"],
    BLACK_NOTES: ["Cs", "Ds", "Fs", "Gs", "As"],
    playTone,
    playChord,
    playClick,
    startMetronome,
    getMetronomeIntervalMs,
    stopMetronome,
    playSuccess,
    playWrong,
    unlockAudio,
    bindTap,
    isUnlocked,
    useCompat,
    getCompatMode,
    setCompatMode,
    enableCompatMode,
    initMobileUnlockUI,
    setInstrument,
    getInstrument,
    displayName: (id) => DISPLAY[id] || id,
  };
})();

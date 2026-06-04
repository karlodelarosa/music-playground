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

  let ctx = null;
  let instrumentId = "grand";
  let primed = false;

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

    withAudio((audio) => {
      const t = audio.currentTime + when;
      const minDur = Instruments.getMinDuration(instrumentId);
      const dur = Math.max(duration, minDur);
      const peak = Instruments.getPreset(instrumentId).peak;
      Instruments.play(audio, instrumentId, freq, t, dur, peak);
    });
  }

  function playSuccess() {
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
      sessionStorage.setItem("elgc_audio_v2", "1");
    } catch (_) {}
  }

  /** Run action on touchstart (iOS) or click (desktop); avoids delayed click breaking audio. */
  function bindTap(el, fn) {
    if (!el || typeof fn !== "function") return;
    el.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        unlockAudio();
        fn(e);
      },
      { passive: false }
    );
    el.addEventListener("click", (e) => {
      unlockAudio();
      fn(e);
    });
  }

  function initMobileUnlockUI() {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem("elgc_audio_v2") === "1";
    } catch (_) {}

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!coarse && navigator.maxTouchPoints < 1) return;
    if (dismissed) return;

    const banner = document.createElement("button");
    banner.type = "button";
    banner.className = "audio-unlock-banner";
    banner.setAttribute("aria-label", "Enable sound");
    banner.innerHTML =
      '<span class="audio-unlock-icon" aria-hidden="true">🔊</span>' +
      "<span class=\"audio-unlock-text\">Tap to enable sound</span>";

    const enable = () => {
      unlockAudio();
      playTone("E", 0.3);
      const audio = getContext();
      if (audio && (audio.state === "running" || primed)) markMobileUnlocked();
      banner.classList.add("audio-unlock-hide");
      setTimeout(() => banner.remove(), 350);
    };

    banner.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        enable();
      },
      { passive: false }
    );
    banner.addEventListener("click", enable);

    document.body.appendChild(banner);
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
    initMobileUnlockUI,
    setInstrument,
    getInstrument,
    displayName: (id) => DISPLAY[id] || id,
  };
})();

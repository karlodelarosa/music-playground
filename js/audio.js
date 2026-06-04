/**
 * Web Audio — notes, chords, metronome; instrument via Instruments presets.
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

  let ctx = null;
  let instrumentId = "grand";
  let unlockPromise = null;

  function getContext() {
    if (!ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      ctx = new Ctx();
      ctx.addEventListener("statechange", () => {
        if (ctx.state === "suspended") unlockPromise = null;
      });
    }
    return ctx;
  }

  /** Prime Web Audio during a tap/click (required on iOS / mobile Safari). */
  function unlockAudio() {
    const audio = getContext();
    if (audio.state === "running") return Promise.resolve();

    if (!unlockPromise) {
      unlockPromise = (async () => {
        if (audio.state === "suspended") await audio.resume();
        const buffer = audio.createBuffer(1, 1, audio.sampleRate);
        const source = audio.createBufferSource();
        source.buffer = buffer;
        source.connect(audio.destination);
        source.start(0);
        source.stop(audio.currentTime + 0.001);
      })().catch(() => {
        unlockPromise = null;
      });
    }
    return unlockPromise;
  }

  function whenRunning(fn) {
    const audio = getContext();
    if (audio.state === "running") {
      fn(audio);
      return;
    }
    unlockAudio().then(() => {
      if (getContext().state === "running") fn(getContext());
    });
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

    whenRunning((audio) => {
      const t = audio.currentTime + when;
      const minDur = Instruments.getMinDuration(instrumentId);
      const dur = Math.max(duration, minDur);
      const peak = Instruments.getPreset(instrumentId).peak;
      Instruments.play(audio, instrumentId, freq, t, dur, peak);
    });
  }

  function playSuccess() {
    whenRunning((audio) => {
      const t = audio.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.15, t + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.3);
      });
    });
  }

  function playWrong() {
    whenRunning((audio) => {
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(165, t + 0.2);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
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
    whenRunning((audio) => {
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.value = accent ? 880 : 660;
      gain.gain.setValueAtTime(accent ? 0.18 : 0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
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
    setInstrument,
    getInstrument,
    displayName: (id) => DISPLAY[id] || id,
  };
})();

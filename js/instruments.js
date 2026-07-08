/**
 * ELGC Playground — Web Audio instrument presets (synthesis).
 */
const Instruments = (() => {
  const PRESETS = {
    grand: {
      id: "grand",
      name: "Grand Piano",
      icon: "piano",
      category: "Keyboard",
      desc: "Warm acoustic piano — default keyboard.",
      minDuration: 0.42,
      peak: 0.2,
    },
    bright: {
      id: "bright",
      name: "Bright Piano",
      icon: "sparkles",
      category: "Keyboard",
      desc: "Crisp, pop-ballad piano with extra sparkle.",
      minDuration: 0.4,
      peak: 0.19,
    },
    electric: {
      id: "electric",
      name: "Electric Piano",
      icon: "sliders-horizontal",
      category: "Keyboard",
      desc: "Rhodes-style bell tone — smooth and jazzy.",
      minDuration: 0.55,
      peak: 0.18,
    },
    organ: {
      id: "organ",
      name: "Organ",
      icon: "wind",
      category: "Keyboard",
      desc: "Classic drawbar organ — sustained church tone.",
      minDuration: 0.9,
      peak: 0.17,
    },
    nylon: {
      id: "nylon",
      name: "Nylon Guitar",
      icon: "guitar",
      category: "Guitar",
      desc: "Soft fingerpicked nylon — mellow attack.",
      minDuration: 0.6,
      peak: 0.2,
    },
    steel: {
      id: "steel",
      name: "Steel Guitar",
      icon: "guitar",
      category: "Guitar",
      desc: "Brighter acoustic strum — more presence.",
      minDuration: 0.55,
      peak: 0.2,
    },
    synth: {
      id: "synth",
      name: "Synth Lead",
      icon: "sliders-vertical",
      category: "Synth",
      desc: "Retro lead — smooth filtered tone.",
      minDuration: 0.48,
      peak: 0.16,
    },
    pad: {
      id: "pad",
      name: "Soft Pad",
      icon: "cloud",
      category: "Synth",
      desc: "Slow, airy pad for chords and atmosphere.",
      minDuration: 1.0,
      peak: 0.15,
    },
  };

  const ORDER = ["grand", "bright", "electric", "organ", "nylon", "steel", "synth", "pad"];

  function effectiveDuration(requested, preset, env) {
    const min = preset.minDuration ?? 0.4;
    const a = env.attack ?? 0.02;
    const d = env.decay ?? 0.1;
    const r = env.release ?? 0.2;
    return Math.max(requested, min, a + d + r + 0.1);
  }

  /** Smooth ADSR — all ramps linear to avoid clicks and broken curves. */
  function scheduleGain(gain, t, peak, env, totalDur) {
    const a = Math.max(env.attack ?? 0.02, 0.003);
    const d = Math.max(env.decay ?? 0.1, 0.02);
    const s = Math.min(Math.max(env.sustain ?? 0.25, 0.05), 0.85);
    const r = Math.max(env.release ?? 0.18, 0.08);
    const end = t + totalDur;
    const p = Math.max(peak, 0.002);
    const ps = Math.max(peak * s, 0.002);
    const decayEnd = Math.min(t + a + d, end - r - 0.01);
    const releaseStart = Math.max(decayEnd, end - r);

    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(p, t + a);
    if (decayEnd > t + a) {
      gain.gain.linearRampToValueAtTime(ps, decayEnd);
    }
    gain.gain.setValueAtTime(ps, releaseStart);
    gain.gain.linearRampToValueAtTime(0.0001, end);
  }

  function startVoices(audio, voices, t, stopAt) {
    voices.forEach(({ type, mult, g, stopEarly }) => {
      const osc = audio.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(mult, t);
      const gn = audio.createGain();
      gn.gain.setValueAtTime(g, t);
      osc.connect(gn);
      gn.connect(voices[0].dest || voices.dest);
      osc.start(t);
      const stop = stopEarly ? t + stopEarly : stopAt;
      osc.stop(Math.min(stop, stopAt + 0.15));
    });
  }

  function playVoices(audio, freq, t, duration, peak, env, voices, filterSetup) {
    const dur = duration;
    const end = t + dur;
    const stopAt = end + 0.15;

    const master = audio.createGain();
    scheduleGain(master, t, peak, env, dur);

    let output = master;
    if (filterSetup) {
      const filter = audio.createBiquadFilter();
      filterSetup(filter, t, dur);
      master.connect(filter);
      output = filter;
    }
    output.connect(audio.destination);

    voices.forEach(({ type, mult, g, stopRatio }) => {
      const osc = audio.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq * mult, t);
      const gn = audio.createGain();
      gn.gain.setValueAtTime(g, t);
      osc.connect(gn);
      gn.connect(master);
      osc.start(t);
      const stop = stopRatio ? t + dur * stopRatio : stopAt;
      osc.stop(Math.max(stop, t + 0.05));
    });
  }

  function playGrand(audio, freq, t, duration, peak) {
    playVoices(audio, freq, t, duration, peak, {
      attack: 0.012,
      decay: 0.08,
      sustain: 0.4,
      release: 0.2,
    }, [
      { type: "triangle", mult: 1, g: 0.5 },
      { type: "sine", mult: 2, g: 0.1 },
      { type: "sine", mult: 0.5, g: 0.07 },
    ]);
  }

  function playBright(audio, freq, t, duration, peak) {
    playVoices(audio, freq, t, duration, peak * 0.95, {
      attack: 0.008,
      decay: 0.07,
      sustain: 0.32,
      release: 0.18,
    }, [
      { type: "triangle", mult: 1, g: 0.42 },
      { type: "sine", mult: 2, g: 0.14 },
      { type: "sine", mult: 3, g: 0.04 },
    ]);
  }

  function playElectric(audio, freq, t, duration, peak) {
    playVoices(
      audio,
      freq,
      t,
      duration,
      peak,
      { attack: 0.01, decay: 0.12, sustain: 0.28, release: 0.28 },
      [
        { type: "sine", mult: 1, g: 0.45 },
        { type: "sine", mult: 2, g: 0.18 },
        { type: "triangle", mult: 2, g: 0.08 },
      ],
      (filter, start, dur) => {
        filter.type = "lowpass";
        filter.Q.value = 0.6;
        filter.frequency.setValueAtTime(2800, start);
        filter.frequency.linearRampToValueAtTime(1800, start + dur * 0.35);
        filter.frequency.linearRampToValueAtTime(1200, start + dur);
      }
    );
  }

  function playOrgan(audio, freq, t, duration, peak) {
    playVoices(audio, freq, t, duration, peak, {
      attack: 0.04,
      decay: 0.12,
      sustain: 0.62,
      release: 0.35,
    }, [
      { type: "sine", mult: 1, g: 0.32 },
      { type: "sine", mult: 2, g: 0.16 },
      { type: "sine", mult: 0.5, g: 0.12 },
    ]);
  }

  function playPluckGuitar(audio, freq, t, duration, peak, bright) {
    playVoices(
      audio,
      freq,
      t,
      duration,
      peak,
      {
        attack: 0.004,
        decay: bright ? 0.14 : 0.18,
        sustain: bright ? 0.08 : 0.12,
        release: bright ? 0.25 : 0.3,
      },
      [
        { type: "triangle", mult: 1, g: bright ? 0.55 : 0.48 },
        { type: "sine", mult: 2, g: bright ? 0.1 : 0.06, stopRatio: 0.55 },
      ],
      (filter, start, dur) => {
        filter.type = "lowpass";
        filter.Q.value = 0.7;
        const hi = bright ? 3000 : 1900;
        const lo = bright ? 1100 : 750;
        filter.frequency.setValueAtTime(hi, start);
        filter.frequency.linearRampToValueAtTime(lo, start + dur);
      }
    );
  }

  function playSynth(audio, freq, t, duration, peak) {
    playVoices(
      audio,
      freq,
      t,
      duration,
      peak,
      { attack: 0.015, decay: 0.1, sustain: 0.38, release: 0.22 },
      [
        { type: "sawtooth", mult: 1, g: 0.14 },
        { type: "sine", mult: 1, g: 0.22 },
        { type: "sine", mult: 2, g: 0.06 },
      ],
      (filter, start, dur) => {
        filter.type = "lowpass";
        filter.Q.value = 1;
        filter.frequency.setValueAtTime(900, start);
        filter.frequency.linearRampToValueAtTime(3500, start + Math.min(0.07, dur * 0.2));
        filter.frequency.linearRampToValueAtTime(2200, start + dur * 0.55);
        filter.frequency.linearRampToValueAtTime(700, start + dur);
      }
    );
  }

  function playPad(audio, freq, t, duration, peak) {
    playVoices(
      audio,
      freq,
      t,
      duration,
      peak,
      { attack: 0.14, decay: 0.22, sustain: 0.5, release: 0.42 },
      [
        { type: "sine", mult: 1, g: 0.38 },
        { type: "sine", mult: 2, g: 0.12 },
        { type: "triangle", mult: 1.005, g: 0.06 },
      ],
      (filter, start, dur) => {
        filter.type = "lowpass";
        filter.Q.value = 0.5;
        filter.frequency.setValueAtTime(2200, start);
        filter.frequency.linearRampToValueAtTime(2000, start + dur);
      }
    );
  }

  const PLAYERS = {
    grand: playGrand,
    bright: playBright,
    electric: playElectric,
    organ: playOrgan,
    nylon: (a, f, t, d, p) => playPluckGuitar(a, f, t, d, p, false),
    steel: (a, f, t, d, p) => playPluckGuitar(a, f, t, d, p, true),
    synth: playSynth,
    pad: playPad,
  };

  function play(audio, instrumentId, freq, t, duration, peak) {
    const preset = PRESETS[instrumentId] || PRESETS.grand;
    const fn = PLAYERS[instrumentId] || PLAYERS.grand;
    const envById = {
      grand: { attack: 0.012, decay: 0.08, sustain: 0.4, release: 0.2 },
      bright: { attack: 0.008, decay: 0.07, sustain: 0.32, release: 0.18 },
      electric: { attack: 0.01, decay: 0.12, sustain: 0.28, release: 0.28 },
      organ: { attack: 0.04, decay: 0.12, sustain: 0.62, release: 0.35 },
      nylon: { attack: 0.004, decay: 0.18, sustain: 0.12, release: 0.3 },
      steel: { attack: 0.004, decay: 0.14, sustain: 0.08, release: 0.25 },
      synth: { attack: 0.015, decay: 0.1, sustain: 0.38, release: 0.22 },
      pad: { attack: 0.14, decay: 0.22, sustain: 0.5, release: 0.42 },
    };
    const dur = effectiveDuration(duration, preset, envById[instrumentId] || envById.grand);
    fn(audio, freq, t, dur, peak ?? preset.peak ?? 0.2);
  }

  function getMinDuration(instrumentId) {
    return PRESETS[instrumentId]?.minDuration ?? 0.4;
  }

  function getPreset(id) {
    return PRESETS[id] || PRESETS.grand;
  }

  function list() {
    return ORDER.map((id) => PRESETS[id]);
  }

  return { PRESETS, ORDER, play, getPreset, getMinDuration, list };
})();

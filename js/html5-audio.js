/**
 * HTML5 Audio fallback — routes through the main speaker on some iPhones
 * where Web Audio only plays on earphones / Bluetooth (not the loudspeaker).
 */
const Html5Audio = (() => {
  const SAMPLE_RATE = 22050;
  const POOL_SIZE = 10;
  const uriCache = new Map();
  let pool = [];
  let poolIdx = 0;
  let speakerPrimed = false;

  function ensurePool() {
    if (pool.length) return;
    for (let i = 0; i < POOL_SIZE; i++) {
      const el = document.createElement("audio");
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "");
      el.preload = "auto";
      el.style.cssText = "position:fixed;width:0;height:0;opacity:0;pointer-events:none";
      document.body.appendChild(el);
      pool.push(el);
    }
  }

  function acquirePlayer() {
    ensurePool();
    const el = pool[poolIdx % POOL_SIZE];
    poolIdx += 1;
    return el;
  }

  function encodeWav(samples) {
    const n = samples.length;
    const buffer = new ArrayBuffer(44 + n * 2);
    const view = new DataView(buffer);
    const w = (o, s) => {
      for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
    };
    w(0, "RIFF");
    view.setUint32(4, 36 + n * 2, true);
    w(8, "WAVE");
    w(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, SAMPLE_RATE, true);
    view.setUint32(28, SAMPLE_RATE * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    w(36, "data");
    view.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return "data:audio/wav;base64," + btoa(bin);
  }

  function buildSamples(freq, durationSec, peak) {
    const n = Math.max(1, Math.ceil(SAMPLE_RATE * durationSec));
    const attack = Math.min(0.008, durationSec * 0.12);
    const release = Math.min(0.1, durationSec * 0.4);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      let env = peak;
      if (t < attack) env = peak * (t / attack);
      else if (t > durationSec - release) env = peak * Math.max(0, (durationSec - t) / release);
      out[i] = Math.sin(2 * Math.PI * freq * t) * env;
    }
    return out;
  }

  function uriFor(freq, durationSec, peak = 0.28) {
    const key = `${Math.round(freq * 10)}-${durationSec.toFixed(2)}-${peak}`;
    if (uriCache.has(key)) return uriCache.get(key);
    const u = encodeWav(buildSamples(freq, durationSec, peak));
    uriCache.set(key, u);
    return u;
  }

  function playOnElement(el, uri, volume = 1) {
    try {
      el.pause();
      el.currentTime = 0;
      el.src = uri;
      el.volume = Math.min(1, Math.max(0, volume));
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (_) {}
  }

  function playFreq(freq, durationSec, delaySec = 0, peak = 0.28) {
    const uri = uriFor(freq, durationSec, peak);
    const run = () => playOnElement(acquirePlayer(), uri);
    if (delaySec > 0) setTimeout(run, delaySec * 1000);
    else run();
  }

  function playTone(noteId, freqMap, duration = 0.35, delaySec = 0) {
    const freq = freqMap[noteId];
    if (!freq) return;
    const dur = Math.max(duration, 0.2);
    playFreq(freq, dur, delaySec);
  }

  function playChord(noteIds, freqMap, duration = 0.5, stagger = 0.05) {
    noteIds.forEach((id, i) => playTone(id, freqMap, duration, i * stagger));
  }

  function playClick(accent) {
    playFreq(accent ? 880 : 660, 0.06, 0, accent ? 0.35 : 0.25);
  }

  function playSuccess() {
    [523.25, 659.25, 783.99].forEach((f, i) => playFreq(f, 0.22, i * 0.08, 0.2));
  }

  function playWrong() {
    playFreq(220, 0.28, 0, 0.18);
    setTimeout(() => playFreq(165, 0.2, 0, 0.15), 120);
  }

  function unlock() {
    playFreq(440, 0.04, 0, 0.02);
  }

  /** Claim the loudspeaker route (iOS may send Web Audio to earpiece/BT otherwise). */
  function primeSpeakerRoute() {
    if (speakerPrimed) return;
    speakerPrimed = true;
    ensurePool();
    playOnElement(acquirePlayer(), uriFor(440, 0.05, 0.12), 0.35);
  }

  function testNote(freqMap) {
    playTone("E", freqMap, 0.35, 0);
  }

  return {
    playTone,
    playChord,
    playClick,
    playSuccess,
    playWrong,
    unlock,
    primeSpeakerRoute,
    testNote,
    playFreq,
  };
})();

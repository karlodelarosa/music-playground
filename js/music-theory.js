/**
 * Shared music theory data — keys, circle, progressions, Nashville degrees.
 */
const MusicTheory = (() => {
  const CHROMATIC = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"];
  const DISPLAY = AudioEngine.DISPLAY;

  const KEYS = [
    { id: "C", label: "C Major", sharps: 0, flats: 0 },
    { id: "G", label: "G Major", sharps: 1, flats: 0 },
    { id: "D", label: "D Major", sharps: 2, flats: 0 },
    { id: "A", label: "A Major", sharps: 3, flats: 0 },
    { id: "E", label: "E Major", sharps: 4, flats: 0 },
    { id: "B", label: "B Major", sharps: 5, flats: 0 },
    { id: "Fs", label: "F# / G♭ Major", sharps: 6, flats: 0 },
    { id: "Cs", label: "C# Major", sharps: 7, flats: 0 },
    { id: "F", label: "F Major", sharps: 0, flats: 1 },
    { id: "As", label: "B♭ Major", sharps: 0, flats: 2 },
    { id: "Ds", label: "E♭ Major", sharps: 0, flats: 3 },
    { id: "Gs", label: "A♭ Major", sharps: 0, flats: 4 },
  ];

  const CIRCLE_ORDER = ["C", "G", "D", "A", "E", "B", "Fs", "Cs", "Gs", "Ds", "As", "F"];
  const CIRCLE_LABELS = ["C", "G", "D", "A", "E", "B", "F♯", "C♯", "A♭", "E♭", "B♭", "F"];

  const RELATIVE_MINOR = {
    C: "Am", G: "Em", D: "Bm", A: "F#m", E: "C#m", B: "G#m",
    Fs: "D#m", Cs: "A#m", F: "Dm", As: "Gm", Ds: "Cm", Gs: "Fm",
  };

  const SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

  const DEGREE_QUALITY = ["Major", "minor", "minor", "Major", "Major", "minor", "diminished"];
  const DEGREE_ROMAN = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];

  const QUALITY_LABELS = {
    Major: "Major",
    minor: "Minor",
    diminished: "Diminished",
  };

  const PROGRESSION_TEMPLATES = [
    {
      id: "1451",
      name: "I – IV – V – I",
      nums: [1, 4, 5, 1],
      desc: "The classic cadence — home, departure, tension, return.",
      use: "Blues, country, hymns, countless pop songs.",
    },
    {
      id: "1564",
      name: "I – V – vi – IV",
      nums: [1, 5, 6, 4],
      desc: "The 'pop progression' — emotional lift then release.",
      use: "Let It Be, Don't Stop Believin', With or Without You.",
    },
    {
      id: "1645",
      name: "I – vi – IV – V",
      nums: [1, 6, 4, 5],
      desc: "Doo-wop / 50s ballad feel — sweet and nostalgic.",
      use: "Stand By Me, Earth Angel, Blue Moon.",
    },
    {
      id: "251",
      name: "ii – V – I",
      nums: [2, 5, 1],
      desc: "Jazz's favorite resolution — smooth voice-leading into home.",
      use: "Autumn Leaves, Satin Doll, most jazz standards.",
    },
    {
      id: "1615",
      name: "I – vi – I – V",
      nums: [1, 6, 1, 5],
      desc: "Gentle loop with a vi color — reflective pop.",
      use: "Common in ballads and indie tracks.",
    },
  ];

  function noteIndex(id) {
    return CHROMATIC.indexOf(id);
  }

  function transpose(rootId, semitones) {
    const i = noteIndex(rootId);
    if (i < 0) return rootId;
    return CHROMATIC[(i + semitones + 12) % 12];
  }

  function getScale(rootId) {
    const root = noteIndex(rootId);
    return SCALE_INTERVALS.map((interval) => CHROMATIC[(root + interval) % 12]);
  }

  function triad(root, quality) {
    const r = noteIndex(root);
    if (r < 0) return root ? [root] : [];
    const q = quality === "dim" ? "diminished" : quality;
    if (q === "minor") return [CHROMATIC[r], CHROMATIC[(r + 3) % 12], CHROMATIC[(r + 7) % 12]];
    if (q === "diminished") return [CHROMATIC[r], CHROMATIC[(r + 3) % 12], CHROMATIC[(r + 6) % 12]];
    return [CHROMATIC[r], CHROMATIC[(r + 4) % 12], CHROMATIC[(r + 7) % 12]];
  }

  function buildFromSemitones(rootId, semitones) {
    const r = noteIndex(rootId);
    if (r < 0) return [rootId];
    const seen = new Set();
    const notes = [];
    semitones.forEach((s) => {
      const n = CHROMATIC[(r + s) % 12];
      if (!seen.has(n)) {
        seen.add(n);
        notes.push(n);
      }
    });
    return notes;
  }

  /** Chord library — simple → extended (intervals from root in semitones). */
  const CHORD_CATALOG = [
    { tier: 1, tierLabel: "Triads — the core", id: "maj", name: "Major", symbol: "C", formula: "1 – 3 – 5", semitones: [0, 4, 7], mood: "Bright, happy, resolved", use: "Pop hooks, choruses, home base" },
    { tier: 1, id: "min", name: "Minor", symbol: "Cm", formula: "1 – ♭3 – 5", semitones: [0, 3, 7], mood: "Sad, intimate, emotional", use: "Ballads, verses, moody sections" },
    { tier: 1, id: "dim", name: "Diminished", symbol: "C°", formula: "1 – ♭3 – ♭5", semitones: [0, 3, 6], mood: "Tense, unstable", use: "Passing chord, vii° in major keys" },
    { tier: 1, id: "aug", name: "Augmented", symbol: "C+", formula: "1 – 3 – ♯5", semitones: [0, 4, 8], mood: "Dreamy, lifted, uneasy", use: "Transitions, film cues" },
    { tier: 2, tierLabel: "Sevenths — color & tension", id: "dom7", name: "Dominant 7th", symbol: "C7", formula: "1 – 3 – 5 – ♭7", semitones: [0, 4, 7, 10], mood: "Bluesy pull — wants to resolve", use: "Blues, jazz, V → I cadences" },
    { tier: 2, id: "maj7", name: "Major 7th", symbol: "Cmaj7", formula: "1 – 3 – 5 – 7", semitones: [0, 4, 7, 11], mood: "Smooth, jazzy, sophisticated", use: "R&B, neo-soul, lullabies" },
    { tier: 2, id: "min7", name: "Minor 7th", symbol: "Cm7", formula: "1 – ♭3 – 5 – ♭7", semitones: [0, 3, 7, 10], mood: "Relaxed, funky, mellow", use: "ii chord in jazz, funk grooves" },
    { tier: 2, id: "sus2", name: "Sus2", symbol: "Csus2", formula: "1 – 2 – 5", semitones: [0, 2, 7], mood: "Open, airy", use: "Ambient pop, pads" },
    { tier: 2, id: "sus4", name: "Sus4", symbol: "Csus4", formula: "1 – 4 – 5", semitones: [0, 5, 7], mood: "Suspended — not resolved yet", use: "Build-ups before a drop" },
    { tier: 3, tierLabel: "Ninths — richer stacks", id: "add9", name: "Add9", symbol: "Cadd9", formula: "1 – 3 – 5 – 9", semitones: [0, 4, 7, 14], mood: "Shimmer without jazz tension", use: "Acoustic pop, arpeggios" },
    { tier: 3, id: "maj9", name: "Major 9th", symbol: "Cmaj9", formula: "1 – 3 – 5 – 7 – 9", semitones: [0, 4, 7, 11, 14], mood: "Lush, expensive", use: "Jazz ballads, chill hop" },
    { tier: 3, id: "min9", name: "Minor 9th", symbol: "Cm9", formula: "1 – ♭3 – 5 – ♭7 – 9", semitones: [0, 3, 7, 10, 14], mood: "Deep, nocturnal", use: "Lo-fi, smooth jazz" },
    { tier: 3, id: "dom9", name: "Dominant 9th", symbol: "C9", formula: "1 – 3 – 5 – ♭7 – 9", semitones: [0, 4, 7, 10, 14], mood: "Funky dominant color", use: "Blues, jazz turnarounds" },
    { tier: 4, tierLabel: "11ths — wide harmony", id: "maj11", name: "Major 11th", symbol: "Cmaj11", formula: "1 – 3 – 5 – 7 – 9 – 11", semitones: [0, 4, 7, 11, 14, 17], mood: "Ethereal, cinematic", use: "Soundtracks, spacious chords" },
    { tier: 4, id: "min11", name: "Minor 11th", symbol: "Cm11", formula: "1 – ♭3 – 5 – ♭7 – 9 – 11", semitones: [0, 3, 7, 10, 14, 17], mood: "Moody, atmospheric", use: "Downtempo, jazz-fusion" },
    { tier: 4, id: "dom11", name: "Dominant 11th", symbol: "C11", formula: "1 – 3 – 5 – ♭7 – 9 – 11", semitones: [0, 4, 7, 10, 14, 17], mood: "Complex dominant", use: "Funk, advanced jazz comping" },
    { tier: 5, tierLabel: "13ths — full jazz stack", id: "dom13", name: "Dominant 13th", symbol: "C13", formula: "1 – 3 – 5 – ♭7 – 9 – 11 – 13", semitones: [0, 4, 7, 10, 14, 17, 21], mood: "Maximum dominant richness", use: "Big band, jazz endings" },
    { tier: 5, id: "maj13", name: "Major 13th", symbol: "Cmaj13", formula: "1 – 3 – 5 – 7 – 9 – 11 – 13", semitones: [0, 4, 7, 11, 14, 17, 21], mood: "Ultra-lush major", use: "Bossa nova, jazz standards" },
  ];

  function formatChordSymbol(template, rootId) {
    const rootName = DISPLAY[rootId] || rootId || "C";
    if (!template || template === "C") return rootName;
    if (template.charAt(0) === "C" && template.length > 1) {
      return rootName + template.slice(1);
    }
    return rootName;
  }

  function qualityLabel(quality) {
    return QUALITY_LABELS[quality] || quality || "Unknown";
  }

  function getCatalogChord(typeId, rootId = "C") {
    const def = CHORD_CATALOG.find((c) => c.id === typeId) || CHORD_CATALOG[0];
    const notes = buildFromSemitones(rootId, def.semitones);
    const symbol = formatChordSymbol(def.symbol, rootId);
    return {
      ...def,
      rootId,
      notes,
      symbol,
      noteNames: notes.map((n) => DISPLAY[n] || n).join(" · "),
    };
  }

  function renderDegreeChartHtml(chords, highlightNums = [], selectedNums = []) {
    const inProg = new Set(highlightNums.map(String));
    const selected = new Set(selectedNums.map(String));
    return `<div class="degree-chart-full">${chords
      .map(
        (c) => `
      <button type="button" class="degree-chart-cell${inProg.has(c.num) ? " in-progression" : ""}${selected.has(c.num) ? " selected" : ""}" data-num="${c.num}" data-notes="${c.notes.join(",")}" aria-pressed="${selected.has(c.num) ? "true" : "false"}">
        <span class="dc-num">${c.num}</span>
        <span class="dc-roman">${c.roman}</span>
        <span class="dc-chord">${c.label}</span>
        <span class="dc-quality">${qualityLabel(c.quality)}</span>
      </button>`
      )
      .join("")}</div>`;
  }

  function chordLabel(root, quality) {
    if (!root) return "—";
    const name = DISPLAY[root] || root;
    const q = quality === "dim" ? "diminished" : quality;
    if (q === "minor") return name + "m";
    if (q === "diminished") return name + "°";
    return name;
  }

  function getDiatonicChords(rootId) {
    const scale = getScale(rootId);
    return DEGREE_ROMAN.map((roman, i) => {
      const root = scale[i];
      const quality = DEGREE_QUALITY[i] || "Major";
      return {
        num: String(i + 1),
        roman,
        root,
        quality,
        qualityLabel: qualityLabel(quality),
        label: chordLabel(root, quality),
        notes: triad(root, quality),
      };
    });
  }

  function getChordForDegree(rootId, degreeNum) {
    const chords = getDiatonicChords(rootId);
    return chords.find((c) => c.num === String(degreeNum)) || chords[0];
  }

  function getProgressionInKey(rootId, template) {
    return template.nums.map((n) => {
      const ch = getChordForDegree(rootId, n);
      return { ...ch, degree: n };
    });
  }

  function getCircleInfo(keyId) {
    const idx = CIRCLE_ORDER.indexOf(keyId);
    const keyMeta = KEYS.find((k) => k.id === keyId) || KEYS[0];
    const prev = CIRCLE_ORDER[(idx - 1 + 12) % 12];
    const next = CIRCLE_ORDER[(idx + 1) % 12];
    const chords = getDiatonicChords(keyId);

    let signature = "No sharps or flats";
    if (keyMeta.sharps) signature = `${keyMeta.sharps} sharp${keyMeta.sharps > 1 ? "s" : ""}`;
    if (keyMeta.flats) signature = `${keyMeta.flats} flat${keyMeta.flats > 1 ? "s" : ""}`;

    return {
      keyId,
      label: keyMeta.label,
      display: CIRCLE_LABELS[idx] || DISPLAY[keyId],
      index: idx,
      relativeMinor: RELATIVE_MINOR[keyId] || "—",
      signature,
      scaleNotes: getScale(keyId).map((n) => DISPLAY[n]).join(" · "),
      neighborLeft: CIRCLE_LABELS[(idx - 1 + 12) % 12],
      neighborRight: CIRCLE_LABELS[(idx + 1) % 12],
      prevId: prev,
      nextId: next,
      chords,
      tip: idx === 0
        ? "C major is the 'neutral' key — great for beginners. No black keys in the scale."
        : `Moving clockwise adds a sharp; counter-clockwise adds a flat. ${keyMeta.label} feels ${keyMeta.sharps > 3 ? "bright and tense" : keyMeta.flats > 2 ? "warm and mellow" : "balanced"}.`,
      commonProg: getProgressionInKey(keyId, PROGRESSION_TEMPLATES[1])
        .map((c) => c.label)
        .join(" → "),
    };
  }

  /** Church modes & relatives — semitone steps from root. */
  const MODES = [
    { id: "ionian", name: "Ionian", alias: "Major", intervals: [0, 2, 4, 5, 7, 9, 11], formula: "1 · 2 · 3 · 4 · 5 · 6 · 7", character: "Bright and resolved — the familiar major sound.", uses: "Pop, country, classical themes", change: "Reference major scale" },
    { id: "dorian", name: "Dorian", alias: "Minor ↑6", intervals: [0, 2, 3, 5, 7, 9, 10], formula: "1 · 2 · ♭3 · 4 · 5 · 6 · ♭7", character: "Minor but smooth — raised 6th adds hope.", uses: "So What, Scarborough Fair, funk jams", change: "♭3 & ♭7 vs major; natural 6" },
    { id: "phrygian", name: "Phrygian", alias: "Minor ↓2", intervals: [0, 1, 3, 5, 7, 8, 10], formula: "1 · ♭2 · ♭3 · 4 · 5 · ♭6 · ♭7", character: "Dark, Spanish, exotic — ♭2 is the tell.", uses: "Flamenco, metal riffs, film tension", change: "♭2, ♭3, ♭6, ♭7" },
    { id: "lydian", name: "Lydian", alias: "Major ↑4", intervals: [0, 2, 4, 6, 7, 9, 11], formula: "1 · 2 · 3 · ♯4 · 5 · 6 · 7", character: "Dreamy, floating — ♯4 lifts everything.", uses: "Film scores, jazz, Simpsons theme vibe", change: "♯4 only vs major" },
    { id: "mixolydian", name: "Mixolydian", alias: "Major ↓7", intervals: [0, 2, 4, 5, 7, 9, 10], formula: "1 · 2 · 3 · 4 · 5 · 6 · ♭7", character: "Rock/blues major — dominant ♭7.", uses: "Beatles, Grateful Dead, blues-rock", change: "♭7 vs major" },
    { id: "aeolian", name: "Aeolian", alias: "Natural minor", intervals: [0, 2, 3, 5, 7, 8, 10], formula: "1 · 2 · ♭3 · 4 · 5 · ♭6 · ♭7", character: "Sad, serious — pure natural minor.", uses: "Ballads, metal, emotional pop", change: "♭3, ♭6, ♭7 vs major" },
    { id: "locrian", name: "Locrian", alias: "Diminished tonic", intervals: [0, 1, 3, 5, 6, 8, 10], formula: "1 · ♭2 · ♭3 · 4 · ♭5 · ♭6 · ♭7", character: "Unstable, rare — ♭5 collapses the home chord.", uses: "Passing color, thrash metal, theory class", change: "♭2, ♭3, ♭5, ♭6, ♭7" },
  ];

  const TIME_SIGNATURES = [
    { id: "44", display: "4/4", category: "Common", clickNote: 1, pattern: [1, 0, 0, 0], beatLabels: ["1", "2", "3", "4"], grouping: "4 beats", feel: "Steady march or rock pulse — most pop/country.", explanation: "Top number = 4 quarter-note beats per bar. Bottom 4 = quarter gets the beat.", examples: "Most radio hits, Queen We Will Rock You stomps", tip: "Count 1-2-3-4. Downbeat on 1." },
    { id: "34", display: "3/4", category: "Common", clickNote: 1, pattern: [1, 0, 0], beatLabels: ["1", "2", "3"], grouping: "3 beats", feel: "Waltz sway — strong–weak–weak.", explanation: "Three quarter beats per bar. Feels circular, not square like 4/4.", examples: "Waltzes, Happy Birthday, Tennessee Waltz", tip: "Think STRONG-2-3." },
    { id: "24", display: "2/4", category: "Common", clickNote: 1, pattern: [1, 0], beatLabels: ["1", "2"], grouping: "2 beats", feel: "Quick march — in-two.", explanation: "Two quarter beats. Often faster tempi — polkas, marches.", examples: "Polkas, some Latin dances", tip: "Half the length of 4/4 per bar." },
    { id: "68", display: "6/8", category: "Compound", clickNote: 0.5, pattern: [1, 0, 0, 1, 0, 0], beatLabels: ["1", "2", "3", "4", "5", "6"], grouping: "2 × (3 eighths)", feel: "Lilting 2 — two big beats, each split in 3.", explanation: "6 eighth notes grouped 3+3. BPM usually refers to dotted-quarter (2 per bar).", examples: "Norwegian Wood, House of the Rising Sun", tip: "Count 1-&-a 2-&-a — accent 1 and 4." },
    { id: "98", display: "9/8", category: "Compound", clickNote: 0.5, pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0], beatLabels: ["1", "2", "3", "4", "5", "6", "7", "8", "9"], grouping: "3 × (3 eighths)", feel: "Three compound beats — flowing jigs.", explanation: "Nine eighths in three groups of three.", examples: "Irish slip jigs, some Debussy", tip: "Feel three beats, not nine tiny ones." },
    { id: "128", display: "12/8", category: "Compound", clickNote: 0.5, pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0], beatLabels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], grouping: "4 × (3 eighths)", feel: "Blues shuffle — four dotted quarters.", explanation: "Twelve eighths = four groups of three. Slow blues often written 12/8.", examples: "Blues shuffle, Boyfriend in 22 Minutes vibe", tip: "Same swing feel as triplet 4/4." },
    { id: "54", display: "5/4", category: "Odd", clickNote: 1, pattern: [1, 0, 0, 0, 0], beatLabels: ["1", "2", "3", "4", "5"], grouping: "5 quarters (3+2 or 2+3)", feel: "Off-kilter — extra beat stretches the bar.", explanation: "Five quarter beats. Often felt 3+2 (strong-weak-weak-strong-weak).", examples: "Take Five, Mission Impossible, Gorillaz 5/4 grooves", tip: "Subdivide 3+2 until it feels natural." },
    { id: "74", display: "7/4", category: "Odd", clickNote: 1, pattern: [1, 0, 0, 0, 1, 0, 0], beatLabels: ["1", "2", "3", "4", "5", "6", "7"], grouping: "7 quarters (4+3)", feel: "Prog-rock stretch — long asymmetric bar.", explanation: "Seven quarter beats. Can group 4+3 or 2+2+3.", examples: "Pink Floyd Money (7/4 sections), All You Need Is Love", tip: "Find the internal 4+3 accent pattern." },
    { id: "78_223", display: "7/8", category: "Odd", clickNote: 0.5, pattern: [1, 0, 1, 0, 1, 0, 0], beatLabels: ["1", "2", "3", "4", "5", "6", "7"], grouping: "2 + 2 + 3", feel: "Balkan bounce — short–short–long.", explanation: "Seven eighth notes per bar, classic 2+2+3 grouping.", examples: "Bulgarian folk, some film cues, progressive metal", tip: "Accent beats 1, 3, and 5." },
    { id: "58_323", display: "5/8", category: "Odd", clickNote: 0.5, pattern: [1, 0, 1, 0, 1], beatLabels: ["1", "2", "3", "4", "5"], grouping: "3 + 2", feel: "Tight odd meter — three then two.", explanation: "Five eighths, often 3+2.", examples: "Some Greek & Balkan dances", tip: "Count 1-2-3-1-2 with accents." },
    { id: "116", display: "11/8", category: "Odd", clickNote: 0.5, pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], beatLabels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"], grouping: "3 + 3 + 3 + 2", feel: "Advanced — four uneven chunks.", explanation: "Eleven eighths; common grouping 3+3+3+2.", examples: "Contemporary classical, fusion experiments", tip: "Master 7/8 before this one." },
  ];

  const INTERVALS = [
    { id: "P1", name: "Perfect unison", semitones: 0, short: "P1", quality: "Same note" },
    { id: "m2", name: "Minor 2nd", semitones: 1, short: "♭2", quality: "Tight, tense" },
    { id: "M2", name: "Major 2nd", semitones: 2, short: "2", quality: "Whole step" },
    { id: "m3", name: "Minor 3rd", semitones: 3, short: "♭3", quality: "Sad color" },
    { id: "M3", name: "Major 3rd", semitones: 4, short: "3", quality: "Happy color" },
    { id: "P4", name: "Perfect 4th", semitones: 5, short: "4", quality: "Open, stable" },
    { id: "TT", name: "Tritone", semitones: 6, short: "♭5", quality: "Devil's interval" },
    { id: "P5", name: "Perfect 5th", semitones: 7, short: "5", quality: "Power, strong" },
    { id: "m6", name: "Minor 6th", semitones: 8, short: "♭6", quality: "Sweet sadness" },
    { id: "M6", name: "Major 6th", semitones: 9, short: "6", quality: "Bright leap" },
    { id: "m7", name: "Minor 7th", semitones: 10, short: "♭7", quality: "Dominant color" },
    { id: "M7", name: "Major 7th", semitones: 11, short: "7", quality: "Leading tension" },
    { id: "P8", name: "Octave", semitones: 12, short: "8ve", quality: "Same note, higher" },
  ];

  function getMode(id) {
    return MODES.find((m) => m.id === id) || MODES[0];
  }

  function triadQualityOnScaleDegree(scaleNotes, degreeIndex) {
    const root = noteIndex(scaleNotes[degreeIndex]);
    const third = noteIndex(scaleNotes[(degreeIndex + 2) % 7]);
    const fifth = noteIndex(scaleNotes[(degreeIndex + 4) % 7]);
    if (root < 0 || third < 0 || fifth < 0) return "major";
    const m3 = (third - root + 12) % 12;
    const p5 = (fifth - root + 12) % 12;
    if (m3 === 3 && p5 === 6) return "dim";
    if (m3 === 3 && p5 === 7) return "minor";
    if (m3 === 4 && p5 === 7) return "major";
    if (m3 === 3) return "minor";
    return "major";
  }

  function getModeScale(rootId, modeId) {
    const mode = getMode(modeId);
    const notes = buildFromSemitones(rootId, mode.intervals);
    const formulaParts = mode.formula.split(" · ");
    const degrees = notes.map((noteId, i) => {
      const quality = triadQualityOnScaleDegree(notes, i);
      return {
        num: String(i + 1),
        interval: formulaParts[i] || String(i + 1),
        noteId,
        noteName: DISPLAY[noteId] || noteId,
        chordLabel: chordLabel(noteId, quality === "dim" ? "dim" : quality === "minor" ? "minor" : "Major"),
      };
    });
    return {
      ...mode,
      rootId,
      notes,
      degrees,
      noteNames: notes.map((n) => DISPLAY[n] || n).join(" · "),
    };
  }

  function renderScaleDegreeHtml(scale) {
    const degrees = scale.degrees || [];
    return `<div class="scale-degree-row">${degrees
      .map(
        (d) => `
      <button type="button" class="scale-degree-cell${d.num === "1" ? " root-degree" : ""}" data-note="${d.noteId}" data-degree="${d.num}">
        <span class="sd-num">${d.num}</span>
        <span class="sd-interval">${d.interval}</span>
        <span class="sd-note">${d.chordLabel || d.noteName}</span>
      </button>`
      )
      .join("")}</div>`;
  }

  function getTimeSignature(id) {
    return TIME_SIGNATURES.find((t) => t.id === id) || TIME_SIGNATURES[0];
  }

  function getInterval(id) {
    return INTERVALS.find((i) => i.id === id) || INTERVALS[0];
  }

  function intervalNotes(rootId, semitones) {
    const top = transpose(rootId, semitones);
    return [rootId, top];
  }

  function buildCircleSvg(activeId, onClick) {
    const cx = 160, cy = 160, rOuter = 138, rInner = 82;
    let svg = `<svg class="circle-svg tool-circle-svg" viewBox="0 0 320 320" role="img" aria-label="Circle of fifths">`;
    CIRCLE_ORDER.forEach((noteId, i) => {
      const a0 = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
      const x0 = cx + rOuter * Math.cos(a0), y0 = cy + rOuter * Math.sin(a0);
      const x1 = cx + rOuter * Math.cos(a1), y1 = cy + rOuter * Math.sin(a1);
      const xi0 = cx + rInner * Math.cos(a0), yi0 = cy + rInner * Math.sin(a0);
      const xi1 = cx + rInner * Math.cos(a1), yi1 = cy + rInner * Math.sin(a1);
      const mid = (a0 + a1) / 2;
      const lx = cx + (rOuter + rInner) / 2 * Math.cos(mid);
      const ly = cy + (rOuter + rInner) / 2 * Math.sin(mid);
      const hue = (i * 30) % 360;
      const active = noteId === activeId ? " active" : "";
      svg += `<path class="circle-key${active}" data-key="${noteId}" role="button" aria-label="${CIRCLE_LABELS[i]} major" d="M${x0},${y0} A${rOuter},${rOuter} 0 0,1 ${x1},${y1} L${xi1},${yi1} A${rInner},${rInner} 0 0,0 ${xi0},${yi0} Z" fill="hsla(${hue},52%,48%,0.9)" stroke="var(--border-strong)"/>`;
      svg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="15" font-weight="700" pointer-events="none">${CIRCLE_LABELS[i]}</text>`;
    });
    svg += `<circle cx="${cx}" cy="${cy}" r="${rInner - 6}" fill="var(--bg-panel-solid)" stroke="var(--border)"/>`;
    svg += `<text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="var(--text-dim)" font-size="10" font-weight="600">5ths</text>`;
    svg += `<text x="${cx}" y="${cy + 10}" text-anchor="middle" fill="var(--accent-strong)" font-size="11" font-weight="800">→</text>`;
    svg += `</svg>`;
    return svg;
  }

  return {
    KEYS,
    CHROMATIC,
    CIRCLE_ORDER,
    CIRCLE_LABELS,
    PROGRESSION_TEMPLATES,
    CHORD_CATALOG,
    DISPLAY,
    getScale,
    getDiatonicChords,
    getChordForDegree,
    getProgressionInKey,
    getCircleInfo,
    getCatalogChord,
    buildFromSemitones,
    renderDegreeChartHtml,
    buildCircleSvg,
    chordLabel,
    qualityLabel,
    formatChordSymbol,
    triad,
    MODES,
    TIME_SIGNATURES,
    INTERVALS,
    getMode,
    getModeScale,
    renderScaleDegreeHtml,
    getTimeSignature,
    getInterval,
    intervalNotes,
    transpose,
  };
})();

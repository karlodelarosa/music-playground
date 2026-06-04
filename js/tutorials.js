/**
 * Music Academy — gamified interactive tutorials.
 */
const Academy = (() => {
  const TUTORIAL_META = {
    bpm: { icon: "⏱️", title: "BPM & Rhythm", desc: "Tap tempo, feel the beat, master BPM.", tier: "beginner", lessons: 4 },
    notes: { icon: "🎵", title: "Note Names", desc: "Learn every key on the piano.", tier: "beginner", lessons: 4 },
    progressions: { icon: "🔄", title: "Chord Progressions", desc: "I–IV–V and pop's favorite moves.", tier: "beginner", lessons: 4 },
    circle: { icon: "⭕", title: "Circle of Fifths", desc: "Explore keys that love each other.", tier: "intermediate", lessons: 4 },
    nashville: { icon: "🔢", title: "Nashville Numbers", desc: "Chord degrees in any key — 1–7.", tier: "intermediate", lessons: 4 },
    chordtypes: { icon: "🎹", title: "Chord Structures", desc: "Major, minor, 7th, dim, aug & more.", tier: "advanced", lessons: 4 },
    modes: { icon: "🎭", title: "Modal Scales", desc: "Dorian, Lydian, Phrygian — color beyond major.", tier: "advanced", lessons: 4 },
    timesignatures: { icon: "📐", title: "Time Signatures", desc: "Odd & compound meters — 5/4, 7/8, 6/8.", tier: "advanced", lessons: 4 },
    intervals: { icon: "📏", title: "Intervals", desc: "Hear the distance between two notes.", tier: "advanced", lessons: 4 },
  };

  const CIRCLE_ORDER = ["C", "G", "D", "A", "E", "B", "Fs", "Cs", "Gs", "Ds", "As", "F"];
  const CIRCLE_LABELS = ["C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F"];

  const NASHVILLE_C = [
    { num: "1", chord: "C", notes: ["C", "E", "G"], quality: "Major" },
    { num: "2", chord: "Dm", notes: ["D", "F", "A"], quality: "minor" },
    { num: "3", chord: "Em", notes: ["E", "G", "B"], quality: "minor" },
    { num: "4", chord: "F", notes: ["F", "A", "C"], quality: "Major" },
    { num: "5", chord: "G", notes: ["G", "B", "D"], quality: "Major" },
    { num: "6", chord: "Am", notes: ["A", "C", "E"], quality: "minor" },
    { num: "7", chord: "B°", notes: ["B", "D", "F"], quality: "diminished" },
  ];

  const CHORD_TYPES = [
    { id: "maj", name: "Major", formula: "1 – 3 – 5", intervals: "Happy, bright", notes: ["C", "E", "G"] },
    { id: "min", name: "Minor", formula: "1 – ♭3 – 5", intervals: "Moody, emotional", notes: ["C", "Ds", "G"] },
    { id: "7", name: "Dominant 7th", formula: "1 – 3 – 5 – ♭7", intervals: "Tension → resolve", notes: ["G", "B", "D", "F"] },
    { id: "maj7", name: "Major 7th", formula: "1 – 3 – 5 – 7", intervals: "Dreamy, jazzy", notes: ["C", "E", "G", "B"] },
    { id: "min7", name: "Minor 7th", formula: "1 – ♭3 – 5 – ♭7", intervals: "Smooth, soulful", notes: ["D", "F", "A", "C"] },
    { id: "dim", name: "Diminished", formula: "1 – ♭3 – ♭5", intervals: "Dark, unstable", notes: ["B", "D", "F"] },
    { id: "aug", name: "Augmented", formula: "1 – 3 – ♯5", intervals: "Mysterious lift", notes: ["C", "E", "As"] },
  ];

  const PROGRESSIONS = {
    classical: { name: "I – IV – V – I", nums: ["1", "4", "5", "1"], chords: ["C", "F", "G", "C"], notes: [["C","E","G"], ["F","A","C"], ["G","B","D"], ["C","E","G"]] },
    pop: { name: "I – V – vi – IV", nums: ["1", "5", "6", "4"], chords: ["C", "G", "Am", "F"], notes: [["C","E","G"], ["G","B","D"], ["A","C","E"], ["F","A","C"]] },
  };

  let active = null;
  let stageEl = null;
  let progressEl = null;
  let titleEl = null;
  let ctx = null;

  function mount(stage, progressFill, title, context) {
    stageEl = stage;
    progressEl = progressFill;
    titleEl = title;
    ctx = context;
  }

  function setProgress(step, total) {
    const pct = total ? (step / total) * 100 : 0;
    if (progressEl) progressEl.style.width = pct + "%";
    const label = document.getElementById("tutorial-step-label");
    if (label) label.textContent = `Step ${step} / ${total}`;
  }

  function render(html) {
    stageEl.innerHTML = `<div class="tutorial-body">${html}</div>`;
    stageEl.classList.remove("feedback-correct", "feedback-wrong");
  }

  function feedback(ok, msg) {
    stageEl.classList.toggle("feedback-correct", ok);
    stageEl.classList.toggle("feedback-wrong", !ok);
    if (msg) {
      const p = stageEl.querySelector(".quiz-feedback") || document.createElement("p");
      p.className = "quiz-feedback";
      p.style.color = ok ? "var(--success)" : "var(--error)";
      p.style.marginTop = "0.5rem";
      p.textContent = msg;
      if (!stageEl.querySelector(".quiz-feedback")) stageEl.querySelector(".tutorial-body")?.appendChild(p);
      else p.textContent = msg;
    }
    if (ok) AudioEngine.playSuccess();
    else AudioEngine.playWrong();
  }

  function awardQuiz() {
    ctx.rewards.onTutorialStep(8);
  }

  function completeTutorial(id) {
    if (!ctx.progress.completedTutorials.includes(id)) {
      ctx.progress.completedTutorials.push(id);
      ctx.rewards.onTutorialComplete(35);
    }
    Storage.save(ctx.progress);
    ctx.onComplete?.();
  }

  function makeQuiz(question, options, correctIndex, onDone) {
    let answered = false;
    const optsHtml = options
      .map(
        (text, i) =>
          `<button type="button" class="quiz-opt" data-i="${i}">${text}</button>`
      )
      .join("");
    render(`<h3>${question}</h3><div class="quiz-options">${optsHtml}</div>`);
    stageEl.querySelectorAll(".quiz-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        const i = parseInt(btn.dataset.i, 10);
        const correct = i === correctIndex;
        stageEl.querySelectorAll(".quiz-opt").forEach((b) => {
          b.disabled = true;
          if (parseInt(b.dataset.i, 10) === correctIndex) b.classList.add("correct");
          else if (b === btn && !correct) b.classList.add("wrong");
        });
        feedback(correct, correct ? "Nice! You got it." : `The answer is: ${options[correctIndex]}`);
        if (correct) awardQuiz();
        setTimeout(onDone, correct ? 900 : 1400);
      });
    });
  }

  function runBpm() {
    const total = 4;
    let step = 0;
    titleEl.textContent = "BPM & Rhythm";

    function go() {
      step += 1;
      setProgress(step, total);
      AudioEngine.stopMetronome();

      if (step === 1) {
        render(`
          <h3>What is BPM?</h3>
          <p><strong>Beats Per Minute</strong> — how fast the music pulses. Slow ballads ≈ 60–80. Dance ≈ 120–130.</p>
          <div class="bpm-display" id="bpm-val">90</div>
          <div class="bpm-pulse running" id="bpm-pulse" style="--beat-dur:0.67s"></div>
          <div class="bpm-presets">
            <button type="button" class="bpm-chip" data-bpm="60">60</button>
            <button type="button" class="bpm-chip selected" data-bpm="90">90</button>
            <button type="button" class="bpm-chip" data-bpm="120">120</button>
          </div>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn primary" id="next-bpm">Continue</button>
          </div>
        `);
        let bpm = 90;
        const pulse = document.getElementById("bpm-pulse");
        const val = document.getElementById("bpm-val");
        AudioEngine.startMetronome(bpm);
        stageEl.querySelectorAll(".bpm-chip").forEach((chip) => {
          chip.addEventListener("click", () => {
            bpm = parseInt(chip.dataset.bpm, 10);
            val.textContent = bpm;
            pulse.style.setProperty("--beat-dur", 60 / bpm + "s");
            stageEl.querySelectorAll(".bpm-chip").forEach((c) => c.classList.remove("selected"));
            chip.classList.add("selected");
            AudioEngine.startMetronome(bpm);
          });
        });
        document.getElementById("next-bpm").onclick = go;
        return;
      }

      if (step === 2) {
        const taps = [];
        render(`
          <h3>Tap the Beat</h3>
          <p>Tap the big button on each beat. We'll calculate your BPM!</p>
          <div class="bpm-display" id="tap-bpm">—</div>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn tap" id="tap-btn">TAP</button>
          </div>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn secondary" id="reset-tap">Reset</button>
            <button type="button" class="tutorial-btn primary" id="next-tap" disabled>Continue</button>
          </div>
        `);
        const tapBpm = document.getElementById("tap-bpm");
        const nextTap = document.getElementById("next-tap");
        document.getElementById("tap-btn").onclick = () => {
          const now = Date.now();
          taps.push(now);
          AudioEngine.playClick();
          if (taps.length >= 4) {
            const intervals = [];
            for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
            const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const bpm = Math.round(60000 / avg);
            tapBpm.textContent = bpm;
            nextTap.disabled = false;
          }
        };
        document.getElementById("reset-tap").onclick = () => {
          taps.length = 0;
          tapBpm.textContent = "—";
          nextTap.disabled = true;
        };
        nextTap.onclick = go;
        return;
      }

      if (step === 3) {
        const target = 80;
        const taps = [];
        render(`
          <h3>Hit 80 BPM</h3>
          <p>Tap steadily near <strong>80 BPM</strong> (about 0.75 sec between taps). Get within ±10 to pass!</p>
          <div class="bpm-display" id="goal-bpm">— / 80</div>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn tap" id="goal-tap">TAP</button>
          </div>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn primary" id="check-bpm" disabled>Check</button>
          </div>
        `);
        document.getElementById("goal-tap").onclick = () => {
          taps.push(Date.now());
          AudioEngine.playClick();
          if (taps.length >= 5) document.getElementById("check-bpm").disabled = false;
        };
        document.getElementById("check-bpm").onclick = () => {
          const intervals = [];
          for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
          const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const bpm = Math.round(60000 / avg);
          document.getElementById("goal-bpm").textContent = bpm + " / 80";
          if (Math.abs(bpm - target) <= 10) {
            feedback(true, "Great rhythm!");
            awardQuiz();
            setTimeout(go, 1000);
          } else {
            feedback(false, `You tapped ~${bpm} BPM. Try slower or faster!`);
            taps.length = 0;
            document.getElementById("check-bpm").disabled = true;
          }
        };
        return;
      }

      if (step === 4) {
        makeQuiz(
          "Which BPM range fits a slow ballad best?",
          ["140–160", "60–80", "200+", "30–40"],
          1,
          () => {
            render(`
              <div class="tutorial-complete-badge">
                <div class="badge-icon">⏱️</div>
                <h3>BPM Mastered!</h3>
                <p>You can feel and count tempo. Use this in every song you learn.</p>
              </div>
              <div class="tutorial-actions">
                <button type="button" class="tutorial-btn primary" id="fin-bpm">Finish</button>
              </div>
            `);
            document.getElementById("fin-bpm").onclick = () => completeTutorial("bpm");
          }
        );
      }
    }
    go();
  }

  function runNotes() {
    const total = 4;
    let step = 0;
    let quizNote = null;
    titleEl.textContent = "Note Names";

    function go() {
      step += 1;
      setProgress(step, total);

      if (step === 1) {
        render(`
          <h3>White Keys</h3>
          <p>From left to right on the piano: <strong>C D E F G A B</strong> — then it repeats.</p>
          <div class="note-map" id="white-map"></div>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="n1">Continue</button></div>
        `);
        const map = document.getElementById("white-map");
        AudioEngine.WHITE_NOTES.forEach((n) => {
          const el = document.createElement("span");
          el.className = "note-map-key";
          el.textContent = AudioEngine.displayName(n);
          map.appendChild(el);
        });
        document.getElementById("n1").onclick = go;
        return;
      }

      if (step === 2) {
        render(`
          <h3>Black Keys (Sharps)</h3>
          <p>Black keys are <strong>sharps (#)</strong>: C#, D#, F#, G#, A# — between most white keys.</p>
          <div class="note-map" id="black-map"></div>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="n2">Continue</button></div>
        `);
        const map = document.getElementById("black-map");
        AudioEngine.BLACK_NOTES.forEach((n) => {
          const el = document.createElement("span");
          el.className = "note-map-key black";
          el.textContent = AudioEngine.displayName(n);
          map.appendChild(el);
        });
        document.getElementById("n2").onclick = go;
        return;
      }

      if (step === 3) {
        render(`
          <h3>Explore on Piano</h3>
          <p>Tap keys below — each shows its name. Try C, then find G five white keys to the right.</p>
          <p id="explore-hint" class="tutorial-hint">Tap any key!</p>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="n3" disabled>Continue (tap 3 keys)</button></div>
        `);
        let taps = 0;
        ctx.pianoOnKey = () => {
          taps += 1;
          if (taps >= 3) document.getElementById("n3").disabled = false;
        };
        document.getElementById("n3").onclick = () => {
          ctx.pianoOnKey = null;
          go();
        };
        return;
      }

      if (step === 4) {
        quizNote = AudioEngine.ALL_NOTES[Math.floor(Math.random() * AudioEngine.ALL_NOTES.length)];
        ctx.pianoOnKey = (noteId) => {
          if (noteId === quizNote) {
            feedback(true, `${AudioEngine.displayName(quizNote)} — correct!`);
            awardQuiz();
            ctx.pianoOnKey = null;
            setTimeout(() => {
              render(`
                <div class="tutorial-complete-badge">
                  <div class="badge-icon">🎵</div>
                  <h3>Notes Unlocked!</h3>
                  <p>The keyboard is your map. Keep exploring in Find The Note mode.</p>
                </div>
                <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="fin-notes">Finish</button></div>
              `);
              document.getElementById("fin-notes").onclick = () => completeTutorial("notes");
            }, 800);
          } else {
            feedback(false, `That's ${AudioEngine.displayName(noteId)}. Find ${AudioEngine.displayName(quizNote)}.`);
            ctx.piano.highlightCorrect(quizNote);
          }
        };
        render(`
          <h3>Find on Piano</h3>
          <p>Play <strong class="highlight">${AudioEngine.displayName(quizNote)}</strong> on the keyboard below.</p>
        `);
      }
    }
    go();
  }

  function runProgressions() {
    const total = 4;
    let step = 0;
    titleEl.textContent = "Chord Progressions";

    function playProg(key) {
      const prog = PROGRESSIONS[key];
      prog.notes.forEach((chord, i) => {
        setTimeout(() => {
          chord.forEach((n) => ctx.piano.highlightCorrect(n));
          AudioEngine.playChord(chord, 0.45, 0.04);
        }, i * 700);
      });
    }

    function go() {
      step += 1;
      setProgress(step, total);

      if (step === 1) {
        const p = PROGRESSIONS.classical;
        render(`
          <h3>I – IV – V – I</h3>
          <p>The classic backbone of Western music. In <strong>C major</strong>: C → F → G → C.</p>
          <div class="prog-chain" id="prog-chain"></div>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn secondary" id="play-class">▶ Hear it</button>
            <button type="button" class="tutorial-btn primary" id="p1">Continue</button>
          </div>
        `);
        const chain = document.getElementById("prog-chain");
        p.chords.forEach((ch, i) => {
          if (i) chain.innerHTML += '<span class="prog-arrow">→</span>';
          chain.innerHTML += `<div class="prog-step"><span class="prog-num">${p.nums[i]}</span><button type="button" class="prog-chord" data-i="${i}">${ch}</button></div>`;
        });
        document.getElementById("play-class").onclick = () => playProg("classical");
        chain.querySelectorAll(".prog-chord").forEach((btn) => {
          btn.onclick = () => {
            const i = parseInt(btn.dataset.i, 10);
            AudioEngine.playChord(p.notes[i]);
          };
        });
        document.getElementById("p1").onclick = go;
        return;
      }

      if (step === 2) {
        const p = PROGRESSIONS.pop;
        render(`
          <h3>Pop Progression</h3>
          <p><strong>I – V – vi – IV</strong> powers thousands of hits. In C: C → G → Am → F.</p>
          <div class="prog-chain" id="pop-chain"></div>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn secondary" id="play-pop">▶ Hear it</button>
            <button type="button" class="tutorial-btn primary" id="p2">Continue</button>
          </div>
        `);
        const chain = document.getElementById("pop-chain");
        p.chords.forEach((ch, i) => {
          if (i) chain.innerHTML += '<span class="prog-arrow">→</span>';
          chain.innerHTML += `<div class="prog-step"><span class="prog-num">${p.nums[i]}</span><button type="button" class="prog-chord">${ch}</button></div>`;
        });
        document.getElementById("play-pop").onclick = () => playProg("pop");
        chain.querySelectorAll(".prog-chord").forEach((btn, i) => {
          btn.onclick = () => AudioEngine.playChord(p.notes[i]);
        });
        document.getElementById("p2").onclick = go;
        return;
      }

      if (step === 3) {
        render(`
          <h3>Play Along</h3>
          <p>When you hear each chord, tap its <strong>root note</strong> on the piano (first note of the chord).</p>
          <p id="playalong-prompt">Get ready…</p>
        `);
        const roots = ["C", "F", "G", "C"];
        let idx = 0;
        ctx.pianoOnKey = (noteId) => {
          if (noteId === roots[idx]) {
            idx += 1;
            if (idx >= roots.length) {
              feedback(true, "You played the roots!");
              awardQuiz();
              ctx.pianoOnKey = null;
              setTimeout(go, 900);
            } else {
              document.getElementById("playalong-prompt").textContent = `Next: play ${AudioEngine.displayName(roots[idx])}`;
              setTimeout(() => AudioEngine.playChord(PROGRESSIONS.classical.notes[idx]), 300);
            }
          }
        };
        document.getElementById("playalong-prompt").textContent = `Play ${AudioEngine.displayName(roots[0])} (C)`;
        setTimeout(() => AudioEngine.playChord(["C", "E", "G"]), 500);
        return;
      }

      if (step === 4) {
        makeQuiz(
          "In C major, which chord is the IV?",
          ["G", "F", "Am", "Dm"],
          1,
          () => {
            render(`
              <div class="tutorial-complete-badge">
                <div class="badge-icon">🔄</div>
                <h3>Progressions Complete!</h3>
                <p>Listen for I–IV–V in songs you love — you'll hear it everywhere.</p>
              </div>
              <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="fin-prog">Finish</button></div>
            `);
            document.getElementById("fin-prog").onclick = () => completeTutorial("progressions");
          }
        );
      }
    }
    go();
  }

  function buildCircleSvg(onSelect) {
    const cx = 140, cy = 140, rOuter = 120, rInner = 72;
    let svg = `<svg class="circle-svg" viewBox="0 0 280 280">`;
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
      svg += `<path class="circle-key" data-note="${noteId}" d="M${x0},${y0} A${rOuter},${rOuter} 0 0,1 ${x1},${y1} L${xi1},${yi1} A${rInner},${rInner} 0 0,0 ${xi0},${yi0} Z" fill="hsla(${hue},55%,45%,0.85)" stroke="rgba(255,255,255,0.2)"/>`;
      svg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="11" font-weight="700" pointer-events="none">${CIRCLE_LABELS[i]}</text>`;
    });
    svg += `<circle cx="${cx}" cy="${cy}" r="${rInner - 4}" fill="rgba(10,14,26,0.9)"/>`;
    svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="currentColor" font-size="12" font-weight="700" pointer-events="none">5ths →</text>`;
    svg += `</svg>`;
    return svg;
  }

  function runCircle() {
    const total = 4;
    let step = 0;
    titleEl.textContent = "Circle of Fifths";

    function go() {
      step += 1;
      setProgress(step, total);

      if (step === 1) {
        render(`
          <h3>The Circle of Fifths</h3>
          <p>Each step <strong>clockwise</strong> adds a fifth (C→G→D…). Tap slices to hear each key.</p>
          <div class="circle-wrap" id="circle-mount"></div>
          <p class="circle-center-label" id="circle-label">Tap any slice on the wheel</p>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="c1">Continue</button></div>
        `);
        document.getElementById("circle-mount").innerHTML = buildCircleSvg();
        const label = document.getElementById("circle-label");
        stageEl.querySelectorAll(".circle-key").forEach((path) => {
          path.addEventListener("click", () => {
            const n = path.dataset.note;
            stageEl.querySelectorAll(".circle-key").forEach((p) => p.classList.remove("active"));
            path.classList.add("active");
            label.textContent = `${CIRCLE_LABELS[CIRCLE_ORDER.indexOf(n)]} — also try the piano!`;
            AudioEngine.playTone(n);
          });
        });
        document.getElementById("c1").onclick = go;
        return;
      }

      if (step === 2) {
        render(`
          <h3>Neighbors on the Wheel</h3>
          <p>Adjacent keys share notes — great for smooth key changes. Tap to see clockwise neighbors.</p>
          <div class="circle-wrap" id="circle-mount2"></div>
          <p class="circle-center-label" id="circle-hint">Clockwise from C → G</p>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="c2">Continue</button></div>
        `);
        document.getElementById("circle-mount2").innerHTML = buildCircleSvg();
        document.getElementById("circle-mount2").querySelectorAll(".circle-key").forEach((path) => {
          path.addEventListener("click", () => {
            const n = path.dataset.note;
            const idx = CIRCLE_ORDER.indexOf(n);
            const next = CIRCLE_LABELS[(idx + 1) % 12];
            document.getElementById("circle-hint").textContent = `Clockwise from ${CIRCLE_LABELS[idx]} → ${next}`;
            AudioEngine.playTone(n);
          });
        });
        document.getElementById("c2").onclick = go;
        return;
      }

      if (step === 3) {
        const gIdx = CIRCLE_ORDER.indexOf("G");
        makeQuiz(
          "Moving clockwise from C, what's the next key on the circle?",
          ["F", "G", "D", "Am"],
          1,
          go
        );
        return;
      }

      if (step === 4) {
        makeQuiz(
          "The circle of fifths helps you find…",
          ["Only drum patterns", "Related keys & chords", "Lyric rhymes", "Microphone settings"],
          1,
          () => {
            render(`
              <div class="tutorial-complete-badge">
                <div class="badge-icon">⭕</div>
                <h3>Circle Complete!</h3>
                <p>Use the wheel when writing or transposing — it's a cheat sheet for harmony.</p>
              </div>
              <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="fin-circle">Finish</button></div>
            `);
            document.getElementById("fin-circle").onclick = () => completeTutorial("circle");
          }
        );
      }
    }
    go();
  }

  function runNashville() {
    const total = 4;
    let step = 0;
    titleEl.textContent = "Nashville Numbers";

    function go() {
      step += 1;
      setProgress(step, total);

      if (step === 1) {
        render(`
          <h3>Numbers = Chord Degrees</h3>
          <p>In <strong>C major</strong>, Nashville numbers tell you which chord to play — movable to any key later.</p>
          <div class="nashville-legend">1=C · 2=Dm · 3=Em · 4=F · 5=G · 6=Am · 7=B°</div>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="nv1">Continue</button></div>
        `);
        document.getElementById("nv1").onclick = go;
        return;
      }

      if (step === 2) {
        let gridHtml = '<div class="nashville-grid" id="nash-grid">';
        NASHVILLE_C.forEach((item) => {
          gridHtml += `<button type="button" class="nashville-btn" data-num="${item.num}"><span class="num">${item.num}</span><span class="chord">${item.chord}</span></button>`;
        });
        gridHtml += '</div><div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="nv2">Continue</button></div>';
        render(`<h3>Tap a Number</h3><p>Each button plays its chord in C. Major: 1, 4, 5 · Minor: 2, 3, 6 · 7 is diminished.</p>${gridHtml}`);
        stageEl.querySelectorAll(".nashville-btn").forEach((btn) => {
          const item = NASHVILLE_C.find((x) => x.num === btn.dataset.num);
          btn.onclick = () => {
            stageEl.querySelectorAll(".nashville-btn").forEach((b) => b.classList.remove("selected"));
            btn.classList.add("selected");
            AudioEngine.playChord(item.notes);
            item.notes.forEach((n) => ctx.piano.highlightCorrect(n));
          };
        });
        document.getElementById("nv2").onclick = go;
        return;
      }

      if (step === 3) {
        makeQuiz(
          "In C major, what chord is the V (five)?",
          ["F", "G", "Am", "Dm"],
          1,
          go
        );
        return;
      }

      if (step === 4) {
        makeQuiz(
          "Nashville numbers let you…",
          ["Play only in C forever", "Transpose progressions to any key", "Tune your guitar", "Count BPM"],
          1,
          () => {
            render(`
              <div class="tutorial-complete-badge">
                <div class="badge-icon">🔢</div>
                <h3>Nashville Complete!</h3>
                <p>Say "1-5-6-4" with musicians worldwide — same shapes, any key.</p>
              </div>
              <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="fin-nv">Finish</button></div>
            `);
            document.getElementById("fin-nv").onclick = () => completeTutorial("nashville");
          }
        );
      }
    }
    go();
  }

  function runChordTypes() {
    const total = 4;
    let step = 0;
    let selectedType = CHORD_TYPES[0];
    titleEl.textContent = "Chord Structures";

    function go() {
      step += 1;
      setProgress(step, total);

      if (step === 1) {
        let cards = "";
        CHORD_TYPES.forEach((ct, i) => {
          cards += `<button type="button" class="chord-type-card${i === 0 ? " selected" : ""}" data-id="${ct.id}">
            <h4>${ct.name}</h4><span class="intervals">${ct.intervals}</span>
            <div class="formula">${ct.formula}</div>
          </button>`;
        });
        render(`
          <h3>Chord Flavors</h3>
          <p>Changing one note transforms the mood. Tap a type to hear it on the piano.</p>
          <div class="chord-type-grid">${cards}</div>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="ct1">Continue</button></div>
        `);
        stageEl.querySelectorAll(".chord-type-card").forEach((card) => {
          card.onclick = () => {
            stageEl.querySelectorAll(".chord-type-card").forEach((c) => c.classList.remove("selected"));
            card.classList.add("selected");
            selectedType = CHORD_TYPES.find((c) => c.id === card.dataset.id);
            AudioEngine.playChord(selectedType.notes);
            selectedType.notes.forEach((n) => ctx.piano.highlightCorrect(n));
          };
        });
        AudioEngine.playChord(CHORD_TYPES[0].notes);
        document.getElementById("ct1").onclick = go;
        return;
      }

      if (step === 2) {
        render(`
          <h3>Major vs Minor</h3>
          <p><strong>Major</strong> = happy (C–E–G). <strong>Minor</strong> lowers the middle note (C–E♭–G).</p>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn secondary" id="hear-maj">Hear Major</button>
            <button type="button" class="tutorial-btn secondary" id="hear-min">Hear Minor</button>
          </div>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="ct2">Continue</button></div>
        `);
        document.getElementById("hear-maj").onclick = () => AudioEngine.playChord(["C", "E", "G"]);
        document.getElementById("hear-min").onclick = () => AudioEngine.playChord(["C", "Ds", "G"]);
        document.getElementById("ct2").onclick = go;
        return;
      }

      if (step === 3) {
        const ct = CHORD_TYPES[Math.floor(Math.random() * CHORD_TYPES.length)];
        AudioEngine.playChord(ct.notes);
        makeQuiz(
          "What chord type did you just hear?",
          CHORD_TYPES.map((c) => c.name),
          CHORD_TYPES.indexOf(ct),
          go
        );
        return;
      }

      if (step === 4) {
        makeQuiz(
          "A diminished chord (dim) sounds…",
          ["Extra bright and happy", "Tense and unstable", "Like a drum", "Exactly like major"],
          1,
          () => {
            render(`
              <div class="tutorial-complete-badge">
                <div class="badge-icon">🎹</div>
                <h3>Chord Structures Done!</h3>
                <p>You're ready to build any chord in Chord Builder mode.</p>
              </div>
              <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="fin-ct">Finish</button></div>
            `);
            document.getElementById("fin-ct").onclick = () => completeTutorial("chordtypes");
          }
        );
      }
    }
    go();
  }

  function runModes() {
    const total = 4;
    let step = 0;
    titleEl.textContent = "Modal Scales";

    function playMode(modeId, root = "D") {
      const scale = MusicTheory.getModeScale(root, modeId);
      scale.notes.forEach((n, i) => setTimeout(() => AudioEngine.playTone(n, 0.35), i * 200));
    }

    function go() {
      step += 1;
      setProgress(step, total);
      AudioEngine.stopMetronome();

      if (step === 1) {
        render(`
          <h3>Beyond major & minor</h3>
          <p>A <strong>mode</strong> is a scale built from a different step of the major scale — same notes, new home. <strong>Dorian</strong> is minor with a brighter 6th; <strong>Lydian</strong> is major with a raised 4th.</p>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn secondary" id="hear-ionian">Hear C Major (Ionian)</button>
            <button type="button" class="tutorial-btn secondary" id="hear-dorian">Hear D Dorian</button>
          </div>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="next-modes-1">Continue</button></div>
        `);
        document.getElementById("hear-ionian").onclick = () => playMode("ionian", "C");
        document.getElementById("hear-dorian").onclick = () => playMode("dorian", "D");
        document.getElementById("next-modes-1").onclick = go;
        return;
      }

      if (step === 2) {
        const cards = MusicTheory.MODES.filter((m) => ["dorian", "lydian", "phrygian", "mixolydian"].includes(m.id))
          .map((m) => `<button type="button" class="tutorial-chip" data-mode="${m.id}">${m.name}</button>`)
          .join("");
        render(`
          <h3>Four colors to know</h3>
          <p>Tap a mode — listen for what makes it unique vs major.</p>
          <div class="tutorial-chip-row">${cards}</div>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="next-modes-2">Continue</button></div>
        `);
        stageEl.querySelectorAll(".tutorial-chip").forEach((btn) => {
          btn.addEventListener("click", () => playMode(btn.dataset.mode, "C"));
        });
        document.getElementById("next-modes-2").onclick = go;
        return;
      }

      if (step === 3) {
        makeQuiz(
          "Which mode is major with a raised 4th (♯4)?",
          ["Dorian", "Lydian", "Phrygian", "Locrian"],
          1,
          go
        );
        return;
      }

      if (step === 4) {
        makeQuiz(
          "Dorian is best described as…",
          ["Major with ♭7", "Minor with natural 6", "All flats", "Same as major"],
          1,
          () => {
            render(`
              <div class="tutorial-complete-badge">
                <div class="badge-icon">🎭</div>
                <h3>Modal Scales Done!</h3>
                <p>Open <strong>Modal Scales</strong> in Tools to explore every mode in any key.</p>
              </div>
              <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="fin-modes">Finish</button></div>
            `);
            document.getElementById("fin-modes").onclick = () => completeTutorial("modes");
          }
        );
      }
    }
    go();
  }

  function runTimeSignatures() {
    const total = 4;
    let step = 0;
    titleEl.textContent = "Time Signatures";

    function go() {
      step += 1;
      setProgress(step, total);
      AudioEngine.stopMetronome();

      if (step === 1) {
        render(`
          <h3>Reading the numbers</h3>
          <p><strong>Top number</strong> = how many beats per bar. <strong>Bottom number</strong> = which note gets one beat (4 = quarter, 8 = eighth).</p>
          <p><strong>4/4</strong> = four quarter beats — most pop. <strong>3/4</strong> = waltz. <strong>6/8</strong> = two lilting beats (each 3 eighths).</p>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="next-ts-1">Continue</button></div>
        `);
        document.getElementById("next-ts-1").onclick = go;
        return;
      }

      if (step === 2) {
        render(`
          <h3>Feel 3/4</h3>
          <p>Strong-weak-weak. Listen:</p>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn secondary" id="metro-34">Start 3/4 @ 90 BPM</button>
            <button type="button" class="tutorial-btn secondary" id="stop-34">Stop</button>
          </div>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="next-ts-2">Continue</button></div>
        `);
        const sig = MusicTheory.getTimeSignature("34");
        document.getElementById("metro-34").onclick = () =>
          AudioEngine.startMetronome(90, { pattern: sig.pattern, clickNote: sig.clickNote });
        document.getElementById("stop-34").onclick = () => AudioEngine.stopMetronome();
        document.getElementById("next-ts-2").onclick = go;
        return;
      }

      if (step === 3) {
        render(`
          <h3>Odd meters</h3>
          <p><strong>5/4</strong> — five beats (Take Five). <strong>7/8</strong> — often 2+2+3 (Balkan feel). They don't divide evenly like 4/4 — count the groupings!</p>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn secondary" id="metro-78">Try 7/8 pattern</button>
            <button type="button" class="tutorial-btn secondary" id="stop-78">Stop</button>
          </div>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="next-ts-3">Continue</button></div>
        `);
        const sig = MusicTheory.getTimeSignature("78_223");
        document.getElementById("metro-78").onclick = () =>
          AudioEngine.startMetronome(100, { pattern: sig.pattern, clickNote: sig.clickNote });
        document.getElementById("stop-78").onclick = () => AudioEngine.stopMetronome();
        document.getElementById("next-ts-3").onclick = go;
        return;
      }

      if (step === 4) {
        makeQuiz(
          "7/8 is often felt as…",
          ["4 + 4", "2 + 2 + 3", "3 + 3 + 3", "7 equal quarters"],
          1,
          () => {
            AudioEngine.stopMetronome();
            render(`
              <div class="tutorial-complete-badge">
                <div class="badge-icon">📐</div>
                <h3>Time Signatures Done!</h3>
                <p>Use the <strong>Time Signatures</strong> tool to practice every meter with visuals.</p>
              </div>
              <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="fin-ts">Finish</button></div>
            `);
            document.getElementById("fin-ts").onclick = () => completeTutorial("timesignatures");
          }
        );
      }
    }
    go();
  }

  function runIntervals() {
    const total = 4;
    let step = 0;
    titleEl.textContent = "Intervals";

    function playIv(semitones, root = "C") {
      const notes = MusicTheory.intervalNotes(root, semitones);
      AudioEngine.playTone(notes[0], 0.3);
      setTimeout(() => AudioEngine.playTone(notes[1], 0.4), 280);
    }

    function go() {
      step += 1;
      setProgress(step, total);
      AudioEngine.stopMetronome();

      if (step === 1) {
        render(`
          <h3>What is an interval?</h3>
          <p>The <strong>distance</strong> between two pitches. A <strong>minor 3rd</strong> (3 semitones) sounds sad; a <strong>major 3rd</strong> (4) sounds happy. A <strong>tritone</strong> (6) is famously tense.</p>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn secondary" id="iv-m3">Hear minor 3rd</button>
            <button type="button" class="tutorial-btn secondary" id="iv-M3">Hear major 3rd</button>
          </div>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="next-iv-1">Continue</button></div>
        `);
        document.getElementById("iv-m3").onclick = () => playIv(3);
        document.getElementById("iv-M3").onclick = () => playIv(4);
        document.getElementById("next-iv-1").onclick = go;
        return;
      }

      if (step === 2) {
        render(`
          <h3>Perfect 5th & octave</h3>
          <p>The <strong>5th</strong> (7 semitones) is strong and stable — power chords use it. The <strong>octave</strong> (12) doubles the same note higher.</p>
          <div class="tutorial-actions">
            <button type="button" class="tutorial-btn secondary" id="iv-p5">Hear perfect 5th</button>
            <button type="button" class="tutorial-btn secondary" id="iv-p8">Hear octave</button>
          </div>
          <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="next-iv-2">Continue</button></div>
        `);
        document.getElementById("iv-p5").onclick = () => playIv(7);
        document.getElementById("iv-p8").onclick = () => playIv(12);
        document.getElementById("next-iv-2").onclick = go;
        return;
      }

      if (step === 3) {
        makeQuiz(
          "How many semitones is a tritone?",
          ["5", "6", "7", "8"],
          1,
          go
        );
        return;
      }

      if (step === 4) {
        makeQuiz(
          "A major 3rd above C is…",
          ["D", "E♭", "E", "F"],
          2,
          () => {
            render(`
              <div class="tutorial-complete-badge">
                <div class="badge-icon">📏</div>
                <h3>Intervals Done!</h3>
                <p>Train every interval in the <strong>Intervals</strong> tool under Tools.</p>
              </div>
              <div class="tutorial-actions"><button type="button" class="tutorial-btn primary" id="fin-iv">Finish</button></div>
            `);
            document.getElementById("fin-iv").onclick = () => completeTutorial("intervals");
          }
        );
      }
    }
    go();
  }

  function start(id, context) {
    stop();
    ctx = context;
    active = id;
    const runners = {
      bpm: runBpm,
      notes: runNotes,
      progressions: runProgressions,
      circle: runCircle,
      nashville: runNashville,
      chordtypes: runChordTypes,
      modes: runModes,
      timesignatures: runTimeSignatures,
      intervals: runIntervals,
    };
    if (runners[id]) runners[id]();
  }

  function stop() {
    AudioEngine.stopMetronome();
    if (ctx) ctx.pianoOnKey = null;
    active = null;
  }

  return {
    TUTORIAL_META,
    mount,
    start,
    stop,
    CIRCLE_ORDER,
    CIRCLE_LABELS,
    NASHVILLE_C,
    CHORD_TYPES,
  };
})();

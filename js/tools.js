/**
 * Standalone tool pages: Circle, Progressions, Nashville, BPM.
 */
const Tools = (() => {
  const TOOL_META = {
    circle: { icon: "⭕", title: "Circle of Fifths", desc: "Explore keys — tap for full details.", tier: "beginner" },
    progressions: { icon: "🔄", title: "Chord Progressions", desc: "Full 1–7 chart per key + classic progressions.", tier: "beginner" },
    chordstructure: { icon: "🎹", title: "Chord Structures", desc: "Major → 9ths → 11ths → 13ths — hear each type.", tier: "intermediate" },
    nashville: { icon: "🔢", title: "Nashville Practice", desc: "Train chord degrees in any key.", tier: "intermediate" },
    bpm: { icon: "⏱️", title: "BPM Metronome", desc: "Set tempo — tap, slider, single or double.", tier: "beginner" },
    modes: { icon: "🎭", title: "Modal Scales", desc: "Dorian, Lydian, Phrygian & all 7 modes.", tier: "advanced" },
    timesig: { icon: "📐", title: "Time Signatures", desc: "4/4 to 7/8 — odd meters with pattern clicks.", tier: "advanced" },
    intervals: { icon: "📏", title: "Intervals", desc: "Minor 3rd to tritone — hear the distance.", tier: "advanced" },
  };

  let activeTool = null;
  let bpmState = null;
  let progPlayTimer = null;
  let onPianoKey = null;

  function stopAll() {
    AudioEngine.stopMetronome();
    if (progPlayTimer) clearTimeout(progPlayTimer);
    progPlayTimer = null;
    if (bpmState?.tapTimeout) clearTimeout(bpmState.tapTimeout);
    onPianoKey = null;
    document.getElementById("timesig-beat-row")?.querySelectorAll(".timesig-beat").forEach((b) => b.classList.remove("active"));
  }

  function renderSidebar(html, sidebarId = "tool-sidebar") {
    const el = document.getElementById(sidebarId);
    if (el) el.innerHTML = html;
  }

  /* ─── Circle of Fifths ─── */
  function initCircle() {
    const mount = document.getElementById("tool-circle-mount");
    let selected = "C";

    function selectKey(keyId, play = true) {
      selected = keyId;
      mount.innerHTML = MusicTheory.buildCircleSvg(selected);
      bindCircleKeys();
      showCircleSidebar(keyId);
      if (play) {
        AudioEngine.unlockAudio();
        AudioEngine.playTone(keyId, 0.45);
      }
    }

    function bindCircleKeys() {
      mount.querySelectorAll(".circle-key").forEach((path) => {
        AudioEngine.bindTap(path, () => selectKey(path.dataset.key, true));
      });
    }

    function showCircleSidebar(keyId) {
      const info = MusicTheory.getCircleInfo(keyId);
      const chordBtns = info.chords
        .map(
          (c) =>
            `<button type="button" class="mini-chord" data-notes="${c.notes.join(",")}" title="Play ${c.label}">${c.roman} ${c.label}</button>`
        )
        .join("");

      renderSidebar(`
        <h3>${info.display} Major</h3>
        <div class="detail-row">
          <div class="detail-label">Key signature</div>
          <div class="detail-value accent">${info.signature}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Relative minor</div>
          <div class="detail-value">${info.relativeMinor}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Scale notes</div>
          <div class="detail-value">${info.scaleNotes}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">On the circle</div>
          <div class="detail-value">← ${info.neighborLeft} · ${info.display} · ${info.neighborRight} →</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Diatonic chords</div>
          <div class="chord-list">${chordBtns}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Pop progression here</div>
          <div class="detail-value">${info.commonProg}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Tip</div>
          <div class="detail-value">${info.tip}</div>
        </div>
      `);

      document.querySelectorAll("#tool-sidebar .mini-chord").forEach((btn) => {
        AudioEngine.bindTap(btn, () => {
          const notes = btn.dataset.notes.split(",");
          AudioEngine.playChord(notes);
          notes.forEach((n) => window.ToolPiano?.highlightCorrect(n));
        });
      });
    }

    selectKey("C", false);
  }

  function degreeSidebarHtml(ch, keyLabel) {
    return `<h3>${ch.roman} · ${ch.label}</h3>
      <div class="detail-row"><div class="detail-label">Key</div><div class="detail-value">${keyLabel}</div></div>
      <div class="detail-row"><div class="detail-label">Degree</div><div class="detail-value accent">${ch.num}</div></div>
      <div class="detail-row"><div class="detail-label">Quality</div><div class="detail-value">${ch.qualityLabel || MusicTheory.qualityLabel(ch.quality)}</div></div>
      <div class="detail-row"><div class="detail-label">Notes</div><div class="detail-value">${ch.notes.map((n) => MusicTheory.DISPLAY[n]).join(" · ")}</div></div>
      <div class="detail-row"><div class="detail-label">Tip</div><div class="detail-value">Tap another number to compare. Hold <kbd>Shift</kbd> to add degrees to a custom sequence.</div>`;
  }

  function playDegreeChord(ch) {
    if (!ch?.notes?.length) return;
    AudioEngine.playChord(ch.notes, 0.55, 0.04);
    ch.notes.forEach((n) => window.ToolPiano?.highlightCorrect(n));
  }

  function bindDegreeChart(container, chords, onSelect) {
    container.querySelectorAll(".degree-chart-cell").forEach((cell) => {
      AudioEngine.bindTap(cell, (e) => {
        onSelect(cell.dataset.num, { additive: e.shiftKey, play: true, source: cell });
      });
    });
  }

  /* ─── Chord Progressions ─── */
  function initProgressions() {
    const keySelect = document.getElementById("prog-key-select");
    const progSelect = document.getElementById("prog-type-select");
    const visual = document.getElementById("prog-visual");
    const chartMount = document.getElementById("prog-degree-chart");
    const pickerMount = document.getElementById("prog-degree-picker");
    const playBtn = document.getElementById("prog-play-btn");
    const playDegreeBtn = document.getElementById("prog-play-degree-btn");

    let selectedDegrees = ["1"];
    let lastKeyId = null;

    MusicTheory.KEYS.forEach((k) => {
      keySelect.innerHTML += `<option value="${k.id}">${k.label}</option>`;
    });
    MusicTheory.PROGRESSION_TEMPLATES.forEach((p) => {
      progSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });

    function syncDegreeUi(allChords, highlightNums) {
      const selectedSet = new Set(selectedDegrees);
      chartMount.querySelectorAll(".degree-chart-cell").forEach((cell) => {
        const num = cell.dataset.num;
        const inProg = highlightNums.map(String).includes(num);
        cell.classList.toggle("in-progression", inProg);
        cell.classList.toggle("selected", selectedSet.has(num));
        cell.setAttribute("aria-pressed", selectedSet.has(num) ? "true" : "false");
      });
      pickerMount.querySelectorAll(".degree-pick-btn").forEach((btn) => {
        const num = btn.dataset.num;
        btn.classList.toggle("active", selectedSet.has(num));
        btn.setAttribute("aria-pressed", selectedSet.has(num) ? "true" : "false");
      });
      playDegreeBtn.hidden = selectedDegrees.length === 0;
      playDegreeBtn.textContent =
        selectedDegrees.length > 1
          ? `▶ Play ${selectedDegrees.length} selected`
          : "▶ Play selected";
    }

    function selectDegree(num, allChords, keyInfo, options = {}) {
      const { additive = false, play = true } = options;
      if (!additive) {
        selectedDegrees = [num];
      } else {
        const idx = selectedDegrees.indexOf(num);
        if (idx >= 0) selectedDegrees.splice(idx, 1);
        else selectedDegrees.push(num);
        if (selectedDegrees.length === 0) selectedDegrees = [num];
      }

      const ch = allChords.find((c) => c.num === num);
      if (play && ch) {
        playDegreeChord(ch);
        if (options.source) {
          chartMount.querySelectorAll(".degree-chart-cell").forEach((c) => c.classList.remove("playing"));
          options.source.classList.add("playing");
          setTimeout(() => options.source.classList.remove("playing"), 400);
        }
      }

      const tmpl = MusicTheory.PROGRESSION_TEMPLATES.find((p) => p.id === progSelect.value);
      syncDegreeUi(allChords, tmpl.nums);

      if (ch) {
        const extra =
          selectedDegrees.length > 1
            ? `<div class="detail-row"><div class="detail-label">Your picks</div><div class="detail-value accent">${selectedDegrees.join(" → ")}</div></div>`
            : "";
        renderSidebar(degreeSidebarHtml(ch, keyInfo.label) + extra, "tool-sidebar-prog");
      }
    }

    function renderPicker(allChords) {
      pickerMount.innerHTML = allChords
        .map(
          (c) =>
            `<button type="button" class="degree-pick-btn${selectedDegrees.includes(c.num) ? " active" : ""}" data-num="${c.num}" aria-pressed="${selectedDegrees.includes(c.num) ? "true" : "false"}" title="${c.label}">${c.num}</button>`
        )
        .join("");
      pickerMount.querySelectorAll(".degree-pick-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const keyId = keySelect.value;
          const all = MusicTheory.getDiatonicChords(keyId);
          const keyInfo = MusicTheory.getCircleInfo(keyId);
          selectDegree(btn.dataset.num, all, keyInfo, { additive: e.shiftKey, play: true });
        });
      });
    }

    function render() {
      const keyId = keySelect.value;
      const tmpl = MusicTheory.PROGRESSION_TEMPLATES.find((p) => p.id === progSelect.value);
      const allChords = MusicTheory.getDiatonicChords(keyId);
      const steps = MusicTheory.getProgressionInKey(keyId, tmpl);
      const keyInfo = MusicTheory.getCircleInfo(keyId);
      const highlightNums = tmpl.nums;

      if (keyId !== lastKeyId) {
        selectedDegrees = ["1"];
        lastKeyId = keyId;
      }

      renderPicker(allChords);
      chartMount.innerHTML = MusicTheory.renderDegreeChartHtml(allChords, highlightNums, selectedDegrees);
      bindDegreeChart(chartMount, allChords, (num, opts) =>
        selectDegree(num, allChords, keyInfo, opts)
      );
      syncDegreeUi(allChords, highlightNums);

      const primary = allChords.find((c) => c.num === selectedDegrees[0]) || allChords[0];
      renderSidebar(
        degreeSidebarHtml(primary, keyInfo.label) +
          `<div class="detail-row"><div class="detail-label">Progression</div><div class="detail-value accent">${tmpl.name}</div></div>
        <div class="detail-row"><div class="detail-label">In this key</div><div class="detail-value">${steps.map((c) => c.label).join(" → ")}</div></div>
        <div class="detail-row"><div class="detail-label">What it does</div><div class="detail-value">${tmpl.desc}</div></div>
        <div class="detail-row"><div class="detail-label">You'll hear it in</div><div class="detail-value">${tmpl.use}</div></div>`,
        "tool-sidebar-prog"
      );

      let html = "";
      steps.forEach((ch, i) => {
        if (i) html += '<span class="prog-block-arrow">→</span>';
        html += `<div class="prog-block">
          <span class="roman">${ch.roman}</span>
          <button type="button" class="chord-name" data-i="${i}">${ch.label}</button>
        </div>`;
      });
      visual.innerHTML = html;

      visual.querySelectorAll(".chord-name").forEach((btn) => {
        btn.addEventListener("click", () => {
          const ch = steps[parseInt(btn.dataset.i, 10)];
          AudioEngine.playChord(ch.notes);
          ch.notes.forEach((n) => window.ToolPiano?.highlightCorrect(n));
        });
      });

    }

    function playSelectedDegrees() {
      const keyId = keySelect.value;
      const allChords = MusicTheory.getDiatonicChords(keyId);
      const nums = selectedDegrees.length ? selectedDegrees : ["1"];
      chartMount.querySelectorAll(".degree-chart-cell").forEach((c) => c.classList.remove("playing"));

      nums.forEach((num, i) => {
        setTimeout(() => {
          const ch = allChords.find((c) => c.num === num);
          if (!ch) return;
          const cell = chartMount.querySelector(`.degree-chart-cell[data-num="${num}"]`);
          chartMount.querySelectorAll(".degree-chart-cell").forEach((c) => c.classList.remove("playing"));
          if (cell) cell.classList.add("playing");
          playDegreeChord(ch);
        }, i * 650);
      });
      setTimeout(
        () => chartMount.querySelectorAll(".degree-chart-cell").forEach((c) => c.classList.remove("playing")),
        nums.length * 650 + 200
      );
    }

    function playSequence() {
      if (progPlayTimer) clearTimeout(progPlayTimer);
      const keyId = keySelect.value;
      const tmpl = MusicTheory.PROGRESSION_TEMPLATES.find((p) => p.id === progSelect.value);
      const steps = MusicTheory.getProgressionInKey(keyId, tmpl);
      const btns = visual.querySelectorAll(".chord-name");

      steps.forEach((ch, i) => {
        setTimeout(() => {
          btns.forEach((b) => b.classList.remove("playing"));
          if (btns[i]) btns[i].classList.add("playing");
          AudioEngine.playChord(ch.notes, 0.55, 0.05);
          ch.notes.forEach((n) => window.ToolPiano?.highlightCorrect(n));
        }, i * 750);
      });
    }

    keySelect.addEventListener("change", render);
    progSelect.addEventListener("change", render);
    AudioEngine.bindTap(playBtn, playSequence);
    AudioEngine.bindTap(playDegreeBtn, playSelectedDegrees);
    render();
  }

  /* ─── Chord structures (simple → extended) ─── */
  function initChordStructure() {
    const rootSelect = document.getElementById("chord-struct-root");
    const keySelect = document.getElementById("chord-struct-key");
    const degreeRef = document.getElementById("chord-structure-degree-ref");
    const ladder = document.getElementById("chord-structure-ladder");
    let selectedId = "maj";

    MusicTheory.CHROMATIC.forEach((n) => {
      if (MusicTheory.DISPLAY[n]) {
        rootSelect.innerHTML += `<option value="${n}">${MusicTheory.DISPLAY[n]}</option>`;
      }
    });

    MusicTheory.KEYS.forEach((k) => {
      keySelect.innerHTML += `<option value="${k.id}">${k.label}</option>`;
    });

    function renderDegreeRef() {
      const keyId = keySelect.value;
      const chords = MusicTheory.getDiatonicChords(keyId);
      degreeRef.innerHTML = MusicTheory.renderDegreeChartHtml(chords);
      degreeRef.querySelectorAll(".degree-chart-cell").forEach((cell) => {
        cell.addEventListener("click", () => {
          const notes = cell.dataset.notes?.split(",").filter(Boolean);
          if (notes?.length) {
            AudioEngine.playChord(notes, 0.45, 0.04);
            notes.forEach((n) => window.ToolPiano?.highlightCorrect(n));
          }
        });
      });
    }

    keySelect.addEventListener("change", renderDegreeRef);
    renderDegreeRef();

    function showChordDetail(ch) {
      renderSidebar(
        `<h3>${ch.symbol}</h3>
        <div class="detail-row"><div class="detail-label">Type</div><div class="detail-value accent">${ch.name}</div></div>
        <div class="detail-row"><div class="detail-label">Formula</div><div class="detail-value">${ch.formula}</div></div>
        <div class="detail-row"><div class="detail-label">Notes</div><div class="detail-value">${ch.noteNames}</div></div>
        <div class="detail-row"><div class="detail-label">Mood</div><div class="detail-value">${ch.mood}</div></div>
        <div class="detail-row"><div class="detail-label">Common use</div><div class="detail-value">${ch.use}</div></div>`,
        "tool-sidebar-chord-struct"
      );
    }

    function renderLadder() {
      const rootId = rootSelect.value;
      let html = "";
      let lastTier = 0;
      MusicTheory.CHORD_CATALOG.forEach((def) => {
        if (def.tier !== lastTier) {
          lastTier = def.tier;
          html += `<h3 class="chord-tier-title">${def.tierLabel || "Level " + def.tier}</h3>`;
        }
        const ch = MusicTheory.getCatalogChord(def.id, rootId);
        const sel = def.id === selectedId ? " selected" : "";
        html += `<button type="button" class="chord-structure-card${sel}" data-id="${def.id}">
          <span class="csc-symbol">${ch.symbol}</span>
          <span class="csc-name">${ch.name}</span>
          <span class="csc-formula">${ch.formula}</span>
        </button>`;
      });
      ladder.innerHTML = html;

      ladder.querySelectorAll(".chord-structure-card").forEach((card) => {
        AudioEngine.bindTap(card, () => {
          selectedId = card.dataset.id;
          const ch = MusicTheory.getCatalogChord(selectedId, rootSelect.value);
          ladder.querySelectorAll(".chord-structure-card").forEach((c) => c.classList.remove("selected"));
          card.classList.add("selected");
          AudioEngine.playChord(ch.notes, 0.55, 0.04);
          ch.notes.forEach((n) => window.ToolPiano?.highlightCorrect(n));
          showChordDetail(ch);
        });
      });

      const ch = MusicTheory.getCatalogChord(selectedId, rootId);
      showChordDetail(ch);
    }

    rootSelect.addEventListener("change", () => {
      const ch = MusicTheory.getCatalogChord(selectedId, rootSelect.value);
      AudioEngine.playChord(ch.notes);
      renderLadder();
    });

    renderLadder();
  }

  /* ─── Nashville practice ─── */
  function initNashville() {
    const keySelect = document.getElementById("nash-key-select");
    const card = document.getElementById("nash-practice-card");
    const grid = document.getElementById("nash-degree-grid");
    const feedback = document.getElementById("nash-feedback");
    const nextBtn = document.getElementById("nash-next-btn");

    MusicTheory.KEYS.forEach((k) => {
      keySelect.innerHTML += `<option value="${k.id}">${k.label}</option>`;
    });

    let target = null;
    let chords = [];

    function renderGrid() {
      const keyId = keySelect.value;
      chords = MusicTheory.getDiatonicChords(keyId);
      grid.innerHTML = chords
        .map(
          (c) =>
            `<button type="button" class="degree-cell" data-num="${c.num}">
              <span class="n">${c.num}</span>
              <span class="c">${c.label}</span>
            </button>`
        )
        .join("");

      grid.querySelectorAll(".degree-cell").forEach((cell) => {
        cell.addEventListener("click", () => checkAnswer(cell.dataset.num, cell));
      });
    }

    function pickTarget() {
      target = chords[Math.floor(Math.random() * chords.length)];
      card.innerHTML = `
        <div class="degree-practice-card">
          <div class="degree-big">${target.roman}</div>
          <div class="degree-chord-target">Play the <strong>${target.num}</strong> chord</div>
          <div class="degree-hint">Tap the matching degree below, or play ${target.label} on the piano</div>
        </div>
      `;
      feedback.textContent = "";
      feedback.style.color = "";
      grid.querySelectorAll(".degree-cell").forEach((c) => {
        c.classList.remove("correct", "wrong", "active");
      });

      onPianoKey = (noteId) => {
        if (target.notes.includes(noteId)) {
          handleCorrect();
        }
      };
    }

    function checkAnswer(num, cell) {
      if (!target) return;
      if (num === target.num) {
        cell.classList.add("correct");
        handleCorrect();
      } else {
        cell.classList.add("wrong");
        feedback.style.color = "var(--error)";
        feedback.textContent = `That's the ${num} chord (${chords.find((c) => c.num === num)?.label}). Try ${target.roman} (${target.label}).`;
        AudioEngine.playWrong();
        const correctCell = grid.querySelector(`[data-num="${target.num}"]`);
        if (correctCell) correctCell.classList.add("active");
        AudioEngine.playChord(target.notes);
      }
    }

    function handleCorrect() {
      feedback.style.color = "var(--success)";
        feedback.textContent = `Correct! ${target.roman} = ${target.label} (${MusicTheory.qualityLabel(target.quality)}) — ${target.notes.map((n) => MusicTheory.DISPLAY[n]).join(", ")}`;
      AudioEngine.playSuccess();
      AudioEngine.playChord(target.notes);
      onPianoKey = null;

      const keyInfo = MusicTheory.getCircleInfo(keySelect.value);
      renderSidebar(`
        <h3>${target.roman} in ${keyInfo.label}</h3>
        <div class="detail-row">
          <div class="detail-label">Chord</div>
          <div class="detail-value accent">${target.label}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Quality</div>
          <div class="detail-value">${MusicTheory.qualityLabel(target.quality)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Notes</div>
          <div class="detail-value">${target.notes.map((n) => MusicTheory.DISPLAY[n]).join(" · ")}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Nashville</div>
          <div class="detail-value">Numbers tell you the <em>role</em> in the key — ${target.num} always fills the same emotional job, even when you change keys.</div>
        </div>
      `, "tool-sidebar-nash");
    }

    function updateSidebarKey() {
      const info = MusicTheory.getCircleInfo(keySelect.value);
      renderSidebar(`
        <h3>${info.label}</h3>
        <div class="detail-row">
          <div class="detail-label">Degrees in this key</div>
          <div class="detail-value">${chords.map((c) => `${c.num}=${c.label}`).join(" · ")}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Practice</div>
          <div class="detail-value">Find the shown Roman numeral on the grid or play its notes on the piano.</div>
        </div>
      `, "tool-sidebar-nash");
    }

    keySelect.addEventListener("change", () => {
      renderGrid();
      updateSidebarKey();
      pickTarget();
    });
    nextBtn.addEventListener("click", pickTarget);

    renderGrid();
    updateSidebarKey();
    pickTarget();
  }

  /* ─── BPM ─── */
  function initBpm() {
    const display = document.getElementById("bpm-tool-value");
    const tapHint = document.getElementById("bpm-tap-hint");
    const slider = document.getElementById("bpm-slider");
    const tapZone = document.getElementById("bpm-tap-zone");
    const pulse = document.getElementById("bpm-pulse-ring");
    const startBtn = document.getElementById("bpm-start-btn");
    const stopBtn = document.getElementById("bpm-stop-btn");
    const quarterBtn = document.getElementById("bpm-mode-quarter");
    const eighthBtn = document.getElementById("bpm-mode-eighth");
    const straightCheck = document.getElementById("bpm-straight-clicks");
    const heroStatus = document.getElementById("bpm-hero-status");

    bpmState = {
      bpm: 100,
      subdivision: 1,
      straightClicks: false,
      taps: [],
      running: false,
      tapTimeout: null,
    };

    function metroOpts() {
      return {
        subdivision: bpmState.subdivision,
        accent: !bpmState.straightClicks,
      };
    }

    function updatePulseSpeed() {
      const ms = AudioEngine.getMetronomeIntervalMs(bpmState.bpm, bpmState.subdivision);
      pulse.style.setProperty("--beat-dur", ms / 1000 + "s");
    }

    function restartMetroIfRunning() {
      if (!bpmState.running) return;
      AudioEngine.stopMetronome();
      AudioEngine.startMetronome(bpmState.bpm, metroOpts());
    }

    function setBpm(bpm) {
      bpmState.bpm = Math.max(40, Math.min(220, Math.round(bpm)));
      display.textContent = bpmState.bpm;
      slider.value = bpmState.bpm;
      updatePulseSpeed();
      restartMetroIfRunning();
      renderBpmSidebar();
    }

    function updateHeroStatus() {
      if (!heroStatus) return;
      if (bpmState.running) {
        heroStatus.textContent = bpmState.subdivision === 2 ? "Playing — 8th-note clicks" : "Playing — quarter-note clicks";
        heroStatus.style.color = "var(--success)";
      } else {
        heroStatus.textContent = "Tap the circle or press Start";
        heroStatus.style.color = "";
      }
    }

    function renderBpmSidebar() {
      const clickRate = bpmState.subdivision === 2
        ? `${bpmState.bpm * 2} clicks/min (8ths at ${bpmState.bpm} BPM)`
        : `${bpmState.bpm} clicks/min`;
      renderSidebar(`
        <h3>Details</h3>
        <div class="detail-row">
          <div class="detail-label">Feel</div>
          <div class="detail-value accent">${bpmFeel(bpmState.bpm)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Click pattern</div>
          <div class="detail-value">${bpmState.subdivision === 2 ? "8th notes — hi-hat count (2× per beat)" : "Quarter notes — one per beat"}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Click rate</div>
          <div class="detail-value">${clickRate}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Tone</div>
          <div class="detail-value">${bpmState.straightClicks ? "Straight — every click sounds the same" : "Accented — stronger click on beat 1 of each bar"}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Tap tempo</div>
          <div class="detail-value">Tap the center circle on the beat — after 2+ taps we average your spacing into BPM.</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Hi-hat tip</div>
          <div class="detail-value">At slow tempos (e.g. 80 BPM), switch to <strong>8ths</strong> to count "1-and-2-and" without changing the song speed.</div>
        </div>
      `, "tool-sidebar-bpm");
      updateHeroStatus();
    }

    function bpmFeel(bpm) {
      if (bpm < 70) return "Slow ballad / emotional";
      if (bpm < 95) return "Relaxed groove";
      if (bpm < 115) return "Mid-tempo pop";
      if (bpm < 135) return "Upbeat dance";
      return "Fast / energetic";
    }

    function registerTap() {
      const now = Date.now();
      AudioEngine.playClick(false);

      bpmState.taps.push(now);
      if (bpmState.taps.length > 8) bpmState.taps.shift();
      if (bpmState.taps.length >= 2) {
        const intervals = [];
        for (let i = 1; i < bpmState.taps.length; i++) {
          intervals.push(bpmState.taps[i] - bpmState.taps[i - 1]);
        }
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        setBpm(60000 / avg);
      }

      tapZone.classList.add("tapped");
      clearTimeout(bpmState.tapTimeout);
      bpmState.tapTimeout = setTimeout(() => tapZone.classList.remove("tapped"), 100);
    }

    slider.addEventListener("input", () => setBpm(parseInt(slider.value, 10)));
    AudioEngine.bindTap(tapZone, () => registerTap());

    AudioEngine.bindTap(startBtn, () => {
      bpmState.running = true;
      pulse.classList.add("running");
      updatePulseSpeed();
      AudioEngine.startMetronome(bpmState.bpm, metroOpts());
      updateHeroStatus();
    });
    stopBtn.addEventListener("click", () => {
      bpmState.running = false;
      pulse.classList.remove("running");
      AudioEngine.stopMetronome();
      updateHeroStatus();
    });

    quarterBtn.addEventListener("click", () => {
      bpmState.subdivision = 1;
      quarterBtn.classList.add("active");
      eighthBtn.classList.remove("active");
      if (tapHint) tapHint.textContent = "quarter-note beats";
      updatePulseSpeed();
      restartMetroIfRunning();
      renderBpmSidebar();
    });
    eighthBtn.addEventListener("click", () => {
      bpmState.subdivision = 2;
      eighthBtn.classList.add("active");
      quarterBtn.classList.remove("active");
      if (tapHint) tapHint.textContent = "BPM from taps — clicks as 8ths";
      updatePulseSpeed();
      restartMetroIfRunning();
      renderBpmSidebar();
    });

    straightCheck.addEventListener("change", () => {
      bpmState.straightClicks = straightCheck.checked;
      restartMetroIfRunning();
      renderBpmSidebar();
    });

    document.querySelectorAll(".bpm-preset-chip").forEach((chip) => {
      chip.addEventListener("click", () => setBpm(parseInt(chip.dataset.bpm, 10)));
    });

    setBpm(100);
    renderBpmSidebar();
  }

  /* ─── Modal scales ─── */
  function initModes() {
    const rootSelect = document.getElementById("modes-root-select");
    const grid = document.getElementById("modes-cards-grid");
    const degreeRef = document.getElementById("modes-degree-ref");
    const degreeTitle = document.getElementById("modes-degree-title");
    const degreeHint = document.getElementById("modes-degree-hint");
    const playBtn = document.getElementById("modes-play-scale-btn");
    let selectedId = "dorian";

    MusicTheory.CHROMATIC.forEach((n) => {
      if (MusicTheory.DISPLAY[n]) {
        rootSelect.innerHTML += `<option value="${n}">${MusicTheory.DISPLAY[n]}</option>`;
      }
    });

    function showModeSidebar(scale) {
      const rootName = MusicTheory.DISPLAY[scale.rootId] || scale.rootId;
      renderSidebar(
        `<h3>${rootName} ${scale.name}</h3>
        <div class="detail-row"><div class="detail-label">Also called</div><div class="detail-value accent">${scale.alias}</div></div>
        <div class="detail-row"><div class="detail-label">Formula</div><div class="detail-value">${scale.formula}</div></div>
        <div class="detail-row"><div class="detail-label">Notes</div><div class="detail-value">${scale.noteNames}</div></div>
        <div class="detail-row"><div class="detail-label">Character</div><div class="detail-value">${scale.character}</div></div>
        <div class="detail-row"><div class="detail-label">vs Major</div><div class="detail-value">${scale.change}</div></div>
        <div class="detail-row"><div class="detail-label">You'll hear it in</div><div class="detail-value">${scale.uses}</div></div>`,
        "tool-sidebar-modes"
      );
    }

    function playScale(scale, stagger = 0.22) {
      scale.notes.forEach((n, i) => {
        const play = () => {
          AudioEngine.playTone(n, 0.4);
          window.ToolPiano?.highlightCorrect(n);
        };
        if (i === 0) play();
        else setTimeout(play, i * stagger * 1000);
      });
    }

    function renderDegreeRef(scale) {
      const rootName = MusicTheory.DISPLAY[scale.rootId] || scale.rootId;
      degreeTitle.textContent = `${rootName} ${scale.name} — degrees 1–7`;
      degreeHint.textContent = `1 = ${scale.degrees[0]?.noteName} (root). Tap any degree to hear it.`;
      degreeRef.innerHTML = MusicTheory.renderScaleDegreeHtml(scale);
      degreeRef.querySelectorAll(".scale-degree-cell").forEach((cell) => {
        AudioEngine.bindTap(cell, () => {
          const noteId = cell.dataset.note;
          AudioEngine.playTone(noteId, 0.45);
          window.ToolPiano?.highlightCorrect(noteId);
          degreeRef.querySelectorAll(".scale-degree-cell").forEach((c) => c.classList.remove("playing"));
          cell.classList.add("playing");
          setTimeout(() => cell.classList.remove("playing"), 350);
        });
      });
    }

    function renderGrid() {
      const rootId = rootSelect.value;
      grid.innerHTML = MusicTheory.MODES.map((m) => {
        const scale = MusicTheory.getModeScale(rootId, m.id);
        const sel = m.id === selectedId ? " selected" : "";
        return `<button type="button" class="mode-scale-card${sel}" data-id="${m.id}">
          <span class="msc-name">${m.name}</span>
          <span class="msc-alias">${m.alias}</span>
          <span class="msc-formula">${m.formula}</span>
        </button>`;
      }).join("");

      grid.querySelectorAll(".mode-scale-card").forEach((card) => {
        AudioEngine.bindTap(card, () => {
          selectedId = card.dataset.id;
          grid.querySelectorAll(".mode-scale-card").forEach((c) => c.classList.remove("selected"));
          card.classList.add("selected");
          const scale = MusicTheory.getModeScale(rootSelect.value, selectedId);
          playScale(scale);
          renderDegreeRef(scale);
          showModeSidebar(scale);
        });
      });

      const scale = MusicTheory.getModeScale(rootId, selectedId);
      renderDegreeRef(scale);
      showModeSidebar(scale);
    }

    AudioEngine.bindTap(playBtn, () => {
      playScale(MusicTheory.getModeScale(rootSelect.value, selectedId));
    });
    rootSelect.addEventListener("change", renderGrid);
    renderGrid();
  }

  /* ─── Time signatures ─── */
  function initTimeSignatures() {
    const sigSelect = document.getElementById("timesig-select");
    const display = document.getElementById("timesig-display");
    const grouping = document.getElementById("timesig-grouping");
    const beatRow = document.getElementById("timesig-beat-row");
    const bpmSlider = document.getElementById("timesig-bpm");
    const bpmVal = document.getElementById("timesig-bpm-val");
    const startBtn = document.getElementById("timesig-start-btn");
    const stopBtn = document.getElementById("timesig-stop-btn");
    let beatAnimTimer = null;
    let beatIdx = 0;

    const categories = ["Common", "Compound", "Odd"];
    categories.forEach((cat) => {
      const opts = MusicTheory.TIME_SIGNATURES.filter((t) => t.category === cat);
      if (!opts.length) return;
      sigSelect.innerHTML += `<optgroup label="${cat}">${opts
        .map((t) => `<option value="${t.id}">${t.display} — ${t.grouping}</option>`)
        .join("")}</optgroup>`;
    });

    function stopBeatAnim() {
      if (beatAnimTimer) {
        clearInterval(beatAnimTimer);
        beatAnimTimer = null;
      }
      beatRow.querySelectorAll(".timesig-beat").forEach((b) => b.classList.remove("active"));
    }

    function render() {
      const sig = MusicTheory.getTimeSignature(sigSelect.value);
      display.textContent = sig.display;
      grouping.textContent = sig.grouping + " · " + sig.category;
      beatRow.innerHTML = sig.beatLabels
        .map(
          (label, i) =>
            `<span class="timesig-beat${sig.pattern[i] ? " accent" : ""}" data-i="${i}">${label}</span>`
        )
        .join("");

      renderSidebar(
        `<h3>${sig.display}</h3>
        <div class="detail-row"><div class="detail-label">Category</div><div class="detail-value accent">${sig.category}</div></div>
        <div class="detail-row"><div class="detail-label">Grouping</div><div class="detail-value">${sig.grouping}</div></div>
        <div class="detail-row"><div class="detail-label">Feel</div><div class="detail-value">${sig.feel}</div></div>
        <div class="detail-row"><div class="detail-label">Explanation</div><div class="detail-value">${sig.explanation}</div></div>
        <div class="detail-row"><div class="detail-label">Examples</div><div class="detail-value">${sig.examples}</div></div>
        <div class="detail-row"><div class="detail-label">Practice tip</div><div class="detail-value">${sig.tip}</div></div>`,
        "tool-sidebar-timesig"
      );
    }

    function startMetro() {
      const sig = MusicTheory.getTimeSignature(sigSelect.value);
      const bpm = parseInt(bpmSlider.value, 10);
      AudioEngine.stopMetronome();
      stopBeatAnim();
      beatIdx = 0;
      const ms = (60000 / bpm) * sig.clickNote;

      AudioEngine.startMetronome(bpm, {
        pattern: sig.pattern,
        clickNote: sig.clickNote,
        accent: true,
      });

      beatAnimTimer = setInterval(() => {
        beatRow.querySelectorAll(".timesig-beat").forEach((b) => b.classList.remove("active"));
        const cell = beatRow.querySelector(`.timesig-beat[data-i="${beatIdx % sig.pattern.length}"]`);
        if (cell) cell.classList.add("active");
        beatIdx += 1;
      }, ms);
    }

    bpmSlider.addEventListener("input", () => {
      bpmVal.textContent = bpmSlider.value;
      if (beatAnimTimer) startMetro();
    });
    sigSelect.addEventListener("change", () => {
      AudioEngine.stopMetronome();
      stopBeatAnim();
      render();
    });
    AudioEngine.bindTap(startBtn, startMetro);
    stopBtn.addEventListener("click", () => {
      AudioEngine.stopMetronome();
      stopBeatAnim();
    });
    bpmVal.textContent = bpmSlider.value;
    render();
  }

  /* ─── Intervals ─── */
  function initIntervals() {
    const rootSelect = document.getElementById("interval-root-select");
    const grid = document.getElementById("interval-cards-grid");
    let selectedId = "M3";

    MusicTheory.CHROMATIC.forEach((n) => {
      if (MusicTheory.DISPLAY[n]) {
        rootSelect.innerHTML += `<option value="${n}">${MusicTheory.DISPLAY[n]}</option>`;
      }
    });

    function playInterval(rootId, interval) {
      const notes = MusicTheory.intervalNotes(rootId, interval.semitones);
      AudioEngine.unlockAudio();
      AudioEngine.playTone(notes[0], 0.35);
      window.ToolPiano?.highlightCorrect(notes[0]);
      setTimeout(() => {
        AudioEngine.playTone(notes[1], 0.45);
        window.ToolPiano?.highlightCorrect(notes[1]);
      }, 320);
    }

    function showSidebar(iv, rootId) {
      const notes = MusicTheory.intervalNotes(rootId, iv.semitones);
      renderSidebar(
        `<h3>${iv.name}</h3>
        <div class="detail-row"><div class="detail-label">From</div><div class="detail-value accent">${MusicTheory.DISPLAY[rootId]} → ${MusicTheory.DISPLAY[notes[1]]}</div></div>
        <div class="detail-row"><div class="detail-label">Semitones</div><div class="detail-value">${iv.semitones}</div></div>
        <div class="detail-row"><div class="detail-label">Symbol</div><div class="detail-value">${iv.short}</div></div>
        <div class="detail-row"><div class="detail-label">Character</div><div class="detail-value">${iv.quality}</div></div>
        <div class="detail-row"><div class="detail-label">In chords</div><div class="detail-value">${intervalChordHint(iv.id)}</div></div>`,
        "tool-sidebar-intervals"
      );
    }

    function intervalChordHint(id) {
      const hints = {
        m3: "Minor triad, sad color",
        M3: "Major triad, happy color",
        P5: "Power chords, stability",
        TT: "Diminished, dominant 7♭5",
        m7: "Dominant 7th, blues",
        M7: "Major 7th, jazz color",
        P8: "Same note, octave equivalence",
      };
      return hints[id] || "Building block of melody & harmony";
    }

    function renderGrid() {
      const rootId = rootSelect.value;
      grid.innerHTML = MusicTheory.INTERVALS.map((iv) => {
        const sel = iv.id === selectedId ? " selected" : "";
        const top = MusicTheory.DISPLAY[MusicTheory.intervalNotes(rootId, iv.semitones)[1]];
        return `<button type="button" class="interval-card${sel}" data-id="${iv.id}">
          <span class="ic-short">${iv.short}</span>
          <span class="ic-name">${iv.name}</span>
          <span class="ic-top">→ ${top}</span>
        </button>`;
      }).join("");

      grid.querySelectorAll(".interval-card").forEach((card) => {
        AudioEngine.bindTap(card, () => {
          selectedId = card.dataset.id;
          grid.querySelectorAll(".interval-card").forEach((c) => c.classList.remove("selected"));
          card.classList.add("selected");
          const iv = MusicTheory.getInterval(selectedId);
          playInterval(rootId, iv);
          showSidebar(iv, rootId);
        });
      });

      showSidebar(MusicTheory.getInterval(selectedId), rootId);
    }

    rootSelect.addEventListener("change", renderGrid);
    renderGrid();
  }

  function start(toolId) {
    stopAll();
    activeTool = toolId;
    onPianoKey = null;

    if (toolId === "bpm" || toolId === "timesig") {
      window.ToolPiano = null;
      if (toolId === "bpm") initBpm();
      else initTimeSignatures();
      return;
    }

    window.ToolPiano = {
      highlightCorrect: (n) =>
        document.dispatchEvent(new CustomEvent("tool-piano-highlight", { detail: n })),
    };

    if (toolId === "circle") initCircle();
    else if (toolId === "progressions") initProgressions();
    else if (toolId === "chordstructure") initChordStructure();
    else if (toolId === "nashville") initNashville();
    else if (toolId === "modes") initModes();
    else if (toolId === "intervals") initIntervals();
  }

  function getPianoHandler() {
    return onPianoKey;
  }

  return { TOOL_META, start, stop: stopAll, getPianoHandler };
})();

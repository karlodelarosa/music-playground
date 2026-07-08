/**
 * ELGC Playground — main application shell.
 */
(function () {
  const MODE_META = {
    find: { icon: "target", title: "Find The Note", desc: "See a note name, hit the right key.", tier: "beginner" },
    echo: { icon: "volume-2", title: "Echo Mode", desc: "Listen, then replay growing sequences.", tier: "beginner" },
    memory: { icon: "brain", title: "Memory Mode", desc: "Memorize a sequence, then play it back.", tier: "intermediate" },
    chord: { icon: "music-4", title: "Chord Builder", desc: "Build major and minor chords.", tier: "intermediate" },
    ear: { icon: "ear", title: "Ear Training", desc: "Hear a note, identify it by ear.", tier: "advanced" },
  };

  const MODE_NAMES = {
    find: "Find The Note",
    echo: "Echo Mode",
    memory: "Memory Mode",
    chord: "Chord Builder",
    ear: "Ear Training",
  };

  const TUTORIAL_NAMES = {
    bpm: "BPM & Rhythm",
    notes: "Note Names",
    progressions: "Chord Progressions",
    circle: "Circle of Fifths",
    nashville: "Nashville Numbers",
    chordtypes: "Chord Structures",
    modes: "Modal Scales",
    timesignatures: "Time Signatures",
    intervals: "Intervals",
  };

  const TOOL_NAMES = {
    circle: "Circle of Fifths",
    progressions: "Chord Progressions",
    chordstructure: "Chord Structures",
    nashville: "Nashville Practice",
    bpm: "BPM Metronome",
    modes: "Modal Scales",
    timesig: "Time Signatures",
    intervals: "Intervals",
  };

  const TOOL_SCREENS = {
    circle: "screen-tool-circle",
    progressions: "screen-tool-progressions",
    nashville: "screen-tool-nashville",
    bpm: "screen-tool-bpm",
  };

  let progress = Storage.load();
  progress.level = Storage.xpToLevel(progress.xp);
  progress = Storage.syncUnlocks(progress);

  let currentMode = null;
  let currentTutorial = null;
  let currentTool = null;
  let modeHandler = null;
  let sessionScore = 0;
  let roundMistake = false;
  let academyPianoHandler = null;

  const els = {
    xp: document.getElementById("stat-xp"),
    level: document.getElementById("stat-level"),
    streak: document.getElementById("stat-streak"),
    modeLabel: document.getElementById("stat-mode"),
    highScore: document.getElementById("stat-highscore"),
    screenMenu: document.getElementById("screen-menu"),
    screenGame: document.getElementById("screen-game"),
    screenTutorial: document.getElementById("screen-tutorial"),
    modeGrid: document.getElementById("mode-grid"),
    academyGrid: document.getElementById("academy-grid"),
    instruction: document.getElementById("instruction"),
    subInstruction: document.getElementById("sub-instruction"),
    scoreLine: document.getElementById("score-line"),
    challengePanel: document.getElementById("challenge-panel"),
    sequenceDisplay: document.getElementById("sequence-display"),
    chordProgress: document.getElementById("chord-progress"),
    submitChord: document.getElementById("submit-chord"),
    pianoMount: document.getElementById("piano-mount"),
    xpContainer: document.getElementById("xp-popup-container"),
    levelBanner: document.getElementById("level-up-banner"),
    backBtn: document.getElementById("back-to-menu"),
    backTutorialBtn: document.getElementById("back-from-tutorial"),
    tutorialStage: document.getElementById("tutorial-stage"),
    tutorialProgressFill: document.getElementById("tutorial-progress-fill"),
    tutorialTitle: document.getElementById("tutorial-title"),
    panelPlay: document.getElementById("panel-play"),
    panelAcademy: document.getElementById("panel-academy"),
    panelTools: document.getElementById("panel-tools"),
    toolsGrid: document.getElementById("tools-grid"),
    screenToolCircle: document.getElementById("screen-tool-circle"),
    screenToolProgressions: document.getElementById("screen-tool-progressions"),
    screenToolNashville: document.getElementById("screen-tool-nashville"),
    screenToolBpm: document.getElementById("screen-tool-bpm"),
    screenToolChordStructure: document.getElementById("screen-tool-chord-structure"),
    screenToolModes: document.getElementById("screen-tool-modes"),
    screenToolTimesig: document.getElementById("screen-tool-timesig"),
    screenToolIntervals: document.getElementById("screen-tool-intervals"),
  };

  const ui = {
    setInstruction(html) {
      els.instruction.innerHTML = html;
    },
    setSub(text) {
      els.subInstruction.textContent = text;
    },
    clearFeedback() {
      els.challengePanel.classList.remove("feedback-correct", "feedback-wrong");
    },
    feedbackCorrect() {
      els.challengePanel.classList.remove("feedback-wrong");
      els.challengePanel.classList.add("feedback-correct");
    },
    feedbackWrong(msg) {
      els.challengePanel.classList.remove("feedback-correct");
      els.challengePanel.classList.add("feedback-wrong");
      els.subInstruction.textContent = msg;
    },
    showSequence(names) {
      els.sequenceDisplay.style.display = "flex";
      els.sequenceDisplay.innerHTML = names
        .map((n) => `<span class="sequence-chip">${n}</span>`)
        .join("");
    },
    hideSequence() {
      els.sequenceDisplay.style.display = "none";
      els.sequenceDisplay.innerHTML = "";
    },
    renderChordSlots(count, labels) {
      els.chordProgress.style.display = "flex";
      els.chordProgress.innerHTML = "";
      for (let i = 0; i < count; i++) {
        const slot = document.createElement("div");
        slot.className = "chord-slot" + (labels[i] ? " filled" : "");
        slot.textContent = labels[i] || (i + 1);
        els.chordProgress.appendChild(slot);
      }
    },
    showChordSubmit(show) {
      els.submitChord.style.display = show ? "inline-block" : "none";
      els.chordProgress.style.display = show ? "flex" : "none";
    },
    updateScoreLine() {
      els.scoreLine.innerHTML = `Session score: <strong>${sessionScore}</strong> · Round XP adds to your total`;
    },
  };

  function applyXp(gain, perfect) {
    progress.streak += 1;
    progress.xp += gain;
    sessionScore += gain;
    if (sessionScore > progress.highScore) progress.highScore = sessionScore;

    const prevLevel = progress.level;
    progress.level = Storage.xpToLevel(progress.xp);
    progress = Storage.syncUnlocks(progress);
    Storage.save(progress);
    renderStats();
    showXpPopup(gain, perfect);

    if (progress.level > prevLevel) {
      setTimeout(showLevelUp, 400);
    }
  }

  const rewards = {
    onCorrect(perfectRound) {
      const gain = perfectRound ? 25 : 10;
      applyXp(gain, perfectRound);
      roundMistake = false;
      ui.updateScoreLine();
    },
    onWrong() {
      progress.streak = 0;
      roundMistake = true;
      Storage.save(progress);
      renderStats();
    },
    onTutorialStep(amount) {
      applyXp(amount, false);
    },
    onTutorialComplete(amount) {
      applyXp(amount, true);
    },
  };

  function showXpPopup(amount, perfect) {
    const pop = document.createElement("div");
    pop.className = "xp-popup" + (perfect ? " perfect" : "");
    pop.textContent = perfect ? `+${amount} XP Complete!` : `+${amount} XP`;
    els.xpContainer.appendChild(pop);
    setTimeout(() => pop.remove(), 1100);
  }

  function showLevelUp() {
    els.levelBanner.classList.add("visible");
    els.levelBanner.querySelector("p").textContent = `You're now level ${progress.level}!`;
    setTimeout(() => els.levelBanner.classList.remove("visible"), 2000);
  }

  function renderStats() {
    els.xp.textContent = progress.xp;
    els.level.textContent = progress.level;
    els.streak.innerHTML = progress.streak > 0
      ? `<span class="streak-flame">${Icons.svg("flame", { size: 16 })}</span> ${progress.streak}`
      : "0";
    els.highScore.textContent = progress.highScore;
  }

  function buildModeGrid() {
    els.modeGrid.innerHTML = "";
    Object.keys(MODE_META).forEach((id) => {
      const meta = MODE_META[id];
      const unlocked = progress.unlockedModes.includes(id);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "mode-card" + (unlocked ? "" : " locked");
      const unlockXp = Storage.UNLOCK_XP[id];
      const lockText = unlockXp ? `Unlock at ${unlockXp} XP` : "Locked";
      card.innerHTML = `
        <div class="mode-icon">${Icons.svg(meta.icon, { size: 28 })}</div>
        <h3>${meta.title}</h3>
        <p>${meta.desc}</p>
        <span class="mode-badge ${unlocked ? meta.tier : "locked"}">${unlocked ? meta.tier : lockText}</span>
      `;
      if (unlocked) AudioEngine.bindTap(card, () => startMode(id));
      els.modeGrid.appendChild(card);
    });
  }

  function buildAcademyGrid() {
    els.academyGrid.innerHTML = "";
    Object.keys(Academy.TUTORIAL_META).forEach((id) => {
      const meta = Academy.TUTORIAL_META[id];
      const unlocked = progress.unlockedTutorials.includes(id);
      const done = progress.completedTutorials.includes(id);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "mode-card" + (unlocked ? "" : " locked") + (done ? " completed" : "");
      const unlockXp = Storage.TUTORIAL_UNLOCK_XP[id];
      const lockText = unlockXp ? `Unlock at ${unlockXp} XP` : "Locked";
      const badge = done ? "completed" : unlocked ? meta.tier : "locked";
      const badgeText = done ? `Completed ${Icons.svg("check", { size: 14 })}` : unlocked ? `${meta.lessons} lessons` : lockText;
      card.innerHTML = `
        <div class="mode-icon">${Icons.svg(meta.icon, { size: 28 })}</div>
        <h3>${meta.title}</h3>
        <p>${meta.desc}</p>
        <span class="mode-badge ${badge}">${badgeText}</span>
      `;
      if (unlocked) AudioEngine.bindTap(card, () => startTutorial(id));
      els.academyGrid.appendChild(card);
    });
  }

  function navigate(screen, pianoOpts = {}) {
    showScreen(screen);
    PianoPanel.resetOverrideForNavigation();
    PianoPanel.applyForScreen(screen, pianoOpts);
    if (PianoPanel.isVisible()) Piano.setEnabled(true);
  }

  function showScreen(name) {
    els.screenMenu.classList.toggle("active", name === "menu");
    els.screenGame.classList.toggle("active", name === "game");
    els.screenTutorial.classList.toggle("active", name === "tutorial");
    els.screenToolCircle.classList.toggle("active", name === "tool-circle");
    els.screenToolProgressions.classList.toggle("active", name === "tool-progressions");
    els.screenToolNashville.classList.toggle("active", name === "tool-nashville");
    els.screenToolBpm.classList.toggle("active", name === "tool-bpm");
    els.screenToolChordStructure.classList.toggle("active", name === "tool-chordstructure");
    els.screenToolModes.classList.toggle("active", name === "tool-modes");
    els.screenToolTimesig.classList.toggle("active", name === "tool-timesig");
    els.screenToolIntervals.classList.toggle("active", name === "tool-intervals");
  }

  function setMenuTab(tab) {
    document.querySelectorAll(".menu-tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === tab);
    });
    els.panelPlay.classList.toggle("active", tab === "play");
    els.panelAcademy.classList.toggle("active", tab === "academy");
    els.panelTools.classList.toggle("active", tab === "tools");
  }

  function buildToolsGrid() {
    els.toolsGrid.innerHTML = "";
    Object.keys(Tools.TOOL_META).forEach((id) => {
      const meta = Tools.TOOL_META[id];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "mode-card";
      card.innerHTML = `
        <div class="mode-icon">${Icons.svg(meta.icon, { size: 28 })}</div>
        <h3>${meta.title}</h3>
        <p>${meta.desc}</p>
        <span class="mode-badge ${meta.tier || "beginner"}">Open</span>
      `;
      AudioEngine.bindTap(card, () => startTool(id));
      els.toolsGrid.appendChild(card);
    });
  }

  function startTool(id) {
    AudioEngine.unlockAudio();
    Academy.stop();
    if (modeHandler?.stop) modeHandler.stop();
    modeHandler = null;
    currentTutorial = null;
    currentMode = null;
    academyPianoHandler = null;
    currentTool = id;
    els.modeLabel.textContent = TOOL_NAMES[id] || "Tools";

    Tools.start(id);

    const screenMap = {
      circle: "tool-circle",
      progressions: "tool-progressions",
      chordstructure: "tool-chordstructure",
      nashville: "tool-nashville",
      bpm: "tool-bpm",
      modes: "tool-modes",
      timesig: "tool-timesig",
      intervals: "tool-intervals",
    };
    navigate(screenMap[id] || "menu");
  }

  function startMode(id) {
    AudioEngine.unlockAudio();
    Academy.stop();
    Tools.stop();
    if (modeHandler?.stop) modeHandler.stop();
    currentTool = null;
    currentTutorial = null;
    academyPianoHandler = null;
    currentMode = id;
    sessionScore = 0;
    roundMistake = false;
    els.modeLabel.textContent = MODE_NAMES[id] || id;
    ui.showChordSubmit(id === "chord");
    ui.hideSequence();
    ui.updateScoreLine();

    if (id === "find") modeHandler = GameModes.createFindMode(ui, Piano, rewards);
    else if (id === "echo") modeHandler = GameModes.createEchoMode(ui, Piano, rewards);
    else if (id === "memory") modeHandler = GameModes.createMemoryMode(ui, Piano, rewards);
    else if (id === "chord") modeHandler = GameModes.createChordMode(ui, Piano, rewards);
    else if (id === "ear") modeHandler = GameModes.createEarMode(ui, Piano, rewards);

    navigate("game");
    modeHandler.start();
  }

  function startTutorial(id) {
    AudioEngine.unlockAudio();
    Tools.stop();
    if (modeHandler?.stop) modeHandler.stop();
    modeHandler = null;
    currentMode = null;
    currentTool = null;
    currentTutorial = id;
    sessionScore = 0;
    els.modeLabel.textContent = TUTORIAL_NAMES[id] || "Academy";

    Academy.mount(
      els.tutorialStage,
      els.tutorialProgressFill,
      els.tutorialTitle,
      {
        progress,
        rewards,
        piano: Piano,
        pianoOnKey: null,
        onComplete: () => {
          buildAcademyGrid();
        },
      }
    );

    const ctx = {
      progress,
      rewards,
      piano: Piano,
      get pianoOnKey() {
        return academyPianoHandler;
      },
      set pianoOnKey(fn) {
        academyPianoHandler = fn;
      },
      onComplete: () => buildAcademyGrid(),
    };

    navigate("tutorial", { tutorialId: id });
    Academy.start(id, ctx);
  }

  function returnToMenu(fromTools) {
    Academy.stop();
    Tools.stop();
    if (modeHandler?.stop) modeHandler.stop();
    modeHandler = null;
    currentMode = null;
    currentTutorial = null;
    currentTool = null;
    academyPianoHandler = null;
    els.modeLabel.textContent = "Select Mode";
    ui.clearFeedback();
    ui.hideSequence();
    ui.showChordSubmit(false);
    buildModeGrid();
    buildAcademyGrid();
    navigate("menu");
    if (fromTools) setMenuTab("tools");
  }

  Piano.build(els.pianoMount);
  PianoPanel.init();
  Piano.onPress((noteId) => {
    AudioEngine.unlockAudio();
    const toolHandler = Tools.getPianoHandler();
    if (toolHandler) {
      toolHandler(noteId);
      return;
    }
    if (academyPianoHandler) {
      academyPianoHandler(noteId);
      return;
    }
    if (modeHandler?.onKey) modeHandler.onKey(noteId);
  });

  document.addEventListener("tool-piano-highlight", (e) => {
    if (e.detail) Piano.highlightCorrect(e.detail);
  });

  els.submitChord.addEventListener("click", () => {
    if (modeHandler?.submit) modeHandler.submit();
  });

  els.backBtn.addEventListener("click", () => returnToMenu(false));
  els.backTutorialBtn.addEventListener("click", () => returnToMenu(false));

  document.querySelectorAll("[data-back=tools]").forEach((btn) => {
    btn.addEventListener("click", () => returnToMenu(true));
  });

  document.querySelectorAll(".menu-tab").forEach((tab) => {
    tab.addEventListener("click", () => setMenuTab(tab.dataset.tab));
  });

  document.body.addEventListener(
    "touchstart",
    () => AudioEngine.unlockAudio(),
    { passive: true, capture: true }
  );
  document.body.addEventListener(
    "click",
    () => AudioEngine.unlockAudio(),
    { capture: true }
  );

  Theme.init();
  SoundSettings.init();
  AudioEngine.initMobileUnlockUI();

  renderStats();
  buildModeGrid();
  buildAcademyGrid();
  buildToolsGrid();
  els.modeLabel.textContent = "Select Mode";
  ui.updateScoreLine();
})();

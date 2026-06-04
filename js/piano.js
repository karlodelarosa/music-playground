/**
 * Interactive one-octave piano keyboard.
 */
const Piano = (() => {
  const WHITE_LAYOUT = [
    { id: "C", label: "C" },
    { id: "D", label: "D" },
    { id: "E", label: "E" },
    { id: "F", label: "F" },
    { id: "G", label: "G" },
    { id: "A", label: "A" },
    { id: "B", label: "B" },
  ];

  const BLACK_LAYOUT = [
    { id: "Cs", label: "C#" },
    { id: "Ds", label: "D#" },
    { id: "Fs", label: "F#" },
    { id: "Gs", label: "G#" },
    { id: "As", label: "A#" },
  ];

  let container = null;
  let keysByNote = {};
  let onPressCallback = null;
  let enabled = true;

  function build(parentEl) {
    container = document.createElement("div");
    container.className = "piano-wrap";
    container.innerHTML = `
      <div class="piano" id="piano">
        <div class="white-keys" id="white-keys"></div>
      </div>
    `;
    parentEl.appendChild(container);

    const piano = container.querySelector("#piano");
    const whiteRow = container.querySelector("#white-keys");
    keysByNote = {};

    WHITE_LAYOUT.forEach(({ id, label }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "piano-key white";
      btn.dataset.note = id;
      btn.setAttribute("aria-label", label);
      btn.innerHTML = `<span class="key-label">${label}</span>`;
      bindKey(btn, id);
      whiteRow.appendChild(btn);
      keysByNote[id] = btn;
    });

    BLACK_LAYOUT.forEach(({ id, label }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "piano-key black";
      btn.dataset.note = id;
      btn.setAttribute("aria-label", label);
      bindKey(btn, id);
      piano.appendChild(btn);
      keysByNote[id] = btn;
    });
  }

  function bindKey(btn, noteId) {
    const press = (e) => {
      e.preventDefault();
      if (!enabled) return;
      AudioEngine.unlockAudio();
      activateKey(noteId, true);
      if (onPressCallback) onPressCallback(noteId);
    };
    btn.addEventListener("pointerdown", press);
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        press(e);
      }
    });
  }

  function activateKey(noteId, playSound = true) {
    const key = keysByNote[noteId];
    if (!key) return;

    key.classList.add("pressed");
    key.classList.add("show-label");

    const bubble = document.createElement("span");
    bubble.className = "note-bubble";
    bubble.textContent = AudioEngine.displayName(noteId);
    key.appendChild(bubble);
    setTimeout(() => bubble.remove(), 700);
    setTimeout(() => {
      key.classList.remove("pressed", "show-label");
    }, 120);

    if (playSound) AudioEngine.playTone(noteId);
  }

  function flashDemo(noteId) {
    const key = keysByNote[noteId];
    if (!key) return;
    key.classList.add("flash-demo", "pressed");
    AudioEngine.playTone(noteId, 0.4);
    setTimeout(() => {
      key.classList.remove("flash-demo", "pressed");
    }, 450);
  }

  function highlightCorrect(noteId) {
    const key = keysByNote[noteId];
    if (!key) return;
    key.classList.add("flash-correct");
    setTimeout(() => key.classList.remove("flash-correct"), 600);
  }

  function highlightWrong(noteId) {
    const key = keysByNote[noteId];
    if (!key) return;
    key.classList.add("flash-wrong");
    setTimeout(() => key.classList.remove("flash-wrong"), 500);
  }

  function setEnabled(value) {
    enabled = value;
    const piano = container?.querySelector(".piano");
    if (piano) piano.classList.toggle("disabled", !value);
  }

  function onPress(fn) {
    onPressCallback = fn;
  }

  return {
    build,
    activateKey,
    flashDemo,
    highlightCorrect,
    highlightWrong,
    setEnabled,
    onPress,
    getKeys: () => keysByNote,
  };
})();

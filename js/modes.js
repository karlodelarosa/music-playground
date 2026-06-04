/**
 * Game mode logic: Find, Echo, Memory, Chord, Ear Training.
 */
const GameModes = (() => {
  const CHORDS = [
    { name: "C Major", notes: ["C", "E", "G"], explain: "C Major = root C + major third E + perfect fifth G." },
    { name: "G Major", notes: ["G", "B", "D"], explain: "G Major stacks G, B, and D — a bright, open sound." },
    { name: "D Major", notes: ["D", "Fs", "A"], explain: "D Major uses D, F#, and A." },
    { name: "A Minor", notes: ["A", "C", "E"], explain: "A Minor is A, C, and E — softer than major chords." },
    { name: "E Minor", notes: ["E", "G", "B"], explain: "E Minor combines E, G, and B." },
    { name: "F Major", notes: ["F", "A", "C"], explain: "F Major is F, A, and C." },
  ];

  const DEMO_GAP = 600;

  function randomNote() {
    return AudioEngine.ALL_NOTES[Math.floor(Math.random() * AudioEngine.ALL_NOTES.length)];
  }

  function shuffleNotes(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function createFindMode(ui, piano, rewards) {
    let target = null;
    let roundPerfect = true;
    let streakInMode = 0;

    function start() {
      roundPerfect = true;
      nextChallenge();
    }

    function nextChallenge() {
      target = randomNote();
      ui.setInstruction(`Find note <span class="highlight">${AudioEngine.displayName(target)}</span>`);
      ui.setSub("Tap the matching key on the piano");
      ui.clearFeedback();
      piano.setEnabled(true);
    }

    function onKey(noteId) {
      if (!target) return;
      piano.setEnabled(false);

      if (noteId === target) {
        streakInMode++;
        const perfect = roundPerfect && streakInMode >= 5;
        rewards.onCorrect(perfect);
        if (perfect) streakInMode = 0;
        AudioEngine.playSuccess();
        ui.feedbackCorrect();
        setTimeout(nextChallenge, 900);
      } else {
        roundPerfect = false;
        streakInMode = 0;
        rewards.onWrong();
        AudioEngine.playWrong();
        ui.feedbackWrong(
          `That was ${AudioEngine.displayName(noteId)}, not ${AudioEngine.displayName(target)}.`
        );
        piano.highlightWrong(noteId);
        piano.highlightCorrect(target);
        setTimeout(() => {
          ui.clearFeedback();
          piano.setEnabled(true);
        }, 1600);
      }
    }

    return { id: "find", start, onKey, stop: () => {} };
  }

  function createEchoMode(ui, piano, rewards) {
    let sequence = [];
    let playerIndex = 0;
    let phase = "idle";
    let roundPerfect = true;
    let demonstrating = false;

    function start() {
      sequence = [randomNote()];
      playerIndex = 0;
      roundPerfect = true;
      runDemoThenListen();
    }

    function runDemoThenListen() {
      phase = "demo";
      demonstrating = true;
      piano.setEnabled(false);
      ui.setInstruction("Listen &amp; repeat");
      ui.setSub(`Round ${sequence.length} — watch the keys light up`);
      ui.showSequence(sequence.map((n) => AudioEngine.displayName(n)));
      playDemoSequence(0, () => {
        demonstrating = false;
        phase = "input";
        playerIndex = 0;
        ui.setSub("Your turn! Play the same notes");
        ui.hideSequence();
        piano.setEnabled(true);
      });
    }

    function playDemoSequence(i, done) {
      if (i >= sequence.length) {
        setTimeout(done, 400);
        return;
      }
      setTimeout(() => {
        piano.flashDemo(sequence[i]);
        playDemoSequence(i + 1, done);
      }, i === 0 ? 300 : DEMO_GAP);
    }

    function onKey(noteId) {
      if (phase !== "input" || demonstrating) return;

      const expected = sequence[playerIndex];
      if (noteId !== expected) {
        roundPerfect = false;
        rewards.onWrong();
        AudioEngine.playWrong();
        ui.feedbackWrong(
          `Expected ${AudioEngine.displayName(expected)}. Try listening carefully to the pitch.`
        );
        piano.highlightWrong(noteId);
        piano.highlightCorrect(expected);
        piano.setEnabled(false);
        setTimeout(() => {
          ui.clearFeedback();
          playerIndex = 0;
          runDemoThenListen();
        }, 1800);
        return;
      }

      playerIndex++;
      if (playerIndex >= sequence.length) {
        piano.setEnabled(false);
        const perfect = roundPerfect;
        rewards.onCorrect(perfect);
        AudioEngine.playSuccess();
        ui.feedbackCorrect();
        sequence.push(randomNote());
        roundPerfect = true;
        setTimeout(runDemoThenListen, 1100);
      }
    }

    return { id: "echo", start, onKey, stop: () => { phase = "idle"; } };
  }

  function createMemoryMode(ui, piano, rewards) {
    let sequence = [];
    let phase = "idle";
    let roundPerfect = true;

    function start() {
      sequence = shuffleNotes(AudioEngine.ALL_NOTES).slice(0, 3);
      roundPerfect = true;
      showThenHide();
    }

    function showThenHide() {
      phase = "memorize";
      piano.setEnabled(false);
      ui.setInstruction("Memorize this sequence");
      ui.setSub("Pay close attention…");
      ui.showSequence(sequence.map((n) => AudioEngine.displayName(n)));

      sequence.forEach((note, i) => {
        setTimeout(() => piano.flashDemo(note), 400 + i * DEMO_GAP);
      });

      const showTime = 400 + sequence.length * DEMO_GAP + 1200;
      setTimeout(() => {
        ui.hideSequence();
        ui.setInstruction("Play it back!");
        ui.setSub(`${sequence.length} notes — good luck`);
        phase = "input";
        playerIndex = 0;
        piano.setEnabled(true);
      }, showTime);
    }

    let playerIndex = 0;

    function growSequence() {
      const pool = AudioEngine.ALL_NOTES.filter((n) => !sequence.includes(n));
      const next = pool.length ? pool[Math.floor(Math.random() * pool.length)] : randomNote();
      sequence.push(next);
    }

    function onKey(noteId) {
      if (phase !== "input") return;
      const expected = sequence[playerIndex];

      if (noteId !== expected) {
        roundPerfect = false;
        rewards.onWrong();
        AudioEngine.playWrong();
        ui.feedbackWrong(
          `That was ${AudioEngine.displayName(noteId)}, not ${AudioEngine.displayName(expected)}.`
        );
        piano.highlightWrong(noteId);
        piano.highlightCorrect(expected);
        piano.setEnabled(false);
        setTimeout(() => {
          sequence = shuffleNotes(AudioEngine.ALL_NOTES).slice(0, 3);
          playerIndex = 0;
          roundPerfect = true;
          ui.clearFeedback();
          showThenHide();
        }, 1800);
        return;
      }

      playerIndex++;
      if (playerIndex >= sequence.length) {
        piano.setEnabled(false);
        rewards.onCorrect(roundPerfect);
        AudioEngine.playSuccess();
        ui.feedbackCorrect();
        growSequence();
        playerIndex = 0;
        roundPerfect = true;
        setTimeout(showThenHide, 1200);
      }
    }

    return { id: "memory", start, onKey, stop: () => { phase = "idle"; } };
  }

  function createChordMode(ui, piano, rewards) {
    let chord = null;
    let selected = [];
    let roundPerfect = true;

    function start() {
      chord = CHORDS[Math.floor(Math.random() * CHORDS.length)];
      selected = [];
      roundPerfect = true;
      ui.setInstruction(`Build <span class="highlight">${chord.name}</span>`);
      ui.setSub("Press the three chord tones, then check");
      ui.renderChordSlots(3, selected);
      ui.showChordSubmit(true);
      piano.setEnabled(true);
    }

    function onKey(noteId) {
      if (!chord || selected.length >= 3) return;
      if (selected.includes(noteId)) return;
      selected.push(noteId);
      ui.renderChordSlots(3, selected.map((n) => AudioEngine.displayName(n)));
    }

    function submit() {
      if (!chord || selected.length !== 3) return;
      piano.setEnabled(false);

      const expected = [...chord.notes].sort().join();
      const got = [...selected].sort().join();

      if (got === expected) {
        rewards.onCorrect(roundPerfect);
        AudioEngine.playSuccess();
        ui.feedbackCorrect();
        ui.setSub(chord.explain);
        setTimeout(start, 2200);
      } else {
        roundPerfect = false;
        rewards.onWrong();
        AudioEngine.playWrong();
        const names = chord.notes.map((n) => AudioEngine.displayName(n)).join(", ");
        ui.feedbackWrong(`Not quite. ${chord.name} needs ${names}. ${chord.explain}`);
        chord.notes.forEach((n) => piano.highlightCorrect(n));
        setTimeout(() => {
          selected = [];
          ui.clearFeedback();
          ui.renderChordSlots(3, []);
          piano.setEnabled(true);
        }, 2400);
      }
    }

    return { id: "chord", start, onKey, stop: () => {}, submit };
  }

  function createEarMode(ui, piano, rewards) {
    let target = null;
    let roundPerfect = true;

    function start() {
      roundPerfect = true;
      nextRound();
    }

    function nextRound() {
      target = randomNote();
      piano.setEnabled(false);
      ui.setInstruction("What note was played?");
      ui.setSub("Listen…");
      ui.clearFeedback();

      setTimeout(() => {
        AudioEngine.playTone(target, 0.55);
        ui.setSub("Tap the note you heard");
        piano.setEnabled(true);
      }, 500);
    }

    function onKey(noteId) {
      if (!target) return;
      piano.setEnabled(false);

      if (noteId === target) {
        rewards.onCorrect(roundPerfect);
        AudioEngine.playSuccess();
        ui.feedbackCorrect();
        setTimeout(nextRound, 900);
      } else {
        roundPerfect = false;
        rewards.onWrong();
        AudioEngine.playWrong();
        ui.feedbackWrong(
          `That was ${AudioEngine.displayName(noteId)}. Try listening carefully to the pitch.`
        );
        piano.highlightWrong(noteId);
        setTimeout(() => {
          AudioEngine.playTone(target, 0.5);
          piano.highlightCorrect(target);
          setTimeout(() => {
            ui.clearFeedback();
            piano.setEnabled(true);
          }, 1200);
        }, 400);
      }
    }

    return { id: "ear", start, onKey, stop: () => {} };
  }

  return {
    createFindMode,
    createEchoMode,
    createMemoryMode,
    createChordMode,
    createEarMode,
  };
})();

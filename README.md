# ELGC Playground

A browser-based music learning playground: play note games on a virtual piano, work through interactive Academy lessons, and explore theory tools — all with synthesized Web Audio, no plugins or build step required.

**Live repo:** [github.com/karlodelarosa/music-playground](https://github.com/karlodelarosa/music-playground)

## Quick start

Requires **Python 3** (used only for a local static server).

```bash
npm run dev
```

Open the URL printed in the terminal (starts at `http://localhost:8000` and picks the next free port if needed).

You can also serve the folder with any static file host, or open `index.html` directly — but **Web Audio needs a user gesture** to unlock; use the dev server for the best experience.

## What's inside

The app has three main areas from the home screen:

### Play — note games

Keyboard-driven challenges that award XP, build streaks, and unlock harder modes:

| Mode | Description |
|------|-------------|
| **Find The Note** | See a note name, press the matching key |
| **Echo Mode** | Listen to a sequence, then replay it as it grows |
| **Memory Mode** | Memorize a sequence, then play it back |
| **Chord Builder** | Build major and minor triads on the piano |
| **Ear Training** | Hear a note, identify it by ear |

### Academy — interactive lessons

Step-by-step tutorials (tap, listen, quiz) with XP rewards. Each lesson has four steps:

- BPM & Rhythm
- Note Names
- Chord Progressions
- Circle of Fifths
- Nashville Numbers
- Chord Structures
- Modal Scales
- Time Signatures
- Intervals

### Tools — theory labs

Standalone explorers you can use without starting a game:

| Tool | What it does |
|------|----------------|
| **Circle of Fifths** | Interactive wheel — key signature, relative minor, scale, diatonic chords |
| **Chord Progressions** | Diatonic 1–7 chart per key plus classic progression presets |
| **Chord Structures** | Triads through extended chords (9ths, 11ths, 13ths) with audio |
| **Nashville Practice** | Find chord degrees in any key (grid or piano) |
| **BPM Metronome** | Tempo slider, tap tempo, quarter or eighth clicks, presets |
| **Modal Scales** | Hear Dorian, Lydian, Phrygian, and the other modes on one root |
| **Time Signatures** | 4/4 through odd meters with pattern clicks |
| **Intervals** | Hear and compare distances from minor 3rd to tritone |

## Global features

- **Virtual piano** — toggle from the header; two octaves, highlights for lessons and games
- **Instruments** — Grand, Bright, Electric Piano, Organ, Nylon Guitar, Steel Guitar, Synth Lead, Synth Pad (Web Audio synthesis)
- **Light / dark theme** — persisted in `localStorage`
- **Progress** — XP, level, streak, session score, and high score in the top bar
- **Unlocks** — modes and Academy lessons open as you earn XP (e.g. Memory & Chord at 100 XP, Ear Training at 250 XP)

Progress is saved locally under the key `musicQuest_v2` (migrates from `musicQuest_v1` if present).

## Project structure

```
index.html          App shell, screens, header stats
css/
  styles.css        Layout, piano, games, theme
  academy.css       Tutorial / lesson UI
  tools.css         Tool screens (circle, metronome, etc.)
  settings.css      Instrument picker panel
js/
  app.js            Routing, menus, XP, game loop
  modes.js          Play mode logic
  tutorials.js      Academy lessons
  tools.js          Theory tools
  music-theory.js   Scales, chords, keys, intervals
  piano.js          Keyboard rendering & input
  piano-panel.js    Collapsible piano footer
  audio.js          Web Audio engine
  instruments.js    Synth presets
  settings.js       Sound settings UI
  storage.js        localStorage progress
  theme.js          Light/dark toggle
dev.sh              Local Python HTTP server
package.json        `npm run dev` → dev.sh
```

## Tech notes

- **Vanilla JavaScript** — no framework, no bundler; scripts load in order from `index.html`
- **Web Audio API** — all sounds are synthesized in the browser
- **Fonts** — Plus Jakarta Sans via Google Fonts
- **Privacy** — no backend; all data stays in the browser

## Browser support

Works in modern Chromium, Firefox, and Safari. Audio starts after the first click or key press (browser autoplay policy).

## License

Private project (`package.json` marks `"private": true`). Add a license file if you plan to open-source it.

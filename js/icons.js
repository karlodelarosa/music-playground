/**
 * Inline SVG icon set (Lucide, ISC license) — no emoji, no network calls.
 */
const Icons = (() => {
  const PATHS = {
    "brain": "<path d=\"M12 18V5\" /><path d=\"M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4\" /><path d=\"M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5\" /><path d=\"M17.997 5.125a4 4 0 0 1 2.526 5.77\" /><path d=\"M18 18a4 4 0 0 0 2-7.464\" /><path d=\"M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517\" /><path d=\"M6 18a4 4 0 0 1-2-7.464\" /><path d=\"M6.003 5.125a4 4 0 0 0-2.526 5.77\" />",
    "check": "<path d=\"M20 6 9 17l-5-5\" />",
    "chevron-left": "<path d=\"m15 18-6-6 6-6\" />",
    "circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" />",
    "cloud": "<path d=\"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z\" />",
    "drama": "<path d=\"M10 11h.01\" /><path d=\"M14 6h.01\" /><path d=\"M18 6h.01\" /><path d=\"M6.5 13.1h.01\" /><path d=\"M22 5c0 9-4 12-6 12s-6-3-6-12c0-2 2-3 6-3s6 1 6 3\" /><path d=\"M17.4 9.9c-.8.8-2 .8-2.8 0\" /><path d=\"M10.1 7.1C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6 4.5 7.8 9.5 8.4 11.2 7.4.9-.5 1.9-2.1 1.9-4.7\" /><path d=\"M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4\" />",
    "ear": "<path d=\"M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0\" /><path d=\"M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4\" />",
    "flame": "<path d=\"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4\" />",
    "grid-3x3": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" /><path d=\"M3 9h18\" /><path d=\"M3 15h18\" /><path d=\"M9 3v18\" /><path d=\"M15 3v18\" />",
    "guitar": "<path d=\"m11.9 12.1 4.514-4.514\" /><path d=\"M20.1 2.3a1 1 0 0 0-1.4 0l-1.114 1.114A2 2 0 0 0 17 4.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 17.828 7h1.344a2 2 0 0 0 1.414-.586L21.7 5.3a1 1 0 0 0 0-1.4z\" /><path d=\"m6 16 2 2\" /><path d=\"M8.23 9.85A3 3 0 0 1 11 8a5 5 0 0 1 5 5 3 3 0 0 1-1.85 2.77l-.92.38A2 2 0 0 0 12 18a4 4 0 0 1-4 4 6 6 0 0 1-6-6 4 4 0 0 1 4-4 2 2 0 0 0 1.85-1.23z\" />",
    "hash": "<line x1=\"4\" x2=\"20\" y1=\"9\" y2=\"9\" /><line x1=\"4\" x2=\"20\" y1=\"15\" y2=\"15\" /><line x1=\"10\" x2=\"8\" y1=\"3\" y2=\"21\" /><line x1=\"16\" x2=\"14\" y1=\"3\" y2=\"21\" />",
    "moon": "<path d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\" />",
    "music-4": "<path d=\"M9 18V5l12-2v13\" /><path d=\"m9 9 12-2\" /><circle cx=\"6\" cy=\"18\" r=\"3\" /><circle cx=\"18\" cy=\"16\" r=\"3\" />",
    "music": "<path d=\"M9 18V5l12-2v13\" /><circle cx=\"6\" cy=\"18\" r=\"3\" /><circle cx=\"18\" cy=\"16\" r=\"3\" />",
    "piano": "<path d=\"M18.5 8c-1.4 0-2.6-.8-3.2-2A6.87 6.87 0 0 0 2 9v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8.5C22 9.6 20.4 8 18.5 8\" /><path d=\"M2 14h20\" /><path d=\"M6 14v4\" /><path d=\"M10 14v4\" /><path d=\"M14 14v4\" /><path d=\"M18 14v4\" />",
    "play": "<path d=\"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z\" />",
    "repeat": "<path d=\"m17 2 4 4-4 4\" /><path d=\"M3 11v-1a4 4 0 0 1 4-4h14\" /><path d=\"m7 22-4-4 4-4\" /><path d=\"M21 13v1a4 4 0 0 1-4 4H3\" />",
    "ruler": "<path d=\"M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z\" /><path d=\"m14.5 12.5 2-2\" /><path d=\"m11.5 9.5 2-2\" /><path d=\"m8.5 6.5 2-2\" /><path d=\"m17.5 15.5 2-2\" />",
    "sliders-horizontal": "<path d=\"M10 5H3\" /><path d=\"M12 19H3\" /><path d=\"M14 3v4\" /><path d=\"M16 17v4\" /><path d=\"M21 12h-9\" /><path d=\"M21 19h-5\" /><path d=\"M21 5h-7\" /><path d=\"M8 10v4\" /><path d=\"M8 12H3\" />",
    "sliders-vertical": "<path d=\"M10 8h4\" /><path d=\"M12 21v-9\" /><path d=\"M12 8V3\" /><path d=\"M17 16h4\" /><path d=\"M19 12V3\" /><path d=\"M19 21v-5\" /><path d=\"M3 14h4\" /><path d=\"M5 10V3\" /><path d=\"M5 21v-7\" />",
    "sparkles": "<path d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\" /><path d=\"M20 2v4\" /><path d=\"M22 4h-4\" /><circle cx=\"4\" cy=\"20\" r=\"2\" />",
    "square": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" />",
    "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\" /><path d=\"M12 2v2\" /><path d=\"M12 20v2\" /><path d=\"m4.93 4.93 1.41 1.41\" /><path d=\"m17.66 17.66 1.41 1.41\" /><path d=\"M2 12h2\" /><path d=\"M20 12h2\" /><path d=\"m6.34 17.66-1.41 1.41\" /><path d=\"m19.07 4.93-1.41 1.41\" />",
    "target": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><circle cx=\"12\" cy=\"12\" r=\"6\" /><circle cx=\"12\" cy=\"12\" r=\"2\" />",
    "timer": "<line x1=\"10\" x2=\"14\" y1=\"2\" y2=\"2\" /><line x1=\"12\" x2=\"15\" y1=\"14\" y2=\"11\" /><circle cx=\"12\" cy=\"14\" r=\"8\" />",
    "volume-2": "<path d=\"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z\" /><path d=\"M16 9a5 5 0 0 1 0 6\" /><path d=\"M19.364 18.364a9 9 0 0 0 0-12.728\" />",
    "wind": "<path d=\"M12.8 19.6A2 2 0 1 0 14 16H2\" /><path d=\"M17.5 8a2.5 2.5 0 1 1 2 4H2\" /><path d=\"M9.8 4.4A2 2 0 1 1 11 8H2\" />",
    "x": "<path d=\"M18 6 6 18\" /><path d=\"m6 6 12 12\" />",
  };

  /** Returns inline SVG markup for a named icon. */
  function svg(name, opts = {}) {
    const size = opts.size ?? 20;
    const strokeWidth = opts.strokeWidth ?? 2;
    const className = opts.className ? ` icon-${opts.className}` : "";
    const inner = PATHS[name];
    if (!inner) return "";
    return `<svg class="icon icon-${name}${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  }

  return { svg };
})();

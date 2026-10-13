/* ============================================================
   Geo Drone — performance diagnostics (only with ?perf=1)

   Loaded by a one-line guard in index.html's <head>, before any of
   the mission's own scripts, so it sees every frame from the first.
   Without ?perf=1 this file is never fetched and nothing here runs.

   It records, while the game is played normally:
     · every frame's interval, per screen (which screen is showing)
     · every long animation frame (>50 ms) with the scripts that ran
       in it -- including extension content scripts, whose sources
       start chrome-extension:// -- and how much of it was forced
       style/layout
     · every interaction slower than 100 ms, split into input delay,
       handler time and the time to the next paint
     · the browser it ran in (DPR, viewport, cores, UA)

   A small readout sits in the top-right corner. Press P to save the
   whole record as geo-perf-<time>.json.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var t0 = performance.now();
  var R = {
    started: new Date().toISOString(),
    env: {
      ua: navigator.userAgent,
      dpr: global.devicePixelRatio,
      viewport: [global.innerWidth, global.innerHeight],
      cores: navigator.hardwareConcurrency || null,
      memoryGB: navigator.deviceMemory || null
    },
    screens: {},       // screen → { frames, over33, over50, worst, ms }
    longFrames: [],    // LoAF entries, with script attribution
    slowTaps: [],      // Event Timing entries ≥ 100 ms
    timeline: []       // [t, screen] each time the screen changes
  };

  function screenName() {
    var s = doc.querySelector && doc.querySelector('.screen.is-active');
    if (!s) return '(start)';
    var label = doc.getElementById('jumpLabel');
    return (s.id || s.className.split(' ')[1] || 'screen') +
           (label && label.textContent ? ' · ' + label.textContent.trim() : '');
  }

  var current = '(start)';
  function bucket(name) {
    return R.screens[name] || (R.screens[name] = { frames: 0, over33: 0, over50: 0, worst: 0, ms: 0 });
  }

  /* ---------- frames ---------- */
  var last = 0, recent = [];
  function frame(t) {
    if (last) {
      var d = t - last;
      var name = screenName();
      if (name !== current) { current = name; R.timeline.push([Math.round(t - t0), name]); }
      var b = bucket(name);
      b.frames++; b.ms += d;
      if (d > 33) b.over33++;
      if (d > 50) b.over50++;
      if (d > b.worst) b.worst = Math.round(d);
      recent.push([t, d]);
      while (recent.length && t - recent[0][0] > 5000) recent.shift();
    }
    last = t;
    global.requestAnimationFrame(frame);
  }
  global.requestAnimationFrame(frame);

  /* ---------- long animation frames ---------- */
  try {
    new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (e) {
        R.longFrames.push({
          at: Math.round(e.startTime - t0),
          screen: current,
          ms: Math.round(e.duration),
          blockingMs: Math.round(e.blockingDuration || 0),
          styleLayoutMs: e.styleAndLayoutStart ? Math.round(e.startTime + e.duration - e.styleAndLayoutStart) : 0,
          scripts: (e.scripts || []).map(function (s) {
            return {
              ms: Math.round(s.duration),
              forcedStyleLayoutMs: Math.round(s.forcedStyleAndLayoutDuration || 0),
              source: (s.sourceURL || '') + (s.sourceCharPosition >= 0 ? ':' + s.sourceCharPosition : ''),
              fn: s.sourceFunctionName || '',
              invoker: s.invoker || ''
            };
          })
        });
        if (R.longFrames.length > 400) R.longFrames.shift();
      });
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch (e) { R.env.noLongFrames = String(e); }

  /* ---------- slow interactions ---------- */
  try {
    new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (e) {
        if (!e.interactionId) return;
        var tg = e.target;
        R.slowTaps.push({
          at: Math.round(e.startTime - t0),
          screen: current,
          type: e.name,
          ms: Math.round(e.duration),
          inputDelayMs: Math.round(e.processingStart - e.startTime),
          handlersMs: Math.round(e.processingEnd - e.processingStart),
          toPaintMs: Math.round(e.startTime + e.duration - e.processingEnd),
          target: tg ? (tg.id || (tg.getAttribute && tg.getAttribute('class')) || tg.tagName || '').slice(0, 60) : ''
        });
        if (R.slowTaps.length > 400) R.slowTaps.shift();
      });
    }).observe({ type: 'event', durationThreshold: 104, buffered: true });
  } catch (e) { R.env.noEventTiming = String(e); }

  /* ---------- readout ---------- */
  var hud;
  function draw() {
    if (!hud && doc.body) {
      hud = doc.createElement('div');
      hud.setAttribute('aria-hidden', 'true');
      hud.style.cssText = 'position:fixed;top:6px;right:6px;z-index:2147483647;pointer-events:none;' +
        'font:11px/1.35 ui-monospace,Menlo,monospace;color:#e8fbff;background:rgba(3,10,20,.72);' +
        'padding:6px 8px;border-radius:6px;white-space:pre';
      doc.body.appendChild(hud);
    }
    if (hud) {
      var n = recent.length, sum = 0, worst = 0, slow = 0;
      recent.forEach(function (r) { sum += r[1]; if (r[1] > worst) worst = r[1]; if (r[1] > 33) slow++; });
      hud.textContent =
        'fps ' + (n ? (1000 * n / sum).toFixed(0) : '–') + '   worst ' + worst.toFixed(0) + 'ms   >33ms ' + slow + '  (5 s)\n' +
        'long frames ' + R.longFrames.length + '   slow taps ' + R.slowTaps.length + '\n' +
        current.slice(0, 48) + '\n' +
        'P = save report';
    }
    global.setTimeout(draw, 500);
  }
  draw();

  /* ---------- the report ---------- */
  function save() {
    R.savedAfterSeconds = Math.round((performance.now() - t0) / 1000);
    Object.keys(R.screens).forEach(function (k) {
      var b = R.screens[k];
      b.avgFps = b.ms ? Math.round(1000 * b.frames / b.ms) : null;
    });
    var blob = new Blob([JSON.stringify(R, null, 1)], { type: 'application/json' });
    var a = doc.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'geo-perf-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    doc.body.appendChild(a);
    a.click();
    a.remove();
  }
  global.addEventListener('keydown', function (e) {
    if ((e.key === 'p' || e.key === 'P') && !e.repeat && !/^(INPUT|TEXTAREA)$/.test((e.target || {}).tagName || '')) save();
  });

  global.GeoPerf = { report: function () { return R; }, save: save };
})(window);

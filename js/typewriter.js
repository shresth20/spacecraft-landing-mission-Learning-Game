/* ============================================================
   Geo Drone — typewriter

   The game's lines arrive the way the lesson screens' do
   (js/learn.js, typePieces): word by word, each word easing in
   where it already sits, a sentence at a time.

   How a line goes up
     · it is cut after every "," "!" "." that has more words
       after it, and the pieces are shown one after another in
       the same box, each replacing the last
     · a piece is laid out whole, a span per word, and the words
       are shown one after another — each fades up and sharpens
       (css/style.css, .wd) — paced per character, so a long word
       holds the line a little longer
     · with a voice, a piece's last word lands at 82% of its share
       of the clip, and the next piece waits until the narrator
       has reached it; without one, the lesson's own reading rate

   Layout: a hidden copy of the longest piece reserves the box,
   and the live piece sits on top of it, so neither the words nor
   the bar move as the line arrives.
   ============================================================ */

(function (global) {
  'use strict';

  /* the lesson's own figures (js/learn.js) */
  var PACE = 1.25;            // the lesson's slow-down of every untimed wait
  var TYPE_MS = 72;           // per character without a voice, before PACE
  var CHUNK_READ_MS = 700;    // between pieces without a voice, before PACE
  var WORD_IN_MS = 200;       // the last word finishing, before PACE
  var LAND_AT = 0.82;         // a piece's last word, as a share of its clip
  var META_WAIT = 1200;       // how long to wait for loadedmetadata

  var doc = global.document;

  function wait(ms) {
    return global.GeoLife
      ? global.GeoLife.wait(ms)
      : new Promise(function (r) { setTimeout(r, ms); });
  }

  /* ---------------------------------------------------------- target
     One typewriter per host element. The box and its two layers
     are built once and reused. */
  function mount(host) {
    if (host.__tw) return host.__tw;

    host.textContent = '';

    var box = doc.createElement('span');
    box.className = 'tw__box';

    var ghost = doc.createElement('span');
    ghost.className = 'tw__ghost';
    ghost.setAttribute('aria-hidden', 'true');

    var line = doc.createElement('span');
    line.className = 'tw__line';

    box.appendChild(ghost);
    box.appendChild(line);
    host.appendChild(box);

    host.__tw = { host: host, ghost: ghost, line: line, token: 0 };
    return host.__tw;
  }

  /* ---------------------------------------------------------- word by word */
  function wordCuts(text) {
    var cuts = [];
    var re = /\S+\s*/g;
    var m;
    while ((m = re.exec(text)) !== null) cuts.push(m.index + m[0].length);
    if (!cuts.length || cuts[cuts.length - 1] !== text.length) cuts.push(text.length);
    return cuts;
  }

  /* A line laid out whole, a span per word. */
  function wordSpans(root, text) {
    root.textContent = '';
    var words = [];
    var from = 0;
    wordCuts(text).forEach(function (cut) {
      var sp = doc.createElement('span');
      sp.className = 'wd';
      sp.textContent = text.slice(from, cut);
      root.appendChild(sp);
      words.push({ el: sp, cut: cut });
      from = cut;
    });
    return words;
  }

  /* ---------------------------------------------------------- a sentence at a time */
  var CHUNK_ABBR = /(?:^|[\s(])(?:sq|e\.g|i\.e|etc|vs|approx)\.$/i;
  function chunkCuts(text) {
    var cuts = [];
    var re = /[,!.?]+['’"”)]*\s+(?=\S)/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      var mark = text.slice(0, m.index + 1);
      if (m[0][0] === '.' && CHUNK_ABBR.test(mark)) continue;
      var from = cuts.length ? cuts[cuts.length - 1] : 0;
      /* "Great, ..." — a comma after a single word does not cut */
      if (m[0][0] === ',' && !/\s/.test(text.slice(from, m.index).trim())) continue;
      cuts.push(m.index + m[0].length);
    }
    return cuts;
  }

  /* The pieces of a line, each with its share of the whole (`len`,
     untrimmed) and its text, trimmed and opening on a capital. */
  function chunks(text) {
    var cuts = chunkCuts(text).concat(text.length);
    var out = [];
    var from = 0;
    cuts.forEach(function (to) {
      var raw = text.slice(from, to);
      var t = raw.trim().replace(/^[a-z](?=[a-z’'])/, function (c) { return c.toUpperCase(); });
      if (t) out.push({ t: t, len: raw.length });
      from = to;
    });
    return out;
  }

  /* ---------------------------------------------------------- the clock */
  function known(el) {
    return el && isFinite(el.duration) && el.duration > 0.5;
  }

  function playing(a) { return a && !a.paused && !a.ended; }

  /* The voice was cut off or ran out. A tab-hidden pause is NOT a
     cut — lifecycle.js parked the element and will start it again. */
  function stopped(a) {
    var parked = global.GeoLife && global.GeoLife.isPaused();
    return a.ended || (a.paused && !parked);
  }

  /* The element is usually handed over before its metadata has
     arrived; give it a moment before deciding we have no clock. */
  function settleDuration(el) {
    if (!el || known(el)) return Promise.resolve(el);

    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        el.removeEventListener('loadedmetadata', finish);
        el.removeEventListener('durationchange', finish);
        resolve(el);
      }
      el.addEventListener('loadedmetadata', finish);
      el.addEventListener('durationchange', finish);
      wait(META_WAIT).then(finish);
    });
  }

  /* Wait for the narrator to reach `frac` of the way through the line. */
  function voiceAt(a, frac, alive) {
    if (!a || stopped(a)) return wait(CHUNK_READ_MS * PACE);
    var at = a.duration * frac - 0.08;
    var start = performance.now();
    function poll() {
      if (!alive() || stopped(a) || a.currentTime >= at) return Promise.resolve();
      if (performance.now() - start > 15000) return Promise.resolve();
      return wait(40).then(poll);
    }
    return poll();
  }

  /* ---------------------------------------------------------- typing */
  /* `opts.audio`  element to clock off (optional)
     `opts.hold`   ms to keep the line marked as typing after its
                   last word
     Resolves when the whole line has been shown. Starting a new
     line on the same host cancels whatever was still arriving. */
  function type(host, text, opts) {
    opts = opts || {};
    if (!host) return Promise.resolve();

    var t = mount(host);
    var mine = ++t.token;
    var alive = function () { return mine === t.token; };
    var full = String(text == null ? '' : text);
    var pieces = chunks(full);

    t.line.textContent = '';
    wordSpans(t.ghost, pieces.reduce(function (a, b) { return b.t.length > a.length ? b.t : a; }, ''));
    host.classList.add('is-typing');

    if (!pieces.length) {
      host.classList.remove('is-typing');
      return Promise.resolve();
    }

    var total = Math.max(1, pieces.reduce(function (n, ch) { return n + ch.len; }, 0));

    return settleDuration(opts.audio).then(function (audio) {
      if (!alive()) return;
      var a = known(audio) ? audio : null;
      var done = 0;
      var k = 0;

      function piece() {
        if (k >= pieces.length) return wait(WORD_IN_MS * PACE);
        var ch = pieces[k];
        var gap = k > 0 ? voiceAt(a, done / total, alive) : Promise.resolve();

        return gap.then(function () {
          if (!alive()) return;

          var pace = TYPE_MS * PACE;
          if (playing(a)) {
            var target = a.duration * (done + ch.len * LAND_AT) / total;
            pace = Math.max(6, (target - a.currentTime) * 1000 / Math.max(1, ch.t.length));
          }

          var words = wordSpans(t.line, ch.t);
          var due = performance.now();
          var from = 0;
          var i = 0;

          /* each word when its first character would have been typed */
          function word() {
            if (!alive()) return;
            if (i >= words.length) {
              var tail = due + from * pace - performance.now();
              return wait(Math.max(0, tail));
            }
            var left = due + from * pace - performance.now();
            return (left > 0 ? wait(left) : Promise.resolve()).then(function () {
              if (!alive()) return;
              words[i].el.classList.add('in');
              from = words[i].cut;
              i++;
              return word();
            });
          }

          return word().then(function () {
            done += ch.len;
            k++;
            if (alive()) return piece();
          });
        });
      }

      return piece().then(function () {
        if (!alive()) return;
        if (!opts.hold) {
          host.classList.remove('is-typing');
          return;
        }
        return wait(opts.hold).then(function () {
          if (alive()) host.classList.remove('is-typing');
        });
      });
    });
  }

  /* Drop the line. */
  function clear(host) {
    if (!host) return;
    var t = mount(host);
    t.token++;
    t.ghost.textContent = '';
    t.line.textContent = '';
    host.classList.remove('is-typing');
  }

  /* Put the whole line up at once — used on a skip and under
     prefers-reduced-motion. */
  function set(host, text) {
    if (!host) return;
    var t = mount(host);
    t.token++;
    var full = String(text == null ? '' : text);
    t.ghost.textContent = full;
    t.line.textContent = full;
    host.classList.remove('is-typing');
  }

  global.GeoType = { type: type, clear: clear, set: set };
})(window);

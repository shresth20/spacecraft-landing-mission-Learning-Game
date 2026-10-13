/* ============================================================
   Geo Drone — the lesson (screen 3)

   The warm-up and the triangle lesson, brought over from the
   learning module and played on the mission's third screen:

     page 2  the three shapes draw themselves on the board and
             Swiftee jumps up to name them: "Here are a few common
             shapes." Round 1: "Drag each name to the matching
             shape." -- three names, three slots; a right drop is
             chimed and burst, a wrong one buzzed and shaken. Round
             2: "Great! Now let's recall their area formulas." --
             the same for three formulas, and it coaches: one wrong
             drop names the sides of every shape, a second concedes
             and flies the formulas home. All three home: "Well
             Done!", confetti, Next
     page 3  the warm-up clears, one triangle draws itself in the
             middle of the empty board; "Triangles can look
             different. But their area depends on the base and
             height." It slides aside and two more kinds join it;
             "Let's observe their base and height." -- dotted base
             and height lines grow onto all three, the formula types
             itself out and lights each word's lines, and Next

   What the mission sees of it is four calls (GeoLearn at the
   bottom): init() once at boot, assets() for the start gate to
   fetch, reset() to put the board back to its opening state, and
   run(), which plays both pages and resolves when the last Next is
   pressed -- or with false if the mission took the screen away.

   ── what was kept, and what was not ──

   The choreography, the typewriters, Swiftee and the drag-and-drop
   are the module's own code, line for line where it mattered. What
   is gone is the rest of the mission that module carried (twenty
   pages of quadrilaterals). The chrome it had for moving about in
   it -- the section menu, Back, Skip, Sound and Replay -- is the
   mission's now (SCENE TOOLS in js/script.js), one set for every
   screen; it reaches the lesson through skip(), run({ page }) and
   setMuted() at the bottom, and hears where the lesson is through
   the onPage hook init() takes.

   Two things the module did to the whole document are done to this
   screen alone: its pace (PACE below) stretched every Web Animation
   and CSS transition on the page, and here it reaches only what is
   made or styled inside .screen--learn, so the mission's own camera
   is not slowed by a lesson it is not showing.

   Words: every line is a KEY into locales/locales.json (T), and its
   clip is named by the locale's voice pack under the same key.
   ============================================================ */

(function (global) {
  'use strict';

  var doc = document;
  var Motion = global.Motion;

  /* the one lookup */
  var T = function (key, repl) { return global.I18n ? global.I18n.t(key, repl) : String(key); };

  /* ---------- the mission's clock ----------
   * The mission freezes every timer and animation while the tab is
   * hidden (js/lifecycle.js); so does the lesson, by taking its
   * waits from the same place. */
  function lifeWait(ms) {
    return global.GeoLife ? global.GeoLife.wait(ms)
                          : new Promise(function (r) { setTimeout(r, ms); });
  }

  /* the section, and everything in it -- looked up in init() */
  var screen = null;
  var el = {};
  var inited = false;

  /* ---------- pacing ----------
   * Every beat of a page is paced through wait(), which is what makes
   * Skip possible: while a skip is running each wait collapses to a
   * single turn of the event loop, so a page plays its whole
   * choreography out in a handful of frames and lands in exactly the
   * state it would have reached anyway. */
  var fastForward = false;

  /* A teardown (the mission leaving the screen, or coming back to it)
     has to genuinely stop the page in play. Every wait belongs to the
     page that started it, and rejects with CANCELLED once that page
     has been retired, which unwinds the whole await chain. */
  var CANCELLED = { cancelled: 'scene replaced' };
  var runToken = 0;

  /* One dial for how fast the board changes. Every beat (wait), every
     Web Animation and every CSS transition or keyframe animation on
     the board is stretched by it, together, so the choreography keeps
     its shape and simply breathes more. The voice-over is the one
     clock it does not touch. */
  var PACE = 1.25;

  var waitFor = function (scale) {
    return function (ms) {
      return new Promise(function (resolve, reject) {
        var mine = runToken;
        lifeWait(fastForward ? 0 : ms * scale).then(function () {
          if (mine !== runToken) return reject(CANCELLED);
          resolve();
        });
      });
    };
  };
  var wait    = waitFor(PACE);
  var waitRaw = waitFor(1);         /* a wait measured against the voice */

  /* the board's own Web Animations, at the board's pace */
  function animate(node, keyframes, opts) {
    if (typeof opts === 'number') opts = opts * PACE;
    else if (opts && typeof opts === 'object') {
      opts = Object.assign({}, opts);
      ['duration', 'delay', 'endDelay'].forEach(function (k) {
        if (typeof opts[k] === 'number') opts[k] *= PACE;
      });
    }
    return node.animate(keyframes, opts);
  }

  /* ...and the stylesheet's, for anything inside this screen only */
  function paceCss(e) {
    var node = e.target;
    if (!node || !node.getAnimations || !node.closest || !node.closest('.screen--learn')) return;
    node.getAnimations().forEach(function (a) {
      if (a.playbackRate !== 1 || !(a.transitionProperty || a.animationName)) return;
      a.playbackRate = 1 / PACE;
    });
  }

  /* A retired page unwinds through whatever await chain it was in, and
     some of those chains are deliberately awaited by nobody. Their
     rejection has nowhere to go, so it is swallowed here. */
  global.addEventListener('unhandledrejection', function (e) {
    if (e.reason === CANCELLED) e.preventDefault();
  });
  var REDUCED = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- the two answers ---------- */
  var markRight = function (node, part) { node.classList.add('correct'); Motion.correct(part || node); };
  var markWrong = function (node, part) { node.classList.add('reject');  Motion.incorrect(part || node); };

  /* A motion.js timeline, waited on the way every other beat is
     waited on, so a teardown throws CANCELLED through it. */
  var played = function (tl) { return wait(tl ? tl.totalDuration() * 1000 : 0); };

  /* How a chip or a slot arrives, from the catalog; and the same taken
     slowly, so the learner sees the places to fill come up one by one
     before the names that fill them. */
  var CARD_IN = { from: { opacity: 0, y: 12, scale: .98 }, duration: Motion.NORMAL, stagger: Motion.STAGGER_UI };
  var ROUND_IN = { from: CARD_IN.from, duration: 0.5, stagger: 0.32 };
  var SLOTS_TO_CHIPS = 550;

  async function revealGroup(els, opts) {
    if (!els.length) return;
    els.forEach(function (n) { n.classList.add('revealing', 'reveal'); });
    await played(Motion.enter(els, opts));
    els.forEach(function (n) { n.classList.remove('revealing'); });
  }

  /* ---------- the copy a drag carries ---------- */
  var GHOST_LIFT = 1.03;
  var ghostTransform = function (dx, dy) {
    return 'translate3d(' + dx + 'px, ' + dy + 'px, 0) scale(' + GHOST_LIFT + ')';
  };

  function flattenGhost(ghost) {
    ghost.classList.remove('is-3d');
    ghost.style.removeProperty('--edge');
    ghost.style.removeProperty('--sink');
    return ghost;
  }

  /* Where a copy in the air is parked: the screen's own effects layer, so
     it is still under .screen--learn and keeps the chip's look (its palette,
     face and pill are all scoped to the screen; a copy on the body is a bare
     grey <button>). That layer is fixed inside the transformed screen, so
     its box -- not the viewport -- is the origin a copy's left/top are
     measured from. */
  function ghostHome() { return el.fx || doc.body; }
  function ghostOrigin() {
    if (!el.fx) return { x: 0, y: 0 };
    var r = el.fx.getBoundingClientRect();
    return { x: r.left, y: r.top };
  }

  function liftGhost(chip, e, z) {
    var rect = chip.getBoundingClientRect();
    var o = ghostOrigin();
    var ghost = flattenGhost(chip.cloneNode(true));
    ghost.classList.add('learn-ghost');
    ghost.disabled = true;
    Object.assign(ghost.style, {
      position: 'fixed',
      left: (rect.left - o.x) + 'px',
      top: (rect.top - o.y) + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      margin: 0,
      pointerEvents: 'none',
      zIndex: z || 999,
      transform: ghostTransform(0, 0),
      willChange: 'transform'
    });
    ghost.classList.add('mo-lifted');
    ghostHome().appendChild(ghost);
    return {
      el: chip, ghost: ghost, box: rect,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      start: { x: e.clientX, y: e.clientY }
    };
  }

  var moveGhost = function (d, x, y) {
    d.ghost.style.transform = ghostTransform(x - d.offsetX - d.box.left,
                                             y - d.offsetY - d.box.top);
  };

  function dropGhost(d, slot, done) {
    var g = d.ghost;
    var to = slot ? slot.getBoundingClientRect() : null;
    var dx = to ? to.left + (to.width  - d.box.width)  / 2 - d.box.left : 0;
    var dy = to ? to.top  + (to.height - d.box.height) / 2 - d.box.top  : 0;
    var landed = false;
    var land = function () {
      if (landed) return;
      landed = true;
      g.style.willChange = '';
      g.remove();
      if (done) done();
    };
    var tl = Motion.liftEnd(g, slot ? { x: dx, y: dy } : null);
    if (tl) tl.eventCallback('onComplete', land); else land();
    return land;
  }

  /* ---------- the half ---------- */
  var FRAC_HALF = '<span class="frac"><span class="num">1</span><span class="den">2</span></span>';
  var escHTML = function (str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var fracHTML = function (str) { return escHTML(str).split('½').join(FRAC_HALF); };
  function setTxt(node, text) {
    if (text.indexOf('½') < 0) node.textContent = text;
    else node.innerHTML = fracHTML(text);
  }

  /* ---------- word by word ---------- */
  function wordCuts(text) {
    var cuts = [];
    var re = /\S+\s*/g;
    var m;
    while ((m = re.exec(text)) !== null) cuts.push(m.index + m[0].length);
    if (!cuts.length || cuts[cuts.length - 1] !== text.length) cuts.push(text.length);
    return cuts;
  }

  var WORD_IN_MS = 200;
  /* A line laid out whole from its segments: a span per segment
     (classed for its highlight) holding a span per word. */
  function lineSpans(root, segs) {
    root.textContent = '';
    var tokens = [];
    segs.forEach(function (seg, i) {
      var from = 0;
      wordCuts(seg.t).forEach(function (cut) {
        tokens.push({ i: i, text: seg.t.slice(from, cut), cut: cut });
        from = cut;
      });
    });
    var parts = segs.map(function (seg) { return { seg: seg, els: [], words: [] }; });
    var segEl = null, segAt = -1;
    tokens.forEach(function (tok) {
      if (tok.i !== segAt || !segEl) {
        segEl = doc.createElement('span');
        if (segs[tok.i].w) segEl.className = 'w w-' + segs[tok.i].w;
        root.appendChild(segEl);
        parts[tok.i].els.push(segEl);
        segAt = tok.i;
      }
      var sp = doc.createElement('span');
      sp.className = 'wd';
      sp.dataset.t = tok.text;
      setTxt(sp, tok.text);
      segEl.appendChild(sp);
      parts[tok.i].words.push({ el: sp, cut: tok.cut });
    });
    return parts;
  }
  var wordSpans = function (node, text) { return lineSpans(node, [{ t: text }])[0].words; };

  /* show the words from `due`, each when its first character would have
     been typed; `alive` may say the line has been taken over */
  async function revealWords(words, due, perChar, alive, voiced) {
    if (!voiced) perChar *= PACE;
    var from = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (alive && !alive()) return due;
      var left = due + from * perChar - performance.now();
      if (left > 0) await waitRaw(left);
      w.el.classList.add('in');
      from = w.cut;
    }
    return due + from * perChar;
  }
  var wordsSettle = function () { return wait(REDUCED ? 0 : WORD_IN_MS); };

  /* ---------- a sentence at a time ----------
   * A line is never shown whole: it is cut after every "," "!" "." that
   * has more words after it, and the pieces are shown one after another
   * in the same box, each replacing the last. The clip is still the
   * whole line, said once: a piece gives way to the next only when the
   * narrator has reached the end of it. */
  var CHUNK_ABBR = /(?:^|[\s(])(?:sq|e\.g|i\.e|etc|vs|approx)\.$/i;
  var CHUNK_READ_MS = 700;
  function chunkCuts(text) {
    var cuts = [];
    var re = /[,!.?]+['’"”)]*\s+(?=\S)/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      var mark = text.slice(0, m.index + 1);
      if (m[0][0] === '.' && CHUNK_ABBR.test(mark)) continue;
      var from = cuts.length ? cuts[cuts.length - 1] : 0;
      if (m[0][0] === ',' && !/\s/.test(text.slice(from, m.index).trim())) continue;
      cuts.push(m.index + m[0].length);
    }
    return cuts;
  }
  function segChunks(segs) {
    var whole = segs.map(function (sg) { return sg.t; }).join('');
    var cuts = chunkCuts(whole).concat(whole.length);
    var chunks = [];
    var piece = [], at = 0, c = 0;
    segs.forEach(function (seg) {
      var from = 0;
      while (c < cuts.length && cuts[c] <= at + seg.t.length) {
        var to = cuts[c] - at;
        if (to > from) piece.push({ t: seg.t.slice(from, to), w: seg.w });
        from = to;
        if (cuts[c] < whole.length) { chunks.push(piece); piece = []; }
        c++;
        if (to >= seg.t.length) break;
      }
      if (from < seg.t.length) piece.push({ t: seg.t.slice(from), w: seg.w });
      at += seg.t.length;
    });
    if (piece.length) chunks.push(piece);
    return chunks
      .map(function (ch) {
        var len = ch.reduce(function (n, sg) { return n + sg.t.length; }, 0);
        var out = ch.map(function (sg) { return { t: sg.t, w: sg.w }; });
        if (out.length) {
          out[0].t = out[0].t.replace(/^\s+/, '');
          out[out.length - 1].t = out[out.length - 1].t.replace(/\s+$/, '');
        }
        var ss = out.filter(function (sg) { return sg.t; });
        if (ss.length) ss[0].t = ss[0].t.replace(/^[a-z](?=[a-z’'])/, function (ch0) { return ch0.toUpperCase(); });
        return { segs: ss, len: len };
      })
      .filter(function (ch) { return ch.segs.length; });
  }
  var sentenceChunks = function (text) {
    return segChunks([{ t: text }]).map(function (ch) { return ch.segs[0].t; });
  };
  var longestChunk = function (text) {
    return sentenceChunks(String(text)).reduce(function (a, b) { return b.length > a.length ? b : a; }, '');
  };

  /* Wait for the narrator to reach `frac` of the way through the line. */
  function voiceAt(said, frac, readMs) {
    var a = said && said.audio;
    if (!said || !said.playing || !a) return wait(readMs == null ? CHUNK_READ_MS : readMs);
    var at = said.length * frac - 0.08;
    if (a.ended || a.paused || a.currentTime >= at) return Promise.resolve();
    return waitOrSkip(function (done) {
      var over = false;
      var end = function () {
        if (over) return;
        over = true;
        clearInterval(iv);
        clearTimeout(cap);
        a.removeEventListener('ended', end);
        a.removeEventListener('pause', end);
        done();
      };
      var iv = setInterval(function () {
        if (over || fastForward || a.ended || a.paused || a.currentTime >= at) end();
      }, 40);
      var cap = setTimeout(end, 15000);
      a.addEventListener('ended', end);
      a.addEventListener('pause', end);
    });
  }

  /* Type a line into a box a piece at a time, each piece paced so its
     last word lands a little before the narrator finishes saying it. */
  async function typePieces(txt, segs, said, perChar, pause, onWord, alive) {
    var chunks = segChunks(segs);
    var total = Math.max(1, chunks.reduce(function (n, ch) { return n + ch.len; }, 0));
    var a = said.playing && said.length > 0.5 ? said.audio : null;
    var done = 0;
    for (var k = 0; k < chunks.length; k++) {
      var ch = chunks[k];
      if (k > 0) {
        await voiceAt(said, done / total, null);
        if (alive && !alive()) return false;
      }
      var chars = Math.max(1, ch.segs.reduce(function (n, sg) { return n + sg.t.length; }, 0));
      var keys = ch.segs.filter(function (sg) { return sg.w; }).length;
      var pace = perChar * PACE, hold = pause * PACE;
      if (a && !a.paused && !a.ended) {
        var target = said.length * (done + ch.len * 0.82) / total;
        hold = pause;
        pace = Math.max(6, ((target - a.currentTime) * 1000 - pause * keys) / chars);
      }
      var parts = lineSpans(txt, ch.segs);
      var due = performance.now();
      for (var p = 0; p < parts.length; p++) {
        var part = parts[p];
        due = await revealWords(part.words, due, pace, alive, true);
        if (alive && !alive()) return false;
        if (part.seg.w) {
          var left0 = due - performance.now();
          if (left0 > 0) await waitRaw(left0);
          part.els.forEach(function (n) { n.classList.add('lit'); });
          if (onWord) onWord(part.seg.w);
          due += hold;
        }
      }
      var left = due - performance.now();
      if (left > 0) await waitRaw(left);
      done += ch.len;
    }
    await wordsSettle();
    return !alive || alive();
  }

  /* ---------- audio ----------
   * The clicks, the chime and the buzzer are the mission's own
   * (js/audio.js): one bank of sounds for the whole game. */
  var SFX = { correct: 'correct', wrong: 'wrong', confetti: 'cheer', click: 'click' };
  function sfx(key, volume) {
    if (fastForward) return;
    if (!Motion.mayPlay(key)) return;      /* off when the sound is off */
    var A = global.GeoAudio;
    if (A && SFX[key]) A.sfx(SFX[key], { volume: volume === undefined ? 1 : volume });
  }

  function durationOf(a) {
    return new Promise(function (resolve) {
      if (a.readyState >= 1 && isFinite(a.duration) && a.duration > 0) return resolve(a.duration);
      var settled = false;
      var off = function () {
        a.removeEventListener('loadedmetadata', done);
        a.removeEventListener('error', fail);
      };
      var done = function () {
        if (settled) return;
        settled = true; off();
        resolve(isFinite(a.duration) && a.duration > 0 ? a.duration : 0);
      };
      var fail = function () {
        if (settled) return;
        settled = true; off();
        resolve(0);
      };
      a.addEventListener('loadedmetadata', done);
      a.addEventListener('error', fail);
      setTimeout(fail, 4000);
      try { a.load(); } catch (e) { fail(); }
    });
  }

  /* ---------- voice-over ----------
   * Every spoken line is looked up by THE LINE ITSELF: the locale's
   * voice pack names a clip for each key, and I18n.voice(text) finds
   * the key from the words on screen. A line with no clip types at its
   * own pace, silently. The clips the start gate fetched are played
   * from memory (blob URLs handed in through adopt()). */
  var local = Object.create(null);       /* url -> blob: URL */
  var voBank = Object.create(null);
  var voNow = null;

  function voHas(text) {
    return global.I18n && global.I18n.voice ? global.I18n.voice(text) : null;
  }
  var voMissed = Object.create(null);
  function voFor(text) {
    var src = voHas(text);
    if (!src) {
      if (!voMissed[text]) {
        voMissed[text] = true;
        if (global.console && console.warn) console.warn('[learn] no clip for: ' + text);
      }
      return null;
    }
    var a = voBank[src];
    if (!a) {
      a = new Audio(local[src] || src);
      a.preload = 'auto';
      voBank[src] = a;
    }
    return a;
  }

  var VO_SILENT = { audio: null, playing: false, length: 0 };

  async function voSay(text) {
    if (fastForward || typeof text !== 'string') return VO_SILENT;
    var a = voFor(text);
    if (!a) return VO_SILENT;
    var mine = runToken;
    var length = await durationOf(a);
    if (mine !== runToken || fastForward) return VO_SILENT;

    silenceNow();
    try {
      a.currentTime = 0;
      /* silenced rather than skipped when the sound is off: the line
         keeps its length, so every beat clocked off it is the same */
      a.muted = !!(Motion.isMuted && Motion.isMuted());
      await a.play();
    } catch (e) {
      return VO_SILENT;
    }
    voNow = a;
    return { audio: a, playing: true, length: length };
  }

  /* the scene tools' Sound switch, thrown while a line is sounding */
  function setMuted(on) {
    Object.keys(voBank).forEach(function (k) { voBank[k].muted = !!on; });
  }

  function voHold(state) {
    var a = state.audio;
    if (!state.playing || !a || a.ended || a.paused) return Promise.resolve();
    return waitOrSkip(function (done) {
      var end = function () {
        a.removeEventListener('ended', end);
        a.removeEventListener('pause', end);
        done();
      };
      a.addEventListener('ended', end);
      a.addEventListener('pause', end);
      setTimeout(end, 15000);
    });
  }

  /* A line that is shown all at once rather than typed -- a verdict --
     still gets its voice, and waits its turn behind one still sounding. */
  var voQueue = Promise.resolve();
  var voRound = 0;
  function voAlone(text, onStart) {
    var mine = voRound;
    voQueue = voQueue.catch(function () {}).then(function () {
      if (mine !== voRound) { if (onStart) onStart(VO_SILENT); return; }
      return voSay(text).then(function (st) {
        if (onStart) onStart(st);
        return voHold(st);
      }, function () { if (onStart) onStart(VO_SILENT); });
    });
    return voQueue;
  }

  function silenceNow() {
    if (voNow) {
      try { voNow.pause(); voNow.currentTime = 0; } catch (e) { /* nothing to stop */ }
      voNow = null;
    }
  }
  function stopVoice() {
    voRound++;
    silenceNow();
  }

  /* the tab hidden: the line that is sounding pauses with the mission,
     and picks up where it stopped on return */
  var held = null;
  function suspendVoice() {
    if (voNow && !voNow.paused && !voNow.ended) { held = voNow; held.pause(); }
  }
  function resumeVoice() {
    if (held && held === voNow) { var p = held.play(); if (p && p.catch) p.catch(function () {}); }
    held = null;
  }

  /* ---------- input lock ---------- */
  var interactive = false;
  function lockInput(on, keep) {
    interactive = !on;
    el.inputLock.classList.toggle('on', !!on);
    if (!on && !keep) headingAside();
  }

  /* ---------- skip ----------
   * A page is skipped by fast-forwarding it, never by abandoning it:
   * waits collapse, animations are finished frame by frame, the
   * narration is left unplayed and a round waiting on the learner is
   * filled in. A skip stops at the page's own boundary: the learner is
   * handed the same Next button they would have reached by playing it. */
  var sceneSeq = 0;
  var pendingNext = null;

  /* the pages, in order, by the key of each one's name -- what the
     mission's section menu lists for this screen -- and which of
     them is in play, reported to the mission as each one opens */
  var PAGES = ['secLessonWarmUp', 'secLessonTriangles'];
  var pageIndex = -1;
  var onPage = null;

  function sceneStart(page) {
    sceneSeq++;
    if (page != null) {
      pageIndex = page;
      if (onPage) onPage(page);
    }
  }
  function sceneEnd() { sceneSeq++; }

  var skipWaiters = new Set();
  function waitOrSkip(register) {
    return new Promise(function (resolve, reject) {
      var mine = runToken;
      var done = function () {
        skipWaiters.delete(done);
        if (mine !== runToken) reject(CANCELLED); else resolve();
      };
      skipWaiters.add(done);
      register(done);
    });
  }
  function releaseWaiters() {
    Array.from(skipWaiters).forEach(function (done) {
      try { done(); } catch (e) { /* already gone */ }
    });
  }

  /* Web Animations run off the clock, not through wait(), so they are
     finished every frame for as long as the skip lasts. Endless ones
     are left alone. */
  function flushAnimations() {
    Motion.skip();
    if (!screen || !screen.getAnimations) return;
    screen.getAnimations({ subtree: true }).forEach(function (a) {
      var timing = a.effect && a.effect.getComputedTiming();
      if (!timing || timing.iterations === Infinity) return;
      try { a.finish(); } catch (e) { /* not finishable; leave it running */ }
    });
  }

  /* Waits that hang on the page's own furniture rather than on a clock:
     the Next button. A skip must NOT resolve these, but a teardown has
     to, or the abandoned frame sits there for the rest of the session. */
  var sceneWaiters = new Set();
  function waitForScene(register) {
    return new Promise(function (resolve, reject) {
      var mine = runToken;
      var done = function () {
        sceneWaiters.delete(done);
        if (mine !== runToken) reject(CANCELLED); else resolve();
      };
      sceneWaiters.add(done);
      register(done);
    });
  }

  /* An animation's end, for a page: a teardown cancels the animation,
     which rejects .finished; the token decides what it meant. */
  async function finished(a) {
    var mine = runToken;
    try { await a.finished; } catch (e) { /* cancelled: see below */ }
    if (mine !== runToken) throw CANCELLED;
  }
  var retired = function (mine) { if (mine !== runToken) throw CANCELLED; };

  var roundWaiting = function () {
    return interactive && round > 0 && !roundDone && roundSlots.length > 0;
  };

  function fillRound() {
    roundSlots.forEach(function (slot) {
      if (slot.classList.contains('filled')) return;
      var chip = roundChips.find(function (c) {
        return c.dataset.word === slot.dataset.accept && !c.disabled;
      });
      if (chip) dock(chip, slot, false);
    });
    if (roundSlots.every(function (s) { return s.classList.contains('filled'); })) {
      feedback(FEEDBACK.done);
      finishRound();
    }
  }

  async function skipScene() {
    if (fastForward) return;
    if (pendingNext) { pendingNext.click(); return; }

    var from = sceneSeq;
    var token = runToken;

    fastForward = true;
    stopVoice();

    var deadline = performance.now() + 8000;
    while (sceneSeq === from && runToken === token && performance.now() < deadline) {
      flushAnimations();
      releaseWaiters();
      if (roundWaiting()) fillRound();
      await new Promise(function (r) { requestAnimationFrame(r); });
    }
    flushAnimations();

    fastForward = false;
  }

  /* A page ahead of the one in play, reached the way Skip reaches the
     end of a page: everything between actually plays, as fast as a
     skip can run it, so the board arrives in a state its own code
     built. A skip has a watchdog of its own and hands the page back
     if it is long, so one is not always enough to reach a hand-off --
     which is why this keeps going rather than reading a single skip
     as the end of the road. */
  async function playTo(page, mine) {
    var guard = performance.now() + 60000;
    var quiet = 0;
    while (pageIndex < page && mine === runToken && performance.now() < guard) {
      var at = pageIndex;
      var seq = sceneSeq;
      await skipScene();
      if (mine !== runToken) return;
      if (pendingNext) await skipScene();        /* at the hand-off: take it */

      /* taking a hand-off only resolves the wait the page was sitting
         on; the next page opens a beat later, of its own accord */
      var settle = performance.now() + 3000;
      while (pageIndex === at && mine === runToken && performance.now() < settle) {
        await new Promise(function (r) { requestAnimationFrame(r); });
      }
      if (pageIndex === at && sceneSeq === seq) {
        if (++quiet >= 6) break;
      } else {
        quiet = 0;
      }
    }
  }

  /* ---------- the stage, and putting it back ----------
   * The class list and the child nodes of everything inside the board
   * are snapshotted at init, so restoring them undoes in one sweep every
   * class a page turned on and removes everything it built for itself. */
  var SCENE_ROOTS = [];
  var pristineClass = new Map();
  var bornWith = new Set();
  var PARKED = ['transform', 'opacity', 'width', 'height', 'left', 'top',
                'right', 'bottom', 'max-height',
                'visibility', 'transition', 'min-height', 'will-change'];

  function snapshot() {
    SCENE_ROOTS = ['bay', 'trayArea', 'lesson'].map(function (k) { return el[k]; }).filter(Boolean);
    SCENE_ROOTS.forEach(function (root) {
      bornWith.add(root);
      root.querySelectorAll('*').forEach(function (n) {
        bornWith.add(n);
        pristineClass.set(n, n.getAttribute('class') || '');
      });
    });
  }

  function clearStage() {
    Array.from(sceneWaiters).forEach(function (done) {
      try { done(); } catch (e) { /* already gone */ }
    });
    sceneWaiters.clear();
    releaseWaiters();
    stopVoice();
    if (nextCtl) { nextCtl.abort(); nextCtl = null; }

    /* drop every animation still holding a forwards fill */
    [screen].forEach(function (root) {
      if (!root || !root.getAnimations) return;
      root.getAnimations({ subtree: true }).forEach(function (a) {
        try { a.cancel(); } catch (e) { /* already done with */ }
      });
    });
    el.hopper.classList.remove('on');
    el.flyer.classList.remove('on');
    birdTrip = [];

    swiftee.release();

    /* a card mid-drag rides on a copy in the effects layer */
    Array.from(ghostHome().children).forEach(function (n) {
      if (n.classList && n.classList.contains('learn-ghost')) n.remove();
    });
    drag = null;
    picked = null;

    SCENE_ROOTS.forEach(function (root) {
      Array.from(root.querySelectorAll('*')).forEach(function (n) {
        if (!bornWith.has(n) && bornWith.has(n.parentNode)) n.remove();
      });
      Array.from(root.querySelectorAll('*')).concat(root).forEach(function (n) {
        PARKED.forEach(function (prop) { n.style.removeProperty(prop); });
      });
    });
    pristineClass.forEach(function (cls, n) {
      if (cls) n.setAttribute('class', cls);
      else n.removeAttribute('class');
    });
    /* the chips' press is bound for good (Motion.button3d); only its
       class went with the restore */
    allChips.forEach(function (chip) { chip.classList.add('is-3d'); });
    /* the containers themselves, back to the opening page */
    el.lesson.classList.remove('on', 'zoomed');
    el.lesson.setAttribute('aria-hidden', 'true');
    el.lesson.style.removeProperty('--scene-zoom');
    el.bay.classList.remove('zoomed');
    el.bay.style.removeProperty('--scene-zoom');

    /* the cards go home, and the round they belonged to is forgotten */
    allChips.forEach(function (chip) {
      var home = trays[chip.dataset.round];
      if (home) home.appendChild(chip);
      chip.disabled = false;
      chip.style.removeProperty('visibility');
    });
    round = 0;
    roundSlots = [];
    roundChips = [];
    wrongInRound = 0;
    autoScheduled = false;
    roundDone = false;
    el.trayArea.style.removeProperty('min-height');

    /* every typewriter on the board, the heading included */
    screen.querySelectorAll('.type .txt').forEach(function (t) { t.textContent = ''; });
    el.promptGhost.textContent = '';
    el.prompt.classList.remove('show');
    el.boardMascot.classList.remove('in');
    el.boardMascot.style.removeProperty('transform');
    el.formulaBox.classList.remove('show');

    pendingNext = null;
    el.nextBtn.hidden = true;
    el.nextBtn.classList.remove('in', 'out');

    el.board.classList.remove('cheer', 'sec2', 'head-held', 'show');
    el.fx.textContent = '';

    el.inputLock.classList.add('on');
    interactive = false;
    headStay = false;
    headKeepUntil = 0;
    mascotArriving = null;
    mascotLeaving = null;
    cancelDismiss();
    rooms.forEach(function (room) {
      room.style.removeProperty('height');
      room.classList.remove('closed');
    });
  }

  /* ---------- opening: draw each shape, then pour the colour in ---------- */
  async function revealShape(shape, lineMs, fillMs) {
    var svg     = shape.querySelector('svg');
    var outline = shape.querySelector('.shape-outline');
    var fill    = shape.querySelector('.shape-fill');
    var wipe    = shape.querySelector('.wipe');

    var len = 4000;
    try { len = outline.getTotalLength() || len; } catch (e) { /* keep guard */ }
    outline.style.strokeDasharray = len;
    outline.style.strokeDashoffset = len;

    if (REDUCED) {
      outline.style.strokeDashoffset = 0;
      fill.style.opacity = 1;
      await wait(120);
      return;
    }

    await finished(animate(outline,
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: lineMs || 760, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }
    ));
    outline.style.strokeDashoffset = 0;

    /* the clip rect slides up from below the artwork, so the colour reads as
       rising into the outline rather than simply switching on */
    var h = (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.height) || 200;
    fill.style.opacity = 1;
    await finished(animate(wipe,
      [{ transform: 'translateY(' + h + 'px)' }, { transform: 'translateY(0px)' }],
      { duration: fillMs || 560, easing: 'cubic-bezier(.35,0,.25,1)', fill: 'forwards' }
    ));
  }

  /* ---------- typewriter ---------- */
  async function typeInto(txt, blink, text, totalMs) {
    await speakerUp(txt);
    var said = await voSay(text);
    blink.hidden = true;
    await typePieces(txt, [{ t: text }], said, totalMs / Math.max(1, text.length), 0, null, null);
    await voHold(said);
    speakerDone(txt);
  }
  var typewrite = function (text, totalMs) { promptLine(text); return typeInto(el.promptTxt, el.caret, text, totalMs); };

  var promptStage = 0;
  var promptLine = function (text) { promptStage++; wordSpans(el.promptGhost, longestChunk(text)); };

  /* ---------- feedback in the heading ----------
   * Swiftee's reaction to a drop is not written anywhere on the board:
   * the bird's own expression, the sound and the chip's landing carry it.
   * The texts are kept for the screen reader, and spoken. */
  var FEEDBACK = {};
  async function feedback(text, silent) {
    el.caret.hidden = true;
    el.quip.textContent = text;
    if (!silent) voAlone(text).catch(function () {});
  }

  /* ---------- a hint waits for the learner to stall ---------- */
  var NUDGE_IDLE = 6000;
  var lastInput = 0;
  async function idleFor(signal, ms) {
    ms = ms || NUDGE_IDLE;
    var start = performance.now();
    while (!signal.done && !fastForward) {
      var idle = performance.now() - Math.max(lastInput, start);
      if (idle >= ms) return;
      await wait(Math.min(250, ms - idle));
    }
  }

  /* ---------- the ghost chip that demonstrates the drag ---------- */
  function demoDrag(signal, opts) {
    var slot = roundSlots[0];
    var chip = roundChips.find(function (c) { return c.dataset.word === slot.dataset.accept; });
    if (!chip) return Promise.resolve();

    var ms = (opts && opts.ms) || 2100;

    async function pass() {
      var from = chip.getBoundingClientRect();
      var to   = slot.getBoundingClientRect();
      if (!from.width || !to.width) return;

      var o = ghostOrigin();
      var ghost = flattenGhost(chip.cloneNode(true));
      ghost.className = 'chip demo-ghost' + (chip.classList.contains('formula') ? ' formula' : '');
      ghost.disabled = true;
      Object.assign(ghost.style, {
        left: (from.left - o.x) + 'px',
        top: (from.top - o.y) + 'px',
        width: from.width + 'px',
        height: from.height + 'px',
        margin: '0'
      });
      el.fx.appendChild(ghost);

      var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
      var dy = (to.top + to.height / 2) - (from.top + from.height / 2);

      var anim = animate(ghost, [
        { transform: 'translate(0,0) scale(.96)', opacity: 0 },
        { transform: 'translate(0,0) scale(1.06)', opacity: .55, offset: .14 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(1)', opacity: .55, offset: .74 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(1)', opacity: .55, offset: .88 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.96)', opacity: 0 }
      ], { duration: ms, easing: 'cubic-bezier(.35,.05,.25,1)' });

      signal.anim = anim;
      var glow = setTimeout(function () { slot.classList.add('over'); }, ms * .69 * PACE);

      var mine = runToken;
      try { await anim.finished; } catch (e) { /* cancelled */ }
      clearTimeout(glow);
      if (!slot.classList.contains('filled')) slot.classList.remove('over');
      ghost.remove();
      signal.anim = null;
      retired(mine);
    }

    if (opts && opts.once) {
      return (async function () {
        if (signal.done || fastForward) return;
        await pass();
      })();
    }

    return (async function () {
      while (!signal.done) {
        await idleFor(signal);
        if (signal.done || fastForward) break;
        await pass();
      }
    })();
  }

  /* ---------- briefing ---------- */
  async function briefing(spec, beforeDemo) {
    el.promptTxt.textContent = '';
    el.caret.hidden = true;
    el.prompt.classList.add('show');
    await wait(320);

    await mascotWithLine(spec.text);
    swiftee.hold('talking');

    /* A line that shows the drag as it says it: the ghost's pass is
       stretched to the clip, so it lands in the slot as the last word
       is said. Without a clip, the typewriter's own 2400ms. */
    var demo = null;
    if (spec.withLine) {
      var clip = voFor(spec.text);
      var secs = clip ? await durationOf(clip) : 0;
      var ms = Math.max(2100, (secs ? secs * 1000 : 2400) / .74);
      demo = demoDrag({ done: false, anim: null }, { once: true, ms: ms });
    }

    await typewrite(spec.text, 2400);

    swiftee.release();
    if (demo) { await demo; return; }
    if (beforeDemo) await beforeDemo();

    await demoDrag({ done: false, anim: null }, { once: true });
  }

  /* ---------- a round ---------- */
  var ROUNDS = {};
  var LAST_ROUND = 2;
  var SHAPES_READY = '';
  var LESSON = {};

  var shapes = [], allSlots = [], allChips = [], trays = {};
  var slotsOf = function (n) { return allSlots.filter(function (s) { return s.dataset.round === String(n); }); };
  var chipsOf = function (n) { return allChips.filter(function (c) { return c.dataset.round === String(n); }); };

  var round = 0;
  var roundSlots = [];
  var roundChips = [];
  var wrongInRound = 0;
  var autoScheduled = false;
  var roundDone = false;

  /* shuffle each deck so its left-to-right order never mirrors the shapes' */
  function shuffleDecks() {
    [1, 2].forEach(function (n) {
      var deck = chipsOf(n);
      for (var i = deck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
      }
      deck.forEach(function (c) { trays[n].appendChild(c); });
    });
  }

  async function startRound(n) {
    lockInput(true);
    round = n;
    roundSlots = slotsOf(n);
    roundChips = chipsOf(n);
    wrongInRound = 0;
    autoScheduled = false;
    roundDone = false;
    headStay = true;

    if (el.bay.classList.contains('zoomed')) unzoomBay();

    Object.keys(trays).forEach(function (k) { trays[k].classList.toggle('live', Number(k) === n); });

    var deal = async function () {
      await revealGroup(roundSlots, ROUND_IN);
      await wait(SLOTS_TO_CHIPS);
      await revealGroup(roundChips, ROUND_IN);
    };
    var spec = ROUNDS[n];
    if (spec.lineFirst) {
      await briefing(spec, async function () { await deal(); await wait(320); });
    } else {
      await deal();
      await briefing(spec);
    }

    /* Swiftee stays in the heading until the round's line and its drag
       demo are done; then the bird and its line leave, and the shapes
       grow up into the heading it empties. */
    headStay = false;
    lockInput(false);
    var gen = runToken;
    (mascotLeaving || Promise.resolve()).then(function () { if (gen === runToken) zoomBay(); });
  }

  async function finishRound() {
    if (roundDone) return;
    roundDone = true;
    lockInput(true);

    var last = round === LAST_ROUND;

    el.board.classList.add('cheer');
    setTimeout(function () { el.board.classList.remove('cheer'); }, 1200);

    swiftee.play(last ? 'proud' : 'celebrating', 1);

    skyConfetti(last ? 150 : 100, last ? 3800 : 2900);
    sfx('confetti', .85);

    if (!last) { await wait(1700); return startRound(round + 1); }

    await wait(1500);
    if (!shapes[0].classList.contains('labelled')) showLabels();

    /* Swiftee comes back up to the heading and says it, then stays --
       through the Next button and on into the triangle lesson */
    headStay = true;
    unzoomBay();
    await heading(FEEDBACK.done);
    await wait(1600);

    await showNext();
    await sectionTwo();
  }

  /* first wrong drop: name the sides of every shape */
  function showLabels() {
    shapes.forEach(function (s, i) { setTimeout(function () { s.classList.add('labelled'); }, i * 130); });
  }

  /* ---------- a scene comes forward ----------
   * Once Swiftee has left the heading, the row is held open (head-held)
   * but stands empty above the scene: the scene zooms into it. */
  var ZOOM_MAX = 1.25;
  var ZOOM_RIM = 20;
  function zoomFor(node) {
    var row = el.promptRow;
    var h = node.offsetHeight, w = node.offsetWidth;
    if (!h || !w) return 1;
    var up = (h + row.offsetHeight + (parseFloat(getComputedStyle(row).marginBottom) || 0)) / h;
    var across = (el.board.clientWidth - 2 * ZOOM_RIM) / w;
    return Math.max(1, Math.min(+node.dataset.zoomMax || ZOOM_MAX, up, across));
  }
  function zoomIn(node) {
    node.style.setProperty('--scene-zoom', zoomFor(node).toFixed(3));
    node.classList.add('zoomed');
  }
  function zoomOut(node) {
    node.classList.remove('zoomed');
    node.style.removeProperty('--scene-zoom');
  }
  var zoomBay   = function () { zoomIn(el.bay); };
  var unzoomBay = function () { zoomOut(el.bay); };

  /* second wrong drop: stop asking, and fly each formula home */
  async function autoSolve() {
    if (roundDone) return;
    lockInput(true);
    unpick();
    showLabels();
    await wait(300);

    for (var i = 0; i < roundSlots.length; i++) {
      var slot = roundSlots[i];
      if (slot.classList.contains('filled')) continue;
      var chip = roundChips.find(function (c) { return c.dataset.word === slot.dataset.accept && !c.disabled; });
      if (!chip) continue;
      await flyIntoSlot(chip, slot);
      await wait(200);
    }

    await wait(340);
    finishRound();
  }

  function flyIntoSlot(chip, slot) {
    var mine = runToken;
    return new Promise(function (resolve, reject) {
      var from = chip.getBoundingClientRect();
      var to   = slot.getBoundingClientRect();
      if (!from.width || !to.width || REDUCED) {
        dock(chip, slot, false);
        return resolve();
      }

      var o = ghostOrigin();
      var ghost = flattenGhost(chip.cloneNode(true));
      ghost.className = 'chip learn-ghost' + (chip.classList.contains('formula') ? ' formula' : '');
      ghost.disabled = true;
      Object.assign(ghost.style, {
        position: 'fixed',
        left: (from.left - o.x) + 'px',
        top: (from.top - o.y) + 'px',
        width: from.width + 'px',
        height: from.height + 'px',
        margin: 0,
        pointerEvents: 'none',
        zIndex: 960,
        transformOrigin: 'top left'
      });
      ghostHome().appendChild(ghost);
      chip.style.visibility = 'hidden';

      var dx = to.left - from.left;
      var dy = to.top - from.top;
      var sx = to.width / from.width;
      var sy = to.height / from.height;

      slot.classList.add('over');
      var a = animate(ghost, [
        { transform: 'translate(0px,0px) scale(1,1)' },
        { transform: 'translate(' + (dx * .5) + 'px,' + (dy * .5 - 30) + 'px) scale(' +
                     ((1 + sx) / 2) + ',' + ((1 + sy) / 2) + ')', offset: .55 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' }
      ], { duration: 780, easing: 'cubic-bezier(.35,.05,.25,1)', fill: 'forwards' });

      var land = function () {
        ghost.remove();
        slot.classList.remove('over');
        dock(chip, slot, false);
        resolve();
      };
      a.onfinish = land;
      a.oncancel = function () {
        if (mine === runToken) return land();
        ghost.remove();
        slot.classList.remove('over');
        reject(CANCELLED);
      };
    });
  }

  /* ---------- confetti ---------- */
  var CONFETTI = [];
  function confettiPiece() {
    if (!CONFETTI.length) return null;
    var p = doc.createElement('i');
    var w = 7 + Math.random() * 8;
    var h = 10 + Math.random() * 12;
    p.style.width  = w + 'px';
    p.style.height = h + 'px';
    p.style.background = CONFETTI[(Math.random() * CONFETTI.length) | 0];
    return p;
  }

  function skyConfetti(count, span) {
    if (REDUCED) return;
    var W = global.innerWidth;
    var H = global.innerHeight;

    for (var i = 0; i < count; i++) {
      var p = confettiPiece();
      if (!p) return;
      p.style.left = (Math.random() * W) + 'px';
      p.style.top = '0px';
      el.fx.appendChild(p);

      var from = -50 - Math.random() * 320;
      var to   = H + 80;
      var sway = Math.random() * 170 - 85;
      var spin = (Math.random() * 1440 - 720) | 0;
      var life = span * (0.66 + Math.random() * 0.5);
      var delay = Math.random() * span * 0.42;

      var step = function (t, x, r) {
        return { transform: 'translate(' + x + 'px,' + (from + (to - from) * t) + 'px) rotate(' + r + 'deg)' };
      };

      var a = animate(p, [
        step(0, 0, 0),
        step(.33, sway * .65, spin * .33),
        step(.66, sway * -.35, spin * .66),
        step(1, sway, spin)
      ], { duration: life, delay: delay, easing: 'linear', fill: 'backwards' });

      a.onfinish = function () { this.effect.target.remove(); };
      a.oncancel = function () { this.effect.target.remove(); };
    }
  }

  function burst(node) {
    if (REDUCED) return;
    var r = node.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;

    for (var i = 0; i < 34; i++) {
      var p = confettiPiece();
      if (!p) return;
      p.style.left = (cx - parseFloat(p.style.width) / 2) + 'px';
      p.style.top  = (cy - parseFloat(p.style.height) / 2) + 'px';
      el.fx.appendChild(p);

      var angle = (Math.random() * Math.PI * 2);
      var dist  = 70 + Math.random() * 190;
      var dx    = Math.cos(angle) * dist;
      var up    = Math.sin(angle) * dist - 90;
      var drop  = up + 150 + Math.random() * 190;
      var spin  = (Math.random() * 900 - 450) | 0;
      var life  = 900 + Math.random() * 600;

      var a = animate(p, [
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: 'translate(' + dx * 0.85 + 'px,' + up + 'px) rotate(' + spin * 0.6 + 'deg) scale(1)',
          opacity: 1, offset: .55 },
        { transform: 'translate(' + dx + 'px,' + drop + 'px) rotate(' + spin + 'deg) scale(.85)',
          opacity: 0 }
      ], { duration: life, easing: 'cubic-bezier(.15,.6,.35,1)' });

      a.onfinish = function () { this.effect.target.remove(); };
      a.oncancel = function () { this.effect.target.remove(); };
    }
  }

  /* ---------- drag / drop plumbing ---------- */
  var drag = null;
  var picked = null;

  function slotUnder(x, y) {
    return roundSlots.find(function (slot) {
      var r = slot.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }) || null;
  }

  var clearOver = function () { roundSlots.forEach(function (s) { s.classList.remove('over'); }); };

  function unpick() {
    if (picked) picked.classList.remove('picked');
    picked = null;
  }

  /* seat a chip in its slot; `earned` is false when the game placed it itself */
  function dock(chip, slot, earned) {
    slot.appendChild(chip);
    slot.classList.add('filled');
    chip.classList.remove('picked', 'dragging');
    chip.style.visibility = '';
    chip.disabled = true;
    slot.closest('.cell').classList.add('docked');

    markRight(slot);
    setTimeout(function () { slot.classList.remove('correct'); }, 520);

    sfx('correct', earned ? 1 : .55);
    if (earned) {
      swiftee.play('happy', 1);
      sfx('confetti', .55);
      requestAnimationFrame(function () { burst(chip); });
    }
  }

  function place(chip, slot) {
    if (!interactive) return false;
    if (chip.dataset.round !== slot.dataset.round) return false;
    if (slot.classList.contains('filled')) return false;

    /* ---- wrong block: red shake + buzzer, the chip stays in the tray ---- */
    if (slot.dataset.accept !== chip.dataset.word) {
      sfx('wrong');
      markWrong(slot);
      markWrong(chip);
      setTimeout(function () {
        slot.classList.remove('reject');
        chip.classList.remove('reject');
      }, 430);

      wrongInRound++;
      swiftee.play(wrongInRound >= 2 ? 'puzzleing' : 'confused', 1);

      if (round === LAST_ROUND) {
        if (wrongInRound === 1) {
          setTimeout(showLabels, 500);
        } else if (wrongInRound >= 2 && !autoScheduled) {
          autoScheduled = true;
          setTimeout(autoSolve, 700);
        }
      }
      return false;
    }

    /* ---- right block: dock it, chime, confetti out of the chip ---- */
    dock(chip, slot, true);

    var done = roundSlots.every(function (s) { return s.classList.contains('filled'); });
    if (!(done && round === LAST_ROUND)) feedback(done ? FEEDBACK.done : FEEDBACK.right);
    if (done) setTimeout(finishRound, 420);
    return true;
  }

  function onDown(e) {
    if (!interactive) return;
    var chip = e.currentTarget;
    if (chip.disabled || chip.dataset.round !== String(round)) return;
    if (e.button !== undefined && e.button !== 0) return;

    drag = liftGhost(chip, e);
    chip.classList.add('dragging');
    unpick();
    sfx('click', .5);

    global.addEventListener('pointermove', onMove);
    global.addEventListener('pointerup', onUp);
    global.addEventListener('pointercancel', onUp);
    e.preventDefault();
  }

  function onMove(e) {
    if (!drag) return;
    moveGhost(drag, e.clientX, e.clientY);

    clearOver();
    var slot = slotUnder(e.clientX, e.clientY);
    if (slot && !slot.classList.contains('filled')) slot.classList.add('over');
  }

  function onUp(e) {
    if (!drag) return;
    global.removeEventListener('pointermove', onMove);
    global.removeEventListener('pointerup', onUp);
    global.removeEventListener('pointercancel', onUp);

    var d = drag;
    drag = null;
    clearOver();

    var slot = slotUnder(e.clientX, e.clientY);
    dropGhost(d, slot, function () {
      d.el.classList.remove('dragging');
      if (slot) place(d.el, slot);
    });
  }

  /* ---------- Swiftee ----------
   * One player driving the bird beside the board's heading, the hopper
   * that stands in for it behind the board and the flyer that carries it
   * over the board; at most one is visible at a time, so they share a
   * clock. Every sheet is a uniform grid whose frames all pivot on the
   * cell centre; a frame is selected by background-position in
   * percentages, so the selection is exact at any rendered size. */
  var swiftee = { play: function () {}, hold: function () {}, release: function () {},
                  show: function () {}, ms: function () { return 0; }, sheets: function () { return []; } };

  function buildSwiftee(nodes) {
    var S = global.SWIFTEE;
    if (!S || !nodes.length) return;

    var FRAME_MS = 1000 / S.fps;
    var clipOf = function (name) { return S.clips[name]; };

    /* A sheet is decoded under the address it is PAINTED from. The start
       gate hands every sheet back as a blob: URL some time after the idle
       blink has already been warmed from the network one, and a bird
       painted from a blob nobody decoded is a bird that blinks out for a
       frame every time its clip changes. So the cache is keyed by the
       painted address, and a sheet whose blob arrives later is decoded
       again under it. */
    var srcOf = function (url) { return local[url] || url; };
    var sheets = Object.create(null);
    function warm(url) {
      var src = srcOf(url);
      var s = sheets[src];
      if (s) return s.p;
      var img = new Image();
      s = sheets[src] = { img: img, settled: false, ok: false, p: null };
      var mark = function () { s.settled = true; s.ok = img.naturalWidth > 0; };
      var loaded = function () {
        return new Promise(function (res) {
          if (img.complete) return res();
          img.onload = img.onerror = res;
        });
      };
      img.src = src;
      s.p = (img.decode ? img.decode().then(mark, function () { return loaded().then(mark); })
                        : loaded().then(mark));
      return s.p;
    }
    var settled = function (src) { var s = sheets[src]; return !!(s && s.settled); };

    /* the address to paint a clip from, or null to hold the frame on
       screen: the blob once it is decoded, the network copy while the
       blob is still decoding if that one is ready, nothing otherwise */
    function pick(n, d) {
      warm(d.img);
      var src = srcOf(d.img);
      if (settled(src)) return src;
      if (src !== d.img && settled(d.img)) return d.img;
      return null;
    }

    var program = [];
    var step = null;
    var frame = 0;
    var pass = 0;
    var accum = 0;
    var lastT = 0;

    function paint() {
      var d = clipOf(step.clip);
      var col = frame % d.cols;
      var row = (frame / d.cols) | 0;
      var px = d.cols > 1 ? (col / (d.cols - 1)) * 100 : 0;
      var py = d.rows > 1 ? (row / (d.rows - 1)) * 100 : 0;
      var size = (d.cols * 100) + '% ' + (d.rows * 100) + '%';
      var pos  = px + '% ' + py + '%';
      nodes.forEach(function (n) {
        if (n._clip !== step.clip) {
          var url = pick(n, d);
          if (!url) return;
          n._clip = step.clip;
          if (n._url !== url) {
            n._url = url;
            n.style.setProperty('--sw-img', 'url("' + new URL(url, doc.baseURI).href + '")');
          }
          if (!n.classList.contains('show')) n.classList.add('show');
        }
        if (n._size !== size) { n._size = size; n.style.setProperty('--sw-size', size); }
        if (n._pos !== pos)   { n._pos = pos;   n.style.setProperty('--sw-pos', pos); }
      });
    }

    function advance() {
      step = program.shift() || null;
      frame = 0;
      pass = 0;
      if (step) paint();
    }

    function tick(t) {
      requestAnimationFrame(tick);
      if (!step) return;
      /* nothing to drive while the screen is not on */
      if (!screen.classList.contains('is-active')) { lastT = t; return; }
      if (!lastT) lastT = t;
      var dt = t - lastT;
      lastT = t;
      if (dt > 250) dt = FRAME_MS;
      accum += dt;

      while (step && accum >= FRAME_MS) {
        accum -= FRAME_MS;
        frame++;
        if (frame >= clipOf(step.clip).frames) {
          pass++;
          if (pass >= step.repeat) advance();
          else frame = 0;
        }
      }
      if (step) paint();
    }

    function build(state, passes) {
      var st = S.states[state];
      var tail = { clip: S.idle, repeat: Infinity };
      if (!st) return [tail];
      var p = [];
      if (st.start) p.push({ clip: st.start, repeat: 1 });
      p.push({ clip: st.loop, repeat: passes });
      if (st.stop) p.push({ clip: st.stop, repeat: 1 });
      p.push(tail);
      return p;
    }

    function ms(state, passes) {
      var st = S.states[state];
      if (!st) return 0;
      var f = st.start ? clipOf(st.start).frames : 0;
      f += clipOf(st.loop).frames * (passes === undefined ? 1 : passes);
      f += st.stop ? clipOf(st.stop).frames : 0;
      return f * FRAME_MS;
    }

    requestAnimationFrame(tick);
    program = build(null, 1);
    advance();

    swiftee = {
      play: function (state, passes) {
        program = build(state, passes === undefined ? 1 : passes);
        accum = 0;
        advance();
      },
      hold: function (state) {
        program = build(state, Infinity);
        accum = 0;
        advance();
      },
      release: function () {
        if (step && step.repeat === Infinity && step.clip !== S.idle) {
          step.repeat = pass + 1;
        }
      },
      show: function (on) {
        if (on && step) paint();
        nodes.forEach(function (n) { n.classList.toggle('show', !!on); });
      },
      ms: ms,
      /* every sheet, for the start gate; a sheet handed in as a blob is
         decoded from memory */
      sheets: function () { return Object.keys(S.clips).map(function (k) { return S.clips[k].img; }); },
      warm: warm
    };
  }

  /* ---------- rows that give up their room ----------
   * The heading row is only as tall as what it shows: an empty row closes
   * and the stage above takes the room; the row opens again when a line
   * or Swiftee arrives in it. */
  var rooms = [];
  var birdTrip = [];
  var headKeepUntil = 0;
  function roomHeight(room) {
    if (el.board.classList.contains('head-held')) return room.firstElementChild.offsetHeight;
    if (performance.now() < headKeepUntil) return room.firstElementChild.offsetHeight;
    var txt = room.querySelector('.txt');
    var flying = el.hopper.classList.contains('on') || el.flyer.classList.contains('on');
    var here = el.boardMascot.classList.contains('in') ||
               (flying && birdTrip.indexOf(el.boardMascot) >= 0);
    return (txt && txt.childNodes.length) || here ? room.firstElementChild.offsetHeight : 0;
  }
  var ROOM_CLOSE_DELAY = 360;
  var roomsDue = 0;
  var roomClose = new Map();
  function setRoom(room, h) {
    var v = Math.round(h) + 'px';
    if (room.style.height !== v) room.style.height = v;
    room.classList.toggle('closed', !h);
  }
  function fitRooms() {
    roomsDue = 0;
    rooms.forEach(function (room) {
      var h = roomHeight(room);
      var pending = roomClose.get(room);
      if (h) {
        if (pending) { clearTimeout(pending); roomClose.delete(room); }
        setRoom(room, h);
        return;
      }
      if (room.style.height === '0px' || pending) return;
      roomClose.set(room, setTimeout(function () {
        roomClose.delete(room);
        if (!roomHeight(room)) setRoom(room, 0);
      }, ROOM_CLOSE_DELAY));
    });
  }
  var askRooms = function () { if (!roomsDue) roomsDue = requestAnimationFrame(fitRooms); };

  /* ---------- the bird arrives on the board ----------
   * Two sprites share the jump: the hopper, painted under the board,
   * does the rising half that starts hidden behind the board's top edge,
   * and the in-board sprite does the falling half over it. */
  async function mascotJumpIn(target) {
    await birdFree();
    var spot = target || el.boardMascot;
    var m = spot.getBoundingClientRect();
    var b = el.board.getBoundingClientRect();
    if (!m.width || REDUCED) { spot.classList.add('in'); return; }

    var apexTop = b.top - m.height * .9 - 8;
    var hideTop = b.top + 14;

    birdTrip = [spot];
    Object.assign(el.hopper.style, {
      left: m.left + 'px', top: hideTop + 'px', width: m.width + 'px', height: m.height + 'px'
    });
    el.hopper.classList.add('on');
    var rise = animate(el.hopper,
      [{ transform: 'translateY(0)' }, { transform: 'translateY(' + (apexTop - hideTop) + 'px)' }],
      { duration: 380, easing: 'cubic-bezier(.2, .6, .35, 1)', fill: 'forwards' }
    );
    await finished(rise);

    /* the spot is measured AGAIN here: the heading's row opens for the
       arriving bird and takes half a second to do it, so by the time the
       sprite reaches the apex its landing spot has moved */
    var at = spot.getBoundingClientRect();
    var dx = m.left - at.left;
    var drop = apexTop - at.top;
    var from = 'translate(' + dx + 'px, ' + drop + 'px)';
    spot.style.transform = from;
    spot.classList.add('in');
    el.hopper.classList.remove('on');
    rise.cancel();
    var fall = animate(spot, [
      { transform: from, easing: 'cubic-bezier(.45, 0, .85, .5)' },
      { transform: 'translateY(0) scale(1.06, .92)', offset: .8, easing: 'ease-out' },
      { transform: 'none' }
    ], { duration: Math.min(760, 320 - drop * .5), fill: 'forwards' });
    try { await finished(fall); } finally { spot.style.removeProperty('transform'); fall.cancel(); birdTrip = []; }
  }

  /* and the way back: the flyer takes the sprite over from its spot, it
     crouches and springs up to the apex over the board, hands over to the
     hopper there, and the hopper drops behind the board's top edge */
  async function mascotJumpOut(source, onAirborne) {
    var off = function () {
      var f = onAirborne; onAirborne = null;
      if (f) try { f(); } catch (e) { /* nothing */ }
    };
    try {
      await birdFree();
      var spot = source || el.boardMascot;
      if (!spot.classList.contains('in')) return;
      var m = spot.getBoundingClientRect();
      var b = el.board.getBoundingClientRect();
      if (!m.width || REDUCED) { spot.classList.remove('in'); return; }

      var apexTop = b.top - m.height * .9 - 8;
      var hideTop = b.top + 14;

      birdTrip = [spot];
      Object.assign(el.flyer.style, {
        left: m.left + 'px', top: m.top + 'px', width: m.width + 'px', height: m.height + 'px'
      });
      el.flyer.classList.add('on');
      spot.classList.remove('in');
      off();
      var rise = animate(el.flyer, [
        { transform: 'none', easing: 'ease-in' },
        { transform: 'translateY(6%) scale(1.06, .92)', offset: .24, easing: 'cubic-bezier(.2, .6, .35, 1)' },
        { transform: 'translateY(' + (apexTop - m.top) + 'px)' }
      ], { duration: 560, fill: 'forwards' });
      await finished(rise);

      Object.assign(el.hopper.style, {
        left: m.left + 'px', top: apexTop + 'px', width: m.width + 'px', height: m.height + 'px'
      });
      el.hopper.classList.add('on');
      el.flyer.classList.remove('on');
      rise.cancel();
      var fall = animate(el.hopper,
        [{ transform: 'translateY(0)' }, { transform: 'translateY(' + (hideTop - apexTop) + 'px)' }],
        { duration: 360, easing: 'cubic-bezier(.45, 0, .85, .5)', fill: 'forwards' }
      );
      await finished(fall);
      el.hopper.classList.remove('on');
      fall.cancel();
      birdTrip = [];
    } finally { off(); }
  }

  /* ---------- next button ---------- */
  var nextCtl = null;
  function showNext() {
    var b = el.nextBtn;
    sceneEnd();
    if (nextCtl) nextCtl.abort();
    var ctl = nextCtl = new AbortController();
    return waitForScene(function (resolve) {
      b.hidden = false;
      void b.offsetHeight;
      b.classList.add('in');
      lockInput(false, true);
      b.focus({ preventScroll: true });
      pendingNext = b;

      b.addEventListener('click', function () {
        pendingNext = null;
        sfx('click', .6);
        lockInput(true);
        b.classList.remove('in');
        b.classList.add('out');
        setTimeout(function () {
          b.hidden = true;
          b.classList.remove('out');
        }, 320);
        resolve();
      }, { once: true, signal: ctl.signal });
    });
  }

  /* ---------- page 3: the triangle lesson ---------- */
  var tris = [];
  var FORMULA = [];
  var FORMULA_MS    = 110;
  var FORMULA_PAUSE = 720;

  function parkCentre(tri) {
    var row  = el.triRow.getBoundingClientRect();
    var cell = tri.parentElement.getBoundingClientRect();
    if (!row.width || !cell.width) return;
    var dx = (row.left + row.width / 2) - (cell.left + cell.width / 2);
    tri.style.transform = 'translateX(' + dx + 'px)';
  }

  async function slideHome(tri) {
    var from = tri.style.transform;
    tri.style.transform = '';
    if (!from || REDUCED) return wait(120);
    var drop = Motion.willChange(tri);
    var a = animate(tri,
      [{ transform: from }, { transform: 'none' }],
      { duration: 760, easing: 'cubic-bezier(.4, 0, .2, 1)' }
    );
    try { await finished(a); } finally { drop(); }
  }

  /* Grow a dashed line out from its first point. */
  function growLine(line, ms) {
    if (!line) return Promise.resolve();
    var x1 = +line.getAttribute('x1'), y1 = +line.getAttribute('y1');
    var X2 = +(line.dataset.x2 || (line.dataset.x2 = line.getAttribute('x2')));
    var Y2 = +(line.dataset.y2 || (line.dataset.y2 = line.getAttribute('y2')));

    if (REDUCED) {
      line.setAttribute('x2', X2); line.setAttribute('y2', Y2);
      line.style.opacity = 1;
      return wait(80);
    }

    line.setAttribute('x2', x1); line.setAttribute('y2', y1);
    line.style.opacity = 1;
    var mine = runToken;
    var span = ms * PACE;
    return new Promise(function (resolve, reject) {
      var t0 = performance.now();
      (function step(t) {
        if (mine !== runToken) return reject(CANCELLED);
        var p = fastForward ? 1 : Math.min(1, (t - t0) / span);
        var e = 1 - Math.pow(1 - p, 3);
        line.setAttribute('x2', x1 + (X2 - x1) * e);
        line.setAttribute('y2', y1 + (Y2 - y1) * e);
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      })(t0);
    });
  }

  var DIMS_GAP = 450;
  async function drawDims() {
    for (var i = 0; i < tris.length; i++) {
      var tri = tris[i];
      if (i) await wait(DIMS_GAP);
      await growLine(tri.querySelector('.dim-base'), 620);
      await wait(160);
      await growLine(tri.querySelector('.dim-ext'), 420);
      await growLine(tri.querySelector('.dim-height'), 620);
      tri.classList.add('marked');
    }
  }

  function lightDims(kind) {
    tris.forEach(function (tri, i) { setTimeout(function () { tri.classList.add('lit-' + kind); }, i * 380); });
  }

  async function showFormula() {
    var parts = lineSpans(el.formulaTxt, FORMULA);
    el.formulaCaret.hidden = true;
    el.formulaBox.classList.add('show');
    sfx('click', .35);
    await wait(REDUCED ? 200 : 560);

    var due = performance.now();
    for (var p = 0; p < parts.length; p++) {
      var part = parts[p];
      due = await revealWords(part.words, due, FORMULA_MS);
      if (part.seg.w) {
        var left0 = due - performance.now();
        if (left0 > 0) await wait(left0);
        part.els.forEach(function (n) { n.classList.add('lit'); });
        lightDims(part.seg.w);
        due += FORMULA_PAUSE;
      }
    }
    var left = due - performance.now();
    if (left > 0) await wait(left);
    await wordsSettle();
  }

  async function sectionTwo() {
    lockInput(true);
    el.board.classList.remove('head-held');
    zoomOut(el.lesson);
    sceneStart(1);
    headStay = true;
    el.board.classList.add('head-held');

    /* 1. the warm-up clears away; Swiftee stays where it is */
    await wait(260);
    el.promptTxt.textContent = '';
    el.caret.hidden = true;
    el.board.classList.add('sec2');
    el.trayArea.style.minHeight = '';
    await wait(520);

    /* 2. one triangle, drawn in the middle of the empty board */
    var first = tris[0];
    parkCentre(first);
    el.lesson.classList.add('on');
    el.lesson.setAttribute('aria-hidden', 'false');
    await wait(80);
    await revealShape(first);
    await wait(320);

    /* 3. Swiftee names what this is */
    await mascotWithLine(LESSON.types);
    swiftee.hold('talking');
    await typewrite(LESSON.types, LESSON.types.length * TYPE_MS);
    swiftee.release();
    await wait(700);

    /* 4. it moves aside, and two more kinds join it, one at a time */
    await slideHome(first);
    await wait(220);
    for (var i = 1; i < tris.length; i++) {
      await revealShape(tris[i]);
      await wait(260);
    }
    await wait(320);

    /* 5. base and height on all three */
    await mascotWithLine(LESSON.dims);
    swiftee.hold('talking');
    await typewrite(LESSON.dims, LESSON.dims.length * TYPE_MS);
    swiftee.release();
    await wait(380);
    await drawDims();
    await wait(520);

    /* 6. the formula, word by word, lighting the lines it names */
    await showFormula();
    swiftee.play('happy', 1);
    await wait(1100);

    /* 7. everything has been said: Swiftee and its line leave the heading,
          and the triangles and formula come forward into the room they
          leave */
    el.board.classList.add('head-held');
    headStay = false;
    el.caret.hidden = true;
    if (el.boardMascot.classList.contains('in')) {
      await mascotJumpOut(el.boardMascot, function () { el.promptTxt.textContent = ''; });
    } else el.promptTxt.textContent = '';
    await wait(220);
    zoomIn(el.lesson);

    /* 8. the zoom, and two seconds to take it in, then on */
    await wait(900 + 2000);
    await showNext();

    /* page 3's Next hands the mission on: run() is waiting on this */
    if (onLessonDone) { var f = onLessonDone; onLessonDone = null; f(); }
  }

  /* set by run(), fired by sectionTwo() */
  var onLessonDone = null;

  /* ---------- the bird arrives with its line ----------
   * Swiftee is never left standing beside an empty heading: it waits
   * behind the board until there is something to say, comes up as the
   * line is about to start, and the words follow one beat later. */
  var MASCOT_LEAD = 200;
  var mascotArriving = null;
  var TYPE_MS = 72;
  function mascotWithLine(text) {
    if (mascotArriving) return mascotArriving;
    cancelDismiss();
    if (!mascotLeaving && !dismissing &&
        (el.board.querySelector('.mascot.in') ||
         el.hopper.classList.contains('on') ||
         el.flyer.classList.contains('on'))) return Promise.resolve();
    if (typeof text === 'string') promptLine(text);
    mascotArriving = (async function () {
      try {
        if (mascotLeaving) await mascotLeaving;
        if (dismissing) await dismissing;
        if (el.board.querySelector('.mascot.in')) return;
        await mascotJumpIn();
        await wait(MASCOT_LEAD);
      } finally { mascotArriving = null; }
    })();
    return mascotArriving;
  }

  /* ---------- the heading stands down ----------
   * Swiftee explains from the heading; when it has finished and the
   * board becomes the learner's, the bird jumps back behind the board
   * and takes its line with it. Only at the hand-over, never between two
   * lines of the same explanation. */
  var mascotLeaving = null;
  var leaveSeq = 0;
  function headingAside() {
    if (headStay) return;
    headKeepUntil = 0;
    cancelDismiss(el.promptTxt);
    headingDown();
  }
  function headingDown() {
    el.caret.hidden = true;
    var staged = promptStage;
    var wipe = function () {
      if (staged !== promptStage) return;
      el.promptTxt.textContent = '';
      el.promptGhost.textContent = '';
    };
    if (!el.boardMascot.classList.contains('in')) { wipe(); return; }
    var mine = ++leaveSeq;
    mascotLeaving = mascotJumpOut(el.boardMascot, wipe).catch(function () {}).then(function () {
      if (mine === leaveSeq) mascotLeaving = null;
    });
  }

  /* ---------- the line said, the speaker goes ---------- */
  var DISMISS_GRACE = 650;
  var headStay = false;
  var HEAD_KEEP_MS = 2600;
  var SPEAKERS = new Map();
  var dismissing = null;
  function speaker(txt, spot) {
    SPEAKERS.set(txt, { spot: spot, gone: false, timer: 0 });
  }
  function cancelDismiss(txt) {
    SPEAKERS.forEach(function (sp, key) {
      if (txt && key !== txt) return;
      if (sp.timer) { clearTimeout(sp.timer); sp.timer = 0; }
    });
  }
  function speakerDone(txt) {
    var sp = SPEAKERS.get(txt);
    if (!sp) return;
    if (headStay && sp.spot === el.boardMascot) return;
    if (sp.timer) clearTimeout(sp.timer);
    var mine = runToken;
    sp.timer = setTimeout(function () {
      sp.timer = 0;
      if (mine !== runToken) return;
      dismissNow(txt, sp);
    }, fastForward ? 0 : DISMISS_GRACE);
  }
  function dismissNow(txt, sp) {
    if (sp.spot === el.boardMascot) {
      if (!txt.childNodes.length && !el.boardMascot.classList.contains('in')) return;
      headKeepUntil = performance.now() + HEAD_KEEP_MS;
      setTimeout(askRooms, HEAD_KEEP_MS + 40);
      headingDown();
    }
  }
  async function speakerUp(txt) {
    cancelDismiss();
    var sp = SPEAKERS.get(txt);
    if (!sp) return;
    if (sp.spot === el.boardMascot) return mascotWithLine(null);
  }
  async function birdFree() {
    cancelDismiss();
    if (dismissing) await dismissing;
    if (mascotLeaving) await mascotLeaving;
  }

  /* Swiftee says a line from its place by the heading */
  async function heading(text) {
    await mascotWithLine(text);
    swiftee.hold('talking');
    await typewrite(text, text.length * TYPE_MS);
    swiftee.release();
  }

  /* ---------- the board arrives ---------- */
  async function showBoard() {
    if (el.board.classList.contains('show')) return;
    el.board.classList.add('show');
    if (REDUCED) return wait(500);
    var a = animate(el.board, [
      { transform: 'translateY(26px) scale(.955)', opacity: 0 },
      { transform: 'none', opacity: 1 }
    ], { duration: 640, easing: 'cubic-bezier(.2, .9, .3, 1.15)' });
    await finished(a);
  }

  /* the console band keeps the height of a full row of chips even after
     the last chip has been docked, so nothing below the shapes moves */
  function lockTrayHeight() {
    if (el.board.classList.contains('sec2')) return;
    var home = allChips.filter(function (c) { return c.parentElement === trays[1] || c.parentElement === trays[2]; });
    if (!home.length) return;
    var cs = getComputedStyle(el.trayArea);
    var pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    var tall = home.reduce(function (m, c) { return Math.max(m, c.getBoundingClientRect().height); }, 0);
    if (tall) el.trayArea.style.minHeight = (tall + pad) + 'px';
  }

  /* ---------- page 2: the warm-up ----------
   * The three shapes draw themselves, Swiftee names what they are, and
   * round 1 opens; the rounds carry the page on to its Next, and that
   * carries on into page 3 (finishRound). */
  async function sceneWarmUp() {
    lockInput(true);
    el.board.classList.add('head-held');
    headStay = true;
    shapes.forEach(function (s) { s.classList.remove('labelled'); });
    unzoomBay();

    for (var i = 0; i < shapes.length; i++) {
      await revealShape(shapes[i]);
      await wait(200);
    }
    await wait(180);

    el.prompt.classList.add('show');
    await mascotWithLine(SHAPES_READY);
    swiftee.hold('talking');
    await typewrite(SHAPES_READY, SHAPES_READY.length * TYPE_MS);
    swiftee.release();
    await wait(1600);

    await startRound(1);
  }


  /* ============================================================
     THE MISSION'S SIDE
     ============================================================ */

  function init(opts) {
    if (inited || !opts || !opts.screen) return;
    screen = opts.screen;
    onPage = typeof opts.onPage === 'function' ? opts.onPage : null;
    inited = true;

    var q = function (id) { return screen.querySelector('#' + id); };
    el = {
      board: q('board'), bay: q('bay'), prompt: q('prompt'),
      promptRow: screen.querySelector('.prompt-row'),
      promptGhost: q('promptGhost'), promptType: q('promptType'),
      trayArea: q('trayArea'), fx: q('learnFx'), inputLock: q('inputLock'),
      boardMascot: q('mascot'), hopper: q('hopper'), flyer: q('flyer'),
      quip: q('quip'), nextBtn: q('nextBtn'),
      lesson: q('lesson'), triRow: q('triRow'),
      formulaBox: q('formulaBox'), formulaGhost: q('formulaGhost'), formulaType: q('formulaType')
    };
    el.promptTxt = el.promptType.querySelector('.txt');
    el.caret = el.promptType.querySelector('.caret');
    el.formulaTxt = el.formulaType.querySelector('.txt');
    el.formulaCaret = el.formulaType.querySelector('.caret');

    shapes   = Array.from(screen.querySelectorAll('.shape'));
    allSlots = Array.from(screen.querySelectorAll('.slot'));
    allChips = Array.from(screen.querySelectorAll('.chip'));
    trays    = { 1: q('tray'), 2: q('tray2') };
    tris     = Array.from(el.lesson.querySelectorAll('.tri'));
    rooms    = [el.promptRow];

    /* the lines, in the language on screen */
    ROUNDS = {
      1: { text: T('p02DragNames'), withLine: true },
      2: { text: T('p02Formulas'), lineFirst: true }
    };
    SHAPES_READY = T('p02Shapes');
    LESSON = { types: T('p03Differ'), dims: T('p03Observe') };
    FEEDBACK = { right: T('fbCorrect'), done: T('fbWellDone'), wrong: T('fbNotQuite') };
    FORMULA = [
      { t: T('areaWord') + ' = ½ × ' },
      { t: T('labelBaseCap'),   w: 'base' },
      { t: ' × ' },
      { t: T('labelHeightCap'), w: 'height' }
    ];
    lineSpans(el.formulaGhost, FORMULA);

    /* the palette, read back out of the stylesheet */
    var cs = getComputedStyle(screen);
    CONFETTI = [1, 2, 3, 4, 5, 6]
      .map(function (n) { return cs.getPropertyValue('--confetti-' + n).trim(); })
      .filter(Boolean);

    /* every chip presses like a key, and every press is caught once */
    allChips.forEach(function (chip) { Motion.button3d(chip, { edge: 4 }); });
    screen.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      var btn = e.target.closest && e.target.closest('button');
      if (!btn || btn.disabled || btn.classList.contains('is-3d')) return;
      Motion.press(btn);
    }, { passive: true });

    /* drag, click and keyboard */
    allChips.forEach(function (chip) { chip.addEventListener('pointerdown', onDown); });
    allChips.forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        if (!interactive || chip.disabled || chip.dataset.round !== String(round)) return;
        e.preventDefault();
        var wasPicked = picked === chip;
        unpick();
        if (!wasPicked) {
          picked = chip;
          chip.classList.add('picked');
          sfx('click', .5);
        }
      });
    });
    allSlots.forEach(function (slot) {
      slot.addEventListener('click', function () {
        if (!interactive || !picked) return;
        var chip = picked;
        unpick();
        place(chip, slot);
      });
    });
    doc.addEventListener('keydown', function (e) {
      if (!interactive || !screen.classList.contains('is-active')) return;
      if (e.key === 'Escape') return unpick();
      if (!picked) return;
      var idx = ['1', '2', '3'].indexOf(e.key);
      if (idx === -1) return;
      var chip = picked;
      unpick();
      place(chip, roundSlots[idx]);
    });
    ['pointerdown', 'pointermove', 'keydown', 'wheel'].forEach(function (t) {
      global.addEventListener(t, function () { lastInput = performance.now(); }, { passive: true, capture: true });
    });

    /* the board's own pace, for its transitions and animations */
    doc.addEventListener('transitionrun', paceCss, true);
    doc.addEventListener('animationstart', paceCss, true);
    if (global.gsap) global.gsap.globalTimeline.timeScale(1 / PACE);

    /* the pacing hooks motion.js wants */
    Motion.bind({
      fast: function () { return fastForward; }
    });

    /* the mission's pause reaches the voice too */
    if (global.GeoLife) {
      global.GeoLife.on('suspend', suspendVoice);
      global.GeoLife.on('resume', resumeVoice);
    }

    buildSwiftee([el.boardMascot, el.hopper, el.flyer]);
    speaker(el.promptTxt, el.boardMascot);

    /* the heading row follows what it holds */
    new MutationObserver(askRooms).observe(el.board, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    [el.hopper, el.flyer].forEach(function (n) {
      new MutationObserver(askRooms).observe(n, { attributes: true, attributeFilter: ['class'] });
    });
    el.board.addEventListener('transitionend', askRooms);
    global.addEventListener('resize', askRooms);
    var resizeTimer = null;
    global.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(lockTrayHeight, 160);
    });
    global.addEventListener('resize', function () {
      screen.querySelectorAll('.zoomed[style*="--scene-zoom"]').forEach(function (n) {
        n.style.setProperty('--scene-zoom', zoomFor(n).toFixed(3));
      });
    });

    snapshot();
    shuffleDecks();
    lockInput(true);
  }

  /* What the start gate fetches for this screen: the board's artwork,
     the mascot's sheets and the clips. Each comes back as a blob: URL
     and is played or painted from memory. */
  function assets() {
    var out = [];
    var I = global.I18n;
    var keys = ['p02Shapes', 'p02DragNames', 'p02Formulas', 'p03Differ', 'p03Observe',
                'fbCorrect', 'fbWellDone', 'fbNotQuite'];
    keys.forEach(function (k) {
      var u = I && I.voiceKey ? I.voiceKey(k) : null;
      if (u) out.push({ url: u, apply: function (blob) { local[u] = blob; } });
    });
    swiftee.sheets().forEach(function (u) {
      /* the sheet decoded under the blob it will be painted from:
         the gate waits on it, so Swiftee never blinks on a first clip */
      out.push({ url: u, apply: function (blob) { local[u] = blob; return swiftee.warm ? swiftee.warm(u) : null; } });
    });
    if (screen) {
      var board = screen.querySelector('.board');
      var bg = board ? getComputedStyle(board).backgroundImage || '' : '';
      /* the url() it paints: an image-set() offers AVIF and WebP */
      var u2 = global.GeoLoad && global.GeoLoad.bgUrl
        ? global.GeoLoad.bgUrl(bg)
        : (/url\((["']?)(.*?)\1\)/.exec(bg) || [])[2];
      if (u2 && !/^(blob|data):/i.test(u2)) {
        out.push({ url: u2, apply: function (blob) {
          var probe = new Image();
          probe.src = blob;
          var done = probe.decode ? probe.decode().catch(function () {}) : Promise.resolve();
          return done.then(function () {
            board.style.backgroundImage = 'url("' + blob + '"), ' + cs(board, '--board-wash');
            board._geoBg = probe;
          });
        } });
      }
    }
    return out;
  }
  function cs(node, prop) { return getComputedStyle(node).getPropertyValue(prop).trim() || 'none'; }

  /* The screen back to its opening state: whatever page was playing is
     retired, its chain unwinds, and the board is as it was parsed. */
  function reset() {
    if (!inited) return;
    runToken++;
    pageIndex = -1;
    Motion.retire();
    clearStage();
  }

  /* Both pages, from the board arriving to the lesson's last Next.
     Resolves true then; false if the mission took the screen away.
     `opts.page` opens on a later page (see playTo): the scene tools'
     way into the middle of the lesson. */
  function run(opts) {
    if (!inited) return Promise.resolve(true);
    opts = opts || {};
    var page = Math.max(0, Math.min(PAGES.length - 1, opts.page | 0));
    var mine = ++runToken;
    fastForward = false;
    lockInput(true);

    return (async function () {
      await wait(200);
      await showBoard();
      lockTrayHeight();
      await wait(160);
      /* the rounds carry the page on: round 2's finish opens page 3,
         and page 3 ends on its Next. The chain comes back here only
         through that Next, so wait for it -- armed before anything
         plays, so a page reached by playTo() can never end unheard. */
      var done = new Promise(function (resolve, reject) {
        sceneWaiters.add(function () {
          if (mine !== runToken) reject(CANCELLED); else resolve();
        });
        onLessonDone = resolve;
      });
      sceneStart(0);
      if (page > 0) {
        /* not awaited: the fast-forward has to start while the warm-up
           is still opening, not once it has played its opening out.
           A teardown rejects it with CANCELLED, which is swallowed here
           as it is for every chain nobody waits on. */
        var opening = sceneWarmUp().catch(function (e) { if (e !== CANCELLED) throw e; });
        await playTo(page, mine);
        await opening;
      } else {
        await sceneWarmUp();
      }
      await done;
      return true;
    })().catch(function (e) {
      if (e === CANCELLED) return false;
      throw e;
    });
  }

  global.GeoLearn = {
    init: init, assets: assets, reset: reset, run: run,
    /* the scene tools' side */
    skip: skipScene,
    pages: function () { return PAGES.slice(); },
    setMuted: setMuted
  };
})(window);

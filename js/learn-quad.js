/* ============================================================
   Geo Drone — the quadrilaterals lesson (the second lesson screen)

   GENERATED from the learning module's js/script.js by
   tools/build_learn_quad.py -- edit the generator's patches, or this
   file by hand if the module will not be pulled again.

   Two pages of the learning module, played between the mission's
   two quadrilateral screens (the survey of the parallelogram, the
   rhombus and the trapezium, and their landing):

     page 4   the general quadrilateral, one diagonal: "What shape is
              this?" -- three names, one to tap; "This is a general
              quadrilateral." / "Let's try and find its area!"; the
              learner joins two corners to draw the diagonal, the
              halves shade, and each triangle's base and height are
              named and worked into ½ × b × (h₁ + h₂) -- "So this is
              the area of the quadrilateral!" -- and Next
     page 28  the trapezium's check for understanding: a trapezium
              of 30, 40 and 15 cm draws itself and takes its
              measurements; "What is the area of the trapezium?" --
              three answers, each verdict said from Swiftee's box --
              and the working solves itself to 525 sq. cm. Next
              brings the mission back

   The choreography is the module's own code, line for line: only
   the statements these two pages reach were carried over (a
   scope-aware pass over the module), and the module's chrome --
   its loader, its intro, its section menu and tools -- is the
   mission's now (SCENE TOOLS in js/script.js), reaching this screen
   through skip(), run({ page }) and setMuted() at the bottom, the
   same four calls js/learn.js answers.

   Everything the module looked up on the document it looks up on
   this screen: `document` below is a stand-in scoped to it, and
   every id in the screen's markup carries the prefix `lq-` so it
   can stand beside the first lesson's board without a clash.

   Words: every line is a KEY into locales/locales.json (T), and its
   clip is named by the locale's voice pack under the same key.
   ============================================================ */

(function (global) {
  'use strict';

  var PFX = 'lq-';
  var inited = false;
  var api = null;

  function lifeWait(ms) {
    return global.GeoLife ? global.GeoLife.wait(ms)
                          : new Promise(function (r) { setTimeout(r, ms); });
  }

  /* '#quizTray .chip' -> '#lq-quizTray .chip' */
  function scopeSel(sel) {
    return String(sel).replace(/#([A-Za-z][\w-]*)/g, '#' + PFX + '$1');
  }

  function init(opts) {
    if (inited || !opts || !opts.screen) return;
    inited = true;
    api = setup(opts.screen, opts);
  }

  function setup(SCREEN, hooks) {
  const realDoc = global.document;
  /* the module's document, narrowed to this screen */
  const document = {
    getElementById: id => realDoc.getElementById(PFX + id),
    querySelector: sel => SCREEN.querySelector(scopeSel(sel)),
    querySelectorAll: sel => SCREEN.querySelectorAll(scopeSel(sel)),
    getAnimations: () => SCREEN.getAnimations({ subtree: true }),
    createElement: (a, b) => realDoc.createElement(a, b),
    createElementNS: (a, b) => realDoc.createElementNS(a, b),
    createRange: () => realDoc.createRange(),
    createTreeWalker: (a, b, c) => realDoc.createTreeWalker(a, b, c),
    addEventListener: (a, b, c) => realDoc.addEventListener(a, b, c),
    removeEventListener: (a, b, c) => realDoc.removeEventListener(a, b, c),
    get body() { return realDoc.body; },
    get baseURI() { return realDoc.baseURI; },
    /* the palette and the type scale are written on the screen */
    documentElement: SCREEN
  };
  const window = global;
  const I18n = global.I18n;
  const Motion = global.Motion;
  const gsap = global.gsap;
  /* the clips the start gate fetched, as blob: URLs (assets, below) */
  const local = Object.create(null);
  const onPage = typeof hooks.onPage === 'function' ? hooks.onPage : null;
  let doneHook = null;
  function lessonDone() { const f = doneHook; doneHook = null; if (f) f(); }


  /* ---------- the language ----------
   * Every word the learner reads comes from locales-quadrilaterals.json
   * through I18n (i18n.js), chosen by ?lan=xx on the URL. T() is the one
   * lookup and the keys are the file's; index.html loads this script only
   * once the locale is in, so T() is good from the first line here. The
   * voice-over stays keyed by the ENGLISH line (VO_FILE): I18n.source()
   * takes a translated line back to it, see voKey. */
  const T = (key, repl) => I18n.t(key, repl);
  /* a measurement with its unit, in the language's own unit word */
  const CM   = n => n + ' ' + T('unitCm');
  const SQCM = n => n + ' ' + T('unitSqCm');
  /* A line with holes -- "Area of {name}" -- as the segments the working is
     typed from: the words round the hole follow the language's word order
     (Hindi puts the name first), and the filling keeps its highlight class.
     `nb` sets the words' own spaces as no-break spaces, so a long line
     wraps at an operator rather than inside "Area of". */
  function segsOf(tpl, fills, nb) {
    const sp = s => nb ? s.replace(/ (?=\S)/g, '\u00a0') : s;
    const segs = [];
    String(tpl).split(/(\{\w+\})/).forEach(part => {
      if (!part) return;
      const m = /^\{(\w+)\}$/.exec(part);
      if (m && fills && fills[m[1]] != null) {
        const f = fills[m[1]];
        segs.push(typeof f === 'string' ? { t: f } : Object.assign({}, f));
      } else {
        segs.push({ t: sp(part) });
      }
    });
    return segs;
  }
  /* the segments of a keyed line; the whole line is looked up once as well,
     so the voice-over knows the sentence the segments make */
  function TS(key, fills, nb) {
    const flat = {};
    Object.keys(fills || {}).forEach(k => { flat[k] = typeof fills[k] === 'string' ? fills[k] : fills[k].t; });
    T(key, flat);
    return segsOf(T(key), fills, nb);
  }
  /* "Area of <name>", the name carrying its highlight class; and the same
     after an "=" or a "+", for the sum lines -- set in no-break spaces
     where the line asks for them (`nb`), so the long sum wraps before an
     operator rather than leaving one dangling */
  const AREA_OF      = (name, w, nb) => TS('areaOf', { name: w ? { t: name, w: w } : name }, nb);
  const EQ_AREA_OF   = (name, w, nb) => [{ t: nb ? ' =\u00a0' : ' = ' }].concat(AREA_OF(name, w, nb));
  const PLUS_AREA_OF = (name, w, nb) => [{ t: nb ? ' +\u00a0' : ' + ' }].concat(AREA_OF(name, w, nb));

  /* Every beat of the game is paced through here, which is what makes Skip
     possible: while a skip is running each wait collapses to a single turn of
     the event loop, so a scene plays its whole choreography out in a handful
     of frames and lands in exactly the state it would have reached anyway. */
  let fastForward = false;

  /* Replay has to genuinely stop the scene in play -- a fast-forward will not
     do, because the abandoned chain would carry on writing to the board
     underneath the fresh one. So every wait belongs to the scene that started
     it, and rejects with CANCELLED once that scene has been retired, which
     unwinds the whole await chain of the scene being replaced. */
  const CANCELLED = { cancelled: 'scene replaced' };
  let runToken = 0;

  /* ---------- the pace ----------
   * One dial for how fast the screen changes (user, 2026-09-25: "a little
   * too fast"). Every scene beat (wait), every Web Animation, every GSAP
   * tween and every CSS transition or keyframe animation is stretched by it,
   * together, so the choreography keeps its shape and simply breathes more.
   * The voice-over is the one clock it does not touch: a line typed against
   * its clip still lands with the narrator (see typePieces, waitRaw). */
  const PACE = 1.25;

  const waitFor = scale => ms => new Promise(function (resolve, reject) {
    const mine = runToken;
    lifeWait(fastForward ? 0 : ms * scale).then(function () {
      if (mine !== runToken) return reject(CANCELLED);
      resolve();
    });
  });
  const wait    = waitFor(PACE);
  const waitRaw = waitFor(1);         /* a wait measured against the voice */

  /* the element's own animate(), and the stylesheet's, at the same pace */
  if (PACE !== 1) {
    /* Element.animate is shared with the whole mission, so the stretch is
       taken only by what is drawn on this screen: the camera, the islands
       and the other lesson keep their own clocks */
    const nativeAnimate = Element.prototype.animate;
    Element.prototype.animate = function (keyframes, opts) {
      if (!(this.closest && this.closest('.screen--learnq'))) return nativeAnimate.call(this, keyframes, opts);
      if (typeof opts === 'number') opts = opts * PACE;
      else if (opts && typeof opts === 'object') {
        opts = Object.assign({}, opts);
        ['duration', 'delay', 'endDelay'].forEach(k => {
          if (typeof opts[k] === 'number') opts[k] *= PACE;
        });
      }
      return nativeAnimate.call(this, keyframes, opts);
    };
    const paceCss = function (e) {
      const el = e.target;
      if (!el || !el.getAnimations || !el.closest || !el.closest('.screen--learnq')) return;
      el.getAnimations().forEach(function (a) {
        if (a.playbackRate !== 1 || !(a.transitionProperty || a.animationName)) return;
        a.playbackRate = 1 / PACE;
      });
    };
    document.addEventListener('transitionrun', paceCss, true);
    document.addEventListener('animationstart', paceCss, true);
  }

  /* A retired scene unwinds through whatever await chain it was in, and some
     of those chains are deliberately awaited by nobody -- a feedback line
     typing itself out, a round finishing on a timer. Their rejection has
     nowhere to go, so it is swallowed here rather than at a dozen call sites.
     Anything that is not a cancellation is left to surface as usual. */
  window.addEventListener('unhandledrejection', function (e) {
    if (e.reason === CANCELLED) e.preventDefault();
  });
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- the motion system ----------
   * js/motion.js holds every duration and easing the game uses, and every
   * animation it makes is tracked so the two things that interrupt a scene
   * can reach it. Handing it the two flags above is the whole of the join:
   *   token   a replay bumps it, and Motion.retire() kills what belonged to
   *           the scene that has just been retired
   *   fast    a skip raises it, and every duration asked of motion.js from
   *           then on collapses to nothing, exactly as wait() does
   * Both are read live, not copied, so motion.js always sees the truth. */

  /* ---------- the two answers ----------
   * A judged answer has always been marked by a class, and the class still
   * carries the colour -- green border, red tint -- because that is a state
   * the element stays in, not a movement. What the class no longer carries is
   * the movement: a pulse and a shake are the same length and the same curve
   * wherever in the mission they happen, they honour a skip and they honour
   * reduced motion, and all three of those come from motion.js rather than
   * from a keyframe rule repeated in six places.
   *   `part` is the piece that actually moves when the class goes on
   * something larger than the thing the eye follows: a card's box, a figure's
   * art, a drop-down's button. */
  const markRight = (el, part) => { el.classList.add('correct'); Motion.correct(part || el); };
  const markWrong = (el, part) => { el.classList.add('reject');  Motion.incorrect(part || el); };

  /* ---------- the half ----------
   * Every "½" in the lesson is drawn as a stacked fraction, a 1 over a bar
   * over a 2, the way it is written on paper. Text that may carry one goes
   * through setTxt(), which falls back to plain text when there is none. */
  const FRAC_HALF = '<span class="frac"><span class="num">1</span><span class="den">2</span></span>';
  const escHTML = str => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fracHTML = str => escHTML(str).split('½').join(FRAC_HALF);
  function setTxt(el, text) {
    if (text.indexOf('½') < 0) el.textContent = text;
    else el.innerHTML = fracHTML(text);
  }

  /* ---------- word by word ----------
   * The typewriters land a word at a time rather than a letter: these are
   * the places a text is cut, after each word together with the spaces that
   * follow it. Pacing stays per character, so a long word takes longer. */
  function wordCuts(text) {
    const cuts = [];
    const re = /\S+\s*/g;
    let m;
    while ((m = re.exec(text)) !== null) cuts.push(m.index + m[0].length);
    if (!cuts.length || cuts[cuts.length - 1] !== text.length) cuts.push(text.length);
    return cuts;
  }

  /* ---------- the words ease in ----------
   * A line is laid out whole, every word in a span of its own, and the words
   * are then shown one after another, each easing in where it already sits,
   * so nothing reflows as the line arrives. Pacing is per character, as the
   * typewriter's was: a long word holds the line a little longer. */
  const WORD_IN_MS = 200;      /* the tail of a line: its last word finishing */
  /* A line laid out whole from its segments: a span per segment (classed
     for its highlight) holding a span per word. A line with more than one
     "=" is set as a small table -- what comes before the first "=" in a
     left column, and every "= ..." step on a row of its own in the right --
     so the equals signs stand under each other and no row carries two.
     Returns, per segment, its spans (to light) and its words (to reveal,
     each with its cut into the segment's text for the pacing). */
  function lineSpans(root, segs) {
    root.textContent = '';
    root.classList.remove('eqgrid');
    const tokens = [];
    segs.forEach((seg, i) => {
      let from = 0;
      wordCuts(seg.t).forEach(cut => { tokens.push({ i: i, text: seg.t.slice(from, cut), cut: cut }); from = cut; });
    });
    const isEq = tok => tok.text.trim() === '=';
    const eqCount = tokens.filter(isEq).length;
    const split = eqCount > 1;
    const parts = segs.map(seg => ({ seg: seg, els: [], words: [] }));
    let holder = root, segEl = null, segAt = -1;
    const place = (tok, text) => {
      if (tok.i !== segAt || !segEl || segEl.parentNode !== holder) {
        segEl = document.createElement('span');
        if (segs[tok.i].w) segEl.className = 'w w-' + segs[tok.i].w;
        holder.appendChild(segEl);
        parts[tok.i].els.push(segEl);
        segAt = tok.i;
      }
      const sp = document.createElement('span');
      sp.className = 'wd';
      sp.dataset.t = text;
      setTxt(sp, text);
      segEl.appendChild(sp);
      parts[tok.i].words.push({ el: sp, cut: tok.cut });
    };
    const cell = cls => { const el = document.createElement('span'); el.className = cls; root.appendChild(el); return el; };
    if (!split) {
      /* one "=": what comes before it and the "= ..." after it are wrapped
         apart, inline, so a line too long for its column can break before
         the "=" (fitEq) instead of at a word */
      if (eqCount === 1) holder = cell('lhs');
      tokens.forEach(tok => {
        if (eqCount === 1 && isEq(tok)) holder = cell('rhs');
        place(tok, tok.text);
      });
      return parts;
    }
    root.classList.add('eqgrid');
    holder = cell('lhs');
    tokens.forEach(tok => {
      if (isEq(tok)) { holder = cell('rhs'); place(tok, tok.text.replace(/^\s+/, '')); }
      else place(tok, tok.text);
    });
    return parts;
  }
  /* a plain text is a line of one segment */
  const wordSpans = (el, text) => lineSpans(el, [{ t: text }])[0].words;
  /* show the words from `due`, each when its first character would have
     been typed; `alive` may say the line has been taken over. Resolves to
     the time the line is complete. */
  async function revealWords(words, due, perChar, alive, voiced) {
    /* at the game's pace -- unless the pace is the narrator's (`voiced`) */
    if (!voiced) perChar *= PACE;
    let from = 0;
    for (const w of words) {
      if (alive && !alive()) return due;
      const left = due + from * perChar - performance.now();
      if (left > 0) await waitRaw(left);
      w.el.classList.add('in');
      from = w.cut;
    }
    return due + from * perChar;
  }
  const wordsSettle = () => wait(REDUCED ? 0 : WORD_IN_MS);

  /* ---------- a sentence at a time ----------
   * A line is never shown whole: it is cut after every "," "!" "." (and
   * "?") that has more words after it, and the pieces are shown one after
   * another in the same box, each replacing the last (user, 2026-09-25).
   * The clip is still the whole line, said once: a piece gives way to the
   * next only when the narrator has reached the end of it.
   * "sq. cm" and the like are abbreviations, not the end of anything. */
  /* the boxes Swiftee speaks from, and the bird on its way out of one --
     filled in by speaker() further down (see "the line said, the speaker
     goes"), declared up here so every box can register as it is built */
  const SPEAKERS = new Map();
  let dismissing = null;
  let headKeepUntil = 0;   /* the heading's row stays open until then */

  const CHUNK_ABBR = /(?:^|[\s(])(?:sq|e\.g|i\.e|etc|vs|approx|चौ|ચો|సెం\.మీ|చ\.సెం\.మీ|ସେ\.ମି)\.$/i;
  const CHUNK_READ_MS = 700;   /* the beat on a piece when there is no voice */
  function chunkCuts(text) {
    const cuts = [];
    const re = /[,!.?।]+['’"”)]*\s+(?=\S)/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const mark = text.slice(0, m.index + 1);
      if (m[0][0] === '.' && CHUNK_ABBR.test(mark)) continue;
      /* a lone opener -- "So," "Now," -- is not a piece of its own: it
         stays with the sentence it opens (user, 2026-09-28) */
      const from = cuts.length ? cuts[cuts.length - 1] : 0;
      if (m[0][0] === ',' && !/\s/.test(text.slice(from, m.index).trim())) continue;
      cuts.push(m.index + m[0].length);
    }
    return cuts;
  }
  /* the line's segments, regrouped into its pieces: each piece is a list of
     segments (a highlight cut in two keeps its hue on both sides), and
     carries how many characters of the whole line it stands for */
  function segChunks(segs) {
    const whole = segs.map(sg => sg.t).join('');
    const cuts = chunkCuts(whole).concat(whole.length);
    const chunks = [];
    let piece = [], at = 0, c = 0;
    segs.forEach(seg => {
      let from = 0;
      while (c < cuts.length && cuts[c] <= at + seg.t.length) {
        const to = cuts[c] - at;
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
      .map(ch => {
        const len = ch.reduce((n, sg) => n + sg.t.length, 0);
        /* the spaces after a mark belong to the gap between two pieces,
           not to the end of the one on screen */
        const out = ch.map(sg => ({ t: sg.t, w: sg.w }));
        if (out.length) {
          out[0].t = out[0].t.replace(/^\s+/, '');
          out[out.length - 1].t = out[out.length - 1].t.replace(/\s+$/, '');
          /* each piece stands alone in its box, so it opens with a capital
             (user, 2026-09-25) -- a word, not a lone letter like side a */
        }
        const segs = out.filter(sg => sg.t);
        if (segs.length) segs[0].t = segs[0].t.replace(/^[a-z](?=[a-z’'])/, c => c.toUpperCase());
        return { segs: segs, len: len };
      })
      .filter(ch => ch.segs.length);
  }
  const sentenceChunks = text => segChunks([{ t: text }]).map(ch => ch.segs[0].t);
  /* the longest piece: what a box that holds one line at a time is sized to */
  const longestChunk = text => sentenceChunks(String(text))
    .reduce((a, b) => (b.length > a.length ? b : a), '');

  /* Wait for the narrator to reach `frac` of the way through the line. With
     nothing playing, the piece on screen is simply given time to be read. */
  function voiceAt(said, frac, readMs, cueAt) {
    const a = said && said.audio;
    if (!said || !said.playing || !a) return wait(readMs == null ? CHUNK_READ_MS : readMs);
    /* a clip with cues says exactly where its pieces begin (VO_CUES); one
       without is paced by the letters, `frac` of the way through */
    const at = (cueAt != null ? cueAt : said.length * frac) - 0.08;
    if (a.ended || a.paused || a.currentTime >= at) return Promise.resolve();
    return waitOrSkip(function (done) {
      let over = false;
      const end = function () {
        if (over) return;
        over = true;
        clearInterval(iv);
        clearTimeout(cap);
        a.removeEventListener('ended', end);
        a.removeEventListener('pause', end);
        done();
      };
      const iv = setInterval(function () {
        if (over || fastForward || a.ended || a.paused || a.currentTime >= at) end();
      }, 40);
      const cap = setTimeout(end, 15000);   /* never hang on a stalled clip */
      a.addEventListener('ended', end);
      a.addEventListener('pause', end);
    });
  }

  /* Type a line into a box a piece at a time. `said` is what voSay() gave
     back for the whole line; each piece is paced so its last word lands a
     little before the narrator finishes saying it, and is then held until
     they have. `pause` and `onWord` are the formula typewriter's: a beat and
     a callback each time a highlighted word completes. `alive` may say the
     box has been taken over by a newer line. Resolves false if it was. */
  async function typePieces(txt, segs, said, perChar, pause, onWord, alive) {
    const chunks = segChunks(segs);
    const total = Math.max(1, chunks.reduce((n, ch) => n + ch.len, 0));
    const a = said.playing && said.length > 0.5 ? said.audio : null;
    const cues = voCuesFor(said, chunks.length);
    let done = 0;
    for (let k = 0; k < chunks.length; k++) {
      const ch = chunks[k];
      if (k > 0) {
        await voiceAt(said, done / total, null, cues ? cues[k] : null);
        if (alive && !alive()) return false;
      }
      const chars = Math.max(1, ch.segs.reduce((n, sg) => n + sg.t.length, 0));
      const keys = ch.segs.filter(sg => sg.w).length;
      /* silent, the line keeps the game's pace (PACE); voiced, the
         narrator's position is the clock, not one of our own, so a piece
         started late still finishes with the voice */
      let pace = perChar * PACE, hold = pause * PACE;
      if (a && !a.paused && !a.ended) {
        /* with cues, the piece is typed to land at 82% of its own span */
        const target = cues
          ? cues[k] + ((k + 1 < chunks.length ? cues[k + 1] : said.length) - cues[k]) * 0.82
          : said.length * (done + ch.len * 0.82) / total;
        hold = pause;
        pace = Math.max(6, ((target - a.currentTime) * 1000 - pause * keys) / chars);
      }
      const parts = lineSpans(txt, ch.segs);
      let due = performance.now();
      for (const part of parts) {
        due = await revealWords(part.words, due, pace, alive, true);
        if (alive && !alive()) return false;
        if (part.seg.w) {
          const left = due - performance.now();
          if (left > 0) await waitRaw(left);
          part.els.forEach(el => el.classList.add('lit'));
          if (onWord) onWord(part.seg.w);
          due += hold;
        }
      }
      const left = due - performance.now();
      if (left > 0) await waitRaw(left);
      done += ch.len;
    }
    await wordsSettle();
    return !alive || alive();
  }

  /* The same for a box whose words are laid in all at once rather than
     typed -- a verdict, a nudge: each piece appears whole, and gives way to
     the next as the voice reaches it. The voice is voAlone's, so it may
     start a moment after the first piece does; `started` resolves with its
     state once it has. */
  const piecesGen = new WeakMap();
  async function showPieces(el, text, started, onPiece) {
    const g = (piecesGen.get(el) || 0) + 1;
    piecesGen.set(el, g);
    const live = () => piecesGen.get(el) === g;
    const chunks = segChunks([{ t: text }]);
    const total = Math.max(1, chunks.reduce((n, ch) => n + ch.len, 0));
    let said = null, cues = null, done = 0;
    for (let k = 0; k < chunks.length; k++) {
      if (k > 0) {
        if (!said) { said = await started; cues = voCuesFor(said, chunks.length); }
        if (!live()) return;
        await voiceAt(said, done / total, Math.max(CHUNK_READ_MS, chunks[k - 1].len * 55),
                      cues ? cues[k] : null);
        if (!live()) return;
      }
      /* a box that fits each piece is told which one is coming */
      if (onPiece) onPiece(chunks[k].segs.map(sg => sg.t).join(''));
      lineSpans(el, chunks[k].segs)[0].words.forEach(w => w.el.classList.add('in'));
      done += chunks[k].len;
    }
  }

  /* ---------- a line that solves itself ----------
   * A numerical working is one line that simplifies in place: "½ × 10 × 6"
   * becomes "5 × 6" becomes "30 sq. cm". Between steps only the words that
   * change cross-fade into their replacement while the line's width eases
   * with them, so the eye follows exactly what is being worked out. */
  const MORPH_MS = 900;             /* the .morph transitions, delay included */
  const MORPH_SLOW_MS = 1250;      /* a derivation step, taken slowly enough to follow */
  function tokensOf(text) {
    let from = 0;
    return wordCuts(text).map(cut => { const t = text.slice(from, cut); from = cut; return t; });
  }
  /* The tokens of a step. A plain string is one plain run; a step given as
     segments carries each segment's highlight into its tokens, so a word
     that names a part of the drawing keeps its colour when the line changes
     under it. */
  function stepTokens(step) {
    if (typeof step === 'string') return tokensOf(step).map(t => ({ t: t }));
    const out = [];
    step.forEach(seg => tokensOf(seg.t).forEach(t => out.push({ t: t, w: seg.w })));
    return out;
  }
  async function morphTo(el, text, whole, slow) {
    let wds = whole ? [] : Array.from(el.querySelectorAll('.wd'));
    const A = wds.map(w => (w.dataset.t || '').trim());
    const B = stepTokens(text), Bt = B.map(t => t.t.trim());
    let p = 0;
    while (p < A.length && p < Bt.length && A[p] === Bt[p]) p++;
    let q = 0;
    while (q < A.length - p && q < Bt.length - p && A[A.length - 1 - q] === Bt[Bt.length - 1 - q]) q++;
    /* `whole`: everything in the line -- drop-down boxes and all -- becomes the text */
    let oldMid = whole ? Array.from(el.children) : wds.slice(p, A.length - q);
    const newMid = whole ? B : B.slice(p, B.length - q);
    if (!oldMid.length && !newMid.length) return;
    /* The words that change must sit side by side in one parent. The spans
       they sit in -- one per segment, and a highlight is one of those -- are
       dissolved to get them there, but the two cells of a line set as
       "lhs = rhs" are left alone on the first pass: dissolving those would
       un-break a line that had broken before its "=", and the line would
       jump from two rows to one under the morph. A change that straddles
       both cells has nowhere else to go, and then they go too. */
    const isCell = w => w.classList.contains('lhs') || w.classList.contains('rhs');
    let parents = new Set(oldMid.map(w => w.parentNode));
    if (!whole && parents.size > 1) {
      const dissolve = keepCells => {
        parents.forEach(w => {
          if (w === el || (keepCells && isCell(w))) return;
          while (w.firstChild) w.parentNode.insertBefore(w.firstChild, w);
          w.remove();
        });
        wds = Array.from(el.querySelectorAll('.wd'));
        oldMid = wds.slice(p, A.length - q);
        parents = new Set(oldMid.map(w => w.parentNode));
      };
      dissolve(true);
      if (parents.size > 1) dissolve(false);
    }
    const holder = document.createElement('span');
    holder.className = 'morph' + (whole ? ' whole' : '') + (slow ? ' slow' : '');
    const at = oldMid.length ? oldMid[0] : (wds[p] || null);
    if (at) at.parentNode.insertBefore(holder, at); else el.appendChild(holder);
    const oldLayer = document.createElement('span');
    oldLayer.className = 'm-old';
    oldMid.forEach(w => oldLayer.appendChild(w));
    const newLayer = document.createElement('span');
    newLayer.className = 'm-new';
    /* a run of tokens under one highlight shares its wrapper, so the colour
       arrives as one word and not a colour per word */
    const fresh = [];
    let wrap = null;
    newMid.forEach(tok => {
      const sp = document.createElement('span');
      sp.className = 'wd in';
      sp.dataset.t = tok.t;
      setTxt(sp, tok.t);
      if (!tok.w) { wrap = null; newLayer.appendChild(sp); fresh.push(sp); return; }
      if (!wrap || wrap.dataset.w !== tok.w) {
        wrap = document.createElement('span');
        wrap.className = 'w w-' + tok.w + ' lit';
        wrap.dataset.w = tok.w;
        newLayer.appendChild(wrap);
        fresh.push(wrap);
      }
      wrap.appendChild(sp);
    });
    holder.append(oldLayer, newLayer);
    const w1 = oldLayer.getBoundingClientRect().width, w2 = newLayer.getBoundingClientRect().width;
    holder.style.width = w1 + 'px';
    void holder.offsetWidth;
    holder.classList.add('go');
    holder.style.width = w2 + 'px';
    sfx('click', .25);
    await wait(REDUCED ? 60 : (slow ? MORPH_SLOW_MS : MORPH_MS));
    fresh.forEach(sp => holder.parentNode.insertBefore(sp, holder));
    holder.remove();
  }

  /* steps[0] is laid out and eased in like any line (a string, or segments
     with highlights); every later step is a string the line becomes */
  async function solveLine(el, steps, perChar, onWord) {
    const first = steps[0];
    const parts = lineSpans(el, typeof first === 'string' ? [{ t: first }] : first);
    let due = performance.now();
    for (const part of parts) {
      due = await revealWords(part.words, due, perChar);
      if (part.seg.w) {
        const left = due - performance.now();
        if (left > 0) await wait(left);
        part.els.forEach(x => x.classList.add('lit'));
        if (onWord) onWord(part.seg.w);
        due += AREA_PAUSE;
      }
    }
    const left = due - performance.now();
    if (left > 0) await wait(left);
    for (let i = 1; i < steps.length; i++) {
      await wait(REDUCED ? 200 : 1000);
      await morphTo(el, steps[i]);
    }
    await wordsSettle();
  }

  /* ---------- pieces ---------- */
  const board       = document.getElementById('board');
  const promptGhost = document.getElementById('promptGhost');
  const promptType  = document.getElementById('promptType');
  const promptTxt   = promptType.querySelector('.txt');
  const caret       = promptType.querySelector('.caret');
  const fx          = document.getElementById('fx');
  const inputLock   = document.getElementById('inputLock');

  /* ---------- palette ----------
   * style.css is the only place a colour is written down, so anything the
   * script needs to paint is read back out of the custom properties rather
   * than repeated here. */
  const rootStyle = getComputedStyle(document.documentElement);
  const token = name => rootStyle.getPropertyValue(name).trim();

  const CONFETTI = [1, 2, 3, 4, 5, 6]
    .map(n => token('--confetti-' + n))
    .filter(Boolean);

  /* ---------- Swiftee ----------
   * One player driving the welcome cut-out, the intro's centre-stage bird, the
   * bird beside the board's heading and the hopper that stands in for it
   * behind the board; at most one is visible at a time, so they can share a
   * clock -- and the moment two swap (the top of the jump) they are painting
   * the very same frame.
   *
   * Every sheet is a uniform grid whose frames all pivot on the cell centre,
   * which is what lets one expression cut to another without the character
   * shifting. A frame is selected by background-position in percentages, so
   * the selection is exact at any rendered size: with background-size set to
   * cols x rows of the box, column i sits at i/(cols-1) of the width.
   *
   * Frame counts, grids and the start -> loop -> stop triads all come from
   * swiftee-sheets.js, generated from the pipeline's manifest. */
  const swiftee = (function () {
    const S = window.SWIFTEE;
    const nodes = ['mascot', 'welcomeMascot', 'introMascot', 'hopper',
                   'quizMascot', 'sideMascot', 'factMascot', 'paraMascot',
                   'rhomMascot', 'rcMascot', 'rpMascot',
                   'trapMascot', 'rtrapMascot', 'rtrapPMascot', 'tcMascot', 'flyer']
      .map(id => document.getElementById(id))
      .filter(Boolean);

    if (!S || !nodes.length) {
      /* no assets, no mascot -- never a blocked mission */
      return { play() {}, hold() {}, release() {}, show() {}, ms: () => 0, preload: () => [] };
    }

    const FRAME_MS = 1000 / S.fps;
    const clipOf = name => S.clips[name];

    /* A sprite drawn bigger than its 256px cell -- Swiftee alone on the
       landscape in the intro, and the welcome cut-out -- is painted from the
       2x sheets, or it comes out soft. */
    const HI_MIN = S.cell * 1.1;
    const HI_DROP = S.cell * 0.94;      /* hysteresis, see below */
    const hiImg = img => img.replace('/1x/', '/2x/').replace('@1x', '@2x');

    /* ---------- sheets: fetched, decoded, and only then painted ----------
       Handing the compositor a url it has not finished reading paints nothing
       at all for a frame or two -- on a bird already on screen that is a blink
       out and back. decode() is the only thing that promises a paintable
       bitmap: an Image that merely reports `complete` has been downloaded, not
       decoded, and a 3584x3072 sheet is a long way from paintable at that
       point. The Image is kept alive so the decode is not thrown away again.
         `settled` means the fetch is over either way and the engine may move
       on; `ok` means there is actually a picture in it. A sheet that will not
       load is still settled, so one missing file can never freeze the bird. */
    const sheets = Object.create(null);         /* url -> { img, settled, ok } */
    function warm(url) {
      let s = sheets[url];
      if (s) return s.p;
      const img = new Image();
      s = sheets[url] = { img: img, settled: false, ok: false, p: null };
      const mark = () => { s.settled = true; s.ok = img.naturalWidth > 0; };
      const loaded = () => new Promise(res => {
        if (img.complete) return res();
        img.onload = img.onerror = res;
      });
      img.src = url;
      s.p = (img.decode ? img.decode().then(mark, () => loaded().then(mark))
                        : loaded().then(mark));
      return s.p;
    }
    const usable  = url => { const s = sheets[url]; return !!(s && s.settled && s.ok); };
    const settled = url => { const s = sheets[url]; return !!(s && s.settled); };

    /* Which sheet a sprite is drawn from is decided from the height the
       stylesheet gives it, which is readable while the sprite is still hidden
       -- offsetHeight is 0 then, and deciding off that meant every sprite was
       revealed at 1x and swapped up to 2x a beat later, in full view of the
       learner. getBoundingClientRect() is not used either: it reports the
       TRANSFORMED height, so a squash or a spring mid-jump would flip the
       sheet and back. The threshold has a dead band -- once big it stays big
       until well under -- so a sprite sitting right on the line cannot
       oscillate between the two sheets. */
    function measure(n) {
      const h = parseFloat(getComputedStyle(n).height) || n.offsetHeight || 0;
      if (!h) return;
      const hi = h > (n._hi ? HI_DROP : HI_MIN);
      if (hi !== n._hi) { n._hi = hi; n._clip = null; }   /* re-pick the sheet */
      /* A sprite that settled for the 1x sheet because the 2x one was still
         coming down keeps it until its clip changes -- and the idle blink can
         hold for minutes. So while it is off screen, and only while it is off
         screen, let it take the better sheet as soon as there is one: nobody
         can see that swap, and it is one the learner would otherwise see the
         moment the sprite is revealed. */
      if (n._hi && n._url && n._url.indexOf('@2x') < 0 && !n.offsetHeight &&
          usable(hiImg(n._url))) n._clip = null;
    }
    function measureAll() { nodes.forEach(measure); }

    /* The sheet for one sprite and one clip, or null if nothing is paintable
       yet -- in which case the caller holds the frame already on screen rather
       than blanking the box. The big sheet is only fetched for a sprite that
       is really rendered: the landscape bird is always sized for 2x, but it
       spends most of the mission behind a display:none and has no business
       pulling down a 2x sheet of every expression the board plays. */
    function pick(n, d) {
      if (n._hi) {
        const big = hiImg(d.img);
        if (usable(big)) return big;
        if (n.offsetHeight) warm(big);
      }
      warm(d.img);
      return settled(d.img) ? d.img : null;
    }

    let program = [];    /* steps still to run: { clip, repeat } */
    let step = null;
    let frame = 0;
    let pass = 0;
    let accum = 0;
    let lastT = 0;

    /* Write only what actually changed. The frame moves at 20fps but this runs
       on every animation frame, and re-assigning the sheet's url() three times
       per frame per sprite makes the engine resolve the image again 60 times a
       second: the loop stutters and drops frames instead of playing evenly.
       The position is the only property that normally moves at all.
         The sheet is chosen once per clip per sprite, never mid-clip: a url
       that changes under a bird already on screen is the whole flicker. Until
       the chosen sheet is decoded the sprite is left showing the last frame it
       painted -- a bird holding a pose for two frames is invisible next to a
       bird that vanishes for them. */
    function paint() {
      const d = clipOf(step.clip);
      const col = frame % d.cols;
      const row = (frame / d.cols) | 0;
      const px = d.cols > 1 ? (col / (d.cols - 1)) * 100 : 0;
      const py = d.rows > 1 ? (row / (d.rows - 1)) * 100 : 0;
      const size = (d.cols * 100) + '% ' + (d.rows * 100) + '%';
      const pos  = px + '% ' + py + '%';
      nodes.forEach(n => {
        if (n._clip !== step.clip) {
          const url = pick(n, d);
          if (!url) return;                 /* nothing paintable yet: hold */
          n._clip = step.clip;
          if (n._url !== url) {
            n._url = url;
            /* absolute: a relative url() inside a custom property resolves
               against the stylesheet that reads var(--sw-img) -- css/ --
               not against this page */
            n.style.setProperty('--sw-img', 'url("' + new URL(url, document.baseURI).href + '")');
          }
          /* A sprite that is held back until there is something in it (the
             welcome cut-out) is let through here and only here: the frame it
             becomes visible on is the frame a decoded sheet lands in it, so
             it is never an empty box that fills in. Asked of the element
             rather than remembered, so a teardown that puts a sprite's
             classes back the way it found them cannot leave it hidden. */
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
      /* a clip boundary is the one moment a sprite may change sheet without
         it showing, so it is also the moment its size is worth re-reading */
      if (step) { measureAll(); paint(); }
    }

    let measuredT = 0;
    function tick(t) {
      requestAnimationFrame(tick);
      if (!step) return;
      /* Sizes are re-read at every clip boundary, but an idle loop can hold
         for minutes; a slow sweep catches a sprite resized or made ready in
         between. Off the hot path: a couple of layout reads a second. */
      if (t - measuredT > 500) { measuredT = t; measureAll(); }
      if (!lastT) lastT = t;
      let dt = t - lastT;
      lastT = t;
      /* a backgrounded tab hands back one enormous delta; spend one frame on
         it rather than fast-forwarding the whole animation */
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

    /* Play the full triad the animator drew: start once, loop `passes` times,
       stop once, then settle back to the idle blink. Cutting straight from one
       loop into another skips the transition and reads as a jerk. */
    function build(state, passes) {
      const st = S.states[state];
      const tail = { clip: S.idle, repeat: Infinity };
      if (!st) return [tail];

      const p = [];
      if (st.start) p.push({ clip: st.start, repeat: 1 });
      p.push({ clip: st.loop, repeat: passes });
      if (st.stop) p.push({ clip: st.stop, repeat: 1 });
      p.push(tail);
      return p;
    }

    /* how long a one-shot reaction takes, so a caller can wait it out */
    function ms(state, passes) {
      const st = S.states[state];
      if (!st) return 0;
      let f = st.start ? clipOf(st.start).frames : 0;
      f += clipOf(st.loop).frames * (passes === undefined ? 1 : passes);
      f += st.stop ? clipOf(st.stop).frames : 0;
      return f * FRAME_MS;
    }

    requestAnimationFrame(tick);
    window.addEventListener('resize', measureAll);
    program = build(null, 1);
    advance();

    return {
      /* a one-shot reaction that settles back to idle on its own */
      play(state, passes) {
        program = build(state, passes === undefined ? 1 : passes);
        accum = 0;
        advance();
      },
      /* an expression held open until release() -- used while a clip narrates */
      hold(state) {
        program = build(state, Infinity);
        accum = 0;
        advance();
      },
      /* let the held loop finish its current pass, then run its stop clip */
      release() {
        if (step && step.repeat === Infinity && step.clip !== S.idle) {
          step.repeat = pass + 1;
        }
      },
      /* Sprites reveal themselves on their first decoded frame (see paint);
         this is the manual override, and painting first keeps the guarantee
         that nothing is shown before there is something in it. */
      show(on) {
        if (on && step) paint();
        nodes.forEach(n => n.classList.toggle('show', !!on));
      },
      ms: ms,
      /* Fetch and decode every 1x sheet, and the 2x sheets of the clips a
         sprite is ever drawn big enough to need them for -- the welcome
         cut-out and the landscape bird only ever blink, wave and talk. The
         loader waits on these, which is what makes every later sheet change a
         swap between two bitmaps the browser already holds. */
      preload() {
        const big = [S.idle].concat(
          ['waving', 'talking'].map(k => S.states[k]).filter(Boolean)
            .map(st => [st.start, st.loop, st.stop]).reduce((a, b) => a.concat(b), []))
          .filter(Boolean).map(k => hiImg(clipOf(k).img));
        return Object.keys(S.clips).map(k => S.clips[k].img).concat(big).map(warm);
      }
    };
  })();

  /* ---------- rows that give up their room ----------
   * The heading row and each section's foot are only as tall as what they
   * show: an empty row closes and the stage above takes the room, so the
   * shape grows; the row opens again when a line, a quiz or Swiftee arrives
   * in it. The height is set in pixels and transitioned, so the change is
   * smooth. Sized from the visible occupants after every class change in
   * the board, every finished transition, and a resize. */
  const rooms = Array.from(document.querySelectorAll('.prompt-row, .quad-foot, .para-foot, .rhom-foot, .trap-foot, .rtrap-foot'));
  /* the spots a jump now in the air is leaving and bound for; empty when the
     bird is standing somewhere. Set by the jumps themselves, further down. */
  let birdTrip = [];
  function roomShown(el) {
    if (el.hidden || el.classList.contains('off')) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }
  function roomHeight(room) {
    if (room.classList.contains('prompt-row')) {
      /* Open while a line is showing, while Swiftee stands in it, or while a
         jump with this row at one end of it is in the air -- the hopper
         carries the bird behind the board, the flyer carries it across the
         board, and for those few hundred milliseconds neither spot holds it.
         Counting only the spots made the row snap shut and straight back open
         on every hop, which pumped the whole board.
           Which end the jump has matters: a bird coming down to a foot of a
         section, over a heading with nothing in it, would otherwise open this
         row for the length of its jump and shut it again on landing -- the
         board's whole contents dropping and rising under the bird in the air.
         So the room is held only for a trip this row is part of. */
      /* A scene may keep the row for its whole length whatever is standing in
         it. The warm-up does: its heading arrives after the shapes are drawn
         and clears again as the sides are named, and letting the row open and
         fold around that took the shapes 122px down the board and back up
         again (user, 2026-09-18). Held, the bay is its final size from the
         first frame and nothing in the scene ever moves. */
      if (board.classList.contains('head-held')) return room.firstElementChild.offsetHeight;
      /* a line cleared between two lines of one explanation: see speakerDone */
      if (performance.now() < headKeepUntil) return room.firstElementChild.offsetHeight;
      const txt = room.querySelector('.txt');
      const hop = document.getElementById('hopper');   /* declared further down: looked up, not closed over */
      const fly = document.getElementById('flyer');
      const bird = document.getElementById('mascot');
      const flying = (hop && hop.classList.contains('on')) || (fly && fly.classList.contains('on'));
      const here = (bird && bird.classList.contains('in')) ||
                   (flying && birdTrip.indexOf(bird) >= 0);
      return (txt && txt.childNodes.length) || here ? room.firstElementChild.offsetHeight : 0;
    }
    /* A foot may keep a row of its OWN above the cell the rest share --
       Swiftee's box in the parallelogram's sides -- and then the room is that
       row plus the cell plus the gap between them, not the taller of the two.
       Every other foot has one cell and falls through to the max. */
    let h = 0, top = 0;
    for (const child of room.children) {
      if (!roomShown(child)) continue;
      if (child.classList.contains('room-row')) top = Math.max(top, child.offsetHeight);
      else h = Math.max(h, child.offsetHeight);
    }
    if (!top) return h;
    return h ? top + h + (parseFloat(getComputedStyle(room).rowGap) || 0) : top;
  }
  /* A room opens the moment it has something to show and closes on a short
     delay. Every close is a half-second transition of the board's whole
     layout, so one taken and given back inside a few frames -- the gap
     between one animation handing over to the next -- reads as a flicker.
     Waiting a beat before closing means only a room that is really finished
     with ever moves; a room that fills again in the meantime never moved at
     all. Opening is never delayed: arrivals are what the room is for. */
  /* ---- the one place the game still animates a layout property ----
     Everything else moves on transform and opacity alone. A room cannot:
     it is an accordion, and the whole point of it is that the rows below
     move up as it folds. A transform does not move anything below it, and
     a scale would squash whatever is standing inside the room instead of
     closing the room around it -- which is why GSAP's Flip, offered a box
     that has to change size with live content in it, is not a way out here
     either. The height of these rooms is the layout; animating it IS the
     effect. The rooms are few, they are siblings on one grid, and only one
     of them moves at a time, so the reflow is bounded and predictable.
       The same reasoning covers the .slot rule in style.css, which
     transitions height, margin-top and border-width when a round changes
     the shape of its dock. */
  const ROOM_CLOSE_DELAY = 360;
  let roomsDue = 0;
  const roomClose = new Map();
  function setRoom(room, h) {
    const v = Math.round(h) + 'px';
    if (room.style.height !== v) room.style.height = v;
    room.classList.toggle('closed', !h);
  }
  function fitRooms() {
    roomsDue = 0;
    rooms.forEach(room => {
      const h = roomHeight(room);
      const pending = roomClose.get(room);
      if (h) {                                   /* occupied: open it now */
        if (pending) { clearTimeout(pending); roomClose.delete(room); }
        setRoom(room, h);
        return;
      }
      if (room.style.height === '0px' || pending) return;   /* already shut, or on its way */
      roomClose.set(room, setTimeout(() => {
        roomClose.delete(room);
        if (!roomHeight(room)) setRoom(room, 0);   /* still empty a beat later */
      }, ROOM_CLOSE_DELAY));
    });
  }
  const askRooms = () => { if (!roomsDue) roomsDue = requestAnimationFrame(fitRooms); };
  /* A room whose occupants have all gone, shut at once rather than eased
     shut: for a layout that is about to be measured with the room in it.
     The quadrilateral's glide back to the middle measures the shape's new
     place under the quiz's foot, and over a foot still closing that place
     was a squashed one -- the shape glided down to it and was then stretched
     back as the foot finished closing (user, 2026-09-29). */
  function shutRoomNow(room) {
    const pending = roomClose.get(room);
    if (pending) { clearTimeout(pending); roomClose.delete(room); }
    room.style.transition = 'none';
    setRoom(room, 0);
    void room.offsetHeight;
    room.style.transition = '';
  }
  if (rooms.length) {
    new MutationObserver(askRooms).observe(board, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    /* the hopper carries the bird on and off the board from outside it, and
       the flyer carries it from spot to spot over it: both live outside the
       board, so neither is covered by the observer above */
    ['hopper', 'flyer'].forEach(id => {
      const el = document.getElementById(id);
      if (el) new MutationObserver(askRooms).observe(el, { attributes: true, attributeFilter: ['class'] });
    });
    board.addEventListener('transitionend', askRooms);
    window.addEventListener('resize', askRooms);
    fitRooms();
  }

  /* ---------- audio ---------- */
  /* Effects play off clones so overlapping hits never cut each other short. */
  function sfx(key, volume) {
    if (fastForward) return;         /* a skip races past; it does not chime */
    /* muted, or this same cue already sounded a breath ago -- two chips
       docking together should chime once, not twice as loudly */
    if (!Motion.mayPlay(key)) return;
    const A = window.GeoAudio, name = SFX[key];
    if (A && name) A.sfx(name, { volume: volume === undefined ? 1 : volume });
  }
  const SFX = { correct: 'correct', wrong: 'wrong', confetti: 'cheer', click: 'click' };

  /* Duration is needed to pace the typewriter. Resolves to 0 if the file
     cannot be read, and the caller falls back to a fixed pace. */
  function durationOf(a) {
    return new Promise(resolve => {
      if (a.readyState >= 1 && isFinite(a.duration) && a.duration > 0) {
        return resolve(a.duration);
      }
      let settled = false;
      const off = () => {
        a.removeEventListener('loadedmetadata', done);
        a.removeEventListener('error', fail);
      };
      const done = () => {
        if (settled) return;
        settled = true; off();
        resolve(isFinite(a.duration) && a.duration > 0 ? a.duration : 0);
      };
      const fail = () => {
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
   * Every spoken line in the mission has a clip of its own under assets/VO,
   * cut from the master recordings and named for the page it belongs to
   * (P04-06-lets-try-and-find-its-area.webm, Opus). Pages 1-8 are cut from the
   * newer recording (voice 1-2.mp3); the rest still play the older voice
   * until they are recorded again.
   *
   * The clips are keyed by THE LINE ITSELF rather than by the call site, and
   * that is the whole of the wiring:
   *   - a line said on six pages -- "That's Correct!" -- finds its clip
   *     wherever it is typed, without six bindings,
   *   - a line built at run time -- "Try again! Join the left and right
   *     corners.", "...fit together to make a parallelogram!" -- finds its
   *     own the same way, because the built string is what is looked up,
   *   - and a scene never names a file. It types its line exactly as it
   *     always did; the voice comes with it.
   * Every box that shows a line goes through one of the typewriters below,
   * and each of those asks here first. A line with no clip types at its own
   * pace, silently, as it did before there was a recording.
   */
  /* The line as it is written on screen, lower-cased with its typographic
     quotes flattened -- so the map can be read against the source, and a
     line that only differs by a curly apostrophe still finds its clip. */

  /* The same line with its punctuation set aside. A comma that became a
     full stop -- "different. But" for "different, but" -- or a dropped
     exclamation mark is still the same sentence to the ear, so a line that
     misses the map on its exact words is looked up once more this way. The
     exact key is always tried first: "That's Correct" and "That's Correct!"
     keep their own clips. */

  /* Where each piece of a line begins in its clip, in seconds from the
     clip's start, measured off the recording's word timings (the part-2
     re-recording, 2026-09-30). A piece then gives way to the next exactly as
     the narrator reaches it, rather than at a guess made from the letters it
     has. Piece 0 is at 0; only clips with more than one piece are listed. A
     clip whose count does not match the line's pieces is paced by the
     letters, as before (voCuesFor). */
  const VO_CUES = {
    p30Wrong1050: [0.0, 1.89],
    p30Wrong450:  [0.0, 1.21, 3.86],
    p30Right:     [0.0, 1.23]
  };
  function voCues(text) {
    const url = voStem(text);
    const stem = url && url.replace(/[?#].*$/, '').replace(/^.*\//, '').replace(/\.[a-z0-9]+$/i, '');
    return (stem && VO_CUES[stem]) || null;
  }
  function voCuesFor(said, pieces) {
    const c = said && said.cues;
    return c && c.length === pieces && c.every(t => t != null) ? c : null;
  }

  /* A line with no clip is typed in silence, as it always was -- but it is
     also named once in the console, so a line whose words drift away from
     its key is found by playing the page rather than by ear. */
  const voMissed = Object.create(null);
  /* the clip a line has, if it has one -- exact words first, then loose */
  function voHas(text) {
    return I18n.voice(text);
  }
  function voStem(text) {
    const key = String(text);
    const stem = voHas(text);
    if (!stem && !voMissed[key]) {
      voMissed[key] = true;
      const part = voFallback(text);
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[VO] no clip for: ' + text + (part ? ' (saying "' + part.text + '")' : ''));
      }
    }
    return stem;
  }

  /* A line with no clip of its own whose first sentence has one -- a
     verdict that was never recorded in full, "That's Correct! The base is
     8 cm." -- is not left silent: its first sentence is said, and the rest
     of the line follows on screen once that clip has ended, at the game's
     own pace. The verdict is heard; the reason is read. The pieces the line
     will be shown in are counted here so the clip can be cued to the first
     of them alone (see voSay). */
  function voFallback(text) {
    const cuts = chunkCuts(text);
    if (!cuts.length) return null;
    const first = text.slice(0, cuts[0]).trim();
    return first && voHas(first) ? { text: first, pieces: cuts.length + 1 } : null;
  }

  /* Built on first use and kept: a line said again -- on this page or six
     pages later -- plays the element it played the first time. */
  const voBank = Object.create(null);
  let voNow = null;                    /* the one clip that may be sounding */

  function voFor(text) {
    const stem = voStem(text);
    if (!stem) return null;
    let a = voBank[stem];
    if (!a) {
      /* played from memory when the start gate fetched it (assets()) */
      a = new Audio(local[stem] || stem);
      a.preload = 'auto';
      voBank[stem] = a;
    }
    return a;
  }

  /* Nothing is playing: the typewriter keeps the pace it was given. */
  const VO_SILENT = { audio: null, playing: false, length: 0 };

  /* Start the clip for a line, if this line has one and this is a moment to
     play it. Resolves to what the typewriter needs to pace itself against.
     Silence is never a failure -- muted, skipped, missing, blocked, or the
     scene torn down while the metadata was being read -- and the caller
     simply falls back to its own pace. */
  async function voSay(text) {
    if (fastForward || Motion.isMuted() || typeof text !== 'string') return VO_SILENT;
    let a = voFor(text), part = null;
    if (!a) {
      part = voFallback(text);
      if (!part) return VO_SILENT;
      a = voFor(part.text);
      if (!a) return VO_SILENT;
    }
    const mine = runToken;
    const length = await durationOf(a);
    /* a replay or a jump took the scene down while the header was read: this
       line is nobody's now, and it must not be heard over the new scene */
    if (mine !== runToken || fastForward || Motion.isMuted()) return VO_SILENT;

    silenceNow();                      /* one voice at a time */
    try {
      a.currentTime = 0;
      await a.play();
    } catch (e) {
      /* the browser is holding sound back until it has been asked for once:
         put the tap up, and carry on either way */
      if (!voGesture) return VO_SILENT;
      const got = await voGesture();
      if (mine !== runToken) return VO_SILENT;
      if (!got) return VO_SILENT;
      try { a.currentTime = 0; await a.play(); }
      catch (e2) { return VO_SILENT; }
    }
    voNow = a;
    if (part) {
      /* the clip is the first piece alone: that piece is typed across it,
         and every later piece is cued past the clip's end, so it waits for
         the clip to finish (voiceAt) and then keeps the game's pace */
      const cues = [0];
      while (cues.length < part.pieces) cues.push(length + 1);
      return { audio: a, playing: true, length: length, cues: cues };
    }
    return { audio: a, playing: true, length: length, cues: voCues(text) };
  }

  /* Hold the beat until the clip has finished, so the next line never talks
     over this one. A skip or a teardown releases it like any other wait. */
  function voHold(state) {
    const a = state.audio;
    if (!state.playing || !a || a.ended || a.paused) return Promise.resolve();
    return waitOrSkip(function (done) {
      const end = function () {
        a.removeEventListener('ended', end);
        a.removeEventListener('pause', end);
        done();
      };
      a.addEventListener('ended', end);
      /* A verdict or a nudge takes the voice over mid-sentence -- stopVoice()
         pauses this one. The beat that was waiting on it has to be let go
         here, or it would sit out the whole of the timeout below. */
      a.addEventListener('pause', end);
      setTimeout(end, 15000);          /* never hang on a stalled clip */
    });
  }

  /* A line that is shown all at once rather than typed -- a banner, a nudge,
     a verdict -- still gets its voice. It is not paced against anything, so
     unlike a typed line it can afford to wait its turn, and it does: a line
     queued behind one still being said follows it rather than talking over it.
     (A typed line still barges in: its clip has to start when its first word
     does, or the two would not be the same sentence any more.)
     The hold comes back, so the caller may wait for the line to be said or
     let it run on under whatever happens next. */
  let voQueue = Promise.resolve();
  let voRound = 0;                     /* bumped when the queue is emptied */
  function voAlone(text, onStart) {
    const mine = voRound;
    voQueue = voQueue.catch(() => {}).then(function () {
      /* the scene went down, or was skipped, while this line waited its
         turn: it belongs to nobody now and is simply dropped */
      if (mine !== voRound) { if (onStart) onStart(VO_SILENT); return; }
      return voSay(text).then(function (st) {
        if (onStart) onStart(st);        /* the pieces on screen follow it */
        return voHold(st);
      }, function () { if (onStart) onStart(VO_SILENT); });
    });
    return voQueue;
  }
  /* A line laid in whole and spoken over, a piece at a time: the words of
     each piece appear as the voice reaches them. Resolves once the line has
     been said and its last piece is on screen. */
  function sayPieces(el, text, onPiece) {
    let begin;
    const started = new Promise(res => { begin = res; });
    const said = voAlone(text, begin);
    const shown = showPieces(el, text, started, onPiece);
    return wordsSettle().then(() => Promise.all([said, shown]));
  }
  /* the mission's start gate has already been tapped: sound is unlocked */
  function voGesture() { return Promise.resolve(false); }

  /* ---------- input lock ---------- */
  let interactive = false;

  function lockInput(on, keep) {
    interactive = !on;
    inputLock.classList.toggle('on', !!on);
    /* Unlocking is the hand-over: Swiftee has finished saying its piece and
       the board is the learner's now, so the heading stands down (see
       headingAside). `keep` is for the one unlock that is not a question --
       the Next button. */
    if (!on && !keep) headingAside();
  }
  lockInput(true);

  /* Bumped when a scene opens and again when one reaches its hand-off. The
     scene in play is state rather than something read off a call stack: the
     chain is driven partly by the learner, since the drop that completes a
     round carries the game into the next scene by itself. */
  let sceneSeq = 0;

  /* the Next the mission is waiting on, if it is waiting on one */
  let pendingNext = null;

  /* How to re-enter the scene in play, so Replay runs the same code that
     played it the first time rather than a second, "from the top" path. */
  let sceneAgain = null;

  /* ---------- the mission, in order ----------
   * The scenes chain by calling one another, which says what follows what but
   * never lays the whole running order out in one place. The jump menu needs
   * exactly that, so here it is -- and the menu is built from it, so the two
   * cannot drift apart.
   *
   * The entries are function declarations, so they are all hoisted and defined
   * by the time this array is evaluated, however far down the file they sit. */
  const MISSION = [
    { entry: sectionThree,  name: 'secLessonQuad' },
    { entry: trapPractice3, name: 'secLessonTrapezium' }
  ];

  /* where we are in that order, and the stage every scene we have opened was
     opened on -- which is what lets one be gone back to exactly */
  let sceneIndex = -1;
  const sceneOpened = new Map();

  /* The scenes played so far, most recent last: { entry, stage }.
     `stage` is what the board looked like as the scene opened -- which is to
     say, what the scene before it left behind. Recording it is what makes Back
     possible: a scene's own code sets up its own stage, but only some scenes
     do (section 4 inherits the quadrilateral stage from section 3 and takes it
     as given), so where a scene starts from cannot be worked out from the
     scene alone. Taking the snapshot at the door is exact for all of them. */
  const sceneHistory = [];

  /* The tools stay up from the first scene to the last, the hand-offs
     included: with a Next waiting, Skip still means "move on", Replay still
     means "play that again" and Back still means "go back", so there is
     nothing to be gained by taking them away at exactly the moment a learner
     might want one.
     `again` is the scene's own re-entry point; a scene that passes none cannot
     be replayed, and Replay stays down for it. */
  function sceneStart(again) {
    headStay = false;   /* only the warm-up holds the heading; it sets this itself */
    birdStay = false;   /* ...and the trapezium pages hold the bird wherever it stands (holdBird) */
    sceneSeq++;
    noteScene(again, stageNow());
  }

  /* Where we are, and what the board looked like when we got here.
     The history is kept as a path through the mission rather than a browser
     trail: arriving somewhere we have already been truncates back to it, so
     Back always means the section before this one. That also makes a replay a
     no-op on the history, since it finds itself already on the end. */
  function noteScene(entry, stage) {
    sceneAgain = entry || null;
    if (!entry) return;

    sceneIndex = MISSION.findIndex(function (m) { return m.entry === entry; });
    sceneOpened.set(entry, stage);

    const at = sceneHistory.findIndex(function (h) { return h.entry === entry; });
    if (at !== -1) sceneHistory.length = at + 1;
    else sceneHistory.push({ entry: entry, stage: stage });

    /* the mission's section menu hears where the lesson is */
    if (onPage && sceneIndex >= 0) onPage(sceneIndex);
  }

  /* A scene has reached its hand-off. Only the counter moves, which is what
     stops a skip that is still running; the tools stay where they are. */
  function sceneEnd() { sceneSeq++; }

  /* Waits that hang on an event rather than a clock -- so far, a voice-over
     running to its end. A skip resolves them at once. */
  const skipWaiters = new Set();

  function waitOrSkip(register) {
    return new Promise(function (resolve, reject) {
      const mine = runToken;
      /* released by a teardown rather than by what it was waiting for: the
         scene is gone, so the frame unwinds instead of running on */
      const done = function () {
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

  /* Web Animations run off the clock, not through wait(), so they are finished
     every frame for as long as the skip lasts -- which also catches the ones a
     scene creates while it unwinds. Endless ones (the caret's blink, a
     button's pulse) are left alone: finish() throws on them. */
  function flushAnimations() {
    /* the same for GSAP: everything motion.js has in the air lands where it
       was going, and anything started after this is built at nothing-length */
    Motion.skip();
    document.getAnimations().forEach(function (a) {
      const timing = a.effect && a.effect.getComputedTiming();
      if (!timing || timing.iterations === Infinity) return;
      try { a.finish(); } catch (e) { /* not finishable; leave it running */ }
    });
  }

  /* Stop the line that is sounding, and nothing else: this is one line
     handing the voice to the next, not the end of the talking. */
  function silenceNow() {
    if (voNow) {
      try { voNow.pause(); voNow.currentTime = 0; } catch (e) { /* nothing to stop */ }
      voNow = null;
    }
  }

  /* ...and this is the end of it: a skip, a jump, a replay or the sound
     being switched off. What is sounding stops, and the lines that were
     waiting their turn behind it are dropped rather than said later, over a
     scene that has moved on. */
  function stopVoice() {
    voRound++;
    silenceNow();
  }

  /* A scene waiting on the learner for something other than a round -- a
     drop-down, the diagonal -- leaves a way to answer it here, and a skip
     runs them all. */
  const skipFills = new Set();

  /* Waits that hang on the scene's own furniture rather than on a clock: the
     Next button, a corner join. A skip must NOT resolve these -- it stops at
     the Next button by design -- but a teardown has to, or the abandoned
     frame sits there for the rest of the session instead of unwinding at its
     next wait(). */
  const sceneWaiters = new Set();

  function waitForScene(register) {
    return new Promise(function (resolve, reject) {
      const mine = runToken;
      /* Resolving on a teardown would let the frame carry on -- past its
         Next and into the scene after, alongside the replay. Rejecting
         unwinds it instead, the way a retired wait() does. */
      const done = function () {
        sceneWaiters.delete(done);
        if (mine !== runToken) reject(CANCELLED); else resolve();
      };
      sceneWaiters.add(done);
      register(done);
    });
  }

  /* An animation's end, for a scene: a replay cancels the animation, which
     rejects .finished; that is caught here and the token decides what it
     meant. A retired scene throws CANCELLED and unwinds; a live one, whose
     animation was cancelled for its own reasons, carries on. */
  async function finished(a) {
    const mine = runToken;
    try { await a.finished; } catch (e) { /* cancelled: see below */ }
    if (mine !== runToken) throw CANCELLED;
  }
  const retired = function (mine) { if (mine !== runToken) throw CANCELLED; };

  async function skipScene() {
    if (fastForward) return;

    /* At a hand-off the scene is already over and the mission is waiting on
       the Next button, so there is no choreography left to race through: Skip
       means the same thing the learner means by pressing it. */
    if (pendingNext) { pendingNext.click(); return; }

    const from = sceneSeq;

    const token = runToken;

    fastForward = true;
    stopVoice();

    /* Never spin forever: if a scene ends up waiting on something a skip
       cannot reach, hand the game back at normal speed rather than leaving it
       stuck in fast-forward. A replay retires the token, which drops the skip
       at once rather than letting it fast-forward the fresh scene too. */
    const deadline = performance.now() + 8000;
    while (sceneSeq === from && runToken === token && performance.now() < deadline) {
      flushAnimations();
      releaseWaiters();
      Array.from(skipFills).forEach(function (fill) { skipFills.delete(fill); fill(); });
      await new Promise(function (r) { requestAnimationFrame(r); });
    }
    flushAnimations();

    fastForward = false;
  }

  /* ---------- replay ----------
   * The scene's furniture is put back to how the page was parsed, and its own
   * re-entry function is called again.
   *
   * What "put back" means is taken from the page rather than from each scene:
   * the class list and the child nodes of everything inside a scene container
   * are snapshotted at load, so restoring them undoes in one sweep every class
   * a scene turned on and removes everything it built for itself -- without
   * eight scenes each having to remember their own list, and without going
   * stale as the mission grows.
   *
   * The board itself, Swiftee and the mission chrome are left alone: Replay
   * re-enters one scene, not the whole mission.
   */
  const SCENE_ROOTS = ['quad', 'rtrap']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  const pristineClass = new Map();
  const bornWith = new Set();

  SCENE_ROOTS.forEach(function (root) {
    bornWith.add(root);
    root.querySelectorAll('*').forEach(function (el) {
      bornWith.add(el);
      pristineClass.set(el, el.getAttribute('class') || '');
    });
  });

  /* The inline properties the scenes park on things: hop offsets, the centred
     first triangle, a bubble mid-resize, a docked card's hidden state. Cleared
     one property at a time rather than by dropping the style attribute, so the
     sprite sheet custom properties on the mascots survive. */
  const PARKED = ['transform', 'opacity', 'width', 'height', 'left', 'top',
                  'right', 'bottom', 'max-height',
                  'visibility', 'transition', 'min-height', 'will-change'];

  function clearStage() {
    /* let go of anything blocked on the scene's own furniture, so its frame
       unwinds at its next wait() instead of waiting for a click that will
       never come */
    Array.from(sceneWaiters).forEach(function (done) {
      try { done(); } catch (e) { /* already gone */ }
    });
    sceneWaiters.clear();
    skipFills.clear();
    releaseWaiters();
    stopVoice();
    if (nextCtl) { nextCtl.abort(); nextCtl = null; }

    /* drop every animation still holding a forwards fill -- the two
       stand-ins that carry the bird between spots included, since they sit
       outside the stage and a hop cut short would leave one of them up */
    [document.querySelector('.stage'), hopper, flyer].forEach(function (root) {
      if (!root || !root.getAnimations) return;
      root.getAnimations({ subtree: true }).forEach(function (a) {
        try { a.cancel(); } catch (e) { /* already done with */ }
      });
    });
    hopper.classList.remove('on');
    flyer.classList.remove('on');
    birdTrip = [];                     /* nothing is in the air any more */

    /* an expression held open for a line that will not finish */
    swiftee.release();

    /* a card mid-drag rides on a copy pinned to the body */
    Array.from(document.body.children).forEach(function (el) {
      if (el.classList && el.classList.contains('chip') && el.classList.contains('ghost')) el.remove();
    });

    SCENE_ROOTS.forEach(function (root) {
      /* whatever the scene built for itself goes away again; taking only the
         top of each built subtree, since removing it takes its children too */
      Array.from(root.querySelectorAll('*')).forEach(function (el) {
        if (!bornWith.has(el) && bornWith.has(el.parentNode)) el.remove();
      });
      Array.from(root.querySelectorAll('*')).concat(root).forEach(function (el) {
        PARKED.forEach(function (prop) { el.style.removeProperty(prop); });
      });
    });

    /* and the classes it turned on -- the containers themselves excepted,
       since whether one is on screen at all was decided by an earlier scene
       and the scene being replayed takes it as given */
    pristineClass.forEach(function (cls, el) {
      if (cls) el.setAttribute('class', cls);
      else el.removeAttribute('class');
    });

    drag = null;

    /* every typewriter on the board, the heading included */
    feedbackGen++;
    document.querySelectorAll('.type .txt').forEach(function (t) { t.textContent = ''; });
    document.querySelectorAll('.type .caret').forEach(function (c) { c.hidden = true; });

    /* and every answer left in a drop-down written in the HTML: the class
       reset above puts the slot back to empty and dashed, so a value still
       sitting in it would read as an answer the learner never gave -- and
       would hide the box's "Tap here" */
    document.querySelectorAll('.dd-value').forEach(function (v) { v.textContent = ''; });

    /* neither Next belongs to the scene being replayed */
    pendingNext = null;
    [nextBtn].forEach(function (b) {
      if (!b) return;
      b.hidden = true;
      b.classList.remove('in', 'out');
    });

    board.classList.remove('cheer');
    fx.textContent = '';                  /* confetti still on the way down */
  }

  /* Which stage is on the board: which of the scene containers are up, and
     the board's own class, which is what decides between them. */
  const MASCOT_SPOTS = Array.from(document.querySelectorAll('.mascot'));

  function stageNow() {
    return {
      /* less the cheer: a round's celebration is still on the board when a
         skip carries the mission into the next scene, and a replay of that
         scene should not bring it back to stay */
      board: (board.getAttribute('class') || '').split(/\s+/).filter(function (c) { return c && c !== 'cheer'; }).join(' '),
      roots: SCENE_ROOTS.map(function (r) {
        return { cls: r.getAttribute('class') || '', aria: r.getAttribute('aria-hidden') };
      })
    };
  }

  function restoreStage(stage) {
    board.setAttribute('class', stage.board);
    SCENE_ROOTS.forEach(function (r, i) {
      const was = stage.roots[i];
      if (was.cls) r.setAttribute('class', was.cls); else r.removeAttribute('class');
      if (was.aria === null) r.removeAttribute('aria-hidden');
      else r.setAttribute('aria-hidden', was.aria);
    });
    /* Swiftee is never handed to a scene already standing on the board: a
       re-entry empties every typewriter, the heading included, and a bird put
       back on its spot here would stand beside an empty heading until the
       scene's first line. It waits behind the board instead and comes up with
       that line, exactly as it does the first time through. */
    MASCOT_SPOTS.forEach(function (m) { m.classList.remove('in'); });
  }

  /* ---------- opening: draw each shape, then pour the colour in ---------- */
  /* `lineMs`/`fillMs` let a scene draw slower than the mission's usual pace
     -- the values scene opens on the trapezium drawing itself and nothing
     else, so it takes its time over it */
  async function revealShape(shape, lineMs, fillMs) {
    const svg     = shape.querySelector('svg');
    const outline = shape.querySelector('.shape-outline');
    const fill    = shape.querySelector('.shape-fill');
    const wipe    = shape.querySelector('.wipe');

    let len = 4000;
    try { len = outline.getTotalLength() || len; } catch (e) { /* keep guard */ }
    outline.style.strokeDasharray = len;
    outline.style.strokeDashoffset = len;

    if (REDUCED) {
      outline.style.strokeDashoffset = 0;
      fill.style.opacity = 1;
      await wait(120);
      return;
    }

    /* a replay cancels whatever a scene left running, and a cancelled
       animation rejects; the scene is being torn down either way */
    await finished(outline.animate(
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: lineMs || 760, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }
    ));
    outline.style.strokeDashoffset = 0;

    /* the clip rect slides up from below the artwork, so the colour reads as
       rising into the outline rather than simply switching on */
    const h = (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.height) || 200;
    fill.style.opacity = 1;
    await finished(wipe.animate(
      [{ transform: 'translateY(' + h + 'px)' }, { transform: 'translateY(0px)' }],
      { duration: fillMs || 560, easing: 'cubic-bezier(.35,0,.25,1)', fill: 'forwards' }
    ));
  }

  /* ---------- typewriter ----------
   * Paced against a wall clock rather than a chain of timeouts, so a slow
   * frame costs nothing: the line always lands on time. */
  async function typeInto(txt, blink, text, totalMs) {
    await speakerUp(txt);
    /* the clip starts as the first word lands, and the line is typed across
       it a piece at a time: see voSay/typePieces/voHold */
    const said = await voSay(text);
    blink.hidden = true;
    await typePieces(txt, [{ t: text }], said, totalMs / Math.max(1, text.length), 0, null, null);
    await voHold(said);
    speakerDone(txt);
  }
  const typewrite = (text, totalMs) => { promptLine(text); return typeInto(promptTxt, caret, text, totalMs); };

  /* The heading's box is the line it shows, so Swiftee -- inside the same
     box -- stands right at the left end of the words wherever they centre. */
  function promptReserve(text) {
    /* lines never wrap and the row is as tall as Swiftee: there is nothing
       to reserve any more, the ghost simply starts the scene empty */
    promptGhost.textContent = '';
  }
  /* a ghost is built the way its live line is -- a span per word -- so the
     two lay out identically; a plain run can differ by a hair and wrap */
  /* bumped each time a line is staged: a wipe ordered before the staging
     (see headingDown) sees the count has moved on and leaves it alone */
  let promptStage = 0;
  const promptLine = text => { promptStage++; wordSpans(promptGhost, longestChunk(text)); };

  /* ---------- feedback in the heading ----------
   * Swiftee's reaction to a drop is not written anywhere on the board: the
   * heading keeps its instruction, and the answer is acknowledged by the
   * bird's own expression, the sound, and the chip's landing. The texts are
   * kept for the screen reader, which is told them through the live tag. */
  /* No "Try again" (user, 2026-09-30): a wrong answer is met by the sound,
     the shake, and -- wherever the page has one -- Swiftee's own sentence
     saying what is wrong, never by a stock line spoken over it. */
  const FEEDBACK = {
    right: T('fbCorrect'),
    done:  T('fbWellDone'),
    /* the bank's "Not quite!" (FB-04) -- not "Try again" -- for a page whose
       wrong answer has no sentence of its own, said and never typed */
    wrong: T('fbNotQuite')
  };
  let feedbackGen = 0;

  const quip = document.getElementById('quip');
  async function feedback(text, silent) {
    feedbackGen++;
    caret.hidden = true;
    quip.textContent = text;          /* announced, never shown */
    /* ...and spoken. Not waited for: the next chip may be on its way
       already, and a verdict that held the board up would be in the way.
       `silent`: the caller is about to say a sentence of its own that
       carries the verdict ("That's Correct! The base is 8 cm."), and a
       typed line barges in on whatever is sounding (voSay) -- so the
       generic clip is not started, or the two would cut each other off. */
    if (!silent) voAlone(text).catch(() => {});
  }

  /* ---------- a hint waits for the learner to stall ----------
   * A hand or ghost that shows what to do is for a learner who is stuck, not
   * one who is already reaching for the answer: every nudge waits until
   * NUDGE_IDLE has passed with no input at all, and waits again before it
   * repeats (review, 2026-09-25: after 6 seconds of inactivity, not from the
   * beginning). Any pointer or key counts as activity. */
  const NUDGE_IDLE = 6000;
  let lastInput = 0;
  ['pointerdown', 'pointermove', 'keydown', 'wheel'].forEach(t =>
    window.addEventListener(t, () => { lastInput = performance.now(); }, { passive: true, capture: true }));
  async function idleFor(signal, ms) {
    ms = ms || NUDGE_IDLE;
    const start = performance.now();
    while (!signal.done && !fastForward) {
      const idle = performance.now() - Math.max(lastInput, start);
      if (idle >= ms) return;
      await wait(Math.min(250, ms - idle));
    }
  }

  /* ---------- a scene comes forward ----------
   * Once Swiftee has said all it has to say and left the heading, the heading
   * row is held open (head-held) but stands empty above the scene. Folding it
   * would slide the whole scene up the board; instead the scene zooms into
   * it. It scales about its bottom centre, so it grows up into the empty
   * heading and out into the board's side padding, and whatever is under it
   * -- the warm-up's tray -- is never covered. A transform, so nothing
   * reflows, and a drag still lands: every hit test reads
   * getBoundingClientRect. Used by the warm-up's bay and the triangle lesson. */
  const ZOOM_MAX = 1.25;
  const ZOOM_RIM = 20;
  function zoomOut(el) {
    el.classList.remove('zoomed');
    el.style.removeProperty('--scene-zoom');
  }

  /* ---------- confetti ---------- */
  function confettiPiece() {
    if (!CONFETTI.length) return null;         /* no palette, no paint */
    const p = document.createElement('i');
    const w = 7 + Math.random() * 8;
    const h = 10 + Math.random() * 12;
    p.style.width  = w + 'px';
    p.style.height = h + 'px';
    p.style.background = CONFETTI[(Math.random() * CONFETTI.length) | 0];
    return p;
  }

  /* How a round is closed out: confetti rains down the whole screen rather
     than firing out of the slots that were just filled. */
  function skyConfetti(count, span) {
    if (REDUCED) return;
    const W = window.innerWidth;
    const H = window.innerHeight;

    for (let i = 0; i < count; i++) {
      const p = confettiPiece();
      if (!p) return;
      p.style.left = (Math.random() * W) + 'px';
      p.style.top = '0px';
      fx.appendChild(p);

      const from = -50 - Math.random() * 320;      /* staggered above the fold */
      const to   = H + 80;
      const sway = Math.random() * 170 - 85;       /* sideways drift as it falls */
      const spin = (Math.random() * 1440 - 720) | 0;
      const life = span * (0.66 + Math.random() * 0.5);
      const delay = Math.random() * span * 0.42;

      const step = (t, x, r) =>
        ({ transform: 'translate(' + x + 'px,' + (from + (to - from) * t) + 'px) rotate(' + r + 'deg)' });

      const a = p.animate([
        step(0, 0, 0),
        step(.33, sway * .65, spin * .33),
        step(.66, sway * -.35, spin * .66),
        step(1, sway, spin)
      ], { duration: life, delay: delay, easing: 'linear', fill: 'backwards' });

      a.onfinish = () => p.remove();
      a.oncancel = () => p.remove();
    }
  }

  function burst(el) {
    if (REDUCED) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    for (let i = 0; i < 34; i++) {
      const p = confettiPiece();
      if (!p) return;
      p.style.left = (cx - parseFloat(p.style.width) / 2) + 'px';
      p.style.top  = (cy - parseFloat(p.style.height) / 2) + 'px';
      fx.appendChild(p);

      const angle = (Math.random() * Math.PI * 2);
      const dist  = 70 + Math.random() * 190;
      const dx    = Math.cos(angle) * dist;
      const up    = Math.sin(angle) * dist - 90;      /* biased upward */
      const drop  = up + 150 + Math.random() * 190;   /* then gravity wins */
      const spin  = (Math.random() * 900 - 450) | 0;
      const life  = 900 + Math.random() * 600;

      const a = p.animate([
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: 'translate(' + dx * 0.85 + 'px,' + up + 'px) rotate(' + spin * 0.6 + 'deg) scale(1)',
          opacity: 1, offset: .55 },
        { transform: 'translate(' + dx + 'px,' + drop + 'px) rotate(' + spin + 'deg) scale(.85)',
          opacity: 0 }
      ], { duration: life, easing: 'cubic-bezier(.15,.6,.35,1)' });

      a.onfinish = () => p.remove();
      a.oncancel = () => p.remove();
    }
  }

  /* ---------- drag / drop plumbing ---------- */
  let drag = null;
  const boardMascot = document.getElementById('mascot');
  const hopper      = document.getElementById('hopper');
  const TYPE_MS  = 72;

  async function showBoard() {
    if (board.classList.contains('show')) return;
    board.classList.add('show');
    if (REDUCED) return wait(500);
    const a = board.animate([
      { transform: 'translateY(26px) scale(.955)', opacity: 0 },
      { transform: 'none', opacity: 1 }
    ], { duration: 640, easing: 'cubic-bezier(.2, .9, .3, 1.15)' });
    await finished(a);
  }

  /* Swiftee arrives on the board by jumping up from behind it and dropping
     onto its spot to the left of the heading.
     Two sprites share the jump: the hopper, painted under the board, does the
     rising half that starts hidden behind the board's top edge, and the
     in-board sprite does the falling half over it. They swap at the top of the
     arc, where both are fully clear of the board, and since one player paints
     both, the cut is invisible. */
  async function mascotJumpIn(target) {
    await birdFree();
    const spot = target || boardMascot;         /* the heading's, unless told otherwise */
    const m = spot.getBoundingClientRect();
    const b = board.getBoundingClientRect();
    if (!m.width || REDUCED) { spot.classList.add('in'); return; }

    const apexTop = b.top - m.height * .9 - 8;         /* the whole bird above the edge */
    const hideTop = b.top + 14;                        /* tucked just under it, covered */

    /* up from behind the board to the apex... */
    birdTrip = [spot];                          /* this jump's only end on the board */
    Object.assign(hopper.style, {
      left: m.left + 'px', top: hideTop + 'px', width: m.width + 'px', height: m.height + 'px'
    });
    hopper.classList.add('on');
    const rise = hopper.animate(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(' + (apexTop - hideTop) + 'px)' }],
      { duration: 380, easing: 'cubic-bezier(.2, .6, .35, 1)', fill: 'forwards' }
    );
    await finished(rise);

    /* ...hand over, and drop onto the spot with a little squash.

       The spot is measured AGAIN here rather than taken from the box read
       before the jump. The heading's row opens for the arriving bird and
       takes half a second to do it, so by the time the sprite reaches the
       apex its landing spot has slid down the board underneath it -- 55px,
       measured. Starting the fall from the stale box puts the in-board
       sprite somewhere other than where the hopper was left standing, and
       the swap paints the character in two places on consecutive frames:
       the flicker the hand-over is supposed to hide. Measured live, the two
       sprites share the same pixel and the cut is invisible again.

       The start of the fall is also written to the element before it is
       shown, so a frame painted before the animation's first sample cannot
       catch the bird sitting at its destination.

       The sideways part of the same slide is carried too: the fall starts
       at the hopper's left edge, not the spot's, and eases across on the
       way down -- the same hand-over rule hopBetween applies on landing.
       Compensating only the vertical put the sprite at the spot's NEW left
       on the swap frame: a sideways teleport right as the bird cleared the
       board. */
    const at = spot.getBoundingClientRect();
    const dx = m.left - at.left;
    const drop = apexTop - at.top;
    const from = 'translate(' + dx + 'px, ' + drop + 'px)';
    spot.style.transform = from;
    spot.classList.add('in');
    hopper.classList.remove('on');
    rise.cancel();
    const fall = spot.animate([
      { transform: from, easing: 'cubic-bezier(.45, 0, .85, .5)' },
      { transform: 'translateY(0) scale(1.06, .92)', offset: .8, easing: 'ease-out' },
      { transform: 'none' }
    ], { duration: Math.min(760, 320 - drop * .5), fill: 'forwards' });   /* longer drop, longer fall */
    /* the fill holds the last keyframe -- which is `none` -- so clearing the
       inline transform and dropping the animation changes nothing on screen */
    try { await finished(fall); } finally { spot.style.removeProperty('transform'); fall.cancel(); birdTrip = []; }
  }

  /* The way back: the flyer takes the sprite over from its spot on the very
     first frame, so the whole trip runs in screen coordinates -- the rise
     used to run on the in-board sprite, and a line cleared or a row folding
     under it mid-air dragged the bird sideways. It crouches and springs up
     to the apex over the board, hands over to the hopper there, and the
     hopper drops behind the board's top edge; the flyer is fixed to the
     screen, so it stands exactly where it was sent and no re-measure is
     needed at the swap.
     `onAirborne` fires the moment the spot is empty: the words a caller
     wants down go THEN, not before the jump, or the row re-centres and
     shoves the still-standing bird sideways first (see headingDown and
     dismissNow). It always fires, whichever way the trip ends. */
  async function mascotJumpOut(source, onAirborne) {
    const off = () => {
      const f = onAirborne; onAirborne = null;
      if (f) try { f(); } catch (e) {}
    };
    try {
      await birdFree();
      const spot = source || boardMascot;
      if (!spot.classList.contains('in')) return;      /* already gone */
      const m = spot.getBoundingClientRect();
      const b = board.getBoundingClientRect();
      if (!m.width || REDUCED) { spot.classList.remove('in'); return; }

      const apexTop = b.top - m.height * .9 - 8;
      const hideTop = b.top + 14;

      birdTrip = [spot];                          /* this jump's only end on the board */
      Object.assign(flyer.style, {
        left: m.left + 'px', top: m.top + 'px', width: m.width + 'px', height: m.height + 'px'
      });
      flyer.classList.add('on');
      spot.classList.remove('in');
      off();                       /* the spot is the flyer's now: words may go */
      const rise = flyer.animate([
        { transform: 'none', easing: 'ease-in' },
        { transform: 'translateY(6%) scale(1.06, .92)', offset: .24, easing: 'cubic-bezier(.2, .6, .35, 1)' },
        { transform: 'translateY(' + (apexTop - m.top) + 'px)' }
      ], { duration: 560, fill: 'forwards' });
      await finished(rise);

      /* hand over to the hopper at the apex, exactly where the flyer stands */
      Object.assign(hopper.style, {
        left: m.left + 'px', top: apexTop + 'px', width: m.width + 'px', height: m.height + 'px'
      });
      hopper.classList.add('on');
      flyer.classList.remove('on');
      rise.cancel();
      const fall = hopper.animate(
        [{ transform: 'translateY(0)' }, { transform: 'translateY(' + (hideTop - apexTop) + 'px)' }],
        { duration: 360, easing: 'cubic-bezier(.45, 0, .85, .5)', fill: 'forwards' }
      );
      await finished(fall);
      hopper.classList.remove('on');
      fall.cancel();
      birdTrip = [];
    } finally { off(); }
  }


  /* ---------- next button ----------
   * Pops up in the middle of the footer band and resolves on the click. The
   * pointer lock is lifted only while it is showing; by then every card of the
   * warm-up is docked and disabled, so nothing else can be touched. */
  const nextBtn = document.getElementById('nextBtn');

  /* the board's Next unless told otherwise; a scene with no board on screen
     passes the viewport-anchored one */
  let nextCtl = null;
  function showNext(which) {
    const b = which || nextBtn;
    /* the scene is over: a skip in flight stops here, and Skip stands down
       until the next scene opens */
    sceneEnd();
    /* the click handler belongs to this scene: a teardown takes it off, so a
       replay's own Next is not also answered by the one it replaced */
    if (nextCtl) nextCtl.abort();
    const ctl = nextCtl = new AbortController();
    return waitForScene(resolve => {
      b.hidden = false;
      void b.offsetHeight;
      b.classList.add('in');
      /* the heading stays: the scene is over, the transition that follows
         takes the bird down anyway, and folding the row for the second
         before it would only make the board jump twice */
      lockInput(false, true);
      b.focus({ preventScroll: true });
      pendingNext = b;

      b.addEventListener('click', () => {
        pendingNext = null;
        sfx('click', .6);
        lockInput(true);
        b.classList.remove('in');
        b.classList.add('out');
        setTimeout(() => {
          b.hidden = true;
          b.classList.remove('out');
        }, 320);
        resolve();
      }, { once: true, signal: ctl.signal });
    });
  }

  /* Grow a dashed line out from its first point. The dash pattern is anchored
     at (x1, y1), so moving the far end reveals the dashes one by one instead
     of scrolling them; a dash-offset draw would not work on a dashed stroke. */
  function growLine(line, ms) {
    if (!line) return Promise.resolve();
    const x1 = +line.getAttribute('x1'), y1 = +line.getAttribute('y1');
    const X2 = +(line.dataset.x2 || (line.dataset.x2 = line.getAttribute('x2')));
    const Y2 = +(line.dataset.y2 || (line.dataset.y2 = line.getAttribute('y2')));

    if (REDUCED) {
      line.setAttribute('x2', X2); line.setAttribute('y2', Y2);
      line.style.opacity = 1;
      return wait(80);
    }

    line.setAttribute('x2', x1); line.setAttribute('y2', y1);
    line.style.opacity = 1;
    const mine = runToken;
    return new Promise((resolve, reject) => {
      const t0 = performance.now();
      (function step(t) {
        if (mine !== runToken) return reject(CANCELLED);     /* a replay took the scene down */
        const p = fastForward ? 1 : Math.min(1, (t - t0) / ms);
        const e = 1 - Math.pow(1 - p, 3);                 /* ease-out cubic */
        line.setAttribute('x2', x1 + (X2 - x1) * e);
        line.setAttribute('y2', y1 + (Y2 - y1) * e);
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      })(t0);
    });
  }

  /* ---------- section 3 onward: quadrilaterals ----------
   * One board section serves every quadrilateral scene from here. Its svg is
   * rebuilt per scene from four corners and a chosen diagonal: the two
   * triangles that diagonal makes, each with its perpendicular height, foot
   * mark and label, are all worked out here rather than drawn by hand. The
   * triangles are told apart by colour -- never by lettered corners. */
  const quad       = document.getElementById('quad');
  const quadShape  = document.getElementById('quadShape');
  const quadSvg    = document.getElementById('quadSvg');
  const quadArt    = quadSvg.querySelector('.art');
  const quadRings  = quadSvg.querySelector('.qrings');
  const quadNames  = quadSvg.querySelector('.tnames');
  const quadDims   = quadSvg.querySelector('.dims');
  const quadDots   = document.getElementById('dots');
  const joinLine   = document.getElementById('joinLine');
  const demoG      = document.getElementById('demoJoin');
  const demoLine   = document.getElementById('demoLine');
  const demoHand   = document.getElementById('demoHand');
  const quizBlock  = document.getElementById('quizBlock');
  const quizMascot = document.getElementById('quizMascot');
  const quizChips  = Array.from(document.querySelectorAll('#quizTray .chip'));
  const quizBubble = document.getElementById('quizNote');
  const noteGhost  = document.getElementById('noteGhost');
  const noteType   = document.getElementById('noteType');
  const noteTxt    = noteType.querySelector('.txt');
  const noteCaret  = noteType.querySelector('.caret');
  const areaLinesEl = document.getElementById('areaLines');
  const flyer      = document.getElementById('flyer');

  let quadFill = null;         /* the whole-shape fill of the quadrilateral on the board */
  let quadCorners = null;      /* its four corners, clockwise from the top (ORDER) */
  let corners  = [];           /* the corner groups of the shape on the board */
  let CORNERS  = {};           /* corner key -> { x, y }, in the svg's units */
  const HIT  = 24;             /* how near a corner a release counts, in svg units */
  const NAME = { T: T('cornerTop'), R: T('cornerRight'), B: T('cornerBottom'), L: T('cornerLeft') };

  /* ---- the shapes ----
   * Corners are keyed by where they sit (top, right, bottom, left), which is
   * how Swiftee refers to them. A spec names the diagonal, and for each of
   * the two triangles it makes: the corner it reaches, its colour, and what
   * its height is labelled. */
  const PTS_A = { T: { x: 165, y: 10 }, R: { x: 323, y: 151 }, B: { x: 73,  y: 262 }, L: { x: 10,  y: 151 } };
  const ORDER = ['T', 'R', 'B', 'L'];

  /* section 3: the first quadrilateral, cut left to right... */
  const SPEC_A = {
    pts: PTS_A, diag: ['L', 'R'], base: T('labelBase'),
    tris: [{ apex: 'T', color: 'purple', label: T('labelHeight') }, { apex: 'B', color: 'green', label: T('labelHeight') }],
    /* the short names the labels take after their two-second look */
    short: { base: 'b', h: ['h₁', 'h₂'] },
    /* The names the working calls the two halves by, written in the empty
       corner each half leaves inside the frame -- `at` is where the name
       sits, `from` the point on its edge the curve leaves, `to` the point
       inside the half it arrives at, and `bow` how far the curve bulges.
       Given per scene rather than worked out, because where a name will fit
       is a matter of the shape it is drawn beside. */
    names: [
      { text: T('triangle1'), at: { x: 52, y: 30 },   from: { x: 74, y: 42 },   to: { x: 124, y: 92 },  bow: 16 },
      { text: T('triangle2'), at: { x: 256, y: 242 }, from: { x: 230, y: 232 }, to: { x: 182, y: 196 }, bow: 16 }
    ]
  };

  /* ---- Swiftee's lines ---- */
  const QUAD = {
    /* the bird asks from its box; the box under the sentence says "Tap here"
       and the hand beside it points at the arrow, so the line itself does
       not have to */
    ask:     T('p04WhatShape'),
    answer:  'quadrilateral',
    /* every remark carries the reason -- how many sides that shape has --
       so a choice is answered with the thing being taught, not with praise */
    notes: {
      triangle:      T('p04NotTriangle'),
      pentagon:      T('p04NotPentagon'),
      quadrilateral: T('p04IsQuad')
    },
    general: T('p04General'),
    area:    T('p04FindArea'),
    join:    T('p04Join'),
    divided: T('p04Divided'),
    /* one triangle at a time: its base, its height, and then its area */
    base1:   T('p04Base1'),
    base2:   T('p04Base2'),
    height:  h => T('p04HeightIs', { h: h }),
    /* not `area`: that key is the aside beside the shape, "Let's try and
       find its area!", and a second `area` here silently replaced it */
    areaIs:  T('p04AreaIs'),
    /* the rule put into words, a part at a time */
    words1:  T('p04Words1'),
    words2:  T('p04Words2'),
    /* the third line of the working, taken the rest of the way */
    swap:    T('p04PutIn'),
    share:   T('p04Share'),
    rule:    T('p04Rule'),
    another: T('p05Another'),
    twoNew:  T('p05TwoNew'),
    complete: T('p05Complete'),
    /* the two boxes are asked one at a time (user, 2026-09-28): the part
       wanted is named, and a wrong choice is answered with what it really is.
       The "green" triangle draws orange, so that is what the learner is told. */
    chooseDiag: T('p05ChooseDiag'),
    chooseSum:  T('p05ChooseSum'),
    notDiag: { 'h-green': T('p05NotDiagOrange'),
               'h-purple': T('p05NotDiagPurple') },
    notSum:  T('p05NotSum'),
    joinWrong: (a, b) => T('p04JoinWrong', { a: NAME[a], b: NAME[b] })
  };
  /* only .pick survives (in the heading-ghost list below): the rest of
     page 6, "Quadrilateral · with measurements", was cut (user, 2026-09-25) */
  const FOUR = {
    pick: T('p06Pick')
  };
  const FIVE = {
    turn: T('p07Turn'),
    /* a wrong answer to each of the three questions: the mascot points back at
       the measurement it is asking about, and the figure glows gold there
       (user, 2026-09-28) */
    wrongHeights: T('p07WrongHeights'),
    wrongDiag:    T('p07WrongDiag'),
    wrongArea:    T('p07WrongArea')
  };

  /* The working under (later, beside) the shape, in pieces: every word that
     names a part of the drawing is its own span, so it can light up -- and
     light the part it names -- the moment it has finished typing. */
  const LINES_A = [
    /* `fly`: the part is not typed but floated in, a copy of the drawing's
       own label for it (floatLine) */
    [...AREA_OF(T('triangle1'), 'purple'), { t: ' = ½ × ' }, { t: 'b', w: 'base', fly: 'base' }, { t: ' × ' }, { t: 'h₁', w: 'h-purple', fly: 'h' }],
    [...AREA_OF(T('triangle2'), 'green'),  { t: ' = ½ × ' }, { t: 'b', w: 'base', fly: 'base' }, { t: ' × ' }, { t: 'h₂', w: 'h-green', fly: 'h' }],
    /* the no-break spaces keep "= Area of" and "+ Area of" whole, so the long
       line wraps before an operator rather than leaving one dangling */
    [...AREA_OF(T('shapeQuadrilateral'), 'quad'), ...EQ_AREA_OF(T('triangle1'), 'purple', true), ...PLUS_AREA_OF(T('triangle2'), 'green', true)]
  ];
  /* The third line does not stop at the sum: it goes on being worked, in
     place, on the row it was written on -- the two areas put in, then the
     base they share taken out of both. Only what changes moves; "Area of
     Quadrilateral = ½ × b ×" is written once and stays put. */
  const QUAD_STEPS = [
    LINES_A[2],
    [...AREA_OF(T('shapeQuadrilateral'), 'quad'), { t: ' = ½ × ' }, { t: 'b', w: 'base' }, { t: ' × ' }, { t: 'h₁', w: 'h-purple' },
     { t: ' + ½ × ' }, { t: 'b', w: 'base' }, { t: ' × ' }, { t: 'h₂', w: 'h-green' }],
    [...AREA_OF(T('shapeQuadrilateral'), 'quad'), { t: ' = ½ × ' }, { t: 'b', w: 'base' }, { t: ' × (' }, { t: 'h₁', w: 'h-purple' },
     { t: ' + ' }, { t: 'h₂', w: 'h-green' }, { t: ')' }]
  ];
  /* The rule again in words, on a row of its own under the working (review,
     2026-09-25): a copy of the last step above, whose b becomes "Diagonal"
     and whose bracket becomes "Sum of perpendicular heights", one and then
     the other. The bracket's sum keeps the height's blue. */
  const WORDS_A = [
    [...AREA_OF(T('shapeQuadrilateral'), 'quad'), { t: ' = ½ × ' }, { t: T('wordDiagonal'), w: 'base' }, { t: ' × (' }, { t: 'h₁', w: 'h-purple' },
     { t: ' + ' }, { t: 'h₂', w: 'h-green' }, { t: ')' }],
    [...AREA_OF(T('shapeQuadrilateral'), 'quad'), { t: ' = ½ × ' }, { t: T('wordDiagonal'), w: 'base' }, { t: ' × (' }, { t: T('wordSumOfHeights'), w: 'height' }, { t: ')' }]
  ];

  const AREA_MS    = 64;       /* per character */
  const AREA_PAUSE = 560;      /* a beat after each key word, for the highlight to land */

  const longest = list => list.reduce((a, b) => (b.length > a.length ? b : a), '');

  /* A box that wraps its line is as wide as its widest row, not as wide as
     the room it was offered: a wrapped block keeps the whole of the width it
     broke at, so a two-row line stood in a box with a blank margin down
     either side (user, 2026-09-28). The ghost is measured row by row and
     pinned to the widest; a transform on the board is divided back out. */
  function snug(ghost) {
    ghost.style.width = '';
    if (!ghost.textContent) return;
    const range = document.createRange();
    range.selectNodeContents(ghost);
    const rows = Array.from(range.getClientRects());
    if (!rows.length) return;
    const k = ghost.offsetWidth ? ghost.getBoundingClientRect().width / ghost.offsetWidth : 1;
    const w = Math.max.apply(null, rows.map(r => r.right)) - Math.min.apply(null, rows.map(r => r.left));
    /* a few px of slack: the live words, laid out a span per word, run a
       hair wider than the plain ghost and would otherwise wrap inside it */
    const slack = parseFloat(getComputedStyle(ghost).fontSize) * .15;
    ghost.style.width = Math.ceil(w / (k || 1) + slack) + 'px';
  }
  /* A line said a piece at a time shows one piece at once, each replacing
     the last (showPieces), so the box is refitted to every piece as it
     comes: "Not quite!" gets a box its own size, not the size of the
     sentence after it (user, 2026-09-28). */
  function fitTo(ghost, text) {
    ghost.textContent = text;
    snug(ghost);
  }
  window.addEventListener('resize', () => snug(noteGhost));

  /* every ghost holds its longest line from the first frame, so no box under
     the shape changes size once it is on screen. Swiftee's box wraps its
     lines, so its ghost is plain text rather than words -- the trapezium's
     name quiz, which shares the box, does the same */
  noteGhost.textContent = longest([QUAD.ask].concat(Object.keys(QUAD.notes).map(k => QUAD.notes[k])));

  /* ---------- building a quadrilateral ---------- */
  const fmt = n => Math.round(n * 10) / 10;

  /* ---------- a length written ON its arrow ----------
   * The number used to be ringed in board colour so the arrow would not run
   * through it. The ring reads as a white border round the number, so the
   * ARROW is parted instead: its stroke is given a gap in the middle, as
   * wide as the number is. Returns '' for a label that already sits clear
   * of the line -- most of them do, and those arrows stay unbroken. */
  function arrowDash(a, b, label, size, at) {
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    if (!L) return '';
    size = size || 17;
    const M = at || { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    /* how far off the line the label sits, and whether it sits along it */
    const off = Math.abs((b.x - a.x) * (a.y - M.y) - (a.x - M.x) * (b.y - a.y)) / L;
    const along = ((M.x - a.x) * (b.x - a.x) + (M.y - a.y) * (b.y - a.y)) / L;
    if (off > size * .5 || along < L * .15 || along > L * .85) return '';
    const gap = Math.min(String(label).length * size * .58 + 9, L * .82);
    const side = (L - gap) / 2;
    return fmt(side) + ' ' + fmt(gap) + ' ' + fmt(side);
  }
  const dashAttr = d => (d ? ' stroke-dasharray="' + d + '"' : '');
  const pt  = p => fmt(p.x) + ',' + fmt(p.y);

  /* ---- denoting a part ----
   * The working names a line: THAT LINE lights up where it stands, its name
   * with it -- a glow in its own hue swells round it, holds while the eye
   * finds it, and settles back (user, 2026-09-17: point at the line, not a
   * circle round it). Nothing moves and no stroke swells, so a part can be
   * denoted as often as the working names it without the picture
   * flickering. `hold` is how long the light stays on; a part asked for
   * again simply starts over. */
  let denoteSeq = 0;
  async function lineDenote(els, hold) {
    const parts = (Array.isArray(els) ? els : [els]).filter(Boolean);
    if (!parts.length) return;
    const mine = String(++denoteSeq);
    parts.forEach(el => { el.dataset.seq = mine; el.classList.add('denote'); });
    await wait(REDUCED ? 160 : (hold == null ? 900 : hold + 300));
    parts.forEach(el => { if (el.dataset.seq === mine) el.classList.remove('denote'); });
    await wait(REDUCED ? 60 : 340);
  }
  /* the quadrilateral's base is the diagonal it is measured along; a
     triangle's part is its height. Each goes lit with its own name. */
  const denoteQuad = (part, hold) => lineDenote(part === 'base'
    ? [joinLine, quadDims.querySelector('.lbl-base')]
    : [quadSvg.querySelector('.h-' + part), quadDims.querySelector('.lbl-' + part)], hold);

  /* ---- naming a half of the shape ----
   * The working calls the two halves "Triangle 1" and "Triangle 2". Each
   * name is written in the empty corner beside its half, and a dashed curve
   * loops from the name into the half, ending in a small arrow head -- so
   * the name in the formula and the colour on the board are tied together
   * without writing anything over the drawing. The curve is a quadratic
   * Bezier; its control point is the straight line's midpoint pushed out
   * sideways by `bow`, which is what gives it its loop.
   *
   * `triNames` keeps each one's three points, so the curve can be grown out
   * from the name a piece at a time when the formula gets there. */
  let triNames = {};
  const lerpPt = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  /* the first `t` of a quadratic, exactly: de Casteljau's two lerps give the
     shorter curve's own control point and end */
  function curveTo(P0, K, P2, t) {
    const A = lerpPt(P0, K, t), B = lerpPt(K, P2, t), E = lerpPt(A, B, t);
    return 'M' + fmt(P0.x) + ' ' + fmt(P0.y) + ' Q' + fmt(A.x) + ' ' + fmt(A.y) + ' ' + fmt(E.x) + ' ' + fmt(E.y);
  }
  /* The quadrilateral's names by default. The rhombus's area page writes its
     own two the same way (user, 2026-09-30): `store` is where the curves'
     points are kept for showTriName, and `k` scales the lettering and the
     arrow head to a drawing whose units are smaller on screen. */
  function triNameArt(spec, store, k) {
    if (!store) store = triNames = {};
    k = k || 1;
    if (!spec.names) return '';
    return spec.names.map((n, i) => {
      const t = spec.tris[i];
      const d = { x: n.to.x - n.from.x, y: n.to.y - n.from.y };
      const L = Math.hypot(d.x, d.y) || 1;
      const bow = n.bow == null ? 16 : n.bow;
      /* the control point: out to one side of the straight run between them */
      const K = { x: (n.from.x + n.to.x) / 2 - d.y / L * bow, y: (n.from.y + n.to.y) / 2 + d.x / L * bow };
      store[t.color] = { P0: n.from, K: K, P2: n.to };
      /* the head sits on the curve's own last direction, not the chord's */
      const h = { x: n.to.x - K.x, y: n.to.y - K.y };
      const hl = Math.hypot(h.x, h.y) || 1;
      const u = { x: h.x / hl, y: h.y / hl }, v = { x: -u.y, y: u.x };
      const back = { x: n.to.x - u.x * 9 * k, y: n.to.y - u.y * 9 * k };
      const w = 5 * k;
      return '<g class="tname tname-' + t.color + '">' +
        '<path class="tname-curve" d="M' + fmt(n.from.x) + ' ' + fmt(n.from.y) + '" />' +
        '<path class="tname-head" d="M' + fmt(back.x + v.x * w) + ' ' + fmt(back.y + v.y * w) +
          ' L' + fmt(n.to.x) + ' ' + fmt(n.to.y) +
          ' L' + fmt(back.x - v.x * w) + ' ' + fmt(back.y - v.y * w) + '" />' +
        '<text class="tname-text" x="' + fmt(n.at.x) + '" y="' + fmt(n.at.y) + '" font-size="' + fmt(14 * k) + '" ' +
          'text-anchor="middle" dominant-baseline="middle">' + n.text + '</text>' +
      '</g>';
    }).join('');
  }

  /* the formula names a half: its name comes up beside the shape and the
     curve draws itself in, once per scene. `root` and `store` are the
     rhombus's own, where it is the rhombus being named (see triNameArt) */
  async function showTriName(color, root, store) {
    const g = (store || triNames)[color];
    const grp = (root || quadNames).querySelector('.tname-' + color);
    if (!g || !grp || grp.classList.contains('on')) return;
    grp.classList.add('on');
    await wait(REDUCED ? 60 : 260);
    await tween(REDUCED ? 0 : 620, e => {
      grp.querySelector('.tname-curve').setAttribute('d', curveTo(g.P0, g.K, g.P2, e));
    }, easeInOut);
    grp.classList.add('done');
  }

  /* A name written beside the line it belongs to, upright.
     Every label on the quadrilateral used to be turned to run along its
     line, which read as a different kind of mark from the working it is
     being checked against -- and put h₁ on its side. They are all
     straight now, and kept off the drawing by being ANCHORED away from it
     rather than merely offset: `away` is the direction the label was pushed
     in, so however long the word, it grows into the clear. */
  function labelAt(M, away) {
    const anchor = Math.abs(away.x) < .35 ? 'middle' : (away.x > 0 ? 'start' : 'end');
    const base   = Math.abs(away.y) < .35 ? 'middle' : (away.y > 0 ? 'hanging' : 'auto');
    return 'x="' + fmt(M.x) + '" y="' + fmt(M.y) + '" font-size="13" ' +
           'text-anchor="' + anchor + '" dominant-baseline="' + base + '"';
  }

  function buildQuad(spec) {
    const P = spec.pts;
    const [d1, d2] = spec.diag;
    const A = P[d1], B = P[d2];
    const dx = B.x - A.x, dy = B.y - A.y;
    const L2 = dx * dx + dy * dy, len = Math.sqrt(L2);

    /* the shape: one fill, the two halves, the outline that draws itself */
    let art = '<polygon class="shape-fill" clip-path="url(#lq-wipeQuad)" points="' + ORDER.map(k => pt(P[k])).join(' ') + '" />';
    spec.tris.forEach(t => {
      art += '<polygon class="tri-fill c-' + t.color + '" points="' + pt(A) + ' ' + pt(P[t.apex]) + ' ' + pt(B) + '" />';
    });
    art += '<path class="shape-outline" d="M' + ORDER.map(k => fmt(P[k].x) + ' ' + fmt(P[k].y)).join(' L') + ' Z" fill="none" stroke-width="5" />';
    /* each triangle's own two outer sides, stacked on the path just drawn --
       see .tri-outline: normally invisible, and only shown (in the focused
       half's colour, the other's dimmed) once a half is in focus */
    {
      const iA = ORDER.indexOf(d1), iB = ORDER.indexOf(d2);
      const arcKeys = (from, to) => {
        const out = [];
        for (let i = from; ; i = (i + 1) % ORDER.length) {
          out.push(ORDER[i]);
          if (i === to) break;
        }
        return out;
      };
      const arcs = [arcKeys(iA, iB), arcKeys(iB, iA)];
      spec.tris.forEach(t => {
        const arc = arcs.find(a => a.indexOf(t.apex) >= 0);
        /* `ol-<color>`, not `c-<color>` -- that class also drives the
           fill's pulse-on-focus animation, whose transform-box/origin are
           set up for a polygon, not this path */
        art += '<path class="tri-outline ol-' + t.color + '" d="M' +
          arc.map(k => fmt(P[k].x) + ' ' + fmt(P[k].y)).join(' L') + '" fill="none" stroke-width="5" />';
      });
    }
    quadArt.innerHTML = art;
    quadFill = quadArt.querySelector('.shape-fill');
    quadCorners = ORDER.map(k => P[k]);

    /* each height: from the triangle's far corner straight down onto the
       diagonal, a right-angle mark at its foot, and its name written
       upright beside it. The three are one group per triangle, so a scene
       writing one triangle's area can step the other's height back without
       reaching past the inline opacity the line's own draw leaves on it. */
    let dims = '';
    spec.tris.forEach(t => {
      const X = P[t.apex];
      const tt = ((X.x - A.x) * dx + (X.y - A.y) * dy) / L2;
      const F = { x: A.x + dx * tt, y: A.y + dy * tt };
      const side = tt < .5 ? 1 : -1;                        /* toward the farther end */
      const u = { x: dx / len * side, y: dy / len * side };
      const hv = { x: X.x - F.x, y: X.y - F.y };
      const hl = Math.hypot(hv.x, hv.y);
      const v = { x: hv.x / hl, y: hv.y / hl };
      t.foot = tt;
      const s = 11;
      const M = { x: (X.x + F.x) / 2 + u.x * 11, y: (X.y + F.y) / 2 + u.y * 11 };
      dims += '<g class="hgrp hgrp-' + t.color + '">' +
              '<line class="dim h-' + t.color + '" x1="' + fmt(X.x) + '" y1="' + fmt(X.y) + '" x2="' + fmt(F.x) + '" y2="' + fmt(F.y) + '" />' +
              '<path class="dim-mark mark-' + t.color + '" d="M' + fmt(F.x + u.x * s) + ' ' + fmt(F.y + u.y * s) +
              ' L' + fmt(F.x + u.x * s + v.x * s) + ' ' + fmt(F.y + u.y * s + v.y * s) +
              ' L' + fmt(F.x + v.x * s) + ' ' + fmt(F.y + v.y * s) + '" />' +
              '<text class="dim-label lbl-h lbl-' + t.color + '" ' + labelAt(M, u) + '>' + t.label + '</text>' +
              '</g>';
    });
    /* the base label: under the MIDDLE of the diagonal, on the side of the
       triangle whose height comes down farthest from that middle -- so the
       name and a right-angle mark never land on the same spot */
    {
      const clear = spec.tris.reduce((a, b) => (Math.abs(b.foot - .5) > Math.abs(a.foot - .5) ? b : a));
      const X = P[clear.apex];
      const mid = { x: A.x + dx * .5, y: A.y + dy * .5 };
      let n = { x: -dy / len, y: dx / len };
      if ((X.x - mid.x) * n.x + (X.y - mid.y) * n.y < 0) n = { x: -n.x, y: -n.y };
      const M = { x: mid.x + n.x * 13, y: mid.y + n.y * 13 };
      dims += '<text class="dim-label lbl-base" ' + labelAt(M, n) + '>' + spec.base + '</text>';
    }
    quadDims.innerHTML = dims;
    quadRings.innerHTML = '';                 /* the rings went: the line itself lights now */
    quadNames.innerHTML = triNameArt(spec);

    /* the corners; the hit circle is bigger than the dot it serves */
    quadDots.innerHTML = ORDER.map(k =>
      '<g class="corner" data-corner="' + k + '"><circle class="dot" cx="' + P[k].x + '" cy="' + P[k].y + '" r="4.5" />' +
      '<circle class="dot-hit" cx="' + P[k].x + '" cy="' + P[k].y + '" r="22" /></g>').join('');
    corners = Array.from(quadDots.querySelectorAll('.corner'));
    corners.forEach(c => c.addEventListener('pointerdown', onCornerDown));
    CORNERS = {};
    ORDER.forEach(k => { CORNERS[k] = P[k]; });

    /* a clean slate: no split, no lights, no lines, one column -- neither
       the quiz's half-and-half nor the working's two fifths */
    quadShape.className = 'quad-shape';
    quad.classList.remove('wide', 'ask', 'own');
    setLine(joinLine, A, A);
    joinLine.classList.remove('live', 'bad', 'done');
    demoG.classList.remove('on');
    areaLinesEl.textContent = '';
  }     /* Swiftee's line beside itself */

  /* ---------- Swiftee's box in the name quiz ----------
   * The question and every answer to a choice are spoken from the box beside
   * the bird, not typed under the sentence: the box pops out of its own tail
   * the first time and then simply changes what it holds, green for the
   * right name and red for a wrong one.
   * The words are laid out whole and eased in together, as the trapezium's
   * are, so the learner reads one sentence rather than watching it arrive --
   * and they are laid in BEFORE the box opens, so a second try never shows
   * the last try's line for the frame before its own is written. */
  async function quizSay(text, tone, onPiece) {
    /* the box fits the line it is saying: a ghost holding the longest line
       kept a one-line question in a two-line box, mostly empty (review,
       2026-09-25). It is reserved BEFORE the bird is brought up -- the same
       rule as the heading's (see mascotWithLine): sized after the jump, the
       box takes its width under a bird that has already landed and shoves
       it sideways a beat after it arrives. */
    /* the first piece is fitted before the bird comes up (see above) */
    fitTo(noteGhost, segChunks([{ t: text }])[0].segs.map(sg => sg.t).join(''));
    await speakerUp(noteTxt);
    quizBubble.classList.remove('ok', 'bad');
    if (tone) quizBubble.classList.add(tone);
    noteCaret.hidden = true;
    /* the words of each piece are all there at once, so the voice is not
       paced against them -- it is simply said over them, a piece at a time,
       and the beat lasts as long as it takes to say */
    const said = sayPieces(noteTxt, text, piece => {
      fitTo(noteGhost, piece);
      if (onPiece) onPiece(piece);
    });
    quizBubble.classList.add('show');
    await said;
    /* no speakerDone: the question has to stay on screen, with the bird
       beside it, while the learner picks a name. The scene takes both down
       itself once the quiz is over. */
  }

  /* ---------- counting the sides ----------
   * "A quadrilateral has 4 sides." -- said over the shape it is about, each
   * side is traced in green in turn, clockwise from the top, with its count
   * (1, 2, 3, 4) popping up beside it, so the learner sees the four being
   * counted as they hear it (user, 2026-09-28). The four are spread across
   * `ms`, the time the sentence takes to say; they hold a moment together,
   * then fade. */
  function countSides(ms) {
    if (fastForward || !quadCorners) return;
    const NS = 'http://www.w3.org/2000/svg';
    const pts = quadCorners;
    const cx = pts.reduce((n, p) => n + p.x, 0) / pts.length;
    const cy = pts.reduce((n, p) => n + p.y, 0) / pts.length;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'side-count');
    quadArt.appendChild(g);
    const lead = ms * .12;
    const step = ms * .78 / pts.length;
    const mine = runToken;
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('class', 'side-lit');
      line.setAttribute('x1', fmt(a.x)); line.setAttribute('y1', fmt(a.y));
      line.setAttribute('x2', fmt(b.x)); line.setAttribute('y2', fmt(b.y));
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      g.appendChild(line);
      line.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: step * .85, delay: lead + i * step, easing: 'ease-out', fill: 'both' });

      /* the count, just outside the side's middle */
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const ox = mx - cx, oy = my - cy, ol = Math.hypot(ox, oy) || 1;
      const bx = mx + ox / ol * 17, by = my + oy / ol * 17;
      const badge = document.createElementNS(NS, 'g');
      badge.setAttribute('class', 'side-n');
      badge.setAttribute('transform', 'translate(' + fmt(bx) + ' ' + fmt(by) + ')');
      badge.innerHTML = '<g class="pop"><circle r="11" /><text dy=".35em">' + (i + 1) + '</text></g>';
      g.appendChild(badge);
      badge.firstChild.animate([
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1.25)', opacity: 1, offset: .6 },
        { transform: 'scale(1)', opacity: 1 }
      ], { duration: 320, delay: lead + i * step + step * .45, easing: 'ease-out', fill: 'both' });
    });
    /* all four together once the last is in, then gone */
    setTimeout(() => {
      if (mine !== runToken || !g.isConnected) return;
      g.classList.add('all');
      g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, delay: 1300, fill: 'forwards' })
        .finished.then(() => g.remove(), () => g.remove());
    }, lead + pts.length * step);
  }

  /* ---------- the bird arrives with its line ----------
   * Swiftee is never left standing beside an empty heading: it waits behind
   * the board until there is something to say, comes up as the line is about
   * to start, and the words follow one beat later. Every line typed into the
   * heading goes through here, so the rule holds wherever a scene puts its
   * text -- and a scene that used to bring the bird up early simply leaves it
   * to this.
   *
   * The line's width is reserved before the jump is measured. The heading is
   * a centred row and the bird stands at the left end of it, so its spot
   * moves as soon as the ghost takes the line's width: reserving first means
   * the bird lands where the line will actually put it, instead of landing in
   * the middle of an empty row and being shoved sideways a beat later. */
  const MASCOT_LEAD = 200;
  let mascotArriving = null;
  function mascotWithLine(text) {
    /* one arrival at a time: some scenes start a line without waiting on it
       and then start the next, and two jumps running together would show as
       the bird flickering in twice */
    if (mascotArriving) return mascotArriving;
    /* somebody is already on the board -- at the heading, or down at a banner
       the scene has deliberately sent the bird to -- or the bird is already in
       the air between two spots; either way it does not jump again for this
       line. A bird on its way BACK behind the board is the exception: that
       trip was the hand-over to the learner, and it has been answered. */
    cancelDismiss();
    if (!mascotLeaving && !dismissing &&
        (board.querySelector('.mascot.in') ||
         hopper.classList.contains('on') ||
         flyer.classList.contains('on'))) return Promise.resolve();
    if (typeof text === 'string') promptLine(text);
    mascotArriving = (async () => {
      try {
        /* An answer given while the bird was still dropping out of sight:
           let it land before calling it back up, or the jump in would start
           from a sprite that is halfway through leaving -- and the line
           would type with nobody beside it. */
        if (mascotLeaving) await mascotLeaving;
        if (dismissing) await dismissing;
        if (board.querySelector('.mascot.in')) return;
        await mascotJumpIn();
        await wait(MASCOT_LEAD);
      } finally { mascotArriving = null; }
    })();
    return mascotArriving;
  }

  /* ---------- the heading stands down ----------
   * Swiftee explains from the heading; when it has finished and the board
   * becomes the learner's, the bird jumps back behind the board and takes
   * its line with it, so the row folds and the shape has the whole of the
   * board to itself while the learner works (user, 2026-09-21).
   *
   * Only at the hand-over, never between two lines of the same explanation:
   * the trapezium's derivation says ten lines from the heading one after
   * another, and a hop out and back between each would pump the board the
   * length of the page. The hand-over is lockInput(false) -- the one moment
   * the mission says "your turn" -- and by then the line's clip has already
   * finished, because every heading line is awaited through voHold.
   *
   * The row folding is roomHeight()'s doing, not this function's: with the
   * line gone and the bird away, the room measures zero and fitRooms closes
   * it. The close is delayed, so an answer given straight away never moves
   * the board at all.
   */
  let mascotLeaving = null;
  let leaveSeq = 0;
  function headingAside() {
    /* a scene holding the bird in the heading through its explanation keeps
       it -- and its line -- at the hand-over too (see headStay) */
    if (headStay) return;
    /* the hand-over folds the row at once: nothing is coming back to it */
    headKeepUntil = 0;
    cancelDismiss(promptTxt);
    headingDown();
  }
  /* The line goes, and the bird with it if it is standing by the heading.
     The warm-up's row is held open whatever stands in it, so there the words
     and the bird simply leave and nothing on the board moves. */
  function headingDown() {
    feedbackGen++;                     /* a feedback line still typing stops */
    caret.hidden = true;
    /* The words go once the bird is off its spot, not before: the heading
       centres its line with the bird at the left end of it, so a line
       cleared while the bird still stands there re-centres the row and
       shoves the sprite sideways just as it leaves. A line staged for the
       NEXT heading while this trip gets under way is not ours to wipe
       (promptStage). */
    const staged = promptStage;
    const wipe = () => {
      if (staged !== promptStage) return;
      promptTxt.textContent = '';
      promptGhost.textContent = '';
    };
    if (!boardMascot.classList.contains('in')) { wipe(); return; }   /* not ours to move */
    const mine = ++leaveSeq;
    mascotLeaving = mascotJumpOut(boardMascot, wipe).catch(() => {}).then(() => {
      if (mine === leaveSeq) mascotLeaving = null;   /* the latest trip landed */
    });
  }

  /* ---------- the line said, the speaker goes ----------
   * Once Swiftee has said a line and its voice-over has finished, the line
   * leaves the screen and the bird goes with it -- wherever it was said
   * from: the heading, the quiz bubble, a box beside the shape (user,
   * 2026-09-25). A short grace keeps the bird for a line that follows
   * straight on from the last, so one explanation said in two lines does not
   * send it away and back between them; a line said after the grace brings
   * it back up (see speakerUp and mascotWithLine).
   *
   * Every typewriter reports here when its line is done, keyed by the box
   * it typed into, and only a box registered with speaker() has a bird to
   * send away. A scene that moves the bird itself -- a hop, a jump, a drop
   * -- cancels whatever is pending: the scene knows where it wants it.
   *
   * A heading cleared mid-explanation keeps its row a little longer, so the
   * board does not fold up and open again between two lines of the same
   * explanation; the hand-over folds it at once (headingAside). */
  const DISMISS_GRACE = 650;
  /* the warm-up keeps the heading's bird up between its lines, until round
     2's line has been said (see startRound) */
  var headStay = false;
  /* The trapezium pages (22 to 29) keep the bird up WHEREVER it is standing
     -- the heading, or a spot beside the working -- until the scene is over:
     a bird that hopped away after every line and back in for the next read
     as flickering (user, 2026-09-29). Set by the scene, cleared by the next
     sceneStart. */
  var birdStay = false;
  function holdBird() { headStay = true; birdStay = true; }
  const HEAD_KEEP_MS = 2600;
  /* one box's pending dismissal, or every one */
  function cancelDismiss(txt) {
    SPEAKERS.forEach(function (sp, key) {
      if (txt && key !== txt) return;
      if (sp.timer) { clearTimeout(sp.timer); sp.timer = 0; }
    });
  }
  function speakerDone(txt) {
    const sp = SPEAKERS.get(txt);
    if (!sp) return;
    if (birdStay) return;
    if (headStay && sp.spot === boardMascot) return;
    if (sp.timer) clearTimeout(sp.timer);
    const mine = runToken;
    sp.timer = setTimeout(function () {
      sp.timer = 0;
      if (mine !== runToken) return;   /* the scene went down meanwhile */
      dismissNow(txt, sp);
    }, fastForward ? 0 : DISMISS_GRACE);
  }
  function dismissNow(txt, sp) {
    if (sp.spot === boardMascot) {
      if (!txt.childNodes.length && !boardMascot.classList.contains('in')) return;
      headKeepUntil = performance.now() + HEAD_KEEP_MS;
      setTimeout(askRooms, HEAD_KEEP_MS + 40);
      headingDown();
      return;
    }
    /* the line and its box go once the bird is off the spot, not before:
       cleared while it still stands there, the row re-centres and shoves
       the sprite sideways just as it leaves (same rule as headingDown) */
    const off = () => {
      if (sp.clear) sp.clear();
      txt.textContent = '';
    };
    if (!sp.spot.classList.contains('in')) { off(); return; }
    sp.gone = true;
    const p = mascotJumpOut(sp.spot, off).catch(() => {}).then(() => {
      if (dismissing === p) dismissing = null;
    });
    dismissing = p;
  }
  /* A line is about to be said in this box. Anything pending waits for the
     line to be done instead; a bird sent away from here comes back up first
     -- unless it is standing somewhere else on the board, where the scene
     has put it. The heading's bird is mascotWithLine's to bring. */
  async function speakerUp(txt) {
    cancelDismiss();
    const sp = SPEAKERS.get(txt);
    if (!sp) return;
    if (sp.spot === boardMascot) return mascotWithLine(null);
    if (dismissing) await dismissing;
    if (!sp.gone) return;
    sp.gone = false;
    if (sp.spot.classList.contains('in') || board.querySelector('.mascot.in') ||
        hopper.classList.contains('on') || flyer.classList.contains('on')) return;
    await mascotJumpIn(sp.spot);
    await wait(MASCOT_LEAD);
  }
  /* A scene moving the bird itself: a line's pending send-off is dropped,
     and a trip already under way lands before the next one starts, so two
     jumps never share the hopper. */
  async function birdFree() {
    cancelDismiss();
    if (dismissing) await dismissing;
    if (mascotLeaving) await mascotLeaving;
  }

  /* Between scenes the bird STAYS where it is: a rebuild that sent it behind
     the board every time reads as blinking, whatever the heading is doing.
     Only the section transitions that always took it down still do. */

  /* Swiftee says a line from its place by the heading */
  async function heading(text) {
    feedbackGen++;
    await mascotWithLine(text);
    swiftee.hold('talking');
    await typewrite(text, text.length * TYPE_MS);
    swiftee.release();
  }

  /* the formula typewriter, generalised: a line in segments, with a pause
     and a callback each time a key word completes */
  async function typeSegments(txt, blink, segs, perChar, pause, onWord) {
    /* the whole line, as it will read on screen, is what the clip is found
       by -- a line in pieces is still one sentence to the ear */
    await speakerUp(txt);
    const whole = segs.map(sg => sg.t).join('');
    const said = await voSay(whole);
    blink.hidden = true;
    /* a piece at a time, every word of the piece in place before the first
       shows; the clip covers the pauses between the key words as well as
       the words themselves (see typePieces) */
    await typePieces(txt, segs, said, perChar, pause, onWord, null);
    await voHold(said);
    speakerDone(txt);
  }

  /* an eased 0 -> 1 over ms, driven by the frame clock; a skip lands it at 1.
     Ease-out cubic unless told otherwise. */
  const easeOut   = p => 1 - Math.pow(1 - p, 3);
  const easeInOut = p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  function tween(ms, step, ease) {
    const fn = ease || easeOut;
    const mine = runToken;
    if (REDUCED || fastForward) { step(1); return wait(0); }
    return new Promise((resolve, reject) => {
      const t0 = performance.now();
      (function f(t) {
        if (mine !== runToken) return reject(CANCELLED);     /* a replay took the scene down */
        const p = fastForward ? 1 : Math.min(1, (t - t0) / ms);
        step(fn(p));
        if (p < 1) requestAnimationFrame(f);
        else resolve();
      })(t0);
    });
  }

  function setLine(line, a, b) {
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
  }
  function setEnd(line, b) {
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
  }
  /* a screen position in the svg's units */
  function svgPoint(x, y) {
    const p = quadSvg.createSVGPoint();
    p.x = x; p.y = y;
    const m = quadSvg.getScreenCTM();
    return m ? p.matrixTransform(m.inverse()) : p;
  }
  function nearCorner(p, except) {
    let best = null, bd = HIT;
    Object.keys(CORNERS).forEach(k => {
      if (k === except) return;
      const el = cornerEl(k);
      if (el && el.classList.contains('spare')) return;   /* hidden: see onlyCorners */
      const c = CORNERS[k];
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < bd) { bd = d; best = k; }
    });
    return best;
  }
  const cornerEl = k => corners.find(c => c.dataset.corner === k);

  /* ---------- a hop from one spot on the board to another ----------
   * Over the board this time, so the flyer carries the sprite: it takes over
   * at the first spot, flies the arc, and hands back at the second. All the
   * spots are the same size, so the box is simply moved. The arc is a
   * parabola on a linear clock -- the way a real jump moves -- with the
   * height of the spring scaled to how far it has to go. */
  async function hopBetween(fromEl, toEl, between) {
    /* The bird is not standing where the hop was meant to start: the board
       was handed over to the learner and it went home behind the board (see
       headingAside). A hop from an empty spot would run the whole
       choreography on an invisible sprite and then pop the bird in at the
       far end, so it comes up from behind the board instead -- which is
       where it actually is. The same if it has just been sent away after
       its line (see speakerDone): the trip down is let finish first. */
    await birdFree();
    if (!fromEl.classList.contains('in')) {
      if (between) await between();
      return mascotJumpIn(toEl);
    }
    const a = fromEl.getBoundingClientRect();
    let b = toEl.getBoundingClientRect();
    /* `between` changes the board under the bird once it has left the
       ground -- a layout the landing spot only exists in -- so it runs
       with the flyer carrying the sprite, and the landing is measured
       after it */
    if (!a.width || REDUCED) {
      fromEl.classList.remove('in');
      if (between) await between();
      toEl.classList.add('in');
      return;
    }

    /* a crouch before the spring */
    const crouch = fromEl.animate(
      [{ transform: 'none' }, { transform: 'translateY(5%) scale(1.06, .92)' }],
      { duration: 150, easing: 'ease-in', fill: 'forwards' }
    );
    await finished(crouch);

    /* the crouch is held by its fill, so this is the sprite's own last
       painted box: the flyer takes over from there. Measured -- and handed
       over -- before the crouch is let go, or the box read here is the
       sprite standing up straight while the pixels on screen are still
       crouched, and the character pops 8% taller on the hand-over frame.
       The same order as the hopper's hand-over further up. */
    const at0 = fromEl.getBoundingClientRect();
    birdTrip = [fromEl, toEl];                  /* both ends hold their room */
    Object.assign(flyer.style, {
      left: at0.left + 'px', top: at0.top + 'px', width: at0.width + 'px', height: at0.height + 'px'
    });
    flyer.classList.add('on');
    fromEl.classList.remove('in');
    crouch.cancel();
    if (between) { await between(); b = toEl.getBoundingClientRect(); }

    const dx = b.left - at0.left;
    const dy = b.top - at0.top;
    const arc = Math.min(170, Math.max(70, Math.abs(dx) * .3 + Math.max(0, -dy) * .2));
    /* The spots down beside a shape are a size larger than the heading's
       (style.css), so the sprite grows or shrinks in the air to arrive at
       the size of where it lands -- in the landing's squash, which is the
       pose the landing below starts from. Scaled from its top-left corner,
       so the translation still carries that corner onto the spot's. */
    const sx = b.width * 1.06 / at0.width, sy = b.height * .92 / at0.height;
    flyer.style.transformOrigin = '0 0';
    const N = 18;
    const kf = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      kf.push({ transform: 'translate(' + (dx * t) + 'px, ' + (dy * t - arc * 4 * t * (1 - t)) + 'px)' +
                ' scale(' + (1 + (sx - 1) * t) + ', ' + (1 + (sy - 1) * t) + ')' });
    }
    const fly = flyer.animate(kf, {
      duration: Math.min(900, 480 + Math.hypot(dx, dy) * .35), easing: 'linear', fill: 'forwards'
    });
    await finished(fly);

    /* and the same hand-over rule on the way down: the destination is
       measured again, so if a row opened or closed while the bird was in the
       air it appears where the flyer left it and eases across to the spot,
       instead of being cut there in a single frame */
    const at1 = toEl.getBoundingClientRect();
    const ox = (at0.left + dx) - at1.left;
    const oy = (at0.top + dy) - at1.top;
    const from = 'translate(' + ox + 'px, ' + oy + 'px) scale(1.06, .92)';
    toEl.style.transform = from;
    toEl.classList.add('in');
    flyer.classList.remove('on');
    fly.cancel();
    flyer.style.removeProperty('transform-origin');
    const land = toEl.animate(
      [{ transform: from }, { transform: 'none' }],
      { duration: 220, easing: 'ease-out', fill: 'forwards' }
    );
    try { await finished(land); } finally { toEl.style.removeProperty('transform'); land.cancel(); birdTrip = []; }
  }

  /* ---------- joining the corners ----------
   * Drag from one corner to another, or tap one and then the other. Only the
   * diagonal the scene is built around counts; the other pair is turned down
   * gently and the learner pointed back at it. */
  let joinLive = false;
  let joinResolve = null;
  let joinSignal = null;
  let joinPair = ['L', 'R'];
  let jdrag = null;            /* { from, start } while a corner is being dragged from */
  let armed = null;            /* a corner tapped once, waiting for its partner */
  const fillJoin = () => completeJoin(true);

  function setArmed(k) {
    corners.forEach(c => c.classList.toggle('armed', c.dataset.corner === k));
    armed = k;
  }
  function setHot(k) {
    corners.forEach(c => c.classList.toggle('hot', c.dataset.corner === k));
  }
  function hideDemo() { demoG.classList.remove('on'); }

  function onCornerDown(e) {
    if (!interactive || !joinLive) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const k = e.currentTarget.dataset.corner;

    /* the learner has taken hold: the hint has done its job */
    if (joinSignal) joinSignal.done = true;
    hideDemo();

    if (armed && armed !== k) {
      const from = armed;
      setArmed(null);
      return tryPair(from, k);
    }
    setArmed(null);

    const p = CORNERS[k];
    jdrag = { from: k, start: svgPoint(e.clientX, e.clientY) };
    setLine(joinLine, p, p);
    joinLine.classList.remove('bad', 'done');
    joinLine.classList.add('live');
    sfx('click', .5);

    window.addEventListener('pointermove', onJoinMove);
    window.addEventListener('pointerup', onJoinUp);
    window.addEventListener('pointercancel', onJoinUp);
  }

  function onJoinMove(e) {
    if (!jdrag) return;
    const q = svgPoint(e.clientX, e.clientY);
    setEnd(joinLine, q);
    setHot(nearCorner(q, jdrag.from));
  }

  async function onJoinUp(e) {
    if (!jdrag) return;
    window.removeEventListener('pointermove', onJoinMove);
    window.removeEventListener('pointerup', onJoinUp);
    window.removeEventListener('pointercancel', onJoinUp);

    const { from, start } = jdrag;
    jdrag = null;
    setHot(null);

    const q = svgPoint(e.clientX, e.clientY);
    const to = nearCorner(q, from);
    if (to) return tryPair(from, to);

    /* a tap, not a drag: the corner waits for its partner */
    if (Math.hypot(q.x - start.x, q.y - start.y) < 6) {
      joinLine.classList.remove('live');
      setArmed(from);
      return;
    }

    /* let go in the open: the line runs back into its corner */
    const a = CORNERS[from];
    const x = +joinLine.getAttribute('x2'), y = +joinLine.getAttribute('y2');
    await tween(260, p => setEnd(joinLine, { x: x + (a.x - x) * p, y: y + (a.y - y) * p }));
    if (!jdrag) joinLine.classList.remove('live');
  }

  function tryPair(a, b) {
    const ok = (a === joinPair[0] && b === joinPair[1]) || (a === joinPair[1] && b === joinPair[0]);
    if (ok) return completeJoin(false, a);
    return wrongJoin(a, b);
  }

  /* the other diagonal: shown red for a beat, then drawn back in */
  async function wrongJoin(a, b) {
    const A = CORNERS[a], B = CORNERS[b];
    setLine(joinLine, A, B);
    joinLine.classList.remove('live');
    joinLine.classList.add('bad');
    sfx('wrong');
    swiftee.play('confused', 1);
    feedback(QUAD.joinWrong(joinPair[0], joinPair[1]));
    [cornerEl(a), cornerEl(b)].forEach(c => c && c.classList.add('hot'));
    await wait(520);
    [cornerEl(a), cornerEl(b)].forEach(c => c && c.classList.remove('hot'));
    if (!joinLive || jdrag) return;        /* completed, or a new drag has begun */
    await tween(260, p => setEnd(joinLine, { x: B.x + (A.x - B.x) * p, y: B.y + (A.y - B.y) * p }));
    if (!jdrag) joinLine.classList.remove('bad');
  }

  /* the diagonal draws itself, corner to corner */
  async function drawJoin(a, b) {
    const A = CORNERS[a], B = CORNERS[b];
    setLine(joinLine, A, A);
    joinLine.classList.remove('bad', 'done');
    joinLine.classList.add('live');
    await tween(620, p => setEnd(joinLine, { x: A.x + (B.x - A.x) * p, y: A.y + (B.y - A.y) * p }));
    joinLine.classList.remove('live');
    joinLine.classList.add('done');
    quadShape.classList.add('joined');
  }

  /* the diagonal is in; `auto` is true when a skip drew it */
  async function completeJoin(auto, from) {
    if (!joinLive) return;
    joinLive = false;
    skipFills.delete(fillJoin);
    lockInput(true);
    if (joinSignal) joinSignal.done = true;
    hideDemo();
    setArmed(null);
    setHot(null);
    quadShape.classList.remove('live');

    const a = from || joinPair[0];
    const b = a === joinPair[0] ? joinPair[1] : joinPair[0];
    joinLine.classList.remove('bad');
    if (auto) {
      await drawJoin(a, b);
    } else {
      setLine(joinLine, CORNERS[a], CORNERS[b]);
      joinLine.classList.remove('live');
      joinLine.classList.add('done');
      quadShape.classList.add('joined');
    }
    sfx('correct', auto ? .55 : 1);
    if (!auto) swiftee.play('happy', 1);
    if (joinResolve) joinResolve();
  }

  function awaitJoin(signal, pair) {
    return waitForScene(resolve => {
      joinResolve = resolve;
      joinSignal = signal;
      joinPair = pair;
      joinLive = true;
      quadShape.classList.add('live');
      lockInput(false);
      skipFills.add(fillJoin);
    });
  }

  /* ---------- the hint under the instruction ----------
   * A dotted line grows from one corner of the pair to the other with a
   * finger riding its tip, again and again, until the learner takes hold of
   * a corner -- the way the ghost chip demonstrates a drag in the warm-up. */
  /* opts.withLine: the length of the line that asks for the join, in ms.
     The first pass then plays at once, faint, WITH the line -- the finger
     setting off on "Join" and reaching the far corner as "diagonal" is said
     (user, 2026-09-28) -- and the stuck-learner passes follow as before. */
  function demoJoin(signal, pair, opts) {
    const A = CORNERS[pair[0]], B = CORNERS[pair[1]];
    const S = 1.7;                 /* the hand glyph's scale; its fingertip is at (11.5, 3) */
    const handAt = (x, y) => demoHand.setAttribute('transform',
      'translate(' + (x - 11.5 * S) + ' ' + (y - 3 * S) + ') scale(' + S + ')');

    if (REDUCED) {
      /* no motion: the whole line, held, until the learner starts */
      return (async () => {
        await idleFor(signal);
        if (signal.done || fastForward) return;
        setLine(demoLine, A, B); handAt(B.x, B.y);
        demoG.classList.add('on');
        while (!signal.done && !fastForward) await wait(200);
        demoG.classList.remove('on');
      })();
    }

    async function pass(ms, soft) {
      ms = ms || 1300;
      setLine(demoLine, A, A); handAt(A.x, A.y);
      demoG.classList.toggle('soft', !!soft);
      demoG.classList.add('on');
      await wait(200);
      const mine = runToken;
      await new Promise((resolve, reject) => {
        const t0 = performance.now();
        (function f(t) {
          if (mine !== runToken) return reject(CANCELLED);
          if (signal.done || fastForward) return resolve();
          const p = Math.min(1, (t - t0) / ms);
          const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   /* ease-in-out */
          const x = A.x + (B.x - A.x) * e, y = A.y + (B.y - A.y) * e;
          setEnd(demoLine, { x: x, y: y }); handAt(x, y);
          if (p < 1) requestAnimationFrame(f);
          else resolve();
        })(t0);
      });
      if (signal.done) return;
      await wait(soft ? 700 : 380);
      demoG.classList.remove('on');
      await wait(300);
      demoG.classList.remove('soft');
    }

    return (async () => {
      if (opts && opts.withLine && !signal.done && !fastForward) {
        /* the fade-in and the hold at the far end come out of the line's
           length, so the finger arrives with its last word */
        await pass(Math.max(900, opts.withLine * .88 - 200), true);
      }
      while (!signal.done && !fastForward) {
        await idleFor(signal);
        if (signal.done || fastForward) break;
        await pass();
      }
      demoG.classList.remove('on');
    })();
  }

  /* ---------- the working ---------- */

  /* The board's middle cell goes from one column to two: the shape to the
     left two fifths, the working to the right three fifths. A grid cannot
     animate that change, so the shape's box is measured before and after and
     the move is played back as a transform from the old place to the new. */
  /* The shape floats from the middle into the left column -- always 40% of
     the board, the working taking the other 60% (CSS) -- sliding from where
     it was to where it now sits; if it has to fit the column it eases to
     that size on the way, in the same move. */
  /* where the drawing itself is on screen: the svg's box is the whole cell,
     the drawing sits centred in it at the viewBox's aspect */
  function drawnRect(svg) {
    const box = svg.getBoundingClientRect();
    const vb = svg.viewBox && svg.viewBox.baseVal;
    if (!vb || !vb.width || !box.width || !box.height) return { left: box.left, top: box.top, width: box.width, height: box.height, box: box };
    const k = Math.min(box.width / vb.width, box.height / vb.height);
    const w = vb.width * k, h = vb.height * k;
    return { left: box.left + (box.width - w) / 2, top: box.top + (box.height - h) / 2, width: w, height: h, box: box };
  }
  /* A drawing held at a size of its own, whatever the layout around it
     does: the svg is set exactly over the drawing, in px of its (unscaled)
     room. `size` is a drawn rect to take the size AND the height on screen
     of: the drawing is centred across where the layout would draw it, but
     stays at that rect's height -- never above the top of its room, so it
     cannot ride up over the heading. Without one, the drawing is held just
     as and where it is on screen now. (Only the across is read off the
     layout: the rooms under a stage ease to their new height over half a
     second, so the layout's up-and-down is not yet where it will settle.) */
  const PIN_PROPS = ['left', 'top', 'right', 'bottom', 'width', 'height', 'max-height'];
  function pinDrawn(svg, size) {
    const room = svg.parentNode;
    const cb = room.getBoundingClientRect();
    const k = room.offsetWidth ? cb.width / room.offsetWidth : 1;
    const now = drawnRect(svg);
    if (!now.width || !cb.width) return;
    const w = size ? size.width : now.width, h = size ? size.height : now.height;
    const x = size ? now.left + now.width / 2 - w / 2 : now.left;
    const y = size ? Math.max(size.top, cb.top) : now.top;
    Object.assign(svg.style, {
      left: (x - cb.left) / k + 'px', top: (y - cb.top) / k + 'px',
      width: w / k + 'px', height: h / k + 'px',
      right: 'auto', bottom: 'auto', maxHeight: 'none'
    });
    svg.dataset.pinned = '1';
  }
  function unpinDrawn(svg) {
    PIN_PROPS.forEach(p => svg.style.removeProperty(p));
    delete svg.dataset.pinned;
  }
  /* a held drawing is let go if the window changes under it: its px were
     measured for the old size */
  window.addEventListener('resize', () => {
    document.querySelectorAll('svg[data-pinned]').forEach(unpinDrawn);
  });

  /* `keep`: the drawing glides to its new place at the size it already has,
     rather than easing to the size the new layout would give it -- it is
     held there at that size (pinDrawn) until a later layoutWide lets it go */
  async function layoutWide(sec, svg, on, cls, keep) {
    sec = sec || quad;
    svg = svg || quadSvg;
    const before = drawnRect(svg);
    /* `cls`: which two-column layout to glide into -- the working layout
       unless a scene has one of its own (the values scene's 50/50 split) */
    sec.classList.toggle(cls || 'wide', on !== false);
    /* the new layout's own place, measured with any hold let go */
    if (svg.dataset.pinned) unpinDrawn(svg);
    if (keep) pinDrawn(svg, before);
    const after = drawnRect(svg);
    if (REDUCED || !before.width || !after.width) return wait(120);

    const dx = before.left - after.left;
    const dy = before.top - after.top;
    const s  = before.width / after.width;          /* 1 while the size is kept */
    /* the transform turns about the drawing's own corner, not the box's */
    svg.style.transformOrigin = (after.left - after.box.left) + 'px ' + (after.top - after.box.top) + 'px';
    const a = svg.animate(
      [{ transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + s + ')' }, { transform: 'none' }],
      { duration: 900, easing: 'cubic-bezier(.45, 0, .15, 1)' }
    );
    const mine = runToken;
    try { await a.finished; } catch (e) {}
    svg.style.transformOrigin = '';
    retired(mine);
  }

  /* the whole-shape fill gives way to the two coloured halves */
  function splitShape() {
    if (quadFill) quadFill.style.opacity = '';
    quadShape.classList.add('split');
  }

  /* the perpendicular drops from the far corner to the base, then its
     right-angle mark appears at the foot. Nothing flares as it lands: the
     line is simply there, in its triangle's colour, and it is the working
     that points at it later. */
  async function dropHeight(color) {
    await growLine(quadSvg.querySelector('.h-' + color), 640);
    quadShape.classList.add('marked-' + color);
    await wait(260);
  }

  /* Once the shape is cut, its parts are named ONE AT A TIME, in the order
     the formula will need them.
     The base goes first and slowly: a ring sweeps round the diagonal, its
     full name is written under the middle of it, and then -- if the spec
     gives short names -- that name dissolves into b. Only then does each
     height drop onto the base, one after the other, each with its
     right-angle mark, its full name, and its own dissolve into h₁ and h₂
     (the next cut names its own pair h₁ and h₂ in the same way).
     Naming them together made the drawing arrive all at once; a part at a
     time, each one is read before the next appears. It all happens with the
     shape still in the middle of the board; only afterwards does it move
     aside for the working. */
  async function relabel(el, text) {
    if (!el) return;
    const out = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' });
    await finished(out);
    el.textContent = text;
    out.cancel();
    await finished(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320 }));
  }

  /* ---- one half at a time ----
   * While a triangle's area is being written the OTHER half steps back --
   * its colour, its height, its right-angle mark, its name. Both halves
   * shaded alike meant the line being typed and the drawing beside it were
   * about different things; with one dimmed, the formula and the shape are
   * pointing at each other. Cleared once the working is about the two
   * together.
   *
   * The quadrilateral asks for this first; the parallelogram, cut into the
   * same two hues, asks for exactly the same thing, so the shape it is done
   * to is an argument rather than the one this was written for. */
  function focusTri(color, shape) {
    const el = shape || quadShape;
    el.classList.remove('focus-green', 'focus-purple');
    if (color) el.classList.add('focus-' + color);
    /* the quadrilateral's outline splits into its two halves' own sides
       while a half is focused, so the other one's border can dim along
       with the rest of it -- see .tri-outline. The parallelogram's and the
       rhombus's do the same, the focused half's drawn heavy. */
    if (el === quadShape) el.classList.toggle('outline-split', !!color);
  }

  /* a key word has landed in the working: light the part of the drawing it
     names -- a triangle swells once, a line stays lit */
  function pulseTri(shape, color) {
    const cls = 'pulse-' + color;
    shape.classList.remove(cls);
    void shape.offsetWidth;
    shape.classList.add(cls);
    setTimeout(() => shape.classList.remove(cls), 700);
  }

  /* A key word lands in the working: point at what it names. A half swells
     once and puts its name up beside the shape; a line has a ring swept
     round it. Either way the drawing is left exactly as it was afterwards --
     the ring runs on its own clock, so the line carries on being read. */
  function onAreaWord(w) {
    if (w === 'green' || w === 'purple') { pulseTri(quadShape, w); showTriName(w); return; }
    const part = w.replace(/^h-/, '');
    /* the class carries the part's name and colour, not a highlight */
    quadShape.classList.add('lit-' + part);
    if (part === 'base' || part === 'green' || part === 'purple') denoteQuad(part);
  }

  /* A line too long for its column breaks before its "=": the "= ..." part
     drops to a second row, indented, rather than the sentence wrapping at a
     word. Judged from the ghost's words before the line is shown. */
  function fitEq(line) {
    const ghost = line.querySelector('.type-ghost');
    /* the room is the column the lines sit in, not the block of lines */
    const box = line.closest('.quad-foot, .para-foot, .rhom-foot, .rtrap-foot, .fig-work') || line.parentNode;
    line.classList.remove('eqbreak');
    if (!ghost || !box || !ghost.querySelector('.rhs')) return;
    /* offsetWidth: the line is still scaled down before it shows, and a
       transformed rect would under-measure it */
    const need = Array.from(ghost.querySelectorAll('.wd')).reduce((a, w) => a + w.offsetWidth, 0);
    const pad = parseFloat(getComputedStyle(box).paddingLeft) + parseFloat(getComputedStyle(box).paddingRight) || 0;
    if (need > box.clientWidth - pad + 1) line.classList.add('eqbreak');
  }

  /* into the quadrilateral's working unless told otherwise */
  function showLine(line, root) {
    (root || areaLinesEl).appendChild(line);
    void line.offsetWidth;
    line.classList.add('show');
    sfx('click', .3);
    return wait(REDUCED ? 160 : 460);
  }

  /* a line of working that types itself out, lighting what it names */
  async function showTypedLine(segs, root, onWord) {
    const line = document.createElement('div');
    line.className = 'area-line';
    line.innerHTML = '<span class="type-wrap"><span class="type-ghost"></span>' +
      '<span class="type"><span class="txt"></span><i class="caret" aria-hidden="true"></i></span></span>';
    /* the ghost carries the whole line, so the box is sized before the first
       character lands */
    lineSpans(line.querySelector('.type-ghost'), segs);
    (root || areaLinesEl).appendChild(line);
    fitEq(line);
    await showLine(line, root);
    await typeSegments(line.querySelector('.txt'), line.querySelector('.caret'), segs, AREA_MS, AREA_PAUSE, onWord || onAreaWord);
    return line;
  }

  /* the last line of a scene is in: "Well Done!", the halves swell together,
     Swiftee is proud, and confetti falls */
  function celebrate() {
    feedback(FEEDBACK.done);
    onAreaWord('green');
    onAreaWord('purple');
    swiftee.play('proud', 1);
    skyConfetti(120, 3200);
    sfx('confetti', .8);
  }

  /* ---------- one triangle, in conversation ----------
   * Swiftee talks the learner through a half of the cut shape (review,
   * 2026-09-25: conversational, and in step with the drawing). The half
   * comes forward and the other steps back; "Let's say the base of this
   * triangle is b." lights the diagonal and names it; "And its height is
   * h₁." drops the height and names it; "So, its area will be …" writes
   * the line beside the shape -- "½ ×" typed, and then the b and the h
   * lifted off the drawing's own labels and set down in their places in
   * the line (`talk.line`). Every line is Swiftee's, from the heading,
   * and the bird stays for all of them: each line's send-off
   * is cancelled as it ends (holdHeading). Each label gets its look at the
   * full word first, exactly as it does in revealDims, and only then
   * dissolves into its short name (relabel) -- before the formula ever
   * reaches for it (user, 2026-09-25). The base only gets that look once:
   * the second triangle finds it already short. */
  const holdHeading = () => cancelDismiss(promptTxt);
  async function triangleTalk(spec, i, talk) {
    const t = spec.tris[i];
    const baseLbl = quadDims.querySelector('.lbl-base');
    const hLbl    = quadDims.querySelector('.lbl-' + t.color);

    /* the base reads thicker than the rest of the outline for as long as
       it is being derived from -- workSum takes it back down once the two
       triangles are put together */
    quadShape.classList.add('thick-base');

    /* this half comes forward, by name */
    focusTri(t.color);
    pulseTri(quadShape, t.color);
    showTriName(t.color);
    await wait(REDUCED ? 200 : 800);

    /* its base: the diagonal, lit and named as the line says so */
    const base = (async () => {
      await wait(REDUCED ? 100 : 600);
      quadShape.classList.add('lit-base');
      if (baseLbl.textContent !== spec.short.base) {
        await wait(REDUCED ? 80 : 460);
        await relabel(baseLbl, spec.short.base);
      }
      await denoteQuad('base', REDUCED ? 200 : 900);
    })();
    await heading(talk.base);
    holdHeading();
    await base;
    await wait(REDUCED ? 100 : 300);

    /* its height: dropped and named as the line says so */
    const height = (async () => {
      await wait(REDUCED ? 100 : 500);
      await dropHeight(t.color);
      quadShape.classList.add('lit-' + t.color);
      await wait(REDUCED ? 80 : 460);
      await relabel(hLbl, spec.short.h[i]);
      await denoteQuad(t.color, REDUCED ? 200 : 700);
    })();
    await heading(QUAD.height(spec.short.h[i]));
    holdHeading();
    await height;
    await wait(REDUCED ? 100 : 300);

    /* its area, written beside the shape */
    await heading(QUAD.areaIs);
    holdHeading();
    await wait(REDUCED ? 100 : 400);
    await floatLine(talk.line, { base: baseLbl, h: hLbl });
    await wait(REDUCED ? 200 : 600);
  }

  /* The area line, its parts lifted off the drawing: the words up to "½ ×"
     type themselves, and then each part the line names -- the b, the h --
     is a copy of the drawing's own label that floats across into its
     place, the label glowing as it leaves. `from` gives the label for each
     segment's `fly` key. The whole line is laid out at once, unseen, so
     every word has its place before the first shows and a flying copy has
     somewhere to land. */
  /* `opts` lets another scene use it on its own working (the
     parallelogram's): `root` is the lines' box, `onWord` what a key word
     lights, and `beforeFly(key)`, if given, is awaited as each part is about
     to leave the drawing -- to start Swiftee's line for that part. A segment's `word` is the
     word it is written as first, where the part's key alone does not say. */
  async function floatLine(segs, from, opts) {
    opts = opts || {};
    const onWord = opts.onWord || onAreaWord;
    const root = opts.root || areaLinesEl;
    /* The line is written out in words first -- "Area of Triangle 1 = ½ ×
       base × height" -- and only then does each part come off the drawing:
       the label floats across onto its word, and the word turns into it,
       "base" into b and "height" into h₁ (user, 2026-09-28). */
    const WORD = { base: T('labelBase'), h: T('labelHeight') };
    const worded = segs.map(sg => sg.fly ? { t: sg.word || WORD[sg.fly] || sg.t, w: sg.w, fly: sg.fly } : sg);
    const line = document.createElement('div');
    line.className = 'area-line';
    line.innerHTML = '<span class="type-wrap"><span class="type-ghost"></span>' +
      '<span class="type"><span class="txt"></span><i class="caret" aria-hidden="true"></i></span></span>';
    lineSpans(line.querySelector('.type-ghost'), worded);
    root.appendChild(line);
    fitEq(line);
    await showLine(line, root);
    line.querySelector('.caret').hidden = true;
    const txt = line.querySelector('.txt');

    /* 1. the sentence in words, each part lit as it is named */
    const parts = lineSpans(txt, worded);
    let due = performance.now();
    for (const part of parts) {
      due = await revealWords(part.words, due, AREA_MS);
      if (part.seg.w) {
        const left = due - performance.now();
        if (left > 0) await waitRaw(left);
        part.els.forEach(el => el.classList.add('lit'));
        if (!part.seg.fly) onWord(part.seg.w);
        due += AREA_PAUSE * PACE;
      }
    }
    const left = due - performance.now();
    if (left > 0) await waitRaw(left);
    await wordsSettle();
    await wait(REDUCED ? 150 : 500);

    /* 2. one part at a time: its label flies onto its word, and the word
          becomes the label */
    const now = worded.slice();
    for (let k = 0; k < segs.length; k++) {
      const sg = segs[k];
      const src = sg.fly && from[sg.fly];
      if (!sg.fly) continue;
      /* awaited: Swiftee's line for the part has started before it leaves */
      if (opts.beforeFly) await opts.beforeFly(sg.fly);
      const word = Array.from(txt.querySelectorAll('.wd')).find(w => (w.dataset.t || '').trim() === now[k].t);
      if (src && word) await flyLabel(src, word, sg.t);
      now[k] = { t: sg.t, w: sg.w };
      onWord(sg.w);
      await morphTo(txt, now, false, false);
      await wait(REDUCED ? 100 : 380);
    }
    return line;
  }

  /* A copy of a drawing's label, flown from the label onto a word in a line
     of working, at the word's own type and hue (floatLine) */
  async function flyLabel(src, target, text) {
    const from = src.getBoundingClientRect();
    const to   = target.getBoundingClientRect();
    if (!from.width || !to.width || REDUCED || fastForward) return;
    const cs = getComputedStyle(target);
    const ghost = document.createElement('span');
    ghost.className = 'float-word';
    ghost.textContent = text;
    Object.assign(ghost.style, {
      fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
      letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight, color: cs.color,
      left: to.left + 'px', top: to.top + 'px'
    });
    fx.appendChild(ghost);
    const s = from.height / to.height;
    const dx = (from.left + from.width / 2) - (to.left + ghost.offsetWidth * s / 2);
    const dy = (from.top + from.height / 2) - (to.top + to.height * s / 2);
    lineDenote([src], 500).catch(() => {});
    const a = ghost.animate([
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', opacity: 0 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', opacity: 1, offset: .12 },
      { transform: 'translate(' + (dx * .45) + 'px,' + (dy * .45 - 28) + 'px) scale(' + ((1 + s) / 2) + ')', opacity: 1, offset: .6 },
      { transform: 'none', opacity: 1 }
    ], { duration: 1100, easing: 'cubic-bezier(.35, .05, .25, 1)', fill: 'forwards' });
    sfx('click', .3);
    try { await finished(a); } finally { ghost.remove(); }
  }


  /* The rule again, in words (review, 2026-09-25): a copy of the line peels
     off it onto the row below -- fades up over it and slides down -- and
     there its b becomes "Diagonal" and its bracket "Sum of perpendicular
     heights", each as Swiftee says it (workSum). The copy's ghost holds
     the longest form it will take, so the row is its final size from the
     start and nothing under it moves as the words grow. */
  /* the part of a line from its "=" on: the row under a line that has
     already said "Area of Quadrilateral" carries only the right-hand side,
     set under the line's own "=" (user, 2026-09-28) */
  function rhsOf(segs) {
    const at = segs.findIndex(sg => sg.t.indexOf('=') >= 0);
    if (at < 0) return segs;
    const head = segs[at].t.slice(segs[at].t.indexOf('='));
    return [Object.assign({}, segs[at], { t: head })].concat(segs.slice(at + 1));
  }
  /* where the first "=" of a line is drawn: the character itself */
  function eqGlyph(line) {
    /* a typed line carries its words in `.txt` (with a `.type-ghost` copy
       overlaid); a words-line -- the rule opened into boxes -- has them bare.
       Read the overlay's "=" where there is one, else the bare words' */
    const wds = line.querySelector('.txt .wd') ? line.querySelectorAll('.txt .wd') : line.querySelectorAll('.wd');
    const w = Array.from(wds).find(x => (x.textContent || '').indexOf('=') >= 0);
    if (!w) return null;
    const walker = document.createTreeWalker(w, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const i = n.data.indexOf('=');
      if (i < 0) continue;
      const r = document.createRange();
      r.setStart(n, i); r.setEnd(n, i + 1);
      return r.getBoundingClientRect();
    }
    return null;
  }
  /* ...and where it sits in the lines' own column, untransformed: a line
     not yet shown is still scaled down (.area-line), so its glyph is read
     against its own box and divided back out of that box's scale */
  function eqAt(line) {
    const g = eqGlyph(line);
    if (!g) return null;
    const r = line.getBoundingClientRect();
    const kx = line.offsetWidth ? r.width / line.offsetWidth : 1;
    const ky = line.offsetHeight ? r.height / line.offsetHeight : 1;
    return { x: line.offsetLeft + (g.left - r.left) / (kx || 1),
             y: line.offsetTop + (g.top - r.top) / (ky || 1) };
  }
  async function copyLine(from, segs, widest, root) {
    const host = root || areaLinesEl;
    /* a block of lines centred as one (fit-lines): a copy wider than the
       line it comes off re-centres the block, and the line above is eased
       across to its new place rather than cut there */
    const centred = host.classList.contains('fit-lines');
    const was = centred ? from.getBoundingClientRect() : null;
    const line = document.createElement('div');
    line.className = 'area-line rhs-only';
    line.innerHTML = '<span class="type-wrap"><span class="type-ghost"></span>' +
      '<span class="type"><span class="txt"></span><i class="caret" aria-hidden="true"></i></span></span>';
    lineSpans(line.querySelector('.type-ghost'), widest);
    lineSpans(line.querySelector('.txt'), segs).forEach(part => {
      if (part.seg.w) part.els.forEach(el => el.classList.add('lit'));
      part.words.forEach(w => w.el.classList.add('in', 'landed'));
    });
    line.querySelector('.caret').hidden = true;
    host.appendChild(line);
    fitEq(line);
    /* indented so its "=" stands exactly under the "=" of the line it comes
       off -- the glyphs themselves are measured, not the words, which carry
       the space in front of the sign -- and it slides down from that row */
    /* the copy is read at its full size: not yet shown, it stands scaled
       down, and a glyph read through the scale came out a few px off (user,
       2026-09-30) */
    const plain = fn => {
      line.style.transition = 'none';
      line.style.transform = 'none';
      const out = fn();
      line.style.transform = '';
      void line.offsetWidth;
      line.style.transition = '';
      return out;
    };
    let at1 = eqAt(from), at2 = plain(() => eqAt(line));
    let dy = null;
    const eases = [];
    if (at1 && at2) {
      /* ...unless the column has no room for the indent and the line
         together: then it starts at the left edge rather than wrap inside
         its own box (the trapezium's rule in words, user, 2026-09-30) */
      const ghost = line.querySelector('.type-ghost');
      /* the live words run a hair wider than the ghost (see snug): a
         little slack, or the last of them folds under at the edge */
      const slack = () => ghost.offsetWidth + parseFloat(getComputedStyle(line).fontSize) * .6;
      let indent = Math.max(0, at1.x - at2.x), need = slack();
      if (host.clientWidth && ghost.offsetWidth && indent + need > host.clientWidth) {
        if (centred) {
          /* the trapezium's working (user, 2026-09-30): the lines close up
             together instead, the one above with its copy, so the "=" stays
             exactly under the "=". The new size is set outright and the
             glyphs measured again at it (the lines' own font-size transition
             held off, or they would be read mid-ease); the line above is
             then eased down to it over the same half second. */
          const fs = parseFloat(getComputedStyle(host).fontSize);
          const k = Math.max(.7, host.clientWidth / (indent + need));
          from.style.transition = 'none';
          host.style.fontSize = fmt(fs * k) + 'px';
          void host.offsetWidth;
          at1 = eqAt(from) || at1; at2 = plain(() => eqAt(line)) || at2;
          indent = Math.max(0, at1.x - at2.x);
          need = slack();
          from.style.transition = '';
          eases.push(() => from.animate([{ fontSize: fmt(fs) + 'px' }, { fontSize: fmt(fs * k) + 'px' }],
            { duration: 500, easing: 'ease' }));
        }
        if (indent + need > host.clientWidth) indent = Math.max(0, host.clientWidth - need);
      }
      line.style.paddingLeft = fmt(indent) + 'px';
      dy = at1.y - at2.y;
      /* ...and then read on screen and put right: a block that re-centres
         round the copy (fit-lines) settles a pass late, and the indent
         worked out above lands a few px off; the two glyphs are compared
         where they are drawn -- the copy still unshown -- until they meet */
      for (let i = 0; i < 3; i++) {
        const d = plain(() => {
          const g1 = eqGlyph(from), g2 = eqGlyph(line);
          return g1 && g2 ? g1.left - g2.left : 0;
        });
        if (Math.abs(d) < .25) break;
        line.style.paddingLeft = fmt(Math.max(0, (parseFloat(line.style.paddingLeft) || 0) + d)) + 'px';
      }
    }
    if (was) {
      const now = from.getBoundingClientRect();
      const dx = was.left - now.left;
      if (Math.abs(dx) > .5) eases.push(() => from.animate(
        [{ transform: 'translateX(' + fmt(dx) + 'px)' }, { transform: 'none' }],
        { duration: 700, easing: 'cubic-bezier(.33, 0, .15, 1)' }));
    }
    if (!REDUCED && !fastForward) eases.forEach(f => f());
    await peelOff(from, line, dy);
    return line;
  }

  /* a copy of a line, already in the row under it, fades up over the
     line and slides down into its own row */
  async function peelOff(from, line, rowDy) {
    /* the rows share one grid, so their offsets are the distance to slide --
       unless the caller measured the row the copy comes off exactly */
    const dy = rowDy != null ? rowDy : from.offsetTop - line.offsetTop;
    line.classList.add('show');
    if (REDUCED || fastForward) return;
    /* one unbroken glide: it fades up in place, then eases down without
       a stop, slowing gently into its row */
    const a = line.animate([
      { transform: 'translateY(' + dy + 'px)', opacity: 0 },
      { transform: 'translateY(' + (dy * .92) + 'px)', opacity: 1, offset: .3 },
      { transform: 'none', opacity: 1 }
    ], { duration: 1700, easing: 'cubic-bezier(.33, 0, .15, 1)' });
    sfx('click', .3);
    await finished(a);
  }

  /* ---------- the two halves together ----------
   * The third line is written as the sum of the two above it, and then
   * carries on being worked where it stands: each triangle's area put in,
   * and the base both of them share taken outside the bracket. One line,
   * one flow -- only the part after the "=" changes, slowly enough to be
   * followed, and each step is said before it is made. Then the rule again
   * in words on a row of its own, the celebration, and Next. */
  async function workSum(steps, words) {
    /* the sum is about both halves: neither is held back for it, and the
       base's own line drops back to the rest of the outline's weight --
       see .thick-base */
    focusTri(null);
    quadShape.classList.remove('thick-base');
    const sum = await showTypedLine(steps[0]);
    const sumTxt = sum.querySelector('.txt');
    await wait(REDUCED ? 300 : 1300);

    await heading(QUAD.swap);
    holdHeading();
    await wait(REDUCED ? 200 : 700);

    /* the line comes forward a step for as long as it is being worked on --
       enough to take the eye back to it, and settled at its new size before
       anything in it moves, since a morph measures the width it is easing to */
    sum.classList.add('solving');
    await wait(REDUCED ? 100 : 620);

    await morphTo(sumTxt, steps[1], false, true);
    await wait(REDUCED ? 300 : 1400);

    await heading(QUAD.share);
    holdHeading();
    await denoteQuad('base', 700);
    await morphTo(sumTxt, steps[2], false, true);
    await wait(REDUCED ? 300 : 1100);

    /* worked out: the line settles back to the size of the two above it */
    sum.classList.remove('solving');
    await wait(REDUCED ? 100 : 620);

    /* the rule in words: the copy comes off the line, and then each part
       becomes its name as Swiftee says it */
    words = words.map(rhsOf);
    const rule = await copyLine(sum, rhsOf(steps[2]), words[1]);
    const ruleTxt = rule.querySelector('.txt');
    await wait(REDUCED ? 200 : 500);
    const diag = (async () => {
      await wait(REDUCED ? 100 : 700);
      await morphTo(ruleTxt, words[0], false, true);
    })();
    await heading(QUAD.words1);
    holdHeading();
    await diag;
    await wait(REDUCED ? 200 : 500);
    const heights = (async () => {
      await wait(REDUCED ? 100 : 900);
      await morphTo(ruleTxt, words[1], false, true);
    })();
    await heading(QUAD.words2);
    holdHeading();
    await heights;
    await wait(REDUCED ? 200 : 700);

    await heading(QUAD.rule);
    await wait(REDUCED ? 150 : 350);
    celebrate();
    await wait(REDUCED ? 400 : 1800);

    /* the formula is complete: Swiftee and its line leave the heading, and
       the shape and the working come forward into the room it leaves --
       held open, so nothing slides up as the bird goes -- and only then
       the Next button (user, 2026-09-28) */
    board.classList.add('head-held');
    headStay = false;
    feedbackGen++;
    promptTxt.textContent = '';
    caret.hidden = true;
    if (boardMascot.classList.contains('in')) await mascotJumpOut();
    await wait(REDUCED ? 60 : 220);
    zoomContent(quad, [drawnRect(quadSvg)].concat(
      Array.from(areaLinesEl.querySelectorAll('.area-line .type-wrap')).map(el => el.getBoundingClientRect())));
    await wait(REDUCED ? 300 : 900 + 1500);
    await showNext();
  }

  /* A scene comes forward into the board once the heading is empty: the
     scale is worked out from what is actually drawn in it (`rects`, on
     screen), not from its box, so a scene as wide as the board still grows
     -- up into the heading and out to the board's sides, about the bottom
     middle of its content, never down over the footer. */
  function zoomContent(sec, rects, max) {
    rects = rects.filter(r => r && r.width && r.height)
      .map(r => ({ left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height }));
    if (!rects.length) return;
    const U = {
      left:   Math.min.apply(null, rects.map(r => r.left)),
      right:  Math.max.apply(null, rects.map(r => r.right)),
      top:    Math.min.apply(null, rects.map(r => r.top)),
      bottom: Math.max.apply(null, rects.map(r => r.bottom))
    };
    const b = board.getBoundingClientRect();
    const row = document.querySelector('.prompt-row').getBoundingClientRect();
    const W = U.right - U.left, H = U.bottom - U.top;
    const cx = (U.left + U.right) / 2;
    /* the room: from the top of the emptied heading down to where the
       content already ends, the board's width less its rim either side.
       Centred across it and in it top to bottom, the content grows as far
       as that room allows -- and when it is as wide as the board already,
       it still comes forward: it rises into the middle of the room the
       heading left (user, 2026-09-28) */
    const roomH = U.bottom - row.top;
    const k = Math.max(1, Math.min(max || ZOOM_MAX, roomH / H, (b.width - 2 * ZOOM_RIM) / W));
    const tx = (b.left + b.width / 2) - cx;
    const ty = -(roomH - H * k) / 2;
    const box = sec.getBoundingClientRect();
    sec.style.transformOrigin = (cx - box.left) + 'px ' + (U.bottom - box.top) + 'px';
    if (max) sec.dataset.zoomMax = max; else delete sec.dataset.zoomMax;
    sec.style.setProperty('--scene-zoom', k.toFixed(3));
    sec.style.setProperty('--scene-tx', tx.toFixed(1) + 'px');
    sec.style.setProperty('--scene-ty', ty.toFixed(1) + 'px');
    sec.classList.add('zoomed');
  }
  function unzoomContent(sec) {
    zoomOut(sec);
    sec.style.transformOrigin = '';
    sec.style.removeProperty('--scene-tx');
    sec.style.removeProperty('--scene-ty');
  }

  /* Only the two corners the diagonal joins are marked: the other pair is
     not part of the step, and dots on it only split the eye (review,
     2026-09-25). Their tap targets go with them, so the only join left to
     make is the right one. A rebuild of the shape starts with all four. */
  function onlyCorners(pair) {
    corners.forEach(c => c.classList.toggle('spare', pair.indexOf(c.dataset.corner) < 0));
  }

  async function sectionThree() {
    lockInput(true);
    sceneStart(sectionThree);
    unzoomContent(quad);       /* a replay comes back to the closing zoom */

    /* 1. Swiftee ducks back behind the board, and the lesson clears away
          while it is mid-air; the empty footer band draws in too */
    const out = mascotJumpOut();
    await wait(260);
    feedbackGen++;
    promptTxt.textContent = '';
    caret.hidden = true;
    board.classList.add('sec3');
    await out;
    /* The heading's room is held for the whole of this page, from before
       the shape is drawn: the row opening under Swiftee as it came up to
       the heading, and folding again as it left, resized the shape each
       time (user, 2026-09-28: the shape changes size too often). Held, the
       shape draws once at its final height and keeps it. Set while the
       board is blank, so the row opens with nothing on screen. */
    board.classList.add('head-held');
    await wait(520);

    /* the heading's ghost takes the longest line of the quadrilateral
       scenes; the board is blank, so the row can re-measure with nothing on
       it to move */
    promptReserve(longest([QUAD.join, QUAD.divided, QUAD.twoNew, QUAD.swap, QUAD.share, QUAD.rule,
                           FOUR.pick, FIVE.turn, QUAD.joinWrong('bottom', 'right')]));

    /* 2. the quadrilateral: outline first, then the colour, drawn full width
          in the middle of the board */
    buildQuad(SPEC_A);
    quad.classList.add('on');
    quad.setAttribute('aria-hidden', 'false');
    await wait(80);
    await revealShape(quadShape);
    /* seen whole, and still, before it makes room */
    await wait(REDUCED ? 200 : 900);

    /* 2b. it glides over to the left half, opening the right half for the
           name quiz. It comes back to the middle for the lines about it and
           the diagonal, and goes aside again for the working: three moves,
           each for a reason, and nothing else ever resizes it (user,
           2026-09-29) */
    await layoutWide(quad, quadSvg, true, 'ask');
    await wait(REDUCED ? 120 : 340);

    /* 3. Swiftee comes up from behind the board and asks what the shape is
          first; the three names then fade up on the right half, one to tap
          (user, 2026-09-25: the question first, then the options). The
          names are inert until dealt -- askChips is what takes their taps. */
    quizBubble.classList.remove('show', 'ok', 'bad');
    quizBlock.classList.remove('off');
    quizBlock.classList.add('show');
    await wait(REDUCED ? 200 : 440);
    await mascotJumpIn(quizMascot);
    await wait(REDUCED ? 100 : 260);
    swiftee.hold('talking');
    await quizSay(QUAD.ask);
    swiftee.release();
    await wait(REDUCED ? 100 : 320);
    await dealChips(quizChips);
    await askChips(quizChips, QUAD.answer,
      chip => quizSay(QUAD.notes[chip.dataset.answer] || QUAD.notes.triangle, 'bad'));
    /* the right answer counts the sides on the shape as it is said: its
       second piece, "A quadrilateral has 4 sides.", runs for its share of
       the clip */
    {
      const right = QUAD.notes[QUAD.answer];
      const clip = voFor(right);
      const secs = clip && !Motion.isMuted() ? await durationOf(clip) : 0;
      await quizSay(right, 'ok', piece => {
        if (!/\d sides/.test(piece)) return;
        countSides(secs ? secs * 1000 * piece.length / right.length
                        : Math.max(1600, piece.length * 55));
      });
    }
    /* a moment for the count to land, then straight on -- no Next, and no
       trip behind the board: the explanation runs as one conversation
       (user, 2026-09-28) */
    await wait(REDUCED ? 300 : 1400);

    /* 4. the names and the box go; Swiftee hops from the quiz up to the
          heading -- where it stays for the rest of the page, hand-overs
          included (headStay) -- and the shape glides back to the middle of
          the board as it goes (user, 2026-09-29) */
    quizBubble.classList.remove('show');
    quizBlock.classList.add('done');
    await wait(REDUCED ? 150 : 380);
    noteTxt.textContent = '';
    headStay = true;
    let toMid = null;
    await hopBetween(quizMascot, boardMascot, () => {
      /* the quiz is gone -- `off`, so its fade does not count as a room
         still occupied -- and its foot under the shape is shut at once, so
         the shape's new place is measured with the whole height it will
         have (shutRoomNow) */
      quizBlock.classList.remove('show', 'done');
      quizBlock.classList.add('off');
      shutRoomNow(quad.querySelector('.quad-foot'));
      toMid = layoutWide(quad, quadSvg, false, 'ask');
    });
    if (toMid) await toMid;
    await wait(REDUCED ? 100 : 300);

    /* the shape named from the heading, and the way in to its area */
    await heading(QUAD.general);
    holdHeading();
    await wait(REDUCED ? 300 : 900);
    await heading(QUAD.area);
    holdHeading();
    await wait(REDUCED ? 200 : 700);

    /* 5. the corners light up, and the instruction, a finger tracing the
          line as it is said */
    onlyCorners(['L', 'R']);
    quadShape.classList.add('dots');
    await wait(560);
    const signal = { done: false };
    const joinClip = voFor(QUAD.join);
    const joinSecs = joinClip && !Motion.isMuted() ? await durationOf(joinClip) : 0;
    const demo = demoJoin(signal, ['L', 'R'],
      { withLine: joinSecs ? joinSecs * 1000 : QUAD.join.length * TYPE_MS });
    await heading(QUAD.join);
    await awaitJoin(signal, ['L', 'R']);
    await demo;

    /* 6. joined: the two colours, and the shape glides aside to make room
          on the right for the working; then the line that says so */
    await wait(360);
    splitShape();
    await wait(REDUCED ? 300 : 700);
    await layoutWide();
    await wait(REDUCED ? 100 : 300);
    await heading(QUAD.divided);
    holdHeading();
    await wait(REDUCED ? 200 : 500);

    /* 7. one triangle at a time, in conversation, with a Next after each */
    await triangleTalk(SPEC_A, 0, { base: QUAD.base1, line: LINES_A[0] });
    await showNext();
    await triangleTalk(SPEC_A, 1, { base: QUAD.base2, line: LINES_A[1] });
    await showNext();

    /* 8. the two together: the sum, worked and then put into words */
    await workSum(QUAD_STEPS, WORDS_A);
    await trapPractice3();
  }

  /* ---------- tap the right chip ----------
   * A row of chips under the shape. The right one goes green with a burst; a
   * wrong one is shaken off, turned down in the heading, and steps back. A
   * skip taps the right one.
   *
   * `onWrong`, if a question has one, is told which chip was tapped, so the
   * question can say why that name is wrong as well as that it is. */
  function askChips(chips, answer, onWrong) {
    return new Promise(resolve => {
      let over = false;
      const finish = (chip, auto) => {
        if (over) return;
        over = true;
        skipFills.delete(fill);
        sceneWaiters.delete(teardown);
        lockInput(true);
        chips.forEach(c => c.removeEventListener('click', onTap));
        feedbackGen++;                       /* a wrong answer's line still typing stops here */
        markRight(chip);
        if (!auto) {
          sfx('correct', .7);
          burst(chip);
          swiftee.play('happy', 1);
        }
        resolve();
      };
      const onTap = e => {
        const chip = e.currentTarget;
        if (!interactive || chip.classList.contains('spent')) return;
        if (chip.dataset.answer === answer) { finish(chip, false); return; }
        sfx('wrong', .6);
        if (onWrong) onWrong(chip);
        swiftee.play('confused', 1);
        markWrong(chip);
        setTimeout(() => {
          chip.classList.remove('reject');
          chip.classList.add('spent');
        }, 440);
      };
      const fill = () => finish(chips.find(c => c.dataset.answer === answer), true);
      /* A replay retires the scene while the question is open. The chips
         stay on the page, so the listeners must come off them here -- left
         on, the retired question would answer the fresh one's tap first and
         lock the input under it. The promise is simply never settled. */
      const teardown = () => {
        sceneWaiters.delete(teardown);
        over = true;
        skipFills.delete(fill);
        chips.forEach(c => c.removeEventListener('click', onTap));
      };
      sceneWaiters.add(teardown);
      skipFills.add(fill);
      chips.forEach(c => c.addEventListener('click', onTap));
      lockInput(false);
    });
  }
  const firstPiece = text => segChunks([{ t: text }])[0].segs.map(sg => sg.t).join('');

  /* the chips fade up one after another */
  async function dealChips(chips) {
    for (const chip of chips) {
      chip.classList.add('reveal');
      await wait(150);
    }
    sfx('click', .3);
  }
  const rhUnit = (p, o) => { const l = Math.hypot(p.x - o.x, p.y - o.y) || 1; return { x: (p.x - o.x) / l, y: (p.y - o.y) / l }; };
  async function showDimGroup(g) {
    const ext = Array.from(g.querySelectorAll('.d-ext'));
    await Promise.all(ext.map(l => growLine(l, 380)));
    ext.forEach(l => { l.style.opacity = .7; });
    await growLine(g.querySelector('.d-arrow'), 720);
    g.classList.add('on');
    sfx('click', .35);
    await wait(REDUCED ? 160 : 520);
  }
  /* the answers come up one at a time, each with its own click */
  async function dealOneByOne(chips) {
    for (const chip of chips) {
      chip.classList.add('reveal');
      sfx('click', .25);
      await wait(REDUCED ? 80 : 420);
    }
  }

  /* the answers to a question: chips built fresh each time */
  function practiceChips(list, tray) {
    tray.classList.remove('off');
    tray.innerHTML = list.map(c =>
      '<button class="chip' + (c.formula ? ' formula' : '') + '" type="button" data-answer="' + c.v + '"><span>' + fracHTML(c.t) + '</span></button>').join('');
    return Array.from(tray.querySelectorAll('.chip'));
  }

  /* ---- the figures ----
   * Each is its own little shape, in a 360 x 260 box: a fill behind a wipe,
   * an outline that draws itself, and the lesson's marks over it. */
  const FIG_W = 360, FIG_H = 260;
  const figLine = (cls, a, b, dash) => '<line class="' + cls + '" x1="' + fmt(a.x) + '" y1="' + fmt(a.y) + '" x2="' + fmt(b.x) + '" y2="' + fmt(b.y) + '"' + dashAttr(dash) + ' />';
  const figHead = (tip, dx, dy, H) => {
    H = H || 9;
    const nx = -dy, ny = dx;
    return '<path class="d-head" d="M' + fmt(tip.x - dx * H + nx * H * .65) + ' ' + fmt(tip.y - dy * H + ny * H * .65) +
           ' L' + fmt(tip.x) + ' ' + fmt(tip.y) +
           ' L' + fmt(tip.x - dx * H - nx * H * .65) + ' ' + fmt(tip.y - dy * H - ny * H * .65) + '" />';
  };
  /* a two-headed arrow between a and b with its length written on it;
     `ext` are the corners it measures from */
  function figMeasure(cls, a, b, label, ext, rotate, size) {
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const u = rhUnit(b, a);
    const font = (size && size.font) || 17, head = (size && size.head) || 9;
    return '<g class="d-group ' + cls + '">' +
      ext.map(e => figLine('d-ext', e.from, e.to)).join('') +
      figLine('d-arrow', a, b, arrowDash(a, b, label, font)) + figHead(a, -u.x, -u.y, head) + figHead(b, u.x, u.y, head) +
      '<text class="d-label" x="' + fmt(mid.x) + '" y="' + fmt(mid.y) + '" font-size="' + font + '" text-anchor="middle" dominant-baseline="middle"' +
        (rotate ? ' transform="rotate(-90 ' + fmt(mid.x) + ' ' + fmt(mid.y) + ')"' : '') + '>' + label + '</text>' +
    '</g>';
  }
  function figShell(key, name, art, over, h, w) {
    h = h || FIG_H;
    w = w || FIG_W;
    return '<div class="fig" data-fig="' + key + '" tabindex="-1">' +
      '<div class="fig-art"><svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
        '<defs><clipPath id="lq-wipeFig' + key + '"><rect class="wipe" x="0" y="0" width="' + w + '" height="' + h + '" /></clipPath></defs>' +
        '<g class="art">' + art + '</g>' +
        '<g class="fig-over" style="--pair: var(--heading)">' + over + '</g>' +
      '</svg></div>' +
      (name ? '<button class="chip formula fig-chip" type="button" tabindex="-1" data-answer="' + key + '"><span>' + name + '</span></button>' : '') +
      '<div class="fig-work"><span class="type-wrap"><span class="type-ghost"></span>' +
        '<span class="type"><span class="txt"></span><i class="caret" hidden aria-hidden="true"></i></span></span></div>' +
    '</div>';
  }

  const figEl = (key, row) => row.querySelector('.fig[data-fig="' + key + '"]');

  /* ---- the practice figures, in page 16's own scale (user, 2026-09-30) ----
   * Every figure asked about on pages 17 to 19 is drawn in the same
   * 440-wide box the measured rhombus of page 16 has (its viewBox), with
   * its lengths written at the same size (19) and its arrowheads the same
   * (6), so the four pages read as one set: an outline, a diagonal, a
   * length line or a label is the same weight on every one of them. The
   * second diagonal's length stands up the RIGHT of the shape, as page
   * 16's does. */
  const PF_W = 440, PF_H = 250, PF = { font: 19, head: 6 };

  /* the figures are put up in place of the rhombus and draw themselves,
     one a beat after the other; then each takes its marks */
  /* Each figure is drawn in a 360-wide box that is taller than some of them
     need. The box is the drawing's room, and with the drawing standing at the
     top of its room (--art-gap in style.css) an unused band inside the viewBox
     would open under the heading just as a centred drawing used to. So the
     viewBox is fitted once, as the figures go up, to what the svg actually
     holds -- the marks that are shown later are already in the DOM, hidden, so
     they are measured too. The width, and with it the scale every figure in
     the row shares, is left exactly as built. */
  function fitFigArt(row) {
    row.querySelectorAll('.fig-art > svg').forEach(svg => {
      const vb = (svg.getAttribute('viewBox') || '').split(' ').filter(Boolean).map(Number);
      if (vb.length !== 4) return;
      let bb;
      try { bb = svg.getBBox(); } catch (e) { return; }
      if (!bb || !bb.height) return;
      const M = 7;                                  /* a hair, for the strokes */
      const top = Math.max(vb[1], Math.floor(bb.y - M));
      const bot = Math.min(vb[1] + vb[3], Math.ceil(bb.y + bb.height + M));
      if (bot - top >= vb[3] || bot - top < 40) return;
      svg.setAttribute('viewBox', vb[0] + ' ' + top + ' ' + vb[2] + ' ' + (bot - top));
    });
  }


  /* the old figures leave */
  async function clearFigures(row) {
    if (!row.children.length) return;
    row.classList.add('off');
    await wait(450);
    row.innerHTML = '';
    row.classList.remove('stepped', 'working');
  }



  /* a line of working that solves itself, put up where the typed lines go:
     the ghost holds the first step, the widest, so the box never moves */
  const asSegs = step => (typeof step === 'string' ? [{ t: step }] : step);
  async function showSolveLine(root, steps, onWord, ghost) {
    const line = document.createElement('div');
    line.className = 'area-line';
    line.innerHTML = '<span class="type-wrap"><span class="type-ghost"></span>' +
      '<span class="type"><span class="txt"></span><i class="caret" aria-hidden="true"></i></span></span>';
    /* the ghost holds the first step, which is normally the widest; a
       working that GROWS as it solves says which step to size it for */
    lineSpans(line.querySelector('.type-ghost'), asSegs(ghost || steps[0]));
    (root || areaLinesEl).appendChild(line);
    fitEq(line);
    await showLine(line, root);
    await solveLine(line.querySelector('.txt'), steps, AREA_MS, onWord);
    return line;
  }

  /* the "parallel" mark: two chevrons astride the middle of a side, pointing
     the way the side runs, with a halo so they read over the outline */
  function parMark(a, b, single) {
    const u = rhUnit(b, a), n = { x: -u.y, y: u.x };
    const M = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const s = 8;
    let d = '';
    /* `single`: one chevron per side rather than two -- a pair of sides
       matched by one mark each, which is all the values scene is saying */
    (single ? [0] : [-6, 6]).forEach(off => {
      const C = { x: M.x + u.x * off, y: M.y + u.y * off };
      d += 'M' + fmt(C.x - u.x * s + n.x * s) + ' ' + fmt(C.y - u.y * s + n.y * s) +
           ' L' + fmt(C.x) + ' ' + fmt(C.y) +
           ' L' + fmt(C.x - u.x * s - n.x * s) + ' ' + fmt(C.y - u.y * s - n.y * s);
    });
    return '<g class="par-mark"><path class="halo" d="' + d + '" /><path class="ink" d="' + d + '" /></g>';
  }

  /* ---------- section 9: the area of a trapezium, three times ----------
   * One continuous derivation -- no Next until the formula is in -- with
   * Swiftee narrating every beat, from the heading first and then from
   * beside the working. It is played three times, once for each kind of
   * trapezium the learner has just named: right-angled (two copies make a
   * rectangle), then scalene and isosceles (two copies make a
   * parallelogram). The choreography is one piece of code; the kind only
   * changes the corners and the words. Each kind has two entry points, so
   * Replay and the jump menu can land on the rectangle as well as on the
   * start.
   *
   *   1. the last drawing goes (or, the first time, the cards) and a
   *      trapezium draws itself in the MIDDLE of the board; the
   *      right-angled one has its two right angles marked: "Let us try to
   *      find the area of this ... trapezium."
   *   2. its sides are named there, on arrows: a along the top, b along the
   *      bottom, h up the left -- with the height itself dotted in when the
   *      left side is slanted
   *   3. the board opens out to the right and the trapezium slides across
   *      into the left half of it, leaving a whole half free beside it
   *   4. a copy pops out of the trapezium -- in the trapezium's own colours,
   *      so one shape is seen to become two -- takes a colour of its own,
   *      slides across into the free half and flips upside down there: two
   *      shapes now, half the stage each
   *   5. the trapezium's names are carried across to the copy one at a time,
   *      each starting on the side it was measured from and landing on the
   *      side of the copy that is the same, the two glowing green together:
   *      a, then b, then h
   *   6. the copy closes on the trapezium's right side -- the two make one
   *      rectangle or parallelogram -- and the two names along the top merge
   *      into one, a + b, and so do the two along the bottom
   *   7. the drawing moves to the left half of the board and Swiftee hops
   *      down to the right half, beside the working: Total area = length ×
   *      breadth (or base × height) = (a + b) × h, lighting what it names
   *   8. the copy fades to a dashed outline -- the trapezium is exactly
   *      half: Area of Trapezium = Half of total area = ½ × (a + b) × h
   *   9. the copy goes, the trapezium comes back to the middle with a, b
   *      and h and its parallel marks, and the rule is boxed: Area of
   *      Trapezium = ½ × (sum of parallel sides) × height. Confetti, Next. */
  const rtrap       = document.getElementById('rtrap');
  const rtrapShape  = document.getElementById('rtrapShape');
  const rtrapSay    = document.getElementById('rtrapSay');
  const rtrapMascot = document.getElementById('rtrapMascot');
  const rtrapText   = document.getElementById('rtrapText');
  const rtrapLines  = document.getElementById('rtrapLines');

  /* Swiftee's box beside the working (user, 2026-09-30): page 4's box,
     fitted to each piece it says rather than held at the page's longest
     line. The ghost is set the way the live line is (setTxt), as rpFit is. */
  const rtNoteGhost = rtrapText.querySelector('.type-ghost');
  const rtNoteTxt   = rtrapText.querySelector('.txt');
  const rtNoteCaret = rtrapText.querySelector('.caret');
  /* the box as another scene must find it: shut and empty */
  function rtNoteClear() {
    rtrapText.classList.remove('show');
    rtNoteTxt.textContent = '';
    rtNoteGhost.textContent = '';
    rtNoteCaret.hidden = true;
    rtrapLines.style.fontSize = '';           /* a pair that closed up to fit (copyLine) */
  }

  /* the lines of working step back together */
  async function rtClear() {
    const lines = Array.from(rtrapLines.children);
    if (!lines.length) { rtrapLines.style.fontSize = ''; return; }
    lines.forEach(l => l.classList.add('off'));
    await wait(REDUCED ? 100 : 420);
    lines.forEach(l => l.remove());
    rtrapLines.style.fontSize = '';           /* a pair that closed up to fit (copyLine) */
  }

  /* ---------- section 9, the practice: the trapezium's area in use ----------
   * Four questions on what the derivation built, a Next between each, on
   * the rhombus practice's pattern (user, 2026-09-30): the derivation's
   * drawing fades, and a figure built for each question draws itself in
   * the middle of the empty board, slowly, takes its height, its parallel
   * marks and its three measurements before a word is said, and then
   * glides into the left half of the board while the right half is given
   * to the question.
   *
   *   1. page 25, the values (trapNumbers), page 15's way: Swiftee stays at
   *      the heading, the formula builds itself in the right half with a, b
   *      and h as empty boxes, and the three measurements are dragged into
   *      them in order -- every drop answered in a sentence in the heading
   *      -- then the area is chosen from three, answered the same way, and
   *      the working simplifies itself under the formula
   *   2. page 26 (trapPractice1), page 16's way: the bird hops down into
   *      the right half and asks from its box -- the sum of the parallel
   *      sides, then the height -- three answers to each, one by one, and
   *      every verdict a sentence in the box
   *   3. page 27 (trapPractice2), on the board page 26 left standing: the
   *      area, from the same box, and the working under the answers
   *   4. page 28 (trapPractice3), the check for understanding: one
   *      trapezium, one question, three answers, and the working held back
   *      until the learner has answered
   *
   * All three figures are drawn in page 16's scale -- the 440-wide box of
   * pFigRhombus, lengths at 19, arrowheads at 6, an outline of 5 -- and
   * all three stand the same height, so a line, an arrow or a label is the
   * same weight on every page and the shape is the same size on each. */
  const rtrapPractice = document.getElementById('rtrapPractice');
  const rtFigRow      = document.getElementById('rtFigRow');
  const rtrapQuiz     = document.getElementById('rtrapQuiz');
  const rtrapFormula  = document.getElementById('rtrapFormula');
  const tpSlots       = Array.from(rtrapFormula.querySelectorAll('.fslot'));
  const rtrapTray     = document.getElementById('rtrapTray');
  const tpChips       = Array.from(rtrapTray.querySelectorAll('.chip'));
  const rtrapQs       = document.getElementById('rtrapQs');
  const rtrapPTray    = document.getElementById('rtrapPTray');
  const rtrapPSay     = document.getElementById('rtrapPSay');
  const rtrapPMascot  = document.getElementById('rtrapPMascot');

  const TP = {
    steps:   T('p27Steps'),
    read:    T('p28Look'),
    area:    T('p29Ask'),
    areaOk:  T('fbCorrectBang')
  };
  const TP_GHOST = [TP.read, TP.area, TP.areaOk];

  /* ---- the figures ----
   * A trapezium in page 16's 440 x 250 box, from its four corners: the two
   * parallel sides measured on arrows above and below, the height dotted
   * in from one corner to the opposite parallel side with a right angle at
   * its foot, and one chevron on each parallel side. `hgt` says which
   * corner the height drops from and which way its label and mark sit. */
  function figTrap(key, name, P, labels, hgt, single) {
    const pts = [P.TL, P.TR, P.BR, P.BL];
    const art =
      '<polygon class="shape-fill" clip-path="url(#lq-wipeFig' + key + ')" points="' + pts.map(pt).join(' ') + '" />' +
      '<path class="shape-outline" d="M' + pts.map(p => fmt(p.x) + ' ' + fmt(p.y)).join(' L') + ' Z" fill="none" stroke-width="5" />';
    const yT = P.TL.y - 24, yB = P.BL.y + 24;
    let over =
      figMeasure('d-top rt-len', { x: P.TL.x, y: yT }, { x: P.TR.x, y: yT }, labels.a, [], false, PF) +
      figMeasure('d-bot rt-len', { x: P.BL.x, y: yB }, { x: P.BR.x, y: yB }, labels.b, [], false, PF);
    /* The height: straight down from the parallel side `hgt.from` sits on
       to the other one. It starts at that corner, unless `hgt.x` names a
       point along the side to start from instead -- on a trapezium whose
       slanted side leans only a little, a height dropped from the corner
       runs alongside that side the whole way down and the two read as one
       line, so it is set in far enough to be plainly its own. */
    const corner = P[hgt.from];
    const from = { x: hgt.x == null ? corner.x : hgt.x, y: corner.y };
    const foot = { x: from.x, y: hgt.from.charAt(0) === 'T' ? P.BL.y : P.TL.y };
    const M = 12, up = foot.y > from.y ? -1 : 1, side = hgt.side, hv = rhUnit(foot, from);
    over += '<g class="d-group d-hgt">' +
      figLine('d-height', from, foot) + figHead(from, -hv.x, -hv.y, PF.head) + figHead(foot, hv.x, hv.y, PF.head) +
      '<path class="d-mark" d="M' + fmt(foot.x) + ' ' + fmt(foot.y + up * M) + ' H' + fmt(foot.x + side * M) + ' V' + fmt(foot.y) + '" />' +
      '<text class="d-label" x="' + fmt(foot.x + side * 10) + '" y="' + fmt((from.y + foot.y) / 2) + '" font-size="' + PF.font + '" text-anchor="' + (side > 0 ? 'start' : 'end') + '" dominant-baseline="middle">' + labels.h + '</text>' +
    '</g>';
    over += '<g class="rt-par">' + parMark(P.TL, P.TR, single) + parMark(P.BL, P.BR, single) + '</g>';
    return figShell(key, name, art, over, PF_H, PF_W);
  }
  /* The three figures, in the box's units. Every one stands 150 tall, from
     y = 50 to y = 200, and is centred in the box, so the three take the
     same room and their labels sit at the same heights; the widths are to
     each figure's own scale. */
  const TP_FIGS = {
    /* 8, 14 and 6 at 25 units to the centimetre: the bottom 350 wide, the
       top 200 and set in */
    n:  { P: { TL: { x: 109, y: 50 }, TR: { x: 309, y: 50 }, BR: { x: 395, y: 200 }, BL: { x: 45, y: 200 } },
          labels: { a: CM(8), b: CM(14), h: CM(6) }, hgt: { from: 'TL', side: 1 } },
    /* 13, 20 and 10 at 15 units to the centimetre: the bottom 300, the top
       195 */
    p:  { P: { TL: { x: 120, y: 50 }, TR: { x: 315, y: 50 }, BR: { x: 400, y: 200 }, BL: { x: 100, y: 200 } },
          labels: { a: CM(13), b: CM(20), h: CM(10) },
          /* its left side leans only 20 units over the whole drop, so the
             height is set in from the corner (user, 2026-09-18): dropped
             from the corner itself the two lines start at the same point
             and stay a hair apart all the way down, and a learner reads
             them as one */
          hgt: { from: 'TL', side: 1, x: 170 } },
    /* the check for understanding, 30, 40 and 15 at 10 units to the
       centimetre: 300 on top, 400 below, its right side square, so the
       height is plainly the distance between the two parallel sides and
       not one of the slanted ones */
    c:  { P: { TL: { x: 120, y: 50 }, TR: { x: 420, y: 50 }, BR: { x: 420, y: 200 }, BL: { x: 20, y: 200 } },
          labels: { a: CM(30), b: CM(40), h: CM(15) }, hgt: { from: 'TL', side: 1 } }
  };
  /* one chevron to a parallel side, the same mark on each, which is all
     "parallel" needs said */
  const tpFig = (key, name) => figTrap(key, name || '', TP_FIGS[key].P, TP_FIGS[key].labels, TP_FIGS[key].hgt, true);
  const tpFigEl = key => figEl(key, rtFigRow);

  /* a figure put up in the row, unseen yet: in page 16's scale and at the
     size it will keep (p-fig), so the glide into the left half is a slide
     and never a resize */
  function tpPutFig(html) {
    rtFigRow.innerHTML = html;
    fitFigArt(rtFigRow);
    rtFigRow.classList.remove('off', 'stepped', 'working');
    rtFigRow.classList.add('single');
    const f = rtFigRow.querySelector('.fig');
    f.classList.add('p-fig');
    rtrapPractice.classList.add('on');
    return f;
  }

  /* ---- a figure draws itself on the empty board (pages 25, 26 and 28) ----
   *   1. the trapezium, slowly, and with no instruction anywhere: there is
   *      nothing to read but the shape, and Swiftee waits behind the board
   *   2. the perpendicular height drops in dotted and squares off at its
   *      foot; then one chevron lands on the top parallel side and the same
   *      one on the bottom -- the pair is named before it is measured
   *   3. the three measurements arrive in turn -- above, below, beside the
   *      height -- each popping in on its own arrow, and its line glowing
   *      for a moment as the number lands */
  async function tpDrawFig(html) {
    const fig = tpPutFig(html);
    await wait(REDUCED ? 120 : 420);
    await revealShape(fig, REDUCED ? 120 : 1200, REDUCED ? 80 : 760);
    await wait(REDUCED ? 120 : 560);

    const hgt = fig.querySelector('.d-hgt');
    await growLine(hgt.querySelector('.d-height'), REDUCED ? 120 : 1000);
    hgt.classList.add('marked');
    sfx('click', .35);
    await wait(REDUCED ? 120 : 620);

    for (const m of Array.from(fig.querySelectorAll('.par-mark'))) {
      m.classList.add('on');
      sfx('click', .28);
      await wait(REDUCED ? 60 : 460);
    }
    await wait(REDUCED ? 100 : 420);

    for (const sel of ['.d-top', '.d-bot', '.d-hgt']) {
      const g = fig.querySelector(sel);
      /* the pop belongs to the label's arrival, so it is armed here and
         fires when the group comes on (CSS) rather than now */
      g.querySelector('.d-label').classList.add('pop');
      if (g.classList.contains('d-hgt')) {
        /* its line is already drawn: only the measurement is due */
        g.classList.add('on');
        sfx('click', .35);
        await wait(REDUCED ? 120 : 520);
      } else {
        await showDimGroup(g);
      }
      await tnFlash(fig, sel);
      await wait(REDUCED ? 100 : 320);
    }
    await wait(REDUCED ? 100 : 420);
    return fig;
  }

  /* a value lands in the working or the formula: the part of the figure it
     names lights up */
  function tpLight(key, what) {
    const f = tpFigEl(key);
    if (!f) return;
    const cls = { a: '.d-top', b: '.d-bot', ab: '.d-top, .d-bot', h: '.d-hgt' }[what];
    if (cls) f.querySelectorAll(cls).forEach(g => g.classList.add('lit'));
  }

  /* the values go home between scenes: a replay may find them docked */
  function homeTpChips() {
    tpChips.forEach(c => { rtrapTray.appendChild(c); c.disabled = false; c.classList.remove('reveal', 'picked', 'dragging', 'reject'); });
    tpSlots.forEach(s => s.classList.remove('filled', 'over', 'correct', 'reject'));
  }

  /* ---- the common opening of a practice question, page 16's way ----
   * Whatever the last page left fades where it stands -- the panel's words
   * and answers, the figure, the derivation's lines -- and the bird goes
   * behind the board; only then, with nothing on the board to move, does
   * the layout change. The question that follows opens on a blank board
   * (user, 2026-09-30). `duck` is the only way in now: every question
   * draws its shape alone first. */
  async function tpOpen(again, duck) {
    lockInput(true);
    sceneStart(again);
    const mine = runToken;
    promptReserve(longest(TP_GHOST));
    feedbackGen++;
    promptTxt.textContent = '';
    caret.hidden = true;
    board.classList.add('sec7');
    rtrap.classList.add('on');
    rtrap.setAttribute('aria-hidden', 'false');
    rtrapShape.classList.add('away');
    rtrapLines.classList.remove('rule', 'steps');
    homeTpChips();
    rtrapQuiz.classList.remove('show');
    rtrapFormula.classList.remove('show');
    rtrapQs.classList.remove('show');
    rtrapQs.textContent = '';
    rtrapPTray.classList.add('off');

    /* 1. everything fades where it stands, and the bird leaves */
    tnPanel.classList.remove('show');
    tcPanel.classList.add('done');
    tcNote.classList.remove('show');
    rtrapSay.classList.remove('show');
    rtrapPSay.classList.remove('show');
    const cleared = clearFigures(rtFigRow);
    const clearing = rtClear();
    const spot = rtrapMascot.classList.contains('in') ? rtrapMascot
               : rtrapPMascot.classList.contains('in') ? rtrapPMascot
               : tcMascot.classList.contains('in') ? tcMascot : null;
    await wait(REDUCED ? 80 : 260);
    if (duck) await mascotJumpOut(spot || boardMascot);
    else if (spot) await hopBetween(spot, boardMascot);
    tcPanel.classList.add('off');
    await cleared;
    await clearing;

    /* 2. the board is blank: the layout can change with nothing on it to move */
    rtrap.classList.remove('wide', 'deriv', 'solve', 'cfu');
    tnClear();
    tcClear();
    rtrapLines.textContent = '';
    rtNoteClear();
    await wait(REDUCED ? 100 : 320);
    return mine;
  }

  /* ---------- 1. the values, found and then used (page 25) ----------
   * Page 15's flow (user, 2026-09-30): the learner carries the three
   * measurements into the formula before it is used, and every drop is
   * answered in a sentence from the heading, where Swiftee stays for the
   * whole page.
   *
   *   1. the trapezium draws itself on the empty board and takes its marks
   *      and its three measurements (tpDrawFig)
   *   2. Swiftee comes up beside the heading: "Let's find the area of this
   *      trapezium." The board halves -- the shape glides into the left
   *      half, the panel takes the right -- and the formula builds itself
   *      there a piece at a time, "Area = ½ × ( a + b ) × h", with a, b and
   *      h as empty boxes; the three lengths are dealt into the tray under
   *      it
   *   3. "Drag the three lengths into the formula." The boxes go in order:
   *      a first, then b, then h, each locked until the one before it is
   *      right. A wrong length is shaken off and told what the box wants;
   *      a right one lights the measurement it came from and the heading
   *      names it and asks for the next
   *   4. all three in: "That's Correct!" -- and straight on to the working,
   *      in the row the lengths have left (user, 2026-09-30): "Let's
   *      simplify it, step by step." -- "Area = ½ × ( 8 + 14 ) × 6"
   *      simplifies itself to "Area = 66 sq. cm", each step flaring the
   *      measurement on the drawing that it is about, and the shape
   *      swelling once at the answer; confetti, and Next */
  const tnPanel   = document.getElementById('tnPanel');
  const tnFormula = document.getElementById('tnFormula');
  const tnTray    = document.getElementById('tnTray');
  const tnWork    = document.getElementById('tnWork');
  let tnChips = [];

  /* the panel as a scene that is not this one must find it: empty, unpainted */
  function tnClear() {
    tnPanel.classList.remove('show');
    tnFormula.textContent = '';
    tnWork.textContent = '';
    tnTray.textContent = '';
    tnTray.classList.remove('off');
    tnChips = [];
  }

  /* a measurement is pointed at for a moment, then left alone again: long
     enough to tie the number to its line, short enough not to stay */
  async function tnFlash(f, sel) {
    const gs = Array.from(f.querySelectorAll(sel));
    gs.forEach(g => g.classList.add('lit'));
    await wait(REDUCED ? 160 : 900);
    gs.forEach(g => g.classList.remove('lit'));
  }

  /* ---------- the question panel of pages 26 to 28 ----------
   * Page 16's panel over again (user, 2026-09-30): the board halves 50/50,
   * the trapezium keeps the left half, and Swiftee hops down into the
   * right half -- the bird at the left end of the answers, its box up over
   * its head and refitted to every line it says. The question is asked
   * from the box, the answers come up one by one under it, and every
   * verdict is said in the same box: red for a wrong pick, with what that
   * number is instead, green for the right one, with the working. The
   * working the right answer solves itself into goes under the answers.
   * Nothing is ever said over the drawing. */
  const tcPanel  = document.getElementById('tcPanel');
  const tcMascot = document.getElementById('tcMascot');
  const tcNote   = document.getElementById('tcNote');
  const tcGhost  = tcNote.querySelector('.type-ghost');
  const tcTxt    = tcNote.querySelector('.txt');
  const tcCaret  = tcNote.querySelector('.caret');
  const tcTray   = document.getElementById('tcTray');
  const tcWork   = document.getElementById('tcWork');

  /* the box fits the piece it is saying, and is fitted before the bird is
     brought up, for the reason quizSay gives (rpFit's way) */
  const tcFit = text => { setTxt(tcGhost, text); snug(tcGhost); };
  async function tcSay(text, tone) {
    tcFit(firstPiece(text));
    await speakerUp(tcTxt);
    feedbackGen++;
    tcNote.classList.remove('ok', 'bad');
    if (tone) tcNote.classList.add(tone);
    tcCaret.hidden = true;
    swiftee.hold('talking');
    const said = sayPieces(tcTxt, text, piece => tcFit(piece));
    tcNote.classList.add('show');
    await said;
    swiftee.release();
  }
  /* the panel as a scene that is not this one must find it: empty and
     unpainted. `data-page` names the page that last painted it, so the page
     that continues on another's board can tell whether it is there. */
  function tcClear() {
    tcPanel.classList.remove('show', 'off', 'done');
    tcNote.classList.remove('show', 'ok', 'bad');
    tcTxt.textContent = '';
    tcGhost.textContent = '';
    tcCaret.hidden = true;
    tcTray.innerHTML = '';
    tcTray.classList.remove('off');
    tcWork.textContent = '';
    tcWork.classList.remove('win');
    delete tcPanel.dataset.page;
  }
  /* the answers to a question that has been answered leave, so the next
     question's can take their room */
  async function tcRetire() {
    if (!tcTray.children.length) return;
    tcTray.classList.add('off');
    await wait(REDUCED ? 100 : 420);
    tcTray.innerHTML = '';
    tcTray.classList.remove('off');
  }
  /* one question from the box, over answers already built under it:
       - the question, then the answers one by one
       - a wrong answer is met with a sentence in red in the box
       - the right one: the other answers go, `onRight` lights what the
         answer was read off, and the verdict is said in green */
  async function tcAsk(q, chips, mine, onRight) {
    await tcSay(q.ask);
    await wait(REDUCED ? 100 : 320);
    await dealOneByOne(chips);
    await wait(REDUCED ? 80 : 200);
    await askChips(chips, q.right, chip => {
      tcSay(q.notes[chip.dataset.answer] || q.notes[q.wrongDefault], 'bad').catch(() => {});
    });
    if (mine !== runToken) throw CANCELLED;
    chips.filter(c => c.dataset.answer !== q.right).forEach(c => c.classList.add('gone'));
    if (onRight) await onRight();
    await tcSay(q.notes[q.right], 'ok');
    if (mine !== runToken) throw CANCELLED;
  }
  /* the board halves for the question: the panel is painted first, empty,
     with the first answers built unrevealed and the box fitted to the first
     line, so the bird's spot and the tray's room are laid out before it
     arrives (page 16's rule); then the shape glides into the left half, and
     Swiftee comes up from behind the board into the right */
  async function tcOpenPanel(fig, page, first, opts) {
    tcClear();
    tcPanel.dataset.page = page;
    const chips = practiceChips(opts, tcTray);
    tcFit(firstPiece(first));
    tcPanel.classList.add('show');
    await layoutWide(rtrap, fig.querySelector('svg'), true, 'cfu');
    await wait(REDUCED ? 120 : 620);
    await mascotJumpIn(tcMascot);
    await wait(REDUCED ? 100 : 260);
    return chips;
  }

  /* ---------- 5. the check for understanding (page 28) ----------
   * One trapezium, one question, and the two halves of the board given to
   * the two halves of the job: the figure is READ on the left, the question
   * is ANSWERED on the right, and neither ever stands on the other. This is
   * the assessment the section ends on, so nothing of the calculation is on
   * the board before the learner has answered: a formula shown before the
   * answer is half the answer.
   *
   *   1. the trapezium draws itself on the empty board and takes its marks
   *      and its three measurements (tpDrawFig)
   *   2. the board halves and Swiftee comes up into the right half: "What is
   *      the area of the trapezium?" -- three answers, one by one
   *   3. a wrong pick is told what that number is instead, in red in the
   *      box; the right one lights the two parallel sides and then the
   *      height on the figure -- the answer is read back off the
   *      measurements first -- and is worked out in green
   *   4. and only then do the answers go and the working solve itself in
   *      their place: 30 and 40 make 70, and half of 70 fifteens is 525
   *      sq. cm, which glows once */
  const TC = {
    ask: TP.area,
    /* the right one, the product without the half, and one side only */
    opts: [{ v: '525', t: SQCM(525) }, { v: '1050', t: SQCM(1050) }, { v: '450', t: SQCM(450) }],
    right: '525', wrongDefault: '1050',
    notes: {
      '1050': T('p30Wrong1050'),
      '450':  T('p30Wrong450'),
      '525':  T('p30Right')
    },
    /* the sum of the parallel sides first, then the halving: the two steps
       the formula is, in the order it is read in */
    work: T('p30Work')
  };
  const tcFig = () => tpFig('c');

  async function trapPractice3() {
    /* the bird goes behind the board: the shape draws itself alone */
    const mine = await tpOpen(trapPractice3, true);
    holdBird();                  /* the question's bird stays beside it while the learner solves */

    /* ---- 1. the trapezium draws itself, and takes its measurements ---- */
    const fig = await tpDrawFig(tcFig());

    /* ---- 2. the board halves and Swiftee comes up into the right half ---- */
    const chips = await tcOpenPanel(fig, 'tc', TC.ask, TC.opts);

    /* ---- 3. the question, the answers, and the verdicts, from the box:
         the right answer is read back off the figure before it is worked
         out -- the two parallel sides, then the height ---- */
    await tcAsk(TC, chips, mine, async () => {
      tpLight('c', 'ab');
      await wait(REDUCED ? 140 : 620);
      tpLight('c', 'h');
      await wait(REDUCED ? 140 : 520);
    });
    /* the answers go, and the working takes their row (user, 2026-09-30) */
    await wait(REDUCED ? 200 : 900);
    await tcRetire();
    await wait(REDUCED ? 80 : 240);

    /* ---- 4. and only now the working, which solves itself. One glow on
         the line it lands in -- the celebration points at the result rather
         than away from it ---- */
    await showSolveLine(tcWork, TC.work);
    tcWork.classList.add('win');
    sfx('correct', .5);
    swiftee.play('proud', 1);
    skyConfetti(90, 2800);
    sfx('confetti', .7);
    feedback(FEEDBACK.done);
    await wait(REDUCED ? 300 : 2600);
    await showNext();
    lessonDone();
  }

  /* ============================================================
     THE MISSION'S SIDE
     ============================================================ */

  /* the board as it was parsed: what every reset puts back */
  const PRISTINE = stageNow();

  /* The screen back to its opening state: whatever page was playing
     is retired, its chain unwinds, and the board is as it was parsed. */
  function reset() {
    runToken++;
    fastForward = false;
    doneHook = null;
    Motion.retire();
    clearStage();
    restoreStage(PRISTINE);
    sceneHistory.length = 0;
    sceneIndex = -1;
    sceneAgain = null;
    headStay = false;
    birdStay = false;
    lockInput(true);
  }

  /* Both pages, from the board arriving to the last Next. Resolves
     true then; false if the mission took the screen away. `opts.page`
     opens on page 28 instead -- the scene tools' way in. */
  function run(opts) {
    opts = opts || {};
    const page = Math.max(0, Math.min(MISSION.length - 1, opts.page | 0));
    const mine = ++runToken;
    fastForward = false;
    /* motion.js reads one game's fast-forward at a time: this one's,
       while this screen plays */
    Motion.bind({ fast: function () { return fastForward; } });
    lockInput(true);

    return (async function () {
      await wait(200);
      await showBoard();
      await wait(160);
      /* the last page ends on its Next, which calls lessonDone(); a
         teardown rejects this the way it rejects every scene's wait */
      const done = new Promise(function (resolve, reject) {
        const release = function () {
          sceneWaiters.delete(release);
          if (mine !== runToken) reject(CANCELLED); else resolve();
        };
        sceneWaiters.add(release);
        doneHook = resolve;
      });
      /* not awaited: a scene runs on past its own function, carried by
         the learner's answers, into the next page */
      MISSION[page].entry().catch(function (e) { if (e !== CANCELLED) throw e; });
      await done;
      return true;
    })().catch(function (e) {
      if (e === CANCELLED) return false;
      throw e;
    });
  }

  /* the scene tools' Sound switch: the line being said stops where it
     stands, and the beat waiting on it is let go */
  function setMuted(on) {
    if (on) stopVoice();
  }

  /* What the start gate fetches for this screen: the clips, as blob:
     URLs played from memory. The board, the landscape and Swiftee's
     sheets are the first lesson's, and are fetched for it. */
  const VO_KEYS = ['fbCorrectBang', 'p04WhatShape', 'p04NotTriangle', 'p04NotPentagon',
    'p04IsQuad', 'p04General', 'p04FindArea', 'p04Join', 'p04JoinWrongLR', 'p04Divided',
    'p04Base1', 'p04HeightIs1', 'p04HeightIs2', 'p04AreaIs', 'p04Base2', 'p04PutIn',
    'p04Share', 'p04Words1', 'p04Words2', 'p04Rule', 'p29Ask', 'p30Wrong1050',
    'p30Wrong450', 'p30Right'];
  function assets() {
    const out = [];
    const seen = Object.create(null);
    const files = (I18n && I18n.voiceUrls) ? I18n.voiceUrls() : [];
    VO_KEYS.forEach(function (k) {
      const u = files.filter(function (f) { return f.indexOf('/' + k + '.') !== -1; })[0];
      if (!u || seen[u]) return;
      seen[u] = true;
      out.push({ url: u, apply: function (blob) { local[u] = blob; } });
    });
    return out;
  }

  return {
    reset: reset, run: run, skip: skipScene, setMuted: setMuted, assets: assets,
    pages: function () { return MISSION.map(function (m) { return m.name; }); }
  };
  }

  global.GeoLearnQuad = {
    init: init,
    assets: function () { return api ? api.assets() : []; },
    reset: function () { if (api) api.reset(); },
    run: function (opts) { return api ? api.run(opts) : Promise.resolve(true); },
    skip: function () { if (api) api.skip(); },
    pages: function () { return api ? api.pages() : []; },
    setMuted: function (on) { if (api) api.setMuted(on); }
  };
})(window);

/* ============================================================
   Geo Drone — audio engine

   · one AudioContext, one shared AnalyserNode
   · narration is routed THROUGH the analyser, so the cockpit
     readout is driven by the actual voice line that is playing
   · ambience/SFX go straight to the speakers so they do not
     pollute the readout
   · say() resolves when the line finishes, which is what the
     flow in script.js is sequenced on
   · if the analyser comes back silent (file:// pages taint the
     media element in most browsers) we transparently fall back
     to a procedural, speech-shaped envelope keyed to playback
     time — the readout still starts, moves and stops with the
     voice
   · everything playing is paused when the tab is hidden and
     picked up again on return (see js/lifecycle.js)
   · every clip is Ogg Opus or WebM Opus (Chrome, Edge, Firefox, and
     Safari 17+). The start gate fetches them all up front
     (js/preload.js) and hands each one in as a blob: URL through
     adopt(), so the first play() of any line reads from memory; a
     clip whose blob fails falls back to its file URL once and
     carries on
   · the voice lines are keyed, and their files are named by the
     locale's voice pack (locales/locales.json), so the narration
     and the words on screen share one name -- see voiceSrc()
   ============================================================ */

(function (global) {
  'use strict';

  var DIR = 'assets/audio/';

  /* file:// taints media-element sources: the analyser reads zeroes
     AND the element's sound disappears into the graph. Only wire the
     analyser up when we are actually served over http(s).           */
  var CAN_ANALYSE =
    global.location.protocol === 'http:' ||
    global.location.protocol === 'https:';

  /* The narration is KEYED: a line and its clip share one name, and
     the clip's file is named by the locale's voice pack
     (locales/locales.json -> voiceOver.<lang>.files), looked up
     through I18n.voiceKey(key). A key the pack has no file for has
     no voice, and narrate() in js/script.js types it at reading rate
     instead -- so a line can be written, keyed and played before it
     is recorded, and starts speaking the moment its clip is added
     to the pack. */
  function voiceSrc(key) {
    var I = global.I18n;
    var u = I && I.voiceKey ? I.voiceKey(key) : null;
    return u ? encodeURI(u) : null;
  }

  var SFX = {
    launch:  'drone-launch.webm',
    rock:    'rock in water.webm',

    /* The two failed landings, one clip each. Both run about two
       seconds, which is what decides where they are fired from:

         crash  2.09s  the hull coming down on the rock. Fired on
                       the frame of impact, so it is still ringing
                       while the wreck settles and the verdict line
                       starts over the top of it.
         sink   1.92s  going into the water and under it. Fired at
                       the moment of entry, where it runs almost
                       exactly the length of the plunge and the sink
                       together (204ms + 1700ms) and dies away as
                       the hull disappears.

       Both are primed rather than built at the moment they are
       needed — see prime() below. */
    crash:   'crash-sound.webm',
    sink:    'sinking-sound.webm',
    glitch:  'screen-glitch.webm',
    correct: 'correct-answer.webm',
    wrong:   'incorrect-answer.webm',
    click:   'button-click.webm',
    cheer:   'confetti-sound.webm'
  };

  var AMBIENCE = 'theme-music.webm';

  /* ---------------------------------------------------------- state */
  var ctx = null;
  var analyser = null;
  var voiceBus = null;          // gain node all narration passes through
  var freqBytes = null;

  var voices = {};              // key -> HTMLAudioElement
  var wired = {};               // key -> true once MediaElementSource exists
  var ambience = null;

  var active = null;            // element currently narrating
  var analyserAlive = null;     // null = untested, true/false once probed
  var probeUntil = 0;

  var oneShots = [];            // SFX still in flight
  var held = [];                // what we paused when the tab went away

  /* The scene tools' Sound switch. Muting silences every element
     rather than stopping it: a line keeps its length and the caption
     clocked off it keeps typing, so the flow is the same with the
     sound off as with it on. New elements inherit the state as they
     are built. */
  var muted = false;

  /* ---------------------------------------------------------- helpers */
  var local = {};               // remote URL -> blob: URL, from the start gate

  /* a sound effect's own URL; the voices' come from the pack */
  function remote(file) { return encodeURI(DIR + file); }
  function url(src) { return local[src] || src; }

  /* One-time fallback for an element playing from a blob: URL. If
     the blob fails — revoked, refused, out of memory — the element
     goes back to its file URL, once, and picks up where it was. The
     flag tells say()/fireShot() to sit through that one error rather
     than declare the line finished while it is still going to play.

     Registered at construction so it runs BEFORE their own error
     listeners (listeners fire in the order they were added). */
  function guard(el, src) {
    el.addEventListener('error', function onErr() {
      el.removeEventListener('error', onErr);
      if (!local[src] || el.src !== local[src]) return;   /* not the blob's fault */

      var playing = !el.paused && !el.ended;
      var at = el.currentTime;
      delete local[src];                  /* nobody else adopts a dead blob */

      el._geoRecover = true;              /* for the error listeners after this one */
      el._geoFellBack = true;             /* for the play() promise that is about to reject */
      el.src = src;
      el.load();
      if (playing) {
        try { el.currentTime = at; } catch (e) { /* not seekable yet */ }
        var p = el.play();
        /* the file would not start either: say so the ordinary way,
           so whoever is waiting on this element is released */
        if (p && p.catch) p.catch(function () { el.dispatchEvent(new Event('error')); });
      }
    });
  }

  /* did guard() just take this error? Answered once, then cleared. */
  function recovering(el) {
    if (!el._geoRecover) return false;
    el._geoRecover = false;
    return true;
  }

  /* HTMLMediaElement.volume throws outside [0,1], and a ramp can
     land a hair past either end on the last frame */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* Safety timers must not burn down while the tab is hidden, or a
     line paused mid-sentence would be declared dead and the flow
     would walk over it on return. */
  function later(ms) {
    return global.GeoLife
      ? global.GeoLife.wait(ms)
      : new Promise(function (r) { setTimeout(r, ms); });
  }

  /* Skip bins 0-1 (DC and rumble — always dead) and stop at 40% of
     the range: a voice track carries no energy above that, and
     mapping bands onto empty bins flattens the trace into a line. */
  var BIN_FIRST = 2;
  var BIN_TOP = 0.40;

  function binEdge(k, usable) {
    return BIN_FIRST + Math.floor(Math.pow(k, 1.45) * (usable - BIN_FIRST - 1));
  }

  /* a fixed per-band roughness table, so the procedural trace has
     the uneven silhouette of real speech instead of a tidy comb */
  var ROUGH = [];
  for (var r = 0; r < 128; r++) {
    ROUGH.push(0.30 + ((Math.sin(r * 12.9898) * 43758.5453) % 1 + 1) % 1 * 0.70);
  }

  function makeVoice(src) {
    var el = new Audio();
    /* none: the start gate has already fetched the file and, on
       http(s), handed it in as a blob — a second, speculative
       download here would only race the loading bar */
    el.preload = 'none';
    guard(el, src);
    el.src = url(src);
    el._geoSrc = src;
    el.volume = 1;
    el.muted = muted;
    return el;
  }

  /* ---------------------------------------------------------- graph */
  function ensureContext() {
    if (!CAN_ANALYSE) { analyserAlive = false; return null; }
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.72;
      analyser.minDecibels = -92;
      analyser.maxDecibels = -18;
      freqBytes = new Uint8Array(analyser.frequencyBinCount);

      voiceBus = ctx.createGain();
      voiceBus.gain.value = 1;
      voiceBus.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (e) {
      ctx = null;
      analyser = null;
    }
    return ctx;
  }

  function routeThroughAnalyser(key, el) {
    if (!ctx || !voiceBus || wired[key]) return;
    try {
      var src = ctx.createMediaElementSource(el);
      src.connect(voiceBus);
      wired[key] = true;
    } catch (e) {
      /* already wired elsewhere, or blocked — the fallback covers it */
      wired[key] = true;
    }
  }

  /* ---------------------------------------------------------- unlock */
  function unlock() {
    ensureContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  /* ---------------------------------------------------------- narration */
  /* Is there a clip for this line? narrate() asks before it decides
     whether to clock the typing off a voice or off the reading
     rate. */
  function hasVoice(key) { return !!voiceSrc(key); }

  function say(key, opts) {
    opts = opts || {};
    var src = voiceSrc(key);
    if (!src) return Promise.resolve();

    unlock();

    var el = voices[key] || (voices[key] = makeVoice(src));
    routeThroughAnalyser(key, el);

    try { el.currentTime = 0; } catch (e) {}
    el.volume = opts.volume == null ? 1 : opts.volume;

    active = el;
    if (analyserAlive === null) probeUntil = performance.now() + 700;

    return new Promise(function (resolve) {
      var done = false;

      function finish() {
        if (done) return;
        done = true;
        el.removeEventListener('ended', finish);
        el.removeEventListener('error', onError);
        el.removeEventListener('loadedmetadata', tighten);
        if (active === el) active = null;
        resolve();
      }

      /* a blob that failed and was swapped for the file is not the
         end of the line — see guard() */
      function onError() { if (!recovering(el)) finish(); }

      /* Watchdog: the clip's own length plus a few seconds' grace,
         re-armed for every line, so a clip that never fires `ended`
         (a stalled decoder, a muted tab that swallowed the event)
         holds the flow for seconds rather than for the hard net
         below. Armed once the duration is known. */
      function tighten() {
        if (isFinite(el.duration) && el.duration > 0) {
          later(el.duration * 1000 + 4000).then(finish);
        }
      }

      el.addEventListener('ended', finish);
      el.addEventListener('error', onError);
      if (el.readyState >= 1) tighten();
      else el.addEventListener('loadedmetadata', tighten);

      /* Hand the element over before playback starts, so a caption
         can clock itself off currentTime instead of guessing at a
         typing speed. play() clears `paused` synchronously, so the
         typewriter's first frame already sees a live clock. */
      if (opts.onPlay) {
        try { opts.onPlay(el); } catch (e) { /* caption only — never stall the line */ }
      }

      el._geoFellBack = false;
      var p = el.play();
      if (p && p.catch) {
        p.catch(function () {
          /* the blob was refused and guard() has already restarted
             the line from its file: `ended` (or the watchdog) will
             see it out, so this is not the end of the line */
          if (el._geoFellBack) { el._geoFellBack = false; return; }
          /* blocked or missing — do not stall the flow, give the
             readout a beat of life then move on */
          later(900).then(finish);
        });
      }

      /* hard safety net so a broken file can never freeze the mission */
      later(30000).then(finish);
    });
  }

  function isSpeaking() {
    return !!(active && !active.paused && !active.ended);
  }

  function stopVoice() {
    Object.keys(voices).forEach(function (k) {
      var el = voices[k];
      if (!el.paused) {
        el.pause();
        /* say() resolves on 'ended'; pausing never fires it, so
           settle the promise by hand instead of leaving the flow
           waiting on the safety timeout */
        el.dispatchEvent(new Event('ended'));
      }
    });
    active = null;
  }

  /* Silence everything at once — used when the player jumps to
     another screen and the sequence that owned these clips is
     abandoned. `held` is cleared too, so a later tab-return cannot
     revive a line that no longer belongs anywhere. */
  function stopAll() {
    Object.keys(voices).forEach(function (k) {
      var el = voices[k];
      if (!el.paused) {
        el.pause();
        el.dispatchEvent(new Event('ended'));
      }
    });

    oneShots.slice().forEach(function (el) {
      try {
        el.pause();
        el.dispatchEvent(new Event('ended'));
      } catch (e) { /* already gone */ }
    });

    active = null;
    held = [];
  }

  /* ---------------------------------------------------------- one-shots */
  /* Play an element that has already been built, and see it off the
     oneShots list however it ends — played out, failed, or still
     going a quarter of a minute later. Shared by sfx() and by the
     primed shots below, so a clip is retired the same way whichever
     of the two fired it. */
  function fireShot(el, opts) {
    opts = opts || {};

    el.volume = opts.volume == null ? 0.7 : opts.volume;
    el.muted = muted;
    if (opts.rate) el.playbackRate = opts.rate;

    /* `keep` holds a clip back from the oneShots list, which is the
       list stopAll() empties when the player leaves a screen.

       The UI tick is the one thing that asks for it: it belongs to
       the tap, not to the screen the tap is walking away from, and
       NEXT would otherwise silence its own click a line later —
       onAdvance() goes straight into goTo(), which calls stopAll()
       while the tick is 20ms old. Everything else stays on the list,
       so a jump still takes its sound with it. */
    if (!opts.keep) oneShots.push(el);

    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        var i = oneShots.indexOf(el);
        if (i >= 0) oneShots.splice(i, 1);
        resolve();
      }
      el.addEventListener('ended', finish);
      el.addEventListener('error', function () { if (!recovering(el)) finish(); });
      el._geoFellBack = false;
      var p = el.play();
      if (p && p.catch) {
        p.catch(function () {
          if (el._geoFellBack) { el._geoFellBack = false; return; }   /* see say() */
          finish();
        });
      }
      later(15000).then(finish);
    });
  }

  function sfx(key, opts) {
    var file = SFX[key];
    if (!file) return Promise.resolve();

    unlock();
    var src = remote(file);
    var el = new Audio();
    guard(el, src);
    el.src = url(src);
    return fireShot(el, opts);
  }

  /* ---------------------------------------------------------- primed shots

     Build the clip NOW, play it on some later frame.

     A crash has to be HEARD on the frame the hull hits the rock. An
     <audio> created at that instant still has to be constructed,
     read out of the HTTP cache and handed to the decoder, and the
     bang lands after the dust — a slip that is small in
     milliseconds and very audible against a 540ms beat.

     prime() is called at the top of an attempt, from inside the
     click that started it, which is both a whole second and a half
     of head start AND the user gesture the autoplay policy wants.
     It warms the decoder by playing the clip muted and parking it
     back at zero, so the play() that matters is immediate.

     It hands back a fire function. Call it once; call it again and
     it falls through to an ordinary sfx(), so nothing goes silent
     if a caller fires twice. */
  function prime(key) {
    var file = SFX[key];
    if (!file) return function () { return Promise.resolve(); };

    unlock();

    var src = remote(file);
    var el = new Audio();
    guard(el, src);
    el.src = url(src);
    el.preload = 'auto';

    var spent = false;

    /* A browser will not decode a clip it has never been asked to
       play, so preload alone can still stall on the first play().
       This asks, silently, and then rewinds. */
    try {
      el.muted = true;
      el.load();
      var warm = el.play();
      if (warm && warm.then) {
        warm.then(function () {
          if (spent) return;              /* the real shot beat us to it */
          el.pause();
          try { el.currentTime = 0; } catch (e) {}
          el.muted = false;
        }, function () { el.muted = false; });
      } else {
        el.muted = false;
      }
    } catch (e) {
      el.muted = false;
    }

    return function (opts) {
      if (spent) return sfx(key, opts);
      spent = true;

      /* whatever state the warm-up left it in, start from the top
         and at full voice */
      el.muted = false;
      try { el.pause(); el.currentTime = 0; } catch (e) {}

      return fireShot(el, opts);
    };
  }

  /* ---------------------------------------------------------- ambience */
  function startAmbience(volume) {
    if (ambience) return;
    ambience = new Audio();
    guard(ambience, remote(AMBIENCE));
    ambience.src = url(remote(AMBIENCE));
    ambience.loop = true;
    ambience.volume = 0;
    ambience.muted = muted;
    var target = volume == null ? 0.24 : volume;
    var p = ambience.play();
    if (p && p.catch) p.catch(function () {});

    /* gentle fade-in so it slips under the briefing */
    var t0 = performance.now();
    (function ramp(now) {
      var k = Math.min(1, (now - t0) / 2600);
      ambience.volume = clamp01(target * k);
      if (k < 1) requestAnimationFrame(ramp);
    })(t0);
  }

  /* ---------------------------------------------------------- sound off */
  function isMuted() { return muted; }

  function setMuted(on) {
    muted = !!on;
    if (ambience) ambience.muted = muted;
    Object.keys(voices).forEach(function (k) { voices[k].muted = muted; });
    oneShots.forEach(function (el) { el.muted = muted; });
  }

  function duckAmbience(to, ms) {
    if (!ambience) return;
    var from = ambience.volume;
    var t0 = performance.now();
    (function ramp(now) {
      var k = Math.min(1, (now - t0) / (ms || 600));
      ambience.volume = clamp01(from + (to - from) * k);
      if (k < 1) requestAnimationFrame(ramp);
    })(t0);
  }

  /* ---------------------------------------------------------- spectrum
     Fills `out` (Float32Array, 0..1) with the current voice
     spectrum. Real analyser data when we have it, a procedural
     speech envelope when we do not.                            */
  function fillSpectrum(out) {
    var n = out.length;
    var speaking = isSpeaking();

    if (analyser && analyserAlive !== false) {
      analyser.getByteFrequencyData(freqBytes);

      if (analyserAlive === null && speaking) {
        var peak = 0;
        for (var p = 0; p < freqBytes.length; p++) {
          if (freqBytes[p] > peak) peak = freqBytes[p];
        }
        if (peak > 6) {
          analyserAlive = true;
        } else if (performance.now() > probeUntil) {
          analyserAlive = false;    // silent graph → go procedural
        }
      }

      if (analyserAlive === true) {
        if (!speaking) {
          proceduralFill(out, performance.now() / 1000, true);
          return false;
        }

        /* Voice energy lives low in the spectrum, so read a
           log-ish slice of the bins rather than the whole range. */
        var bins = freqBytes.length;
        var usable = Math.floor(bins * BIN_TOP);

        for (var i = 0; i < n; i++) {
          var lo = binEdge(i / (n - 1), usable);
          var hi = binEdge((i + 1) / (n - 1), usable);
          if (hi <= lo) hi = lo + 1;
          var max = 0;
          for (var b = lo; b < hi && b < bins; b++) {
            if (freqBytes[b] > max) max = freqBytes[b];
          }
          /* a small floor keeps the tail alive instead of ruler-flat */
          out[i] = Math.max(speaking ? 0.05 : 0.02,
                            Math.min(1, (max / 255) * 1.4));
        }
        return speaking;
      }
    }

    proceduralFill(out, active ? active.currentTime : performance.now() / 1000, !speaking);
    return speaking;
  }

  /* Speech-shaped envelope, used two ways: as the whole signal when
     the analyser is unavailable, and as the idle breath between
     lines so the readout never sits as a dead flat line.          */
  function proceduralFill(out, t, idle) {
    var n = out.length;

    /* syllable gate: opens and closes the way speech does */
    var syl = Math.abs(Math.sin(t * 8.7) * Math.sin(t * 2.9 + 1.1)) * 0.7 +
              Math.abs(Math.sin(t * 4.3 + 0.4)) * 0.3;
    var amp = idle ? 0.07 : (0.22 + 0.78 * syl);

    for (var j = 0; j < n; j++) {
      var g = j / (n - 1);
      var tilt = Math.pow(1 - g, 0.6) * 0.72 + 0.28;
      var rough = ROUGH[j % ROUGH.length];
      /* two detuned wobbles per band keep neighbours from marching
         in step, which is what made the comb look mechanical */
      var wob =
        0.5 + 0.34 * Math.sin(j * 2.31 + t * (7.1 + rough * 6.4)) +
              0.16 * Math.sin(j * 0.77 - t * (13.7 - rough * 4.1));
      /* 0.82 keeps the loud bands off the clamp, which is what
         was flattening the peaks into a even comb */
      out[j] = Math.max(0.015, Math.min(1, 0.82 * amp * tilt * rough * (0.34 + 0.9 * wob)));
    }
  }

  /* ---------------------------------------------------------- lifecycle
     Pause every player that is actually making sound and remember
     which ones they were, so returning to the tab picks each of
     them up exactly where it stopped. */
  function suspendAll() {
    if (held.length) return;

    var all = Object.keys(voices).map(function (k) { return voices[k]; })
      .concat(oneShots);
    if (ambience) all.push(ambience);

    all.forEach(function (a) {
      if (a && !a.paused && !a.ended) {
        a.pause();
        held.push(a);
      }
    });
  }

  function resumeAll() {
    var list = held;
    held = [];
    list.forEach(function (a) {
      var p = a.play();
      if (p && p.catch) p.catch(function () { /* gone — let it go */ });
    });
  }

  /* ---------------------------------------------------------- the gate's hand-in

     The start gate (js/script.js) fetches every clip through
     js/preload.js and hands each one in here as a blob: URL. From
     then on url() serves the blob, so every Audio built above —
     voices, one-shots, the primed shots, the ambience — starts from
     memory. A voice element that already exists is re-pointed too,
     unless it is mid-line. */
  function files() {
    var seen = {};
    var out = [];
    var I = global.I18n;
    function add(src) {
      if (!src || seen[src]) return;
      seen[src] = true;
      out.push({ file: src, url: src });
    }
    /* every clip the pack names, in the language on screen */
    (I && I.voiceUrls ? I.voiceUrls() : []).forEach(function (u) { add(encodeURI(u)); });
    Object.keys(SFX).forEach(function (k) { add(remote(SFX[k])); });
    add(remote(AMBIENCE));
    return out;
  }

  function adopt(src, blobUrl) {
    if (!src || !blobUrl) return;
    local[src] = blobUrl;
    Object.keys(voices).forEach(function (k) {
      var el = voices[k];
      if (el._geoSrc === src && el.paused && active !== el) el.src = blobUrl;
    });
  }

  if (global.GeoLife) {
    global.GeoLife.on('suspend', suspendAll);
    global.GeoLife.on('resume', resumeAll);
  }

  global.GeoAudio = {
    files: files,
    adopt: adopt,
    unlock: unlock,
    say: say,
    hasVoice: hasVoice,
    sfx: sfx,
    prime: prime,
    stopVoice: stopVoice,
    stopAll: stopAll,
    startAmbience: startAmbience,
    duckAmbience: duckAmbience,
    setMuted: setMuted,
    isMuted: isMuted,
    fillSpectrum: fillSpectrum
  };
})(window);

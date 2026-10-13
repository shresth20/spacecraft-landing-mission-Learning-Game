/* ============================================================
   Geo Drone — mission flow

   Screen 1 · cockpit
     briefing (3 lines, readout waveform live)
     → LAUNCH button rises out of the console
     → prompt to press it
     → press: launch SFX, drone climbs out through the canopy
     → cross-fade to the drone feed

   Screen 2 · the survey — one continuous shot over one sea
     black (ocean hidden) + "it is too dark"
     → "start the scanner"
     → green line sweeps left/right/left/right
     → the scan clears the dark to the drone's SURVEY HEIGHT: open
        water corner to corner, with nothing in it
     → the archipelago breaks the surface: small islands of every
        shape in the mission, and among them the four SITES the
        lens will come down on
     → down on the SQUARE site: "the scanner found several landing
        zones" · "look at the shapes" · "select all the square
        landing zones" — three squares to find, two other shapes to
        leave. Right shape → green coast; wrong → red coast, "try
        again"
     → all three found: the lens climbs, the two wrong shapes sink,
        "correct! these are the square landing zones" plays from the
        air, and the lens crosses the water and comes down on the
        RECTANGLE site — the same question of the rectangles
     → and again for the TRIANGLE site
     → up, across, and down on the GALLERY: one square, one
        rectangle and one triangle side by side, each with its name
        printed under it. "To find the area of these landing zones,
        we need to recall the area of these shapes." · "Let's
        recall." — and the mission hands over to the lesson

   Screen 3 · the lesson (js/learn.js)
     the warm-up — name the three shapes, then recall their area
     formulas — and the triangle's base and height. Its own board,
     its own voice; NEXT at the end brings the mission back

   Screen 4 · the landing — the same shot, three landing sites
     opens on the water at survey height: "We have recalled the
     area of these shapes." · "Now, we can safely land the
     spacecraft in the landing zone."
     → down on the SQUARE landing site: three squares carrying
        three areas, and the square-hulled craft flies in. "next, we
        need to find how much space the spaceship needs" (its sides
        are called out) · the areas print · "calculate the area" ·
        "choose the landing zone with the exact area"
     → the player picks; the craft flies down and the geometry
        decides what happens (THE LANDING, below)
     → it fits: confetti, "landing successful", and NEXT
     → NEXT: the lens climbs and crosses to the RECTANGLE landing
        site, and the same is asked of the rectangle-hulled craft;
        then the TRIANGLE's. The last NEXT carries the mission on

   Screen 5 · the quadrilateral survey -- the survey again, for the
     three shapes the first lesson did not cover. No dark to scan:
     it opens on the water at survey height, and the archipelago
     breaks the surface under the lens
     → down on the PARALLELOGRAM site: "look at the shapes" ·
        "select all the parallelogram landing zones"; all found, the
        lens climbs, the wrong shapes sink, "correct! these are the
        parallelogram landing zones" from the air, and across to the
        RHOMBUS site, then the TRAPEZIUM site
     → up, across, and down on their GALLERY, each named: "To find
        the area of these landing zones, we need to recall the area
        of these quadrilaterals." · "Let's recall."

   Screen 6 · the second lesson (js/learn-quad.js)
     the learning module's page 4, the general quadrilateral cut by
     one diagonal, and page 28, the trapezium's check; its last NEXT
     brings the mission back

   Screen 7 · the quadrilateral landing -- the landing again: "We
     have recalled the area of these quadrilaterals." · "Now, we can
     safely land the spacecraft in the landing zone." from the air,
     then the PARALLELOGRAM, RHOMBUS and TRAPEZIUM landing sites, a
     NEXT between each

   Every playing screen is an ITINERARY of sites, and runRound()
   below plays any of them: what differs between the four screens
   is the list of sites each carries, which lives in js/pages.js.

   The "<" / ">" nav can cut in at any point, so each screen is
   described as a list of steps run under a generation id. Jumping
   bumps that id, which makes the abandoned chain unwind at its next
   step instead of firing captions and voice lines over the screen
   the player just moved to.

   The SCENE TOOLS (near the bottom) are the learning module's own
   way around a mission, brought over as they were: a menu of every
   section, and Back / Skip / Sound / Replay. A section is one site
   of a playing screen, one page of the lesson, or the cockpit; a
   skip runs the section in play out to its end rather than
   abandoning it, with every wait collapsed and every line put up
   whole.

   Words: nothing the player reads or hears is written here. Every
   line is a KEY into locales/locales.json (T below), and its clip
   is named by the same key (see js/audio.js).
   ============================================================ */

(function (global) {
  'use strict';

  /* ---------- the scene tools' fast-forward ----------
   * Skip (SCENE TOOLS, below) plays a section out rather than
   * abandoning it: while it runs, every wait the flow takes through
   * M collapses to a single turn of the loop, every line is put up
   * whole instead of spoken (narrate), and every cue is left
   * unsounded. The engines themselves are untouched -- A and M here
   * are the mission's own views of them, and the only places the
   * flag is read besides narrate() and fly(). */
  var fastForward = false;

  var A = (function (G) {
    var w = {};
    Object.keys(G).forEach(function (k) { w[k] = G[k]; });
    w.sfx = function (key, opts) { return fastForward ? Promise.resolve() : G.sfx(key, opts); };
    w.say = function (key, opts) { return fastForward ? M.wait(0) : G.say(key, opts); };
    return w;
  })(global.GeoAudio);

  var M = (function (G) {
    var w = {};
    Object.keys(G).forEach(function (k) { w[k] = G[k]; });
    w.wait = function (ms) { return G.wait(fastForward ? 0 : ms); };
    return w;
  })(global.GeoMotion);

  var W = global.GeoWave;
  var TW = global.GeoType;

  /* js/failure.js — the landing and its two failures, shared by
     every landing site. Every one of the three outcomes below goes
     through it. */
  var F = global.GeoFail;

  /* the one lookup for every line on screen (js/i18n.js) */
  function T(key, repl) {
    return global.I18n ? global.I18n.t(key, repl) : String(key);
  }

  /* js/water.js, or a stand-in that does nothing. The water is the
     scene's finish rather than its plumbing: with the module
     missing the islands keep their hard edges and every beat below
     still plays, which is the same bargain addRoundScreens() makes
     with js/pages.js. */
  var SEA = global.GeoWater || (function () {
    function noop() {}
    return {
      init: noop, breach: noop, close: noop,
      approve: noop, reject: noop, settle: noop, impact: noop
    };
  })();

  var el = {};
  var launched = false;

  var runId = 0;            // bumped on every jump
  var seqId = 0;            // the sequence in play, 0 between them
  var current = 0;          // index into SCREENS
  var busy = false;         // a swap is in flight
  var ABORT = { abort: true };

  function grab() {
    [
      'stage', 'screenCockpit', 'screenDrone', 'screenLearn', 'screenLearnQuad', 'starfield',
      'flyDrone', 'flyTrail', 'dash', 'waveCanvas', 'cockpitCaption',
      'launchSlot', 'launchBtn', 'oceanBg', 'blackout', 'scanner',
      'droneHud', 'cam',
      'altHud', 'altNum', 'altState',
      'topbar', 'topbarText',
      'confetti', 'advanceBtn',
      'landHud', 'landCaption', 'landTally',
      'veil', 'gate', 'gateBtn', 'gateLoad', 'gateFill',
      'gateStatus', 'gatePct', 'nav', 'navPrev', 'navNext',
      'jump', 'jumpBtn', 'jumpMenu', 'jumpLabel',
      'backBtn', 'skipBtn', 'muteBtn', 'resetBtn'
    ].forEach(function (id) { el[id] = document.getElementById(id); });
  }

  /* ---------------------------------------------------------- sequencing
     Runs `steps` in order, dropping out the moment the generation it
     started under is no longer the live one. */
  function sequence(steps) {
    var id = ++runId;
    var chain = Promise.resolve();
    seqId = id;

    steps.forEach(function (step) {
      chain = chain.then(function () {
        if (id !== runId) throw ABORT;
        return step(id);
      });
    });

    /* over, however it ended: what a skip reads as "nothing left to
       run to" (SCENE TOOLS) */
    return chain.then(function () {
      if (seqId === id) seqId = 0;
    }, function (e) {
      if (seqId === id) seqId = 0;
      if (e !== ABORT) throw e;
    });
  }

  function live(id) { return id === runId; }

  /* ---------------------------------------------------------- caption + voice */
  function speak(target, key, keep) {
    if (target) {
      target.textContent = T(key);
      target.classList.add('is-shown');
    }
    return A.say(key).then(function () {
      return M.wait(240);
    }).then(function () {
      /* `keep` lets a step that has already moved on (the player
         pressed LAUNCH mid-prompt) hold on to its own caption */
      if (target && (!keep || keep())) target.classList.remove('is-shown');
      return M.wait(180);
    });
  }

  function notLaunched() { return !launched; }

  /* ---------------------------------------------------------- narration bar
     Same contract as speak(), but the line is TYPED into the header
     bar instead of cross-fading in, and the typing is clocked off
     the voice clip itself rather than off a chars/second guess —
     GeoAudio hands the <audio> element over through `onPlay`, and
     GeoType reads currentTime off it. See js/typewriter.js. */
  function narrate(bar, key, text) {
    if (text == null) text = T(key);

    /* a skip: the whole line goes up at once, and nothing is said */
    if (fastForward) {
      TW.set(bar, text);
      return M.wait(0);
    }

    /* A line with no clip recorded for it yet: the typing is clocked
       off the typewriter's own reading rate and the flow waits for
       the text rather than for a voice. Record the line, name the
       file by its key in the locale's voice pack, and this branch
       stops being taken — the line starts speaking, with no change
       here. */
    if (!A.hasVoice(key)) {
      if (M.reduced()) {
        TW.set(bar, text);
        return M.wait(1400);
      }
      return TW.type(bar, text, { hold: 900 }).then(function () {
        return M.wait(400);
      });
    }

    if (M.reduced()) {
      TW.set(bar, text);
      return A.say(key).then(function () { return M.wait(260); });
    }

    return A.say(key, {
      onPlay: function (audio) {
        TW.type(bar, text, { audio: audio, hold: 260 });
      }
    }).then(function () {
      return M.wait(300);
    });
  }

  /* ============================================================
     SCREEN 1 — COCKPIT
     ============================================================ */
  function resetCockpit() {
    launched = false;

    el.cockpitCaption.classList.remove('is-shown');
    el.cockpitCaption.textContent = '';

    el.launchSlot.classList.remove('is-armed', 'is-spent');
    el.launchBtn.classList.remove('is-shown', 'is-pressed');

    /* the climb is a Web Animation with fill:forwards — cancel it or
       the drone stays parked wherever it was left */
    [el.flyDrone, el.flyTrail].forEach(function (node) {
      if (node && node.getAnimations) {
        node.getAnimations().forEach(function (a) { a.cancel(); });
      }
    });

    el.dash.classList.add('is-live');
  }

  function runCockpit() {
    W.start();
    enterSection(current, 0);           /* the one section this screen is */

    return sequence([
      function () { return M.wait(700); },
      function () { return speak(el.cockpitCaption, 'welcome'); },
      function () { return speak(el.cockpitCaption, 'safePlace'); },
      function () { return speak(el.cockpitCaption, 'sendDrone'); },
      function () { return M.wait(280); },
      function () {
        el.launchBtn.classList.add('is-shown');
        el.launchSlot.classList.add('is-armed');
        return M.wait(420);
      },
      /* the prompt plays over the button appearing — the player can
         press as soon as it is there, they do not have to wait */
      function () { return speak(el.cockpitCaption, 'clickLaunch', notLaunched); },
      function () {
        if (launched) return;
        el.cockpitCaption.textContent = T('pressWhenReady');
        el.cockpitCaption.classList.add('is-shown');
      }
    ]);
  }

  /* ---------------------------------------------------------- launch */
  function onLaunch() {
    if (launched) return;
    launched = true;

    var id = runId;                       // the briefing's generation

    el.launchSlot.classList.remove('is-armed');
    el.launchBtn.classList.add('is-pressed');
    A.stopVoice();
    el.cockpitCaption.textContent = T('launching');
    el.cockpitCaption.classList.add('is-shown');

    A.duckAmbience(0.11, 700);
    A.sfx('launch', { volume: 0.9 });

    /* hold the plate down for a beat, then let it fade — it has done
       its job and should not sit there competing for attention */
    M.wait(420).then(function () {
      if (live(id)) el.launchSlot.classList.add('is-spent');
    });

    /* drone climbs out; the swap starts while it is still shrinking,
       so the two motions read as one continuous shot */
    M.flyDrone(el.flyDrone, el.flyTrail);

    M.wait(M.reduced() ? 500 : 2350).then(function () {
      if (!live(id)) return;              // player navigated away mid-flight
      el.cockpitCaption.classList.remove('is-shown');
      A.sfx('glitch', { volume: 0.34 });
      return goTo(1, { silent: true });
    });
  }

  /* ============================================================
     THE PLAYING SCREENS — the two surveys and the two landings

     One driver for all of them. Every playing screen is one
     continuous shot over one sea, and the lens comes down on it at
     each of its SITES in turn:

       survey height       the whole archipelago breaks the surface
                           under the lens -- sixteen islets of every
                           shape, and among them the sites
       down on a SHAPE site
                           three islands of one shape, three sizes,
                           and two other shapes. The line names the
                           shape; wrong shape shakes, right shape
                           takes a green coast. All three found, the
                           two that never matched sink and the
                           payoff line plays from the air as the lens
                           climbs away
       down on a LANDING site
                           three islands of one shape in the row,
                           carrying three areas, and the craft that
                           arrives over them. Its callouts are drawn
                           on, the areas print, the player picks, the
                           craft flies down and the geometry decides.
                           Planted: confetti, and NEXT
       down on the GALLERY one island of each lesson shape with its
                           name printed under it, and the two lines
                           that hand over to the lesson
       up, across, down    between any two sites the lens climbs,
                           drifts at survey height with the whole
                           archipelago under it, and descends; the
                           flight is one animation, so it never comes
                           to rest in between

     The survey (screen 2) is this with the drone's dark-and-scan
     opening in front of it (`round.intro`); the quadrilateral survey
     opens straight onto the water; a landing screen opens on the
     water with two lines said from the air. What differs between
     them otherwise is
     entirely data -- the sites, the artwork, the measurements, the
     numbers on the islands, the formula -- and all of it lives in
     js/pages.js. Nothing below names a shape.

     ── the sites ──

     Every site is shaped alike (js/pages.js) and shares the
     screen's chrome, and the task helpers further down play a SITE:
     `R` is the site whose question is live. State hangs off the
     screen and its sites rather than off this module, because
     resetRound() has to be able to put a screen the player has
     already left back to its opening state while another plays.

     ── coordinates ──

     Everything in the camera plate is in WORLD coordinates -- per
     cent of one frame. A site's frame is at its `offset`, and its
     centre is that plus (50, 50). `round.world` is the point between
     the sites the lens holds at survey height.

     ── the lens ──

     States, and the flights between them (THE CAMERA in
     js/animation.js): wide over the world, down on a site. The
     first descent is one leg; a crossing is one animation with a
     climb, a slow drift at altitude and a descent in it, so the lens
     never stops between two sites. The altimeter follows the lens
     itself (altFollow), whatever it is doing.
     ============================================================ */

  /* how long each move takes. Long -- the move is the beat, not an
     animation played under one. The crossing is climb, drift and
     descent in one: see the offsets in the flight itself. */
  var DESCENT_MS = 3400;
  var TRANSIT_MS = 6400;

  var R = null;               /* the SITE whose question is live */

  /* whether the lens FLIES between its states or cuts: false under
     reduced motion, where every move is a cut and the altimeter and
     the bracket stay away */
  var airborne = false;

  /* screen 2's itinerary, from GeoPages.buildSurvey() at boot */
  var survey = null;

  /* the lens down on a site: scale 1, the site's centre under the
     middle of the frame -- which is that site laid out exactly as a
     screen of its own would lay it out */
  function siteState(site) {
    return { s: 1, x: site.offset.x + 50, y: site.offset.y + 50 };
  }

  /* and at survey height, over the middle of the sea */
  function wideState(round, dx, dy) {
    return {
      s: M.camWide(round.node),
      x: round.world.x + (dx || 0),
      y: round.world.y + (dy || 0)
    };
  }

  function resetRound(round) {
    var e = round.el;
    var P = global.GeoPages;

    /* the lens first: back to the ground state before anything is
       measured, so the layout below is read off the layout itself */
    M.camReset(round.node);
    altReset(round);

    /* the survey's opening: the dark, the bezel and the scanner */
    if (round.intro) {
      e.bg.classList.remove('is-lit');
      e.bezel.classList.remove('is-retired');
      e.blackout.classList.remove('is-clear');
      e.scanner.classList.remove('is-on');
      var bar = e.scanner.querySelector('.scanner__bar');
      if (bar && bar.getAnimations) {
        bar.getAnimations().forEach(function (an) { an.cancel(); });
      }
    }

    /* a NEXT the screen was waiting on mid-itinerary is settled by
       hand, so the abandoned chain unwinds */
    releaseAdvance(round);

    /* every site back to its opening state, then a fresh draw on
       each: a shape site with a fresh pair of decoys, strewn across
       the five stations; a landing site's three dealt across the
       row, so the fit is never twice in the same place; the gallery
       in the row it was built in */
    round.sites.forEach(function (site) {
      clearRound(site);

      if (site.kind === 'shape') {
        P.arrangeSite(site, P.drawPair(site.decoyPool), ['pad--far1', 'pad--far2']);
        P.dealRow(site);
        P.scatter(site);
      } else if (site.kind === 'landing') {
        P.arrangeSite(site, [], []);
        P.dealRow(site);
      } else {
        P.arrangeSite(site, [], []);
      }
    });

    /* the rest of the archipelago, strewn again */
    round.islets.forEach(function (isl) { isl.classList.remove('is-up'); });
    P.strewIslets(round);

    /* And the lens: PARKED at survey height over the middle of the
       sea, before the screen is shown. Reset runs under the veil (see
       goTo), so the screen fades up already high rather than snapping
       up to height on its first frame.

       Parked, not set loitering -- the drift starts in runRound(),
       once the screen is on. A reset runs on hidden screens (every
       screen at boot, and the one the player has just left), and an
       animation that FINISHES on a hidden screen and is then
       cancelled leaves its last frame behind in Chromium: the
       element reports no animations and an inline transform, and
       renders the finished keyframe anyway, immovably, until the
       page is reloaded. A loiter that only ever runs on a screen the
       player is looking at is cancelled long before it can finish. */
    airborne = !M.reduced();
    M.camSet(round.node, wideState(round));
  }

  function runRound(round, opts) {
    W.stop();

    var e = round.el;
    var sites = round.sites;

    /* the site to open on: the first, unless the scene tools asked
       for one further along the itinerary. Entered there, the screen
       skips its opening lines and comes down straight onto it, with
       every shape site behind it already answered. */
    var from = Math.max(0, Math.min(sites.length - 1, (opts && opts.site) | 0));

    R = null;
    noteSection(current, from);

    /* The lens starts its loiter now that the screen is on -- see the
       note at the end of resetRound(). Long enough that nothing on
       any screen can outwait it: the first descent comes within
       twenty seconds of it starting, and it is that descent that
       interrupts it, so it never gets to finish and never leaves a
       filled frame behind. */
    if (airborne) M.camLoiter(round.node, wideState(round), { dx: 5.8, dy: 3.2, ms: 45000 });

    var steps = [];

    if (round.intro && from === 0) {
      /* ── the survey's opening: the dark, and the scan ── */
      steps.push(
        /* the bar drops in empty and then carries every line on this
           screen -- it has to be up before the first voice clip */
        function () {
          e.topbar.classList.add('is-on');
          A.duckAmbience(0.18, 900);
          return M.wait(720);
        },
        function () { return narrate(e.topbarText, 'tooDark'); },
        function () { return M.wait(220); },
        function () { return narrate(e.topbarText, 'startScan'); },
        function () { return M.sweep(e.scanner, { legs: 2, legMs: 1150 }); },

        /* --- lights up: ocean 0 → 1, and the camera bezel steps aside ---
           And it lights up HIGH. What the scan clears the dark to is
           the drone's survey height -- open water with nothing in it
           -- which is why the lens is parked before this step rather
           than after it: the first thing the player sees of the sea
           has to already be the wide shot.

           The bar goes with the bezel. The last thing it said was
           "start the scanner", which has now been done, and an
           instruction left standing over a camera move reads as a
           game waiting for the player. It comes back for the payoff. */
        function () {
          e.bg.classList.add('is-lit');
          e.blackout.classList.add('is-clear');
          e.bezel.classList.add('is-retired');
          altTo(round, 'altSurvey');
          e.topbar.classList.remove('is-on');
          return M.wait(1500);
        },

        /* a beat of nothing but sea, held long enough to read as
           empty: an island that is already there when the lights
           come up has always been there, and one that breaks a
           surface the player has had time to see is EMPTY has just
           arrived */
        function () {
          TW.clear(e.topbarText);
          return M.wait(airborne ? 900 : 300);
        }
      );
    } else if (round.intro) {
      /* ── the survey entered past its opening: the scan has been
         and gone, so the lights are already up ── */
      steps.push(function () {
        e.bg.classList.add('is-lit');
        e.blackout.classList.add('is-clear');
        e.bezel.classList.add('is-retired');
        A.duckAmbience(0.16, 900);
        altTo(round, 'altSurvey');
        return M.wait(airborne ? 900 : 300);
      });
    } else {
      /* ── a screen opens on the water, at height ── */
      steps.push(function () {
        A.duckAmbience(0.16, 900);
        altTo(round, 'altSurvey');
        return M.wait(airborne ? 900 : 300);
      });
    }

    steps.push(
      /* --- the archipelago breaks the surface --- */
      function () {
        /* a shape site behind the one being entered has been
           answered by now: the green is off its islands, and its
           two decoys stay under (emerge leaves them out) */
        sites.forEach(function (site, i) {
          if (i < from && site.kind === 'shape') site.el.pads.classList.add('is-cleared');
        });
        altTo(round, 'altContact');
        return emerge(round, sites[from], from);
      },
      function () { return M.wait(420); }
    );

    if (round.kind === 'landing' && from === 0) {
      /* ── back from the lesson: the two lines that pick the mission
         up again are said from the air, over the whole archipelago,
         before the lens comes down on the first landing site. The
         bar goes again for the descent, exactly as it does after the
         scan: a line left standing over a camera move reads as a
         game waiting for the player. ── */
      steps.push(
        function () {
          e.topbar.classList.add('is-on');
          return M.wait(560);
        },
        function () { return narrate(e.topbarText, round.recalledKey || 'recalledAreas'); },
        function () { return M.wait(220); },
        function () { return narrate(e.topbarText, 'safeLand'); },
        function () {
          e.topbar.classList.remove('is-on');
          return M.wait(420);
        },
        function () {
          TW.clear(e.topbarText);
          return M.wait(200);
        }
      );
    }

    /* ── the itinerary: down on the first site, and then up, across
       and down onto each of the others ── */
    sites.forEach(function (site, i) {
      if (i < from) return;
      /* the section boundary the scene tools read: a skip runs to
         here and no further, and the menu marks where we are */
      steps.push(function () { enterSection(current, i); });
      if (i === from) descentSteps(round, site, steps);
      else transitSteps(round, sites[i - 1], site, steps);

      if (site.kind === 'shape') shapeSteps(round, site, i, steps);
      else if (site.kind === 'landing') landingSteps(round, site, i === sites.length - 1, steps);
      else gallerySteps(round, site, steps);
    });

    return sequence(steps);
  }

  /* --- the lens comes down on the first site ---
     Nothing is said over it: the first line is the first thing
     spoken from the new altitude. The bracket is released a little
     under halfway down, well before the islands are big enough for
     it to be a box drawn round the answer. */
  function descentSteps(round, site, steps) {
    var e = round.el;
    steps.push(
      function (id) {
        altTo(round, 'altDescend');
        A.duckAmbience(0.26, 1400);
        M.wait(DESCENT_MS * 0.42).then(function () {
          if (live(id)) M.camUnfix(round.node, 620);
        });
        return fly(round, [siteState(site)], DESCENT_MS);
      },

      /* --- the lens settles, the instrument bows out, and the bar
             comes up --- */
      function () {
        altTo(round, 'altHold');
        e.topbar.classList.add('is-on');
        return Promise.all([altOut(round), M.wait(780)]);
      }
    );
  }

  /* --- up, across, and down onto the next site ---

     Whatever the site being left has to do on the way out (a shape
     site sinks its two wrong shapes and has its payoff line spoken
     from the air; a landing site puts its chrome away and leaves
     the craft planted) is started as the lens climbs, and the lens
     does not wait for it. The crossing is one flight -- climb, a
     slow drift at survey height with the whole archipelago under
     it, descent -- so the lens never comes to rest between two
     sites. The next site is bracketed at the top and the bracket is
     released on the way down.

     Under reduced motion there is no flight to speak over, so the
     beats run in order and the lens cuts. */
  function transitSteps(round, from, to, steps) {
    steps.push(
      function () { return M.wait(420); },
      function (id) {
        var leave = leaveSite(round, from, id);

        if (!airborne) {
          return leave.cut().then(function () {
            if (!live(id)) return;
            return fly(round, [siteState(to)], 0);
          });
        }

        leave.go();

        altTo(round, 'altClimb');
        A.duckAmbience(0.22, 1400);

        var top = wideState(round);
        M.wait(TRANSIT_MS * 0.40).then(function () {
          if (!live(id)) return;
          altTo(round, 'altTransit');
          M.camFix(round.node, siteBox(round, to, top), 560);
        });
        M.wait(TRANSIT_MS * 0.58).then(function () { if (live(id)) altTo(round, 'altDescend'); });
        M.wait(TRANSIT_MS * 0.80).then(function () {
          if (live(id)) M.camUnfix(round.node, 560);
        });

        return fly(round, [
          { s: top.s, x: top.x - 6, y: top.y - 3, offset: 0.40, easing: 'linear' },
          { s: top.s, x: top.x + 6, y: top.y + 3, offset: 0.56,
            easing: 'cubic-bezier(.5, 0, .18, 1)' },
          siteState(to)
        ], TRANSIT_MS, { easing: 'cubic-bezier(.44, .02, .28, 1)' }).then(function () {
          /* a line started from the air is awaited once the lens is
             down, so the next line never talks over it */
          return leave.after();
        });
      },

      /* --- down on the next site --- */
      function () {
        altTo(round, 'altHold');
        return altOut(round);
      }
    );
  }

  /* What a site does as the lens leaves it. `go` starts it under
     the flight, `after` is what to wait for once the lens is down;
     `cut` does the lot in order, for a lens that cuts rather than
     flies. */
  function leaveSite(round, site, id) {
    var e = round.el;

    if (site.kind === 'shape') {
      /* The two shapes that never matched go back under and the
         payoff line plays. `is-cleared` takes the green off the
         three that did as the lens leaves them: they answered the
         shape question and that question is closed. */
      var said = null;
      return {
        go: function () {
          sinkRoundDecoys(site);
          M.wait(520).then(function () {
            if (live(id)) site.el.pads.classList.add('is-cleared');
          });
          M.wait(700).then(function () {
            if (live(id)) said = narrate(e.topbarText, site.matchKey);
          });
        },
        after: function () { return said; },
        cut: function () {
          return sinkRoundDecoys(site).then(function () {
            if (!live(id)) return;
            site.el.pads.classList.add('is-cleared');
            return narrate(e.topbarText, site.matchKey);
          });
        }
      };
    }

    if (site.kind === 'landing') {
      /* the craft stays where it was planted -- the island it fitted
         is its answer, and the lens leaves it standing there -- and
         the screen's chrome is put away for the next site */
      var stow = function () { site.onward = false; stowLanding(round); };
      return {
        go: stow,
        after: function () { return null; },
        cut: function () { stow(); return M.wait(200); }
      };
    }

    return {
      go: function () {},
      after: function () { return null; },
      cut: function () { return M.wait(0); }
    };
  }

  function stowLanding(round) {
    var e = round.el;
    if (e.advance) {
      e.advance.classList.remove('is-in');
      e.advance.hidden = true;
    }
    e.hud.classList.remove('is-on');
    e.caption.classList.remove('is-shown');
    e.tally.classList.remove('is-shown');
    TW.clear(e.topbarText);
  }

  /* ═══════════════ the shape question, on a shape site ═══════════════
     The craft is NOT on screen for this. The line names the shape
     and the player has to carry that to the water themselves, which
     is a different question from "which of these looks like that"
     -- and a harder one. */
  function shapeSteps(round, site, i, steps) {
    var e = round.el;

    if (round.intro && i === 0) {
      steps.push(
        function () { return narrate(e.topbarText, 'foundZones'); },
        function () { return M.wait(300); }
      );
    }

    if (i === 0) {
      steps.push(
        function () { return narrate(e.topbarText, 'lookShapes'); },
        /* a beat to look at the water before the line names the shape */
        function () { return M.wait(560); }
      );
    } else {
      steps.push(function () { return M.wait(380); });
    }

    steps.push(
      function () {
        R = site;
        return narrate(e.topbarText, site.selectKey);
      },

      /* --- over to the player, until all three are found --- */
      function (id) { return startRoundPicking(site, id); }
    );
  }

  /* ═══════════════ the area question, on a landing site ═══════════════ */
  function landingSteps(round, site, last, steps) {
    var e = round.el;

    steps.push(
      /* --- the craft arrives ---
         It comes down the middle of the frame, which is water by
         construction: the row is across the front and there is
         nothing else on this site. The site's question is the live
         one from here. */
      function () {
        R = site;
        /* whether NEXT has anywhere to take the player from here:
           on to the next site, or on to the next screen if there
           is one */
        site.onward = last ? canAdvance() : true;
        site.el.ship.classList.add('is-in');
        e.hud.classList.add('is-on');
        /* the flight in takes 1.55s (shipArrive, css/rounds.css);
           the line lands as it settles onto its station */
        return M.wait(M.reduced() ? 200 : 1250);
      }
    );

    steps.push(
      /* --- how much space it needs ---
         the callouts are drawn on as the line lands: they ARE "how
         much space it needs" */
      function () {
        M.wait(680).then(function () {
          if (R === site) site.el.shipDims.classList.add('is-drawn');
        });
        return narrate(e.topbarText, 'spaceNeeded');
      },

      /* --- the three candidates get their areas printed on --- */
      function () { return priceRound(site); },

      function () { return narrate(e.topbarText, site.areaKey); },
      function () { return narrate(e.topbarText, 'chooseExact'); },

      /* --- over to the player, for as many attempts as it takes --- */
      function (id) { return startRoundChoosing(site, id); },

      /* --- planted; plantRound() has already said its piece --- */
      function (id) {
        return handFooterToAdvance(id, e.caption, e.tally, function () {
          showRoundAdvance(site);
        }, site.onward);
      }
    );

    /* a site with another after it waits for NEXT here, and the
       itinerary flies on; the last site's NEXT goes to the next
       screen through goTo() as every NEXT does */
    if (!last) {
      steps.push(function (id) { return awaitAdvance(round, id); });
    }
  }

  /* ═══════════════ the gallery ═══════════════
     One island of each shape the lesson is about, and its name
     printed under it one island at a time -- then the two lines
     that hand the mission over to the lesson, and the lesson. */
  function gallerySteps(round, site, steps) {
    var e = round.el;

    steps.push(
      function (id) {
        R = site;
        return nameGallery(site, id);
      },
      function () { return M.wait(360); },
      function () { return narrate(e.topbarText, site.recallKey || 'recallIntro'); },
      function () { return M.wait(200); },
      function () { return narrate(e.topbarText, 'recallGo'); },
      function () { return M.wait(700); },
      function () {
        if (canAdvance()) return goTo(current + 1);
      }
    );
  }

  function nameGallery(site, id) {
    var pads = site.el.padList;
    var gap = M.reduced() ? 120 : 320;

    pads.forEach(function (pad, i) {
      M.wait(i * gap).then(function () {
        if (!live(id)) return;
        pad.classList.add('is-named');
        A.sfx('click', { volume: 0.3, rate: [1.06, 1, 1.12][i % 3] });
      });
    });

    return M.wait((pads.length - 1) * gap + 800);
  }

  /* --- a NEXT in the middle of an itinerary ---
     The step parks a promise only the button can settle; the
     button's handler (onAdvance) settles it, and a jump away
     settles it by hand (releaseAdvance) so the chain unwinds. */
  function awaitAdvance(round, id) {
    return new Promise(function (resolve) {
      round.advanceRelease = resolve;
      if (!live(id)) releaseAdvance(round);
    });
  }

  function releaseAdvance(round) {
    var done = round && round.advanceRelease;
    if (!round) return;
    round.advanceRelease = null;
    if (done) done();
  }

  /* One flight of the lens, with the altimeter following it. Under
     reduced motion the lens CUTS to where the flight would have
     ended, and nothing follows anything. */
  function fly(round, keys, ms, opts) {
    /* a skip cuts too: the lens is parked where the flight was going */
    if (!airborne || fastForward) {
      M.camSet(round.node, keys[keys.length - 1]);
      return M.wait(M.reduced() ? 200 : 0);
    }

    opts = opts || {};
    opts.ms = ms;

    altFollow(round, true);
    return M.camFly(round.node, keys, opts).then(function () {
      altFollow(round, false);
      altSample(round, true);
    });
  }

  /* The archipelago breaks the surface: the islets and every site's
     islands, back to front across the whole sea as the lens sees
     it, with a little jitter so the ranks of a site do not arrive
     as rows. The bracket goes up on the first site a little past
     halfway, so the eye has been shown where to look before the
     lens moves.

     Seen from survey height the splashes are quiet and pitched up --
     distance does both -- and only the sites' islands throw a front
     into the water: the islets are scenery, and twenty-odd fronts at
     once would be a storm. */
  function emerge(round, first, from) {
    var pads = [];
    round.sites.forEach(function (site, i) {
      /* a shape site behind the one being entered (a jump into the
         middle of the itinerary) comes up already answered: its two
         decoys never surface, as they would have gone under by now */
      var list = (i < (from | 0) && site.kind === 'shape') ? roundMatches(site) : site.el.padList;
      pads = pads.concat(list);
    });
    var all = round.islets.concat(pads);

    var rows = all.map(function (isl) {
      return { el: isl, y: isl.getBoundingClientRect().top + (Math.random() - 0.5) * 40 };
    }).sort(function (p, q) { return p.y - q.y; }).map(function (o) { return o.el; });

    var gap = M.reduced() ? 60 : 105;

    if (airborne && first) {
      M.wait(gap * Math.round(rows.length * 0.55)).then(function () {
        M.camFix(round.node, siteBox(round, first, M.camRead(round.node)), 620);
      });
    }

    return M.surfaceZones(rows, function (isl, i) {
      if (pads.indexOf(isl) >= 0) {
        SEA.breach(isl);
        A.sfx('rock', { volume: 0.22, rate: 1.1 + (i % 5) * 0.04 });
      } else if (i % 3 === 0) {
        A.sfx('rock', { volume: 0.13, rate: 1.18 + (i % 4) * 0.05 });
      }
    }, fastForward ? { gap: 1, settle: 0 } : { gap: gap, settle: 900 });
  }

  /* Where a site is being SHOWN, for the bracket: the box round its
     islands in world coordinates -- each island's centre of area,
     read off the station it was dealt or strewn to, plus its own
     half-box -- projected through the lens state `st` to the frame
     the bracket is drawn on. Padded a touch, and asymmetrically:
     per cent of the frame is a different length on each axis. */
  function siteBox(round, site, st) {
    var W = round.node.clientWidth || 1;
    var H = round.node.clientHeight || 1;
    var l = 1e9, r = -1e9, t = 1e9, b = -1e9;

    site.el.padList.forEach(function (pad) {
      var cs = global.getComputedStyle(pad);
      var x = parseFloat(cs.getPropertyValue('--cx'));
      var y = parseFloat(cs.getPropertyValue('--cy'));
      if (!isFinite(x) || !isFinite(y)) return;

      var hw = pad.offsetWidth / 2 / W * 100;
      var hh = pad.offsetWidth / 2 / H * 100;

      l = Math.min(l, site.offset.x + x - hw);
      r = Math.max(r, site.offset.x + x + hw);
      t = Math.min(t, site.offset.y + y - hh);
      b = Math.max(b, site.offset.y + y + hh);
    });

    if (l > r) return null;

    var p1 = M.camProject(round.node, st, l, t);
    var p2 = M.camProject(round.node, st, r, b);
    var padX = 2.4;
    var padY = padX * (W / H);

    return { l: p1.x - padX, r: p2.x + padX, t: p1.y - padY, b: p2.y + padY };
  }


  /* ---------------------------------------------------------- the altimeter

     Four digits and a marker on a scale, and they are the one thing
     on the feed that names what is happening: five shapes getting
     bigger on their own is a different event from a lens coming
     down onto five shapes, and a falling number is what tells the
     player which of the two they are watching.

     It follows the LENS rather than a clock of its own: while a
     flight is running, every frame reads the camera's live zoom
     (M.camRead) and turns it into a height, so the readout climbs,
     holds and descends with the shot -- and shows the truth about
     an interrupted one. The digits are throttled to about 12Hz: an
     instrument that rewrites four figures sixty times a second is
     a blur rather than a reading, and it is the one thing in a
     flight that costs layout. The marker rides every frame; it is
     a needle. */
  var ALT_TOP = 4200;            /* metres at survey height */
  var ALT_LOW = 90;              /* and over the water on the ground */
  var ALT_TICK_MS = 80;

  function altClock() {
    return global.performance && global.performance.now
      ? global.performance.now()
      : Date.now();
  }

  /* Plain digits, not zero-filled: "0683" reads as an error code
     rather than an altitude. The width is held by the cell instead
     -- see .alt__num in css/style.css. */
  function altFace(m) {
    return String(Math.max(0, Math.round(m)));
  }

  function altReset(round) {
    altFollow(round, false);
    var e = round.el;
    if (!e.alt) return;

    e.alt.classList.remove('is-on', 'is-out');
    e.alt.style.setProperty('--alt-p', '0');
    if (e.altNum) e.altNum.textContent = altFace(ALT_TOP);
    if (e.altState) e.altState.textContent = T('altStandby');
  }

  /* `state` is the key of the word the readout shows */
  function altTo(round, state) {
    var e = round.el;
    if (!e.alt || !airborne) return;
    e.alt.classList.add('is-on');
    if (e.altState) e.altState.textContent = T(state);
  }

  /* one reading off the lens, marker and (if it is time) digits */
  function altSample(round, force) {
    var e = round.el;
    if (!e.alt) return;
    var st = M.camRead(round.node);
    var t = M.camZoom(round.node, st.s);
    var now = altClock();

    e.alt.style.setProperty('--alt-p', t.toFixed(4));
    if (e.altNum && (force || now - (round.altWrote || -1e9) >= ALT_TICK_MS)) {
      round.altWrote = now;
      e.altNum.textContent = altFace(ALT_TOP + (ALT_LOW - ALT_TOP) * t);
    }
  }

  function altFollow(round, on) {
    if (round.altRaf) {
      global.cancelAnimationFrame(round.altRaf);
      round.altRaf = null;
    }
    if (!on || !round.el.alt) return;

    round.altWrote = -1e9;
    (function step() {
      altSample(round, false);
      round.altRaf = global.requestAnimationFrame(step);
    })();
  }

  /* Off again before a task starts: the instrument said what it was
     there to say, and an instrument left on the water is one more
     thing over the shapes the player has to read. */
  function altOut(round) {
    var e = round.el;
    if (!e.alt || !airborne) return M.wait(0);

    altSample(round, true);
    e.alt.classList.add('is-out');
    return M.wait(760).then(function () {
      e.alt.classList.remove('is-on', 'is-out');
    });
  }


  /* ============================================================
     THE LANDING — what every landing site shares

     The craft is flown down onto the island the player picked and
     the geometry decides what happens (js/failure.js). The two
     pieces below are the halves of that which are the same on all
     of them: the footer's hand-over to the NEXT button, and the
     fall.
     ============================================================ */

  /* The footer is one strip, and the formula, the tally and the NEXT
     button are all centred on it. So the two lines are taken away
     BEFORE the button arrives: the footer says one thing at a time,
     and NEXT lands in the space the text leaves instead of being
     stacked under it.

     The sum is the answer to the whole screen, so it gets its read
     before the hand-over. And when there is nowhere for the button
     to go — `allowed` is false on the last site of the last screen
     — the two lines STAY, because clearing the footer for a button
     that never arrives would just empty it. */
  function handFooterToAdvance(id, caption, tally, reveal, allowed) {
    if (!allowed) return;

    return M.wait(2400).then(function () {
      if (!live(id)) return;
      if (caption) caption.classList.remove('is-shown');
      if (tally) tally.classList.remove('is-shown');
      /* the lines' own fade — .45s in css/style.css */
      return M.wait(520);
    }).then(function () {
      if (live(id)) reveal();
    });
  }

  /* ---------------------------------------------------------- the fall
     The half of a failed landing that is the same everywhere: one
     call into js/failure.js, with the sounds and the water's own
     answer hung off its two callbacks.

     `tight` true  → the island was too small: it slides off the
                     edge, hits the water and sinks
     `tight` false → the island was too big: it goes over ON the
                     rock and stays there

     `onSettle` is fired the moment the craft begins to lose its
     footing, which is where the spoken verdict starts. `onImpact`
     is fired on the frame something is actually hit, and carries
     the point it was hit at — the craft goes over wherever it went
     over, never at a fixed spot. */
  function failFlight(ship, pad, ref, tight, geo, id, onSettle) {
    /* Built here, at the top of the attempt, and fired a second and
       a half later on the frame of impact. See prime() in
       js/audio.js for why the clip cannot be made at the moment it
       is wanted: this call is still inside the click that started
       the landing, which is both the head start the decoder needs
       and the user gesture the autoplay policy wants. */
    var bang = A.prime(tight ? 'sink' : 'crash');

    var opts = {
      refPad: ref,
      geo: geo || undefined,
      alive: function () { return live(id); },

      /* No buzzer here. The SHAPE task still uses one — a tap on the
         wrong shape has nothing else to answer it with — but this
         screen does: the craft's own crash or its going under IS
         the answer, and the spoken verdict starts over the top of
         it a beat later. */
      onSettle: onSettle,

      /* Fired on the frame something is actually hit, so the sound,
         the burst and SEA's front are one event rather than three
         near-misses. */
      onImpact: function (point, kind) {
        if (kind === 'water') {
          SEA.impact(ship, point, { size: 54 });
          bang({ volume: 0.75 });
        } else {
          SEA.impact(ship, point, { size: 32 });
          bang({ volume: 0.85 });
        }
      }
    };

    return tight ? F.sinkInWater(ship, pad, opts)
                 : F.crashOnLand(ship, pad, opts);
  }

  /* ============================================================
     THE TASKS -- the helpers both questions are played through

     Each takes a SITE (js/pages.js shapes them alike), and
     `R === site` is how a helper knows its question is still the
     live one.
     ============================================================ */

  function roundPads(site) { return site.el.padList; }

  function roundMatches(site) {
    return roundPads(site).filter(function (pad) {
      return pad.dataset.shape === site.shape;
    });
  }

  /* the island the craft actually fits: the scale every attempt is
     drawn at, whichever one is being flown to */
  function roundRef(site) {
    return site.el.pads.querySelector('.pad[data-area="' + site.area + '"]');
  }

  /* Everything about a site back to its opening state, EXCEPT where
     its islands stand: that is the layout half, and resetRound()
     does it for every site of a screen. `e.all` is every island a
     site carries, hidden ones included. */
  function clearRound(site) {
    if (R === site) R = null;

    var e = site.el;

    site.phase = null;         /* 'shape', 'area', or nothing to do */
    site.picked = 0;
    site.scolding = false;
    site.landing = false;
    site.solved = false;
    site.onward = false;

    /* takes every phase class off the craft and empties both effect
       layers, so a wreck and its scorch go with the reset. A site
       without a craft skips it. */
    if (e.ship) {
      F.resetSpaceship(e.ship);
      e.ship.classList.remove('is-in');
      e.ship.style.removeProperty('--lean');
    }
    if (e.shipDims) e.shipDims.classList.remove('is-drawn');

    e.pads.classList.remove('is-picking', 'is-cleared', 'is-choosing', 'is-priced');
    (e.all || roundPads(site)).forEach(function (pad) {
      pad.classList.remove('is-up', 'is-picked', 'is-wrong', 'is-sunk',
                           'is-priced', 'is-fit', 'is-loose', 'is-tight',
                           'is-scattered', 'is-named');
      var hit = pad.querySelector('.pad__hit');
      if (hit) hit.tabIndex = -1;
    });

    if (e.confetti) M.confettiClear(e.confetti);

    if (e.advance) {
      e.advance.classList.remove('is-in');
      e.advance.hidden = true;
    }

    if (e.hud) e.hud.classList.remove('is-on');
    if (e.caption) {
      e.caption.classList.remove('is-shown');
      e.caption.textContent = '';
    }
    if (e.tally) {
      e.tally.classList.remove('is-shown');
      e.tally.textContent = '';
    }

    if (e.topbar) {
      e.topbar.classList.remove('is-on');
      TW.clear(e.topbarText);
    }

    /* both player-driven steps park a promise only a click can
       settle, so every jump settles it by hand — the step after it
       then sees a stale generation and unwinds like any other */
    var done = site.release;
    site.release = null;
    if (done) done();
  }

  /* ---------------------------------------------------------- the shape task */

  function startRoundPicking(site, id) {
    site.phase = 'shape';
    site.picked = 0;

    site.el.pads.classList.add('is-picking');
    roundPads(site).forEach(function (pad) {
      var hit = pad.querySelector('.pad__hit');
      if (hit) hit.tabIndex = 0;
    });

    return new Promise(function (resolve) {
      site.release = resolve;
      if (!live(id)) clearRound(site);      /* jumped while we armed */
    });
  }

  function endRoundPicking(site) {
    site.phase = null;
    site.scolding = false;

    site.el.pads.classList.remove('is-picking');
    roundPads(site).forEach(function (pad) {
      var hit = pad.querySelector('.pad__hit');
      if (hit) hit.tabIndex = -1;
    });

    var done = site.release;
    site.release = null;
    if (done) done();
  }

  /* The wrong shape: a red coast, a buzzer, and one "try again" at
     a time. */
  function refuseShape(site, pad) {
    A.sfx('wrong', { volume: 0.5 });

    pad.classList.remove('is-wrong');
    /* force a reflow so a second wrong tap on the same island
       replays the shock instead of doing nothing */
    void pad.offsetWidth;
    pad.classList.add('is-wrong');
    SEA.reject(pad);
    M.wait(620).then(function () { pad.classList.remove('is-wrong'); });

    /* one nudge at a time — tapping both decoys must not stack two
       voice lines on top of each other */
    if (!site.scolding) {
      site.scolding = true;
      A.say('tryAgain').then(function () { site.scolding = false; });
    }
  }

  function onRoundShapePick(site, pad) {
    if (pad.classList.contains('is-picked')) return;

    /* --- the wrong shape --- */
    if (pad.dataset.shape !== site.shape) return refuseShape(site, pad);

    /* --- a match --- */
    pad.classList.add('is-picked');
    site.picked++;
    A.sfx('correct', { volume: 0.55 });
    SEA.approve(pad);

    if (site.picked >= roundMatches(site).length) {
      /* let the last tick land before the flow moves on */
      M.wait(760).then(function () {
        if (R === site) endRoundPicking(site);
      });
    }
  }

  /* The shapes that are not the one asked for go back where they
     came from, nearest (largest) first so the surface closes front
     to back — the survey feed's own manners. */
  function sinkRoundDecoys(site) {
    var others = roundPads(site).filter(function (pad) {
      return pad.dataset.shape !== site.shape;
    });

    others.sort(function (a, b) {
      return b.getBoundingClientRect().width - a.getBoundingClientRect().width;
    });

    return M.sinkZones(others, function (pad, i) {
      A.sfx('rock', { volume: 0.6, rate: [0.88, 0.95][i % 2] });
      SEA.close(pad);
    }, fastForward ? { gap: 1, settle: 0 } : { gap: 620 });
  }


  /* ---------------------------------------------------------- the area task

     The second question opens: the areas are printed on the three
     islands. */
  function priceRound(site) {
    var matches = roundMatches(site);
    site.el.pads.classList.add('is-priced');

    matches.forEach(function (pad, i) {
      M.wait(i * 260).then(function () {
        if (R !== site) return;
        pad.classList.add('is-priced');
        A.sfx('click', { volume: 0.3, rate: [1.06, 1, 1.12][i % 3] });

        /* the label carried the shape while the shape was the
           question; now it carries the number too */
        var hit = pad.querySelector('.pad__hit');
        if (hit) {
          hit.setAttribute('aria-label',
            T('padZoneArea', { shape: T(pad.dataset.adj), area: pad.dataset.area }));
        }
      });
    });

    return M.wait((matches.length - 1) * 260 + 950);
  }

  function startRoundChoosing(site, id) {
    site.phase = 'area';
    armRound(site);

    return new Promise(function (resolve) {
      site.release = resolve;
      if (!live(id)) clearRound(site);
    });
  }

  function armRound(site) {
    site.el.pads.classList.add('is-choosing');
    roundMatches(site).forEach(function (pad) {
      var hit = pad.querySelector('.pad__hit');
      if (hit) hit.tabIndex = 0;
    });
  }

  function disarmRound(site) {
    site.el.pads.classList.remove('is-choosing');
    roundPads(site).forEach(function (pad) {
      var hit = pad.querySelector('.pad__hit');
      if (hit) hit.tabIndex = -1;
    });
  }

  function onRoundAreaPick(site, pad) {
    if (site.landing || pad.dataset.area == null) return;
    if (F.isAnimating(site.el.ship)) return;

    var ref = roundRef(site);
    if (!ref) return;

    var area = +pad.dataset.area;
    var e = site.el;

    /* An attempt runs on its own chain, outside the screen's
       sequence, so it carries the generation itself — otherwise a
       jump mid-crash would come back and re-arm a screen the player
       has already left. */
    var id = runId;

    site.landing = true;
    disarmRound(site);

    /* the callouts come off: the craft is flying now, and a
       measurement drawing riding through a crash would read as part
       of the wreck */
    e.ship.classList.add('is-committed');

    return area === site.area
      ? plantRound(site, pad, ref, id)
      : failRound(site, pad, ref, area < site.area, id);
  }

  /* ---------------------------------------------------------- it fits */
  function plantRound(site, pad, ref, id) {
    var e = site.el;

    site.solved = true;
    armAdvanceWatchdog(site, id);

    return F.successfulLanding(e.ship, pad, {
      refPad: ref,
      geo: site.geo,
      alive: function () { return live(id); },

      /* everything is hung off the touchdown, so the verdict
         outline, the chime and the confetti land on the frame the
         craft settles rather than a beat after it */
      onTouchdown: function () {
        pad.classList.add('is-fit');
        SEA.settle(pad);

        A.sfx('correct', { volume: 0.6 });

        /* a beat after the chime, so the two sounds read as one
           cue. The shower is fired and not awaited: it runs on the
           compositor while the narration carries on underneath. */
        M.wait(220).then(function () {
          if (!live(id)) return;
          A.sfx('cheer', { volume: 0.5 });
          M.confetti(e.confetti);
        });
      }
    }).then(function () {
      if (!live(id)) return;
      return sayRoundPlanted(site, id);
    });
  }

  function sayRoundPlanted(site, id) {
    var e = site.el;

    return narrate(e.topbarText, 'perfectFit')
      .then(function () {
        if (!live(id)) return;
        return narrate(e.topbarText, 'landed');
      })
      .then(function () {
        site.landing = false;
        var done = site.release;
        site.release = null;
        if (done) done();
      });
  }

  /* ---------------------------------------------------------- it does not
     The craft is drawn at its TRUE size on every attempt, so both
     failures are the honest consequence of the numbers:

       too small  the craft is wider than the land it came down on,
                  so the edge is right under it: it judders, slides
                  off, and the next thing under it is water
       too big    the land runs a long way past the craft on every
                  side, nothing is holding it, and there is no edge
                  within reach to go over — so it wrecks ON the rock
                  and never reaches the sea                         */
  function failRound(site, pad, ref, tight, id) {
    var e = site.el;

    pad.classList.add(tight ? 'is-tight' : 'is-loose');

    /* the verdict is SPOKEN OVER the struggle rather than after it,
       and awaited at the end, so a slow connection delays the retry
       prompt instead of talking over it */
    var said = null;

    return failFlight(e.ship, pad, ref, tight, site.geo, id, function () {
      said = narrate(e.topbarText, tight ? 'tooSmall' : 'tooLarge');
    })
      .then(function () { return said; })
      .then(function () {
        if (!live(id)) return;
        /* put it back on the rail, callouts and all */
        pad.classList.remove('is-tight', 'is-loose');
        F.resetSpaceship(e.ship);
        e.shipDims.classList.add('is-drawn');
        return M.wait(760);
      })
      .then(function () {
        if (!live(id)) return;
        site.landing = false;
        if (!site.solved) armRound(site);
        return narrate(e.topbarText, 'chooseExact');
      });
  }

  /* The NEXT button's third road. It normally arrives at the end of
     the planted sequence -- touchdown, two spoken lines, the footer
     handed over (handFooterToAdvance) -- and every step of that is
     a promise on a clip or a clock. Should any of them fail to
     settle, the player would be left on a finished screen with no
     way on. So a landing arms this as well: the whole sequence's
     length plus grace, re-armed on every planting, and if the
     button is still hidden when it fires the footer is cleared and
     the button shown by hand. Under the same generation check as
     everything else, so a jump away disarms it. */
  var ADVANCE_WATCHDOG_MS = 20000;

  function armAdvanceWatchdog(site, id) {
    M.wait(ADVANCE_WATCHDOG_MS).then(function () {
      var btn = site.el.advance;
      /* `R !== site`: the lens has already left this site for the next
         one on the itinerary, and its NEXT was put away on purpose */
      if (!live(id) || R !== site || !site.solved || !btn || !btn.hidden || !site.onward) return;
      if (site.el.caption) site.el.caption.classList.remove('is-shown');
      if (site.el.tally) site.el.tally.classList.remove('is-shown');
      showRoundAdvance(site);
    });
  }

  /* The reward for the right answer, and the way on. Withheld when
     there is nowhere for it to go. */
  function showRoundAdvance(site) {
    var btn = site.el.advance;
    if (!btn || !site.onward) return;

    btn.hidden = false;
    /* reflow, so there is an un-hidden starting frame to animate away
       from instead of snapping straight to the end */
    void btn.offsetWidth;
    btn.classList.add('is-in');
  }


  /* ============================================================
     SCREENS 3 AND 6 — THE LESSONS (js/learn.js, js/learn-quad.js)

     The warm-up and the triangle lesson, and then the general
     quadrilateral and the trapezium's check, each played on its own
     board by its own engine. This module only hands an engine its
     screen, starts it, and goes on when it reports its last NEXT.
     Both engines answer the same calls: init, assets, reset, run,
     skip, pages, setMuted.
     ============================================================ */
  function lessonScreen(node, engine) {
    return {
      node:   function () { return node(); },
      lesson: function () { return global[engine] || null; },
      reset:  function () { var L = global[engine]; if (L) L.reset(); },
      run:    function (opts) { return runLesson(global[engine], opts); }
    };
  }

  function runLesson(L, opts) {
    W.stop();
    A.duckAmbience(0.12, 900);

    return sequence([
      function (id) {
        if (!L) return;
        return L.run(opts).then(function (done) {
          if (done && live(id) && canAdvance()) return goTo(current + 1);
        });
      }
    ]);
  }

  /* every lesson engine there is, for the calls that reach all of them */
  function lessons() {
    return [global.GeoLearn, global.GeoLearnQuad].filter(Boolean);
  }


  /* ============================================================
     SCREENS + NAV
     ============================================================ */
  /* `round` is the itinerary a playing screen carries, for the scene
     tools to name its sites by -- the survey's arrives at boot
     (wireSurvey), so it is read when asked for rather than copied */
  var SCREENS = [
    { node: function () { return el.screenCockpit; }, reset: resetCockpit, run: runCockpit },
    { node: function () { return el.screenDrone; },   reset: resetSurvey,  run: runSurvey,
      round: function () { return survey; } },
    lessonScreen(function () { return el.screenLearn; }, 'GeoLearn')
  ];

  /* Screen 2 is a playing screen like the others once js/pages.js
     has built its sites (wireSurvey); until then -- or without
     pages.js at all -- it is dark water and a scan that finds
     nothing, which is the most the screen can honestly play. */
  function resetSurvey() {
    if (survey) return resetRound(survey);
    el.topbar.classList.remove('is-on');
    TW.clear(el.topbarText);
  }

  function runSurvey(opts) {
    if (survey) return runRound(survey, opts);
    return sequence([
      function () { el.topbar.classList.add('is-on'); return M.wait(720); },
      function () { return narrate(el.topbarText, 'tooDark'); },
      function () { return narrate(el.topbarText, 'startScan'); }
    ]);
  }

  /* The landing screen and the two quadrilateral screens are built from js/pages.js at
     boot and appended here, so the nav, the veil, the NEXT button
     and goTo() pick them up with no special case. */
  function addRoundScreens() {
    /* Loudly, because the mission still runs without it: screens 1-3
       play as normal and then simply stop, which looks like a broken
       NEXT button rather than a missing file. */
    if (!global.GeoPages) {
      if (global.console) {
        console.warn('GeoDrone: js/pages.js did not load — the survey has ' +
                     'no islands and the screens after the lesson are missing.');
      }
      return;
    }

    global.GeoPages.build(el.stage, el.veil).forEach(function (round) {
      SCREENS.push({
        node:  function () { return round.node; },
        reset: function () { resetRound(round); },
        run:   function (opts) { return runRound(round, opts); },
        round: function () { return round; }
      });
      wireSites(round);
      round.el.advance.addEventListener('click', function () { onAdvance(round); });

      /* the quadrilateral survey's gallery hands over to the second
         lesson, and the quadrilateral landing follows it */
      if (round.lesson === 'quad' && el.screenLearnQuad) {
        SCREENS.push(lessonScreen(function () { return el.screenLearnQuad; }, 'GeoLearnQuad'));
      }
    });
  }

  /* One listener per site rather than one per island; which
     question a tap answers is decided by which site is live. */
  function wireSites(round) {
    round.sites.forEach(function (site) {
      if (site.kind === 'shape') {
        site.el.pads.addEventListener('click', function (e) {
          var hit = e.target.closest('.pad__hit');
          if (!hit || R !== site || site.phase !== 'shape') return;
          var pad = hit.closest('.pad');
          if (pad) onRoundShapePick(site, pad);
        });
      } else if (site.kind === 'landing') {
        site.el.pads.addEventListener('click', function (e) {
          var hit = e.target.closest('.pad__hit');
          if (!hit || R !== site || site.phase !== 'area') return;
          var pad = hit.closest('.pad');
          if (pad) onRoundAreaPick(site, pad);
        });
      }
    });
  }

  function syncNav() {
    el.navPrev.disabled = busy || current === 0;
    el.navNext.disabled = busy || current === SCREENS.length - 1;
    armTools();
  }

  /* Is there a screen after this one? Asked by every NEXT button on
     a screen's last site before it shows itself, and it is the SAME
     question the ">" arrow answers by going disabled — a screen must
     never offer a button the nav has already given up on. */
  function canAdvance() {
    return current < SCREENS.length - 1;
  }

  /* Every NEXT button, on every screen, goes through here. A screen
     waiting on NEXT in the middle of its itinerary (the landing
     screen, between two of its sites) is let go on to its next site;
     otherwise NEXT means the next screen. */
  function onAdvance(round) {
    if (round && round.advanceRelease) {
      releaseAdvance(round);
      return Promise.resolve();
    }
    return goTo(current + 1);
  }

  /* Jump to a screen: abandon whatever was running, put the target
     back to its opening state, swap, then play its sequence.
     `silent` skips the audio cut, for the scripted launch hand-off
     that is already mid-cue and should not be clipped.
     `site` is handed to the screen, to open part-way along its
     itinerary; `again` lets the screen in view be re-entered in
     place -- it is put back under the veil, since it is the one the
     player is looking at. Both are the scene tools'. */
  function goTo(index, opts) {
    opts = opts || {};
    var again = !!opts.again && index === current;
    if (busy || (index === current && !again) || index < 0 || index >= SCREENS.length) {
      return Promise.resolve();
    }

    var from = SCREENS[current];
    var to = SCREENS[index];

    busy = true;
    fastForward = false;                   // a jump ends a skip
    syncNav();

    runId++;                               // strand the running sequence
    if (!opts.silent) A.stopAll();

    if (!again) to.reset();

    return M.swapScreens(again ? null : from.node(), to.node(), el.veil, 1300,
                         again ? function () { to.reset(); } : null).then(function () {
      current = index;
      busy = false;
      syncNav();

      /* the screen left behind goes back to its opening state too, so
         stepping back into it starts from the top rather than from
         wherever it was abandoned */
      if (!again) from.reset();

      return to.run({ site: opts.site | 0, page: opts.site | 0 });
    });
  }


  /* ============================================================
     SCENE TOOLS -- the section menu, and Back / Skip / Sound / Replay

     The learning module's own way around a mission, brought over
     as it was: the menu (bottom-left) lists every SECTION in the
     order the mission plays them and jumps to any of them; the
     four tools (bottom-right, beside the "<" / ">" nav) step back
     a section, run the one in play out to its end, switch the
     sound off, or play it again from the top.

     A section is one site of a playing screen, one page of the
     lesson, or the cockpit: the unit a skip runs to the end of and
     the unit the menu names. The list is built from SCREENS and
     the sites each carries, so it cannot drift out of step with
     the mission. Where we are is reported by the screens
     themselves (enterSection) as they reach each section.
     ============================================================ */
  var SECTIONS = [];            /* { screen, site, name } in mission order */
  var secAt = [];               /* secAt[screen][site] -> index into SECTIONS */
  var sectionIndex = -1;        /* where we are in that order */
  var sectionSeq = 0;           /* bumped at every section boundary: what a skip watches */
  var sectionHistory = [];      /* the sections played so far, most recent last */
  var learnAt = -1;             /* the lesson's index into SCREENS */
  var skipping = false;
  var tripBtn = null;           /* the tool whose errand is running, for its `working` state */
  var jumpOpts = [];

  function shapeName(site, adj) {
    var shape = site.shape || '';
    return T((adj ? 'adj' : 'shape') + shape.charAt(0).toUpperCase() + shape.slice(1));
  }

  function sectionName(round, site) {
    if (round.kind === 'survey') {
      if (site.kind === 'gallery') return T('secSurveyGallery');
      return T('secSurveyShape', { shape: shapeName(site, true) });
    }
    if (round.kind === 'landing') return T('secLandingSite', { shape: shapeName(site) });
    return T(site.kind === 'shape' ? 'secRoundShape' : 'secRoundLanding', { shape: shapeName(site) });
  }

  function buildSections() {
    SECTIONS = [];
    secAt = [];
    SCREENS.forEach(function (screen, s) {
      var node = screen.node();
      var names;
      if (node === el.screenCockpit) {
        names = [T('secCockpit')];
      } else if (node === el.screenLearn) {
        learnAt = s;
        var L = global.GeoLearn;
        names = (L && L.pages ? L.pages() : []).map(function (k) { return T(k); });
        if (!names.length) names = [T('secLesson')];
      } else {
        var round = screen.round ? screen.round() : null;
        names = round ? round.sites.map(function (site) { return sectionName(round, site); })
                      : [T('secSurvey')];
      }
      secAt[s] = names.map(function (name, i) {
        SECTIONS.push({ screen: s, site: i, name: name });
        return SECTIONS.length - 1;
      });
    });
  }

  /* A section's opening, reported by the screen playing it: a round
     at each site as the lens sets off for it, the lesson at each
     page, the cockpit once. The boundary a skip stops at -- and if
     one is running, its fast-forward ends here, so what follows
     plays at its own pace. */
  function enterSection(screen, site) {
    sectionSeq++;
    if (skipping) fastForward = false;
    noteSection(screen, site);
  }

  /* Where we are. The history is kept as a path through the mission
     rather than a browser trail: arriving somewhere we have already
     been truncates back to it, so Back always means the section
     before this one, and a replay is a no-op on it. */
  function noteSection(screen, site) {
    var row = secAt[screen];
    if (!row || !row.length) return;
    var i = row[Math.max(0, Math.min(row.length - 1, site | 0))];
    sectionIndex = i;
    var at = sectionHistory.indexOf(i);
    if (at !== -1) sectionHistory.length = at + 1;
    else sectionHistory.push(i);
    markJump();
    armTools();
  }

  /* every trip the tools make is this: the section's screen, put
     back and entered at the section */
  function enterAt(sec) {
    return goTo(sec.screen, { site: sec.site, again: true });
  }

  /* ---- the menu ---- */
  function buildJump() {
    el.jumpMenu.textContent = '';
    SECTIONS.forEach(function (sec, i) {
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'jump-opt';
      opt.setAttribute('role', 'option');
      opt.dataset.i = String(i);
      var n = document.createElement('span');
      n.className = 'jump-n';
      n.textContent = String(i + 1);
      var name = document.createElement('span');
      name.className = 'jump-name';
      name.textContent = sec.name;
      opt.appendChild(n);
      opt.appendChild(name);
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        openJump(false);
        jumpTo(i);
      });
      el.jumpMenu.appendChild(opt);
    });
    jumpOpts = Array.prototype.slice.call(el.jumpMenu.querySelectorAll('.jump-opt'));
  }

  /* the button says where we are; the list says which one that is */
  function markJump() {
    var here = SECTIONS[sectionIndex];
    el.jumpLabel.textContent = here ? here.name : T('jumpLabel');
    jumpOpts.forEach(function (opt, i) {
      opt.setAttribute('aria-selected', i === sectionIndex ? 'true' : 'false');
      opt.classList.toggle('ahead', i > sectionIndex);
    });
  }

  function openJump(on) {
    el.jump.classList.toggle('open', !!on);
    el.jumpBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on && jumpOpts.length) {
      jumpOpts[Math.max(0, sectionIndex)].scrollIntoView({ block: 'nearest' });
    }
  }

  function jumpTo(i) {
    var sec = SECTIONS[i];
    if (!sec || busy) return;
    trip(el.jumpBtn);
    enterAt(sec);
  }

  /* ---- the tools ---- */
  function showTools() {
    [el.backBtn, el.skipBtn, el.muteBtn, el.resetBtn].forEach(function (b) {
      b.hidden = false;
      void b.offsetHeight;
      b.classList.add('in');
    });
    el.jump.hidden = false;
    void el.jump.offsetHeight;
    el.jump.classList.add('in');
    armTools();
  }

  /* Which tools are any use right now. Back needs a section behind
     this one; everything but the sound waits out a swap. The sound
     switch is never taken away: a player who wants it off wants it
     off now, whatever the screen is doing. */
  function armTools() {
    if (!el.backBtn) return;
    el.backBtn.disabled = busy || sectionHistory.length < 2;
    el.skipBtn.disabled = busy || skipping;
    el.resetBtn.disabled = busy || sectionIndex < 0;
    el.jumpBtn.disabled = busy;
    el.muteBtn.disabled = false;
    if (!busy && tripBtn) {
      tripBtn.classList.remove('working');
      tripBtn = null;
    }
  }

  function trip(btn) {
    if (tripBtn) tripBtn.classList.remove('working');
    tripBtn = btn;
    btn.classList.add('working');
  }

  function replaySection() {
    var sec = SECTIONS[sectionIndex];
    if (!sec || busy) return;
    trip(el.resetBtn);
    enterAt(sec);
  }

  function backSection() {
    if (busy || sectionHistory.length < 2) return;
    sectionHistory.pop();                 /* step out of the section we are in */
    var sec = SECTIONS[sectionHistory[sectionHistory.length - 1]];
    if (!sec) return;
    trip(el.backBtn);
    enterAt(sec);
  }

  /* ---- skip ----
     The section in play is run out to its end, never abandoned:
     waits collapse (M.wait), lines go up whole (narrate), the lens
     cuts (fly), animations are finished frame by frame, and a step
     waiting on the player is answered for them -- the matching
     shapes picked, the craft put down on the island it fits. It
     stops at the next section's opening (enterSection), at a NEXT
     the screen is waiting on, or when the screen has nothing left
     to run; and never spins forever. The lesson skips itself. */
  function flushAnimations(node) {
    if (!node || !node.getAnimations) return;
    node.getAnimations({ subtree: true }).forEach(function (a) {
      var timing = a.effect && a.effect.getComputedTiming();
      if (!timing || timing.iterations === Infinity) return;
      /* the craft's flight is clocked by js/failure.js, not by its
         own animations: finishing those early would land it before
         the chain watching it has caught up */
      var target = a.effect && a.effect.target;
      if (target && target.closest && target.closest('.ship')) return;
      try { a.finish(); } catch (e) { /* not finishable; leave it running */ }
    });
  }

  function playerStep() {
    return !!(R && R.release &&
      (R.phase === 'shape' || (R.phase === 'area' && !R.landing && !R.solved)));
  }

  function answerStep(site) {
    if (site.phase === 'shape') {
      roundMatches(site).forEach(function (pad) { onRoundShapePick(site, pad); });
    } else if (site.phase === 'area') {
      var ref = roundRef(site);
      if (ref) onRoundAreaPick(site, ref);
    }
  }

  function atNext(round) {
    if (!round) return false;
    if (round.advanceRelease) return true;
    var btn = R && R.el && R.el.advance;
    return !!(R && R.solved && btn && !btn.hidden);
  }

  function skipSection() {
    if (busy || skipping) return;

    if (current === learnAt) {
      if (global.GeoLearn && global.GeoLearn.skip) global.GeoLearn.skip();
      return;
    }

    var id = runId;
    var from = sectionSeq;
    var screen = SCREENS[current];
    var node = screen.node();
    var round = screen.round ? screen.round() : null;

    skipping = true;
    fastForward = true;
    armTools();
    A.stopVoice();                        /* the line being said is cut where it stands */

    var deadline = performance.now() + 10000;
    (async function () {
      while (runId === id && seqId === id && sectionSeq === from &&
             !atNext(round) && performance.now() < deadline) {
        flushAnimations(node);
        if (playerStep()) answerStep(R);
        await new Promise(function (r) { requestAnimationFrame(r); });
      }
      flushAnimations(node);
      fastForward = false;
      skipping = false;
      armTools();
    })();
  }

  /* ---- sound off ----
     js/motion.js holds the state and remembers it between sittings;
     this is only the switch, and it reaches both engines: the
     mission's (js/audio.js) and the lesson's own voice. */
  function showMute() {
    var off = !!(global.Motion && global.Motion.isMuted());
    el.muteBtn.classList.toggle('muted', off);
    el.muteBtn.setAttribute('aria-pressed', off ? 'true' : 'false');
    var label = off ? T('soundOn') : T('soundOff');
    el.muteBtn.setAttribute('aria-label', label);
    el.muteBtn.setAttribute('title', label);
  }

  function applyMute() {
    var off = !!(global.Motion && global.Motion.isMuted());
    if (A.setMuted) A.setMuted(off);
    if (global.GeoLearn && global.GeoLearn.setMuted) global.GeoLearn.setMuted(off);
    showMute();
  }

  function wireTools() {
    buildSections();
    buildJump();
    markJump();
    applyMute();

    el.jumpBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (busy) return;
      openJump(!el.jump.classList.contains('open'));
    });
    el.jumpMenu.addEventListener('click', function (e) { e.stopPropagation(); });
    /* anywhere else, and Escape, closes it */
    document.addEventListener('click', function () { openJump(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') openJump(false);
    });

    el.backBtn.addEventListener('click', backSection);
    el.skipBtn.addEventListener('click', skipSection);
    el.resetBtn.addEventListener('click', replaySection);
    el.muteBtn.addEventListener('click', function () {
      if (global.Motion) global.Motion.toggleMuted();
      applyMute();
    });
  }

  /* ============================================================
     START GATE

     The mission opens on a black cockpit and a voice line, so it
     cannot start until the artwork and the narration are actually
     in the browser — a half-loaded start means the commander talks
     over an empty screen. The gate therefore holds the mission
     until every asset has settled, and shows how far along it is
     rather than a spinner that says nothing.
     ============================================================ */

  /* ---------------------------------------------------------- what to load

     Read off the document rather than kept in a second list here:
     every <img> is in document.images (the built screens included —
     they are built before this runs) and every painted backdrop is
     the computed background-image of a .layer or the gate, so this
     cannot drift out of step with the page. The audio comes from
     GeoAudio's own tables, the fonts from their <link rel=preload>,
     and the lesson's own pieces from js/learn.js.

     Each file's weight is its size on disk (js/manifest.js), looked
     up by its path relative to this document, decoded. */
  function relPath(u) {
    var a = new URL(u, document.baseURI);
    var base = new URL('.', document.baseURI).pathname;
    var path = a.pathname.indexOf(base) === 0
      ? a.pathname.slice(base.length)
      : a.pathname.replace(/^\//, '');
    try { return decodeURIComponent(path); } catch (e) { return path; }
  }

  function sizeOf(u) {
    var m = global.GeoManifest || {};
    return m[relPath(u)] || 0;
  }

  /* Point an <img> at the blob the gate fetched. Decoded off-screen
     first, so the swap on an image that is already showing (the
     gate's own craft) is between two decoded copies of the same
     pixels and never blinks. If the blob is ever refused the element
     goes back to its file URL, once. An <img> in a <picture> loses
     its <source>s on the way: they would outrank the new src, and
     the blob is already the file they chose. */
  /* Both swaps return a promise the gate waits on (js/preload.js):
     it settles once the element itself is showing the blob and the
     browser has decoded it for that element, so the start button is
     never offered over a picture that is still coming in. */
  function decodeOf(img) {
    return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
  }

  function swapImg(img, original, blobUrl) {
    var probe = new Image();
    probe.src = blobUrl;
    return decodeOf(probe).then(function () {
      img.addEventListener('error', function onErr() {
        img.removeEventListener('error', onErr);
        if (img.src === blobUrl) img.src = original;
      });
      var pic = img.parentNode;
      if (pic && pic.nodeName === 'PICTURE') {
        Array.prototype.slice.call(pic.querySelectorAll('source')).forEach(function (s) {
          pic.removeChild(s);
        });
      }
      img.src = blobUrl;
      return decodeOf(img);
    });
  }

  function swapBg(node, blobUrl) {
    var probe = new Image();
    probe.src = blobUrl;
    return decodeOf(probe).then(function () {
      node.style.backgroundImage = 'url("' + blobUrl + '")';
      /* kept alive with the node, so the decode is not thrown away
         before the screen it is on first paints */
      node._geoBg = probe;
    });
  }

  function bgUrl(value) {
    if (global.GeoLoad && global.GeoLoad.bgUrl) return global.GeoLoad.bgUrl(value);
    var m = /url\((["']?)(.*?)\1\)/.exec(value);
    return m ? m[2] : '';
  }

  function imageJobs() {
    var byUrl = {};
    var order = [];

    function add(u, apply) {
      if (!u) return;
      var abs;
      try { abs = new URL(u, document.baseURI).href; } catch (e) { return; }
      if (/^(blob|data):/i.test(abs)) return;
      if (!byUrl[abs]) { byUrl[abs] = []; order.push(abs); }
      byUrl[abs].push(apply);
    }

    Array.prototype.forEach.call(document.images, function (img) {
      var src = img.currentSrc || img.src;
      add(src, function (blobUrl) { return swapImg(img, src, blobUrl); });
    });

    Array.prototype.forEach.call(
      document.querySelectorAll('.layer, .gate'),
      function (node) {
        /* the url() it paints: an image-set() offers AVIF and WebP */
        var u = bgUrl(getComputedStyle(node).backgroundImage || '');
        if (!u) return;
        add(u, function (blobUrl) { return swapBg(node, blobUrl); });
      }
    );

    return order.map(function (u) {
      var fns = byUrl[u];
      return {
        url: u,
        size: sizeOf(u),
        apply: function (blobUrl) {
          return Promise.all(fns.map(function (f) { return f(blobUrl); }));
        }
      };
    });
  }

  function audioJobs() {
    return A.files().map(function (f) {
      return {
        url: f.url,
        size: sizeOf(f.url),
        apply: function (blobUrl) { A.adopt(f.file, blobUrl); }
      };
    });
  }

  /* the faces: fetched so they are in before the first caption, and
     counted, but left to the CSS to use — a font is applied by
     name, not by URL */
  function fontJobs() {
    return Array.prototype.map.call(
      document.querySelectorAll('link[rel="preload"][as="font"]'),
      function (l) { return { url: l.href, size: sizeOf(l.href), apply: null }; }
    );
  }

  /* the lesson's own pieces: its board, its mascot's sprite sheets
     and its clips, named by js/learn.js and weighed here */
  function learnJobs() {
    if (!global.GeoLearn || !global.GeoLearn.assets) return [];
    return global.GeoLearn.assets().map(function (a) {
      return { url: a.url, size: sizeOf(a.url), apply: a.apply || null };
    });
  }

  /* what the readout says, by how far along the load is */
  var STATUS = [
    [0.00, 'gateBoot'],
    [0.20, 'gateChart'],
    [0.48, 'gateTerrain'],
    [0.76, 'gateSync'],
    [1.00, 'gateReady']
  ];

  function statusFor(p) {
    var key = STATUS[0][1];
    for (var i = 0; i < STATUS.length; i++) {
      if (p >= STATUS[i][0]) key = STATUS[i][1];
    }
    return T(key);
  }

  var GATE_MIN_MS = 1150;       // a warm cache must still read as a load
  var SETTLE_MS = 8000;         // the most the final check may add

  /* The last check before Start is offered, after every file is in
     and decoded: anything the fetcher could not hand over (a file
     that failed keeps its own URL and loads the ordinary way) is
     waited for here, along with the faces the captions are set in,
     and then two painted frames -- so the first screen, its artwork
     and the gate's own animation are already on the GPU and running
     when the button arrives, not starting up under the first tap.
     Capped, like everything on the gate: nothing here can hold the
     mission. */
  function nextFrame() {
    return new Promise(function (r) { requestAnimationFrame(function () { r(); }); });
  }

  function settleAll() {
    var waits = Array.prototype.map.call(document.images, function (img) {
      if (img.complete && img.naturalWidth) return decodeOf(img);
      /* complete with no pixels: it already failed, and its error
         event has been and gone -- nothing more to wait for */
      if (img.complete) return Promise.resolve();
      return new Promise(function (r) {
        img.addEventListener('load', function () { decodeOf(img).then(r); }, { once: true });
        img.addEventListener('error', r, { once: true });
      });
    });
    if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
    var all = Promise.all(waits).then(nextFrame).then(nextFrame);
    return Promise.race([all, M.wait(SETTLE_MS)]);
  }

  /* has every asset settled? begin() will not run until it has, so
     a keyboard or scripted start waits on the same bar the click
     does — the button being `hidden` until then is the visible half
     of the same rule */
  var ready = false;

  /* js/preload.js, or a stand-in that resolves at once: without the
     fetcher the mission still starts, it just cannot promise its
     files are in */
  var LOAD = global.GeoLoad || { run: function () { return Promise.resolve(); } };

  function runGate() {
    var jobs   = imageJobs().concat(audioJobs(), fontJobs(), learnJobs());
    var target = 0;             // where the bytes say the bar should be
    var shown  = 0;             // where the bar actually is
    var raf    = 0;
    var t0     = performance.now();
    var slow   = !M.reduced();

    function draw(p) {
      var pct = Math.round(p * 100);
      el.gateFill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      el.gatePct.textContent = pct + '%';

      var label = statusFor(p);
      if (el.gateStatus.textContent !== label) el.gateStatus.textContent = label;
    }

    /* Eased rather than stepped: on a warm cache six megabytes land
       in the same frame, and a bar that teleports to 100% reads as a
       glitch. The easing also keeps the readout moving while a slow
       file is still in flight. `target` only ever rises (GeoLoad
       promises as much), so the bar never runs backwards. */
    function tick() {
      shown += (target - shown) * 0.10;
      if (target - shown < 0.0015) shown = target;
      draw(shown);
      raf = requestAnimationFrame(tick);
    }

    function onProgress(p) {
      if (p > target) target = p;
      if (!slow) draw(target);
    }

    if (slow) raf = requestAnimationFrame(tick);
    draw(0);

    return LOAD.run(jobs, onProgress).then(function (tally) {
      return settleAll().then(function () { return tally; });
    }).then(function (tally) {
      target = 1;
      if (tally && tally.failed && global.console) {
        console.warn('GeoDrone: ' + tally.failed + ' asset(s) could not be ' +
                     'prefetched; the elements keep their file URLs.');
      }
      /* let the easing run the last stretch out before handing over */
      var rest = slow ? Math.max(0, GATE_MIN_MS - (performance.now() - t0)) + 520
                      : Math.max(0, 300 - (performance.now() - t0));
      return M.wait(rest);
    }).then(function () {
      if (raf) cancelAnimationFrame(raf);
      draw(1);
      return M.wait(slow ? 260 : 0);
    }).then(revealStart);
  }

  function revealStart() {
    ready = true;
    el.gateLoad.classList.add('is-done');

    return M.wait(M.reduced() ? 0 : 360).then(function () {
      el.gateLoad.hidden = true;

      el.gateBtn.hidden = false;
      /* reflow, so the browser has an un-hidden starting frame to
         transition away from instead of snapping straight to the end */
      void el.gateBtn.offsetWidth;

      el.gateBtn.classList.add('is-in');

      try { el.gateBtn.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
    });
  }


  /* ============================================================
     BOOT
     ============================================================ */
  function begin() {
    if (!ready) return;                   /* the bar has not reached the end */

    el.gate.classList.add('is-gone');
    el.nav.classList.add('is-on');
    showTools();

    /* Once its fade is over (.7s, css/style.css) the gate is taken
       out of the layout altogether. It never comes back, and left
       in place its craft, plumes and sheen would go on animating on
       their own compositor layers under every screen for the whole
       session. */
    M.wait(900).then(function () { el.gate.hidden = true; });

    A.unlock();
    A.startAmbience(0.24);

    resetCockpit();
    syncNav();
    runCockpit();
  }

  /* ---------------------------------------------------------- the tap

     One listener, for every control in the game: Start, LAUNCH, the
     islands on both questions, the nav arrows, NEXT — and anything
     built after this runs, since the listener sits on the document
     rather than on the buttons. The lesson's own controls are the
     one exception: its engine sounds its own taps, so it is left
     alone here.

     On the way DOWN, so the tick is already playing before the
     handler that owns the button decides what the tap MEANT: a pick
     that ends in a crash should still sound like it was pressed. */
  var TAPPABLE = 'button, [role="button"], a[href], summary, input, select';

  function onTap(e) {
    var node = e.target;
    if (!node || !node.closest) return;         /* text/document target */

    var hit = node.closest(TAPPABLE);
    if (!hit || hit.disabled) return;
    if (hit.getAttribute('aria-disabled') === 'true') return;
    if (hit.closest('.screen--learn')) return;

    /* `keep` so goTo()'s audio cut does not eat the click of the
       very button that asked for the jump — see fireShot() */
    A.sfx('click', { volume: 0.4, keep: true });
  }

  /* Screen 2's sites, built into its markup and wired like any
     other screen's. Before SEA.init(), so every island gets its
     shoreline with the rest, and before runGate(), so its artwork is
     counted by the loading bar. */
  function wireSurvey() {
    if (!global.GeoPages || !global.GeoPages.buildSurvey) return;
    survey = global.GeoPages.buildSurvey(el.screenDrone);
    if (survey) wireSites(survey);
  }

  function boot() {
    grab();

    /* first, so every timer armed below is already pausable */
    if (global.GeoLife) global.GeoLife.init();

    if (M.reduced()) document.body.classList.add('is-reduced');

    M.starfield(el.starfield, 150);
    W.init(el.waveCanvas);

    /* before runGate(), so the islands and crafts on the built
       screens are already in document.images when the loading bar
       works out what it has to fetch */
    addRoundScreens();
    wireSurvey();

    /* the lesson: its board, its mascot and its own engine -- and the
       scene tools hear from it as each of its pages opens */
    if (global.GeoLearn && el.screenLearn) {
      global.GeoLearn.init({
        screen: el.screenLearn,
        onPage: function (page) { enterSection(learnAt, page); }
      });
    }

    /* and after both, because every island on every screen needs a
       shoreline built from its own silhouette */
    SEA.init(el.stage);

    /* every playing screen in its opening state from the off -- after
       the water is in, because the lens parks the sea's own sheets */
    SCREENS.forEach(function (screen, i) { if (i > 0) screen.reset(); });

    /* the scene tools, once every screen and site they list exists */
    wireTools();

    runGate();

    /* first, and in the capture phase, so every control below is
       audible without knowing anything about this */
    document.addEventListener('click', onTap, true);

    el.gateBtn.addEventListener('click', begin, { once: true });
    el.launchBtn.addEventListener('click', onLaunch);

    el.navPrev.addEventListener('click', function () { goTo(current - 1); });
    el.navNext.addEventListener('click', function () { goTo(current + 1); });

    /* the survey's NEXT takes the same road as the ">" arrow; the
       built screens wire the same handler in addRoundScreens() */
    el.advanceBtn.addEventListener('click', function () { onAdvance(survey); });
    syncNav();

    document.body.classList.add('is-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);

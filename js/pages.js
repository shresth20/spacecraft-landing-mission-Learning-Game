/* ============================================================
   Geo Drone — the playing screens: their data and their markup

   Every playing screen is one continuous camera shot over one
   sea, and the lens comes down on it at a number of SITES, one
   after another. A site is a frame-sized box inside the camera
   plate that holds the islands of one question:

     shape    three islands of one shape, three sizes, and two
              other shapes drawn from a pool -- "select all the
              square landing zones"
     landing  three islands of one shape carrying three areas,
              and the craft that has to come down on the right
              one -- "choose the landing zone with the exact area"
     gallery  one island of each shape the lesson is about, each
              with its name printed under it, and nothing to do:
              the beat that hands the mission over to the lesson

   The screens, in the order the mission plays them:

     2  the survey     square > rectangle > triangle shape sites,
                       then the gallery (then the first lesson,
                       which is not built here -- see js/learn.js)
     4  the landing    square > rectangle > triangle landing sites
     5  the quadrilateral survey
                       parallelogram > rhombus > trapezium shape
                       sites, then their gallery (then the second
                       lesson -- js/learn-quad.js)
     7  the quadrilateral landing
                       parallelogram > rhombus > trapezium landing
                       sites

   This file is the DATA and the MARKUP. The flow that plays it is
   runRound() in js/script.js, which is one function for every
   screen -- the difference between them lives entirely below.

   ── why the numbers are here and not in the stylesheet ─────────

   Landing is one flat shape coming down onto another (the camera
   looks straight down), so a craft is square on an island when the
   two CENTRES OF AREA line up, and it FITS when the two painted
   areas match. Both of those are properties of the artwork, not of
   the layout, so every figure below was measured off the alpha
   channel of the PNG it describes:

     land          fill %  centre of area      craft            fill %  centre of area
     Triangle       36.623  (49.94, 63.45)     Triangle ship     31.407  (49.92, 47.72)
     Square         59.110  (50.04, 50.08)     Square ship       37.389  (49.84, 37.83)
     Rectangle      28.000  (49.97, 49.93)     Rectangle ship    26.957  (49.81, 43.16)
     Parallelogram  36.281  (50.15, 49.98)     Trapezium ship    29.117  (50.26, 38.85)
     Trapezium      38.396  (49.96, 56.36)     Parallelogram sh  39.193  (49.92, 45.09)
     Rhombus        31.797  (50.00, 49.82)     Rhombus ship      21.258  (49.89, 41.49)

   A craft's fill is its HULL: the flame is masked out by colour.
   Everything else — the pad sizes, the ship box, the fall
   arithmetic in plan() (js/failure.js) — is derived from those two
   columns at load, so there is one place to correct if a PNG is
   ever redrawn, and no figure is repeated anywhere it could drift.

   ── the two pieces of artwork that are swapped ─────────────────

   Parallelogram spaceship.webp is a TRAPEZIUM: its rows widen from
   45.9% of the canvas at the top to 95.7% at the bottom.
   Trapezium spaceship.webp is a PARALLELOGRAM: every row is 58.0%
   wide and they shear steadily sideways.

   The two land tiles are both correct, so the round for each shape
   is wired to the craft whose hull IS that shape, which is why the
   `craft` names below read as though they were crossed over. They
   are not: the files are. Renaming the two PNGs and swapping these
   two lines back is a safe change to make later.

   ── where the artwork still does not quite agree ─────────────

   Matched on AREA, a craft and its island are not always the same
   PROPORTIONS, because the two sets of drawings were not drawn to
   one ratio. The AREAS are exact in every case — that is what the
   lesson rests on, and it follows from the two fills alone — but a
   silhouette can still come out wider or shorter than the one it
   matches. Closing that is an artwork change, not a code one.

   The land as it now stands, painted, in per cent of its own box:

     triangle       93.2 x 78.9   ratio 1.18
     square         77.5 x 76.8   ratio 1.01
     rectangle      70.0 x 40.0   ratio 1.75
     parallelogram  96.9 x 57.0   ratio 1.70
     trapezium      95.4 x 56.6   ratio 1.69
     rhombus        69.2 x 92.6   ratio 0.75

   ── words ──────────────────────────────────────────────────────

   Nothing the player reads is written here: every label, every
   callout and every spoken line is a KEY into locales/locales.json,
   looked up through I18n (js/i18n.js) at the moment it is drawn.
   ============================================================ */

(function (global) {
  'use strict';

  var doc = document;

  /* the one lookup. index.html loads this file before the locale
     is in, so nothing below may call it at load time -- only from
     the builders, which script.js runs from boot(). */
  function T(key, repl) {
    return global.I18n ? global.I18n.t(key, repl) : String(key);
  }

  /* ---------------------------------------------------------- the land
     One entry per shape of island, and every figure in it is read
     off that PNG's alpha channel rather than chosen: `fill` is how
     much of the canvas the painted land covers, `cx`/`cy` its centre
     of area, `outline` and `clip` the silhouette traced in the same
     box units. So the verdict outline is the actual coastline, the
     tap target is the actual land, the water's shore is built on the
     actual shore, and `label` is the point a printed number has to
     sit on to look centred.

     EVERY ONE OF THESE PNGs MUST BE SQUARE. The figures are per cent
     of the canvas, .zone and .pad are `aspect-ratio: 1`, and every
     <svg> the water draws on them — shore, laps, surf, blast — has
     `viewBox="0 0 100 100"`. A land tile that is not square renders
     at 100% x (h/w) of that box and top-aligns, so its painting ends
     up somewhere its own percentages do not describe. Rectangle.webp
     shipped 1448 x 1086 and did exactly that; it is now padded out
     to 1448 x 1448, transparently, with the painting untouched.

     `adj` is the key of the shape's adjective ("triangular"), for
     the island's accessible name; `name` the key of its noun
     ("Triangle"), for the gallery's printed label. */
  var LAND = {
    triangle: {
      img: 'Triangle.webp', fill: 36.623, cx: 0.4994, cy: 0.6345,
      outline: 'M50 10.9L96.5 89.8L3.3 89.6z',
      clip: 'polygon(50% 10.9%, 96.5% 89.8%, 3.3% 89.6%)',
      label: [49.9, 63.4],
      adj: 'adjTriangle', name: 'shapeTriangle'
    },

    square: {
      img: 'Square.webp', fill: 59.110, cx: 0.5004, cy: 0.5008,
      outline: 'M11.4 11.7L88.8 11.7L88.8 88.5L11.3 88.5z',
      clip: 'polygon(11.4% 11.7%, 88.8% 11.7%, 88.8% 88.5%, 11.3% 88.5%)',
      label: [50.0, 50.1],
      adj: 'adjSquare', name: 'shapeSquare'
    },

    rectangle: {
      img: 'Rectangle.webp', fill: 28.000, cx: 0.4997, cy: 0.4993,
      outline: 'M85 30L85 70L15 70L15 30z',
      clip: 'polygon(85% 30%, 85% 70%, 15% 70%, 15% 30%)',
      label: [50.0, 49.9],
      adj: 'adjRectangle', name: 'shapeRectangle'
    },

    parallelogram: {
      img: 'Parallelogram.webp', fill: 36.281, cx: 0.5015, cy: 0.4998,
      outline: 'M34.5 21.5L98.5 21.5L65.7 78.5L1.6 78.4z',
      clip: 'polygon(34.5% 21.5%, 98.5% 21.5%, 65.7% 78.5%, 1.6% 78.4%)',
      label: [50.1, 50.0],
      adj: 'adjParallelogram', name: 'shapeParallelogram'
    },

    trapezium: {
      img: 'Trapezium.webp', fill: 38.396, cx: 0.4996, cy: 0.5636,
      outline: 'M29.5 24.3L70.5 24.3L97.6 80.9L2.2 80.8z',
      clip: 'polygon(29.5% 24.3%, 70.5% 24.3%, 97.6% 80.9%, 2.2% 80.8%)',
      label: [50.0, 56.4],
      adj: 'adjTrapezium', name: 'shapeTrapezium'
    },

    rhombus: {
      img: 'Rhombus.webp', fill: 31.797, cx: 0.5000, cy: 0.4982,
      outline: 'M50 3.5L84.6 50L49.8 96.1L15.4 49.9z',
      clip: 'polygon(50% 3.5%, 84.6% 50%, 49.8% 96.1%, 15.4% 49.9%)',
      label: [50.0, 49.8],
      adj: 'adjRhombus', name: 'shapeRhombus'
    }
  };

  /* The bounding box of each painted silhouette, in box units, read
     out of that shape's own clip polygon rather than written down a
     second time — the scatter below has to know how much water an
     island actually covers, and this way that figure cannot drift
     from the outline it came from. */
  Object.keys(LAND).forEach(function (key) {
    var n = LAND[key].clip.match(/-?[\d.]+(?=%)/g).map(Number);
    var xs = [], ys = [], i;
    for (i = 0; i < n.length; i += 2) { xs.push(n[i]); ys.push(n[i + 1]); }
    LAND[key].ext = [
      Math.min.apply(null, xs) / 100, Math.min.apply(null, ys) / 100,
      Math.max.apply(null, xs) / 100, Math.max.apply(null, ys) / 100
    ];
  });


  /* ---------------------------------------------------------- callouts
     The dimension overlay is drawn in PERCENT OF THE SHIP BOX: the
     <svg> is placed at -28%/-6% and sized 132%, and its viewBox is
     the same numbers, so one user unit is one percent of the box and
     every coordinate below can be read straight off the hull
     measurements.

     Three primitives, so a callout is described by the points it
     measures rather than by a hand-written path:

       across()  a tick-capped line and the number, measuring a
                 horizontal side
       beside()  the same, turned down the left-hand side
       perp()    the perpendicular height dropped through the shape,
                 with the little square that says it is a right
                 angle

     The line runs the measured length and stops there: no witness
     lines reaching back to the hull's corners. */

  /* half-length of the tick that caps each end of a dimension line */
  var CAP = 3.6;

  /* every island and craft has an AVIF twin of its WebP; js/preload.js
     says which of the two this browser decodes */
  function art(name) {
    return global.GeoLoad && global.GeoLoad.artName ? global.GeoLoad.artName(name) : name;
  }

  function path(cls, d) { return '<path class="' + cls + '" d="' + d + '" />'; }

  function num(x, y, txt) {
    return '<text class="dim__text" x="' + x + '" y="' + y + '">' + txt + '</text>';
  }

  function numDown(x, y, txt) {
    return '<text class="dim__text" x="' + x + '" y="' + y +
           '" transform="rotate(-90 ' + x + ' ' + y + ')">' + txt + '</text>';
  }

  /* the number on a callout: "{n} units", in the player's language */
  function units(n) { return T('units', { n: n }); }

  /* o: x1, x2  the two points being measured
        y       where the dimension line goes — under the exhaust for
                a base, over the nose for a top side
        ty      the number's baseline
        tx      only when the number should not sit at the midpoint */
  function across(o) {
    return path('dim__line', 'M' + o.x1 + ' ' + o.y + 'H' + o.x2) +
           path('dim__tip', 'M' + o.x1 + ' ' + (o.y - CAP) + 'V' + (o.y + CAP) +
                            'M' + o.x2 + ' ' + (o.y - CAP) + 'V' + (o.y + CAP)) +
           num(o.tx == null ? (o.x1 + o.x2) / 2 : o.tx, o.ty, units(o.n));
  }

  /* o: y1, y2  the two rows being measured
        x       where the dimension line goes (negative: off to the
                left of the craft, in open water)                    */
  function beside(o) {
    return path('dim__line', 'M' + o.x + ' ' + o.y1 + 'V' + o.y2) +
           path('dim__tip', 'M' + (o.x - CAP) + ' ' + o.y1 + 'H' + (o.x + CAP) +
                            'M' + (o.x - CAP) + ' ' + o.y2 + 'H' + (o.x + CAP)) +
           numDown(o.x - 7, (o.y1 + o.y2) / 2, units(o.n));
  }

  function perp(x, yt, yb) {
    return path('dim__inner', 'M' + x + ' ' + yt + 'V' + yb) +
           path('dim__square', 'M' + x + ' ' + (yb - 7.4) + 'H' + (x + 7.4) + 'V' + yb);
  }


  /* ---------------------------------------------------------- the craft
     `fill` and `c` are the HULL, flame masked out. `alt` is the key
     of the craft's accessible name, and `dims` builds its callouts
     -- a function, not a string, because the numbers on them are
     words in the player's language and the locale is not in when
     this file loads.                                               */
  var CRAFT = {
    triangle: {
      img: 'Triangle spaceship.webp', fill: 31.407, cx: 0.4992, cy: 0.4772,
      alt: 'shipAltTriangle',
      /* hull apex (50.0, 2.8), base y 70.0 from x 4.94 to 94.82 */
      dims: function () {
        return perp(49.9, 2.8, 69.8) +
          beside({ x: -8, y1: 2.8, y2: 69.8, n: 5 }) +
          across({ x1: 4.94, x2: 94.74, y: 101, ty: 116, n: 8 });
      }
    },

    square: {
      img: 'Square spaceship.webp', fill: 37.389, cx: 0.4984, cy: 0.3783,
      alt: 'shipAltSquare',
      /* hull x 18.2..81.5, y 8.3..67.3 — 63.3 across by 59.0 down,
         so the drawn square is 7% wider than it is tall. Both sides
         are still called 6 units: the area is exact, the artwork is
         a little out of square. */
      dims: function () {
        return across({ x1: 18.2, x2: 81.5, y: 95, ty: 110, n: 6 }) +
          beside({ x: -8, y1: 8.3, y2: 67.3, n: 6 });
      }
    },

    rectangle: {
      img: 'Rectangle spaceship.webp', fill: 26.957, cx: 0.4981, cy: 0.4316,
      alt: 'shipAltRectangle',
      /* hull x 14.75..84.85, y 23.92..62.36 */
      dims: function () {
        return across({ x1: 14.75, x2: 84.85, y: 92, ty: 107, n: 10 }) +
          beside({ x: -8, y1: 23.92, y2: 62.36, n: 5 });
      }
    },

    /* the parallelogram-hulled craft — the file called Trapezium */
    parallelogram: {
      img: 'Trapezium spaceship.webp', fill: 29.117, cx: 0.5026, cy: 0.3885,
      alt: 'shipAltParallelogram',
      /* top edge y 14.0 from x 35.7 to 92.7, bottom edge y 63.9 from
         x 7.3 to 64.5: every row 57.9 wide, sheared 0.58 sideways
         per unit down. The height callout is the PERPENDICULAR one —
         that is the whole point of the shape — so it is dropped
         through the middle as well as measured down the side. */
      dims: function () {
        return perp(50, 14, 63.9) +
          across({ x1: 7.3, x2: 64.5, y: 92, ty: 107, n: 7 }) +
          beside({ x: -8, y1: 14, y2: 63.9, n: 6 });
      }
    },

    /* the trapezium-hulled craft — the file called Parallelogram */
    trapezium: {
      img: 'Parallelogram spaceship.webp', fill: 39.193, cx: 0.4992, cy: 0.4509,
      alt: 'shipAltTrapezium',
      /* top edge y 14.2 from x 27.2 to 72.8 (45.6 across), bottom
         edge y 69.4 from x 2.4 to 97.3 (94.9 across), 55.2 apart —
         which is 5 : 10 : 6 to within a percent, so the numbers
         printed on it are the numbers it is drawn at. */
      dims: function () {
        return perp(50, 14.2, 69.4) +
          across({ x1: 27.2, x2: 72.8, y: 9, ty: 4.5, n: 5 }) +
          across({ x1: 2.4, x2: 97.3, y: 100, ty: 115, n: 10 }) +
          beside({ x: -8, y1: 14.2, y2: 69.4, n: 6 });
      }
    },

    rhombus: {
      img: 'Rhombus spaceship.webp', fill: 21.258, cx: 0.4989, cy: 0.4149,
      alt: 'shipAltRhombus',
      /* vertices (49.9, 5.5) (79.7, 41.4) (49.9, 76.6) (20.2, 41.4).

         The short diagonal is measured ON ITSELF rather than from a
         line under the craft: this hull is only 21% of its box, so a
         box big enough to match the island's area puts anything
         drawn below the exhaust down among the islands. The number
         sits off to the LEFT of centre rather than under the middle
         of the line: dead centre puts it under the porthole and
         straight across the long diagonal. */
      dims: function () {
        return path('dim__inner', 'M49.9 5.5V76.6') +
          path('dim__line', 'M20.2 41.4H79.7') +
          path('dim__tip', 'M20.2 37.8V45M79.7 37.8V45') +
          num(32, 57, units(6)) +
          beside({ x: -8, y1: 5.5, y2: 76.6, n: 7 });
      }
    }
  };


  /* ---------------------------------------------------------- the shapes

     Everything a question about one shape needs, in one place:

       area       the square units the craft of this shape needs
       areaKey    which of the two "find the area" lines is said
       copy       the HUD's formula, tally and sum (keys)
       row        the three areas a landing site carries, left to
                  right, in SQUARE UNITS. The smallest is always in
                  the middle: the craft's base callout hangs below
                  the hull, and only the shortest island leaves it
                  room. The wrong answers are the arithmetic slips
                  the shape invites -- the perimeter, or the half
                  forgotten -- so flying the craft onto one is the
                  mistake made visible.
       sizesA     the three sizes a SHAPE site shows (never printed):
                  visibly three different islands, out of step with
                  the two decoys so that neither the biggest three
                  nor the smallest three are the answer
       decoyPool  every shape that may stand as a wrong answer to
                  "select the <shape>s". Cut mathematically: a
                  square IS a rectangle, a rhombus and a
                  parallelogram, and a rhombus IS a parallelogram,
                  so none of those can ever be a decoy for those
                  questions. A trapezium is read the way the mission
                  draws it -- exactly one pair of parallel sides. */
  var SIZES_A = [1.3, 0.6, 1.0];

  var SHAPES = {
    triangle: {
      area: 20,                        /* 1/2 x 8 x 5 */
      areaKey: 'calcArea',
      copy: { formula: 'hudFormulaTriangle', tally: 'hudTallyTriangle', sum: 'hudSumTriangle' },
      sizesA: [26, 12, 20],
      row: [30, 12, 20],               /* 30 too much room, 12 too little */
      decoyPool: ['square', 'rectangle', 'parallelogram', 'trapezium', 'rhombus']
    },

    square: {
      area: 36,                        /* 6 x 6 */
      areaKey: 'calcArea',
      copy: { formula: 'hudFormulaSquare', tally: 'hudTallySquare', sum: 'hudSumSquare' },
      row: [54, 24, 36],               /* 24 is the perimeter */
      decoyPool: ['triangle', 'rectangle', 'parallelogram', 'trapezium', 'rhombus']
    },

    rectangle: {
      area: 50,                        /* 10 x 5 */
      areaKey: 'findArea',
      copy: { formula: 'hudFormulaRectangle', tally: 'hudTallyRectangle', sum: 'hudSumRectangle' },
      row: [50, 30, 75],               /* 30 is the perimeter */
      decoyPool: ['triangle', 'parallelogram', 'trapezium', 'rhombus']   /* a square IS a rectangle */
    },

    parallelogram: {
      area: 42,                        /* 7 x 6 */
      areaKey: 'calcArea',
      copy: { formula: 'hudFormulaParallelogram', tally: 'hudTallyParallelogram', sum: 'hudSumParallelogram' },
      row: [63, 30, 42],
      decoyPool: ['triangle', 'trapezium']       /* squares, rectangles and rhombi ARE parallelograms */
    },

    trapezium: {
      area: 45,                        /* 1/2 x (5 + 10) x 6 */
      areaKey: 'findArea',
      copy: { formula: 'hudFormulaTrapezium', tally: 'hudTallyTrapezium', sum: 'hudSumTrapezium' },
      row: [45, 30, 90],               /* 90 is the half forgotten */
      decoyPool: ['triangle', 'square', 'rectangle', 'parallelogram', 'rhombus']
    },

    rhombus: {
      area: 21,                        /* 1/2 x 6 x 7 */
      areaKey: 'calcArea',
      /* this hull fills only 21% of its canvas, so the box that
         matches a 21-unit island is the tallest on any screen — it
         is hung 3% lower than the others, in css/rounds.css, to
         keep its nose clear of the narration bar */
      copy: { formula: 'hudFormulaRhombus', tally: 'hudTallyRhombus', sum: 'hudSumRhombus' },
      row: [42, 14, 21],               /* 42 is the half forgotten */
      decoyPool: ['triangle', 'rectangle', 'parallelogram', 'trapezium']   /* a square IS a rhombus */
    }
  };

  function sizesA(shape) {
    var s = SHAPES[shape];
    return s.sizesA || SIZES_A.map(function (m) { return s.area * m; });
  }


  /* ---------------------------------------------------------- the screens

     A screen is a list of SITES in the order the lens visits them.
     `at` is where the site's frame sits in the camera plate, in
     per cent of one frame -- the first site's frame is (0..100,
     0..100) and the others are laid out around it on a diamond, so
     every flight between two of them climbs, crosses and descends
     on a slant: a lens that crosses diagonally reads as a journey,
     one that slides sideways reads as a scroll. The frames may
     touch at their edges: the islands only ever stand inside the
     middle band of a frame (BAND, below), so two frames that share
     an edge never share an island.

     The survey is screen 2, with the drone's dark-and-scan opening
     in front of it (`intro`), and its screen is written in
     index.html; the landing screen and the two quadrilateral
     screens are built by sectionHTML() at boot.

     What a screen says is data too: the gallery's hand-over line
     (`recallKey`), and the line a landing screen picks the mission
     up again with after a lesson (`recalledKey`).                 */

  /* the four stations of the diamond */
  var AT = {
    nw: { x: 0, y: 0 },
    e:  { x: 100, y: 45 },
    sw: { x: 0, y: 90 },
    ne: { x: 100, y: -45 }
  };

  var SURVEY = {
    kind: 'survey',
    intro: true,
    sites: [
      { key: 'sq',  kind: 'shape',   shape: 'square',    at: AT.nw, selectKey: 'selectSquare',    matchKey: 'matchSquare' },
      { key: 'rc',  kind: 'shape',   shape: 'rectangle', at: AT.e,  selectKey: 'selectRectangle', matchKey: 'matchRectangle' },
      { key: 'tr',  kind: 'shape',   shape: 'triangle',  at: AT.sw, selectKey: 'selectTriangle',  matchKey: 'matchTriangle' },
      { key: 'gal', kind: 'gallery', shapes: ['square', 'rectangle', 'triangle'], at: AT.ne,
        recallKey: 'recallIntro' }
    ]
  };

  var LANDING = {
    kind: 'landing',
    recalledKey: 'recalledAreas',
    sites: [
      { key: 'sq', kind: 'landing', shape: 'square',    at: AT.nw },
      { key: 'rc', kind: 'landing', shape: 'rectangle', at: AT.e },
      { key: 'tr', kind: 'landing', shape: 'triangle',  at: AT.sw }
    ]
  };

  /* The quadrilaterals: the same two screens again, for the three
     shapes the first lesson did not cover. The survey has no dark to
     scan -- the drone is already over the sea -- so it opens on the
     water at survey height, as the landing screen does, and its
     gallery hands over to the second lesson (`lesson`). */
  var SURVEY_QUAD = {
    kind: 'survey',
    gallery: 'secSurveyQuads',
    lesson: 'quad',
    sites: [
      { key: 'pa',  kind: 'shape',   shape: 'parallelogram', at: AT.nw, selectKey: 'selectParallelogram', matchKey: 'matchParallelogram' },
      { key: 'rh',  kind: 'shape',   shape: 'rhombus',       at: AT.e,  selectKey: 'selectRhombus',       matchKey: 'matchRhombus' },
      { key: 'tz',  kind: 'shape',   shape: 'trapezium',     at: AT.sw, selectKey: 'selectTrapezium',     matchKey: 'matchTrapezium' },
      { key: 'gal', kind: 'gallery', shapes: ['parallelogram', 'rhombus', 'trapezium'], at: AT.ne,
        recallKey: 'recallIntroQuad' }
    ]
  };

  var LANDING_QUAD = {
    kind: 'landing',
    recalledKey: 'recalledQuad',
    sites: [
      { key: 'pa', kind: 'landing', shape: 'parallelogram', at: AT.nw },
      { key: 'rh', kind: 'landing', shape: 'rhombus',       at: AT.e },
      { key: 'tz', kind: 'landing', shape: 'trapezium',     at: AT.sw }
    ]
  };


  /* ---------------------------------------------------------- sizing

     FIT_AREA is what the survey's 20-unit island actually covers:
     17 box units squared, of which the triangle paints 36.623%. Every
     fit island is drawn to cover the SAME painted area, so a 36-unit
     square and a 20-unit triangle look like the same amount of
     ground and the series keeps one scale throughout.

     From there:
       k(area)  = kFit x sqrt(area / fit area)   — areas in true
                  proportion to the numbers printed on them
       fit      = sqrt(land fill / hull fill)    — a length ratio, so
                  the square root of two areas
       shipK    = kFit x fit                     — the box that makes
                  the PAINTED hull cover exactly the fit island        */
  var FIT_AREA = 17 * 17 * 0.36623;      /* = 105.84 box units of land */

  function boxFor(paintedArea, land) {
    return Math.sqrt(paintedArea / (land.fill / 100));
  }

  function round2(n) { return Math.round(n * 100) / 100; }


  /* ---------------------------------------------------------- layout
     Where each island sits is a LAYOUT question, so it lives in
     css/rounds.css against the slot classes handed out below —
     `pad--row1/2/3` for the three of the site's own shape, sitting
     in a row on one centre-of-area line, and `pad--far1/2` for the
     two decoys on a shape site, which sit higher up the frame.

     A shape site's five are then strewn across those five stations
     on every visit (scatter below); a landing site's three stay in
     the row, and the gallery's three stand in the row in the order
     the lesson names them.                                        */


  /* ---------------------------------------------------------- the scatter

     While the SHAPE is the question, the five islands are strewn
     about the water and shuffled every time the screen is entered.
     That is not decoration: with the site's own three always in a
     row across the front, "pick the front three" wins the shape task
     without ever looking at a shape, and the question stops being a
     question.

     ── the five stations ──

     Two set back and inset, three across the front. The front three
     ARE the row (the same 21/50/79 the area task uses, on the same
     --land-y), so an island that happens to be scattered onto its
     own row station simply stays where it is when the row forms.

     ── why the shuffle is sampled and not just applied ──

     The islands are sized by the areas printed on them, so they are
     not interchangeable, and some permutations of five such objects
     across five fixed stations simply overlap. So every draw is
     measured before it is used, and rejected if two islands would
     touch or one would leave the water. If a frame is too cramped
     for any draw at all, the islands stay in the row.              */

  /* the water the islands may use: clear of the narration bar above
     and the HUD line below */
  var BAND = [0.17, 0.86];
  var SIDES = 0.02;                        /* air at each edge */
  /* Islands have to CLEAR each other, not merely not intersect.
     offsetWidth is a whole number of pixels while the real box is
     fractional, so a draw accepted at exactly touching can come out
     a fraction over. */
  var CLEAR = 3;
  var STATION_X = [37, 63, 21, 50, 79];    /* two behind, three across */
  var DRAWS = 200;

  function shuffled(list) {
    var a = list.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* One island, measured: how far its painted silhouette reaches
     from its centre of area on each side — which is what has to
     fit, not the box. All four come off offsetWidth: the box is
     square by construction, and the width is the axis that is
     always laid out even before the artwork has decoded. */
  function measure(el) {
    var land = LAND[el.dataset.shape];
    var w = el.offsetWidth;
    return {
      el: el,
      cx: land.cx,
      cy: land.cy,
      w: w,
      left:  (land.cx - land.ext[0]) * w,
      right: (land.ext[2] - land.cx) * w,
      up:    (land.cy - land.ext[1]) * w,
      down:  (land.ext[3] - land.cy) * w
    };
  }

  function stationsOf(sec, W, H) {
    var cs = global.getComputedStyle(sec);
    var far = parseFloat(cs.getPropertyValue('--far-y'));
    var land = parseFloat(cs.getPropertyValue('--land-y'));
    return STATION_X.map(function (x, i) {
      return { x: W * x / 100, y: H * (i < 2 ? far : land) / 100 };
    });
  }

  function collides(list, W, H) {
    var i, j, a, b;
    for (i = 0; i < list.length; i++) {
      a = list[i];
      if (a.x - a.m.left < W * SIDES + CLEAR ||
          a.x + a.m.right > W * (1 - SIDES) - CLEAR ||
          a.y - a.m.up < H * BAND[0] + CLEAR ||
          a.y + a.m.down > H * BAND[1] - CLEAR) return true;
      for (j = i + 1; j < list.length; j++) {
        b = list[j];
        if (a.x - a.m.left - CLEAR < b.x + b.m.right &&
            b.x - b.m.left - CLEAR < a.x + a.m.right &&
            a.y - a.m.up - CLEAR < b.y + b.m.down &&
            b.y - b.m.up - CLEAR < a.y + a.m.down) return true;
      }
    }
    return false;
  }

  /* Shuffle `els` across this frame's five stations and hand each
     placement to `place(el, x, y, m)`, where x/y are px within the
     frame and name the point the island's CENTRE OF AREA should
     land on. Returns the islands back to front, or null if no draw
     of five fitted, which is the caller's cue to leave them where
     its stylesheet put them. */
  function strew(sec, els, place) {
    var W = sec.clientWidth;
    var H = sec.clientHeight;
    if (!W || !H || !els.length) return null;

    var art = els.map(measure);
    var spots = stationsOf(sec, W, H);
    var placed = null;

    for (var t = 0; t < DRAWS && !placed; t++) {
      var draw = shuffled(art).map(function (m, i) {
        return { m: m, x: spots[i].x, y: spots[i].y };
      });
      if (!collides(draw, W, H)) placed = draw;
    }

    if (!placed) return null;

    placed.forEach(function (o) { place(o.m.el, o.x, o.y, o.m); });

    return placed.slice()
      .sort(function (a, b) { return (a.y - b.y) || (a.x - b.x); })
      .map(function (o) { return o.m.el; });
  }

  /* A site's islands are anchored on their centre of area already
     (see .pad in css/style.css), so the station goes straight into
     --sx/--sy as a percentage of the site's own frame. */
  function scatter(site) {
    var pads = site.el.padList;
    var W = site.node.clientWidth || 1;
    var H = site.node.clientHeight || 1;

    var order = strew(site.node, pads, function (el, x, y) {
      el.style.setProperty('--sx', (x / W * 100).toFixed(3) + '%');
      el.style.setProperty('--sy', (y / H * 100).toFixed(3) + '%');
      el.classList.add('is-scattered');
    });

    if (order) return;

    /* too cramped for any draw: back to the row it was laid out at */
    pads.forEach(function (pad) { pad.classList.remove('is-scattered'); });
  }

  /* ---------------------------------------------------------- dealing

     Hand `classes` out among `els` at random, dropping whichever of
     them an element is already wearing. This is how a station gets
     attached to an island rather than written into it: the classes
     carry nothing but a position, so dealing them again moves the
     islands without touching a size, a printed number or a
     `data-area`. A class rather than an inline `--cx`, because
     `.pad.is-scattered` overrides `--cx` from a rule, and an inline
     property would outrank it and break the shape task's scatter. */
  function deal(els, classes) {
    var order = shuffled(classes);
    els.forEach(function (el, i) {
      classes.forEach(function (c) { el.classList.remove(c); });
      if (order[i]) el.classList.add(order[i]);
    });
  }

  var ROW_SLOTS = ['pad--row1', 'pad--row2', 'pad--row3'];

  /* A site's three matching islands, dealt across the three row
     stations. Called from the screen's reset, so every entry asks
     the area question with the answer somewhere else. */
  function dealRow(site) {
    deal(site.el.padList.filter(function (pad) {
      return pad.dataset.shape === site.shape;
    }), ROW_SLOTS);
  }

  /* ============================================================
     THE SITES -- how every playing screen is laid out

     Each place the lens comes down on is a SITE: a frame-sized
     coordinate box inside the camera plate (see .site in
     css/style.css), holding the islands of one question, laid out
     on the same stations, the same --pu and the same centre-of-area
     anchoring as every other.

     A shape site carries every shape in its pool as a decoy and
     shows TWO of them: an island's shoreline is built from its
     silhouette at load (js/water.js), so swapping a pad's shape
     later would leave it wearing the wrong coast. Hiding all but two
     is the same random pair with none of that.

     And around and between the sites, the ISLETS: the rest of the
     archipelago, sixteen small islands cycling through every shape
     the mission has, which are what the wide shot is of. Scenery --
     no shoreline, no tap target, no number -- and kept out of every
     site's frame, so no question ever has an extra island in it.
     ============================================================ */

  /* the islets: how many, and the range of land they cover, in
     painted box units -- between a third and two thirds of the fit
     island -- cycling through every shape */
  var ISLETS = 16;
  var ISLET_AREA = [FIT_AREA * 0.30, FIT_AREA * 0.66];
  var ISLET_SHAPES = ['triangle', 'square', 'rectangle',
                      'parallelogram', 'trapezium', 'rhombus'];

  /* the sea the islets are strewn over: every site's frame with a
     wide margin around the lot, and each frame itself (plus a
     little) kept clear. In per cent of one frame, like `at`. */
  var SEA_MARGIN = { x: 44, y: 68 };
  var SITE_MARGIN = 8;

  function seaOf(round) {
    var l = 1e9, r = -1e9, t = 1e9, b = -1e9;
    round.sites.forEach(function (s) {
      l = Math.min(l, s.offset.x); r = Math.max(r, s.offset.x + 100);
      t = Math.min(t, s.offset.y); b = Math.max(b, s.offset.y + 100);
    });
    return {
      world: { l: l - SEA_MARGIN.x, r: r + SEA_MARGIN.x, t: t - SEA_MARGIN.y, b: b + SEA_MARGIN.y },
      exclude: round.sites.map(function (s) {
        return { l: s.offset.x - SITE_MARGIN, r: s.offset.x + 100 + SITE_MARGIN,
                 t: s.offset.y - SITE_MARGIN, b: s.offset.y + 100 + SITE_MARGIN };
      })
    };
  }

  function isletHTML(shape, k) {
    var land = LAND[shape];
    return '<div class="islet" data-shape="' + shape + '"' +
                ' style="--k:' + round2(k) + ';--icx:' + land.cx + ';--icy:' + land.cy + '">' +
      '<span class="islet__wake"></span>' +
      '<span class="islet__splash"></span>' +
      '<img class="islet__img" src="assets/images/' + encodeURI(art(land.img)) + '" alt="" />' +
    '</div>';
  }

  function isletsHTML() {
    var out = [];
    for (var i = 0; i < ISLETS; i++) {
      var shape = ISLET_SHAPES[i % ISLET_SHAPES.length];
      var area = ISLET_AREA[0] + Math.random() * (ISLET_AREA[1] - ISLET_AREA[0]);
      out.push(isletHTML(shape, boxFor(area, LAND[shape])));
    }
    return out.join('');
  }

  /* Strew a screen's islets over its sea, clear of the sites and of
     each other. Rejection sampling, like the pads' own scatter: a
     spot is drawn, measured against the exclusions and against
     every islet already placed, and kept only if it is clear. */
  function strewIslets(round) {
    var cam = round.el.cam;
    var W = cam.clientWidth || 1;
    var H = cam.clientHeight || 1;
    var sea = seaOf(round);
    var placed = [];

    function clear(x, y, rx, ry) {
      var i, e, o;
      for (i = 0; i < sea.exclude.length; i++) {
        e = sea.exclude[i];
        if (x + rx > e.l && x - rx < e.r && y + ry > e.t && y - ry < e.b) return false;
      }
      for (i = 0; i < placed.length; i++) {
        o = placed[i];
        if (Math.abs(x - o.x) < rx + o.rx + 4 && Math.abs(y - o.y) < ry + o.ry + 4) return false;
      }
      return true;
    }

    round.islets.forEach(function (el) {
      var w = el.offsetWidth || 1;
      var rx = w / W * 100 / 2;
      var ry = w / H * 100 / 2;
      var t, x, y;

      for (t = 0; t < 80; t++) {
        x = sea.world.l + rx + Math.random() * (sea.world.r - sea.world.l - 2 * rx);
        y = sea.world.t + ry + Math.random() * (sea.world.b - sea.world.t - 2 * ry);
        if (clear(x, y, rx, ry)) break;
      }
      if (t === 80) {
        /* nowhere clear: park it well off the visible sea */
        x = sea.world.l - 60; y = sea.world.t - 60;
      }

      el.style.setProperty('--wx', x.toFixed(2) + '%');
      el.style.setProperty('--wy', y.toFixed(2) + '%');
      placed.push({ x: x, y: y, rx: rx, ry: ry });
    });
  }


  /* ---------------------------------------------------------- markup */

  var BADGE =
    '<span class="topbar__badge" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24">' +
        '<path d="M12 2.2c2.7 2.8 4.1 6.3 4.1 9.8v3.4H7.9V12c0-3.5 1.4-7 4.1-9.8z" />' +
        '<path d="M7.9 12.4 5.1 15.3v3.4l2.8-2M16.1 12.4l2.8 2.9v3.4l-2.8-2" />' +
        '<path d="M10.2 15.8c0 2.2.7 4.1 1.8 5.4 1.1-1.3 1.8-3.2 1.8-5.4z" />' +
        '<circle cx="12" cy="9.2" r="1.7" />' +
      '</svg>' +
    '</span>';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* One island. `area` is null for a decoy: it never gets as far as
     the arithmetic, so it is never given a number to print. `name`
     is the gallery's label, printed under the land. */
  function padHTML(shape, o) {
    var land = LAND[shape];

    var vars = [
      '--k:' + round2(o.k),
      '--pcx:' + land.cx,
      '--pcy:' + land.cy,
      '--ax:' + land.label[0] + '%',
      '--ay:' + land.label[1] + '%',
      '--foot:' + (land.ext[3] * 100).toFixed(1) + '%',
      '--clip:' + land.clip
    ].join(';');

    var adj = T(land.adj);

    return '<div class="pad pad--' + o.slot + '" data-shape="' + shape + '"' +
                ' data-adj="' + land.adj + '"' +
                (o.area == null ? '' : ' data-area="' + o.area + '"') +
                ' style="' + vars + '">' +
      '<img class="pad__img" src="assets/images/' + encodeURI(art(land.img)) + '" alt="" />' +
      '<svg class="pad__fit" viewBox="0 0 100 100" aria-hidden="true">' +
        '<path d="' + land.outline + '" />' +
      '</svg>' +
      (o.area == null ? ''
        : '<p class="pad__area"><b>' + o.area + '</b><i>' + esc(T('padSqUnits')) + '</i></p>') +
      (o.name ? '<p class="pad__name">' + esc(T(o.name)) + '</p>' : '') +
      '<button class="pad__hit" type="button" tabindex="-1" aria-label="' +
        esc(T('padZone', { shape: adj })) + '"></button>' +
    '</div>';
  }

  /* the craft, from its CRAFT entry. .ship__cast and .ship__wash are
     not written here: js/water.js inserts them at the front of .ship,
     and css/failure.css animates the cast one as the landing
     shadow. .ship__dust is the touchdown puff, and .engine-flame is
     off unless the craft artwork has no exhaust painted on it -- see
     block 2 of css/failure.css. */
  function shipHTML(shape) {
    var craft = CRAFT[shape];
    return '<div class="ship">' +
      '<span class="ship__dust" aria-hidden="true"></span>' +
      '<div class="ship__craft">' +
        '<img class="ship__img" src="assets/images/' + encodeURI(art(craft.img)) +
             '" alt="' + esc(T(craft.alt)) + '" />' +
        '<span class="engine-flame" aria-hidden="true"></span>' +
        '<svg class="ship__dims" viewBox="-28 -6 132 132" aria-hidden="true">' +
          craft.dims() +
        '</svg>' +
      '</div>' +
    '</div>';
  }

  /* The landing's effect layers, one either side of the craft: the
     back one (z 3) holds the scorch mark the wreck lies on and half
     the spray, the front one (z 6) the rest. Between them sits the
     water overlay (z 5), which is painted OVER a sinking craft so it
     goes under something rather than fading out. All three are
     filled by js/failure.js -- and they live inside the site,
     because the points they are parked on are worked out in screen
     coordinates, and with the lens down on the site the site's box
     IS the screen's box. */
  function fxHTML() {
    return '<div class="fx-layer fx-layer--back" aria-hidden="true"></div>' +
           '<div class="water-depth-overlay" aria-hidden="true"></div>' +
           '<div class="fx-layer fx-layer--front" aria-hidden="true"></div>';
  }

  /* One site's islands, by what the site is for. Decoys first in
     the DOM, so they paint behind the row that carries the question. */
  function padsHTML(spec) {
    var out = [];
    var shape, land, kFit;

    if (spec.kind === 'gallery') {
      spec.shapes.forEach(function (s, i) {
        out.push(padHTML(s, {
          k: boxFor(FIT_AREA, LAND[s]),
          slot: 'row' + (i + 1),
          area: null,
          name: LAND[s].name
        }));
      });
      return out.join('');
    }

    shape = spec.shape;
    land = LAND[shape];
    kFit = boxFor(FIT_AREA, land);

    if (spec.kind === 'shape') {
      SHAPES[shape].decoyPool.forEach(function (s) {
        out.push(padHTML(s, { k: boxFor(FIT_AREA, LAND[s]), slot: 'far1', area: null }));
      });
      sizesA(shape).forEach(function (size, i) {
        out.push(padHTML(shape, {
          k: kFit * Math.sqrt(size / SHAPES[shape].area),
          slot: 'row' + (i + 1),
          area: null
        }));
      });
      return out.join('');
    }

    /* landing: the three areas, printed */
    SHAPES[shape].row.forEach(function (size, i) {
      out.push(padHTML(shape, {
        k: kFit * Math.sqrt(size / SHAPES[shape].area),
        slot: 'row' + (i + 1),
        area: size
      }));
    });
    return out.join('');
  }

  /* One site: its frame, placed in the plate by --site-x/--site-y
     (see .site in css/style.css), and -- on a landing site -- the
     craft's box figures, set on the site rather than the screen so
     that three crafts of three shapes can stand on one sea. */
  function siteHTML(spec) {
    var vars = ['--site-x:' + spec.at.x + '%', '--site-y:' + spec.at.y + '%'];
    var ship = '';

    if (spec.kind === 'landing') {
      var land = LAND[spec.shape];
      var craft = CRAFT[spec.shape];
      var kFit = boxFor(FIT_AREA, land);
      var fit = Math.sqrt(land.fill / craft.fill);
      vars.push('--ship-k:' + round2(kFit * fit), '--scx:' + craft.cx, '--scy:' + craft.cy);
      ship = shipHTML(spec.shape);
    }

    return '<div class="site site--' + spec.kind + '" data-site="' + spec.key + '"' +
                ' style="' + vars.join(';') + '">' +
      ship +
      '<div class="pads">' + padsHTML(spec) + '</div>' +
      (spec.kind === 'landing' ? fxHTML() : '') +
    '</div>';
  }

  /* everything inside the camera plate: the islets, then the sites */
  function camHTML(round) {
    return '<div class="islets" aria-hidden="true">' + isletsHTML() + '</div>' +
      round.sites.map(siteHTML).join('');
  }

  /* Everything a screen shares between its sites and its lens */
  var CHROME =
    '<div class="aerial" aria-hidden="true"></div>' +
    '<div class="fix" aria-hidden="true">' +
      '<div class="fix__box">' +
        '<span class="fix__ring"></span>' +
        '<i class="fix__c fix__c--tl"></i><i class="fix__c fix__c--tr"></i>' +
        '<i class="fix__c fix__c--bl"></i><i class="fix__c fix__c--br"></i>' +
      '</div>' +
    '</div>' +
    '<div class="alt" aria-hidden="true">' +
      '<span class="alt__track"><i class="alt__mark"></i></span>' +
      '<span class="alt__read">' +
        '<span class="alt__row"><b class="alt__num">4200</b><i class="alt__unit"></i></span>' +
        '<em class="alt__state"></em>' +
      '</span>' +
    '</div>';

  function sectionHTML(round) {
    return '<section class="screen screen--round' +
                   (round.kind === 'landing' ? ' screen--landing' : '') + '"' +
                   (round.shape ? ' data-shape="' + round.shape + '"' : '') + '>' +

      '<div class="layer layer--bg s3-bg" aria-hidden="true"></div>' +

      /* the camera plate: the islets, the sites, and the wave
         fronts js/water.js mounts in here. See .cam in css/style.css */
      '<div class="cam">' + camHTML(round) + '</div>' +

      CHROME +

      '<div class="confetti" aria-hidden="true"></div>' +

      '<div class="hud">' +
        '<p class="hud__caption" role="status" aria-live="polite"></p>' +
        '<p class="hud__tally" role="status" aria-live="polite"></p>' +
      '</div>' +

      '<header class="topbar">' +
        '<div class="topbar__frame">' + BADGE +
          '<p class="topbar__text" role="status" aria-live="polite"></p>' +
        '</div>' +
      '</header>' +

      '<div class="advance">' +
        '<button class="advance__btn" type="button" hidden>' +
          '<span class="advance__label">' + esc(T('btnNext')) + '</span>' +
          '<svg class="advance__arrow" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="m9 5 7 7-7 7" /></svg>' +
        '</button>' +
      '</div>' +

    '</section>';
  }


  /* ---------------------------------------------------------- wiring

     One site, as the flow plays it: the shape's figures, this
     site's node, offset and islands, and the fall arithmetic
     js/failure.js runs on. `el.all` is every island it carries,
     hidden ones included; `el.padList` the ones in play, set by
     arrangeSite(). */
  function siteOf(round, node, spec) {
    var all = Array.prototype.slice.call(node.querySelectorAll('.pad'));
    var shape = spec.shape || null;
    var fig = shape ? SHAPES[shape] : null;
    var land = shape ? LAND[shape] : null;
    var craft = shape ? CRAFT[shape] : null;

    return {
      key: spec.key,
      kind: spec.kind,
      node: node,
      offset: spec.at,
      shape: shape,
      area: fig ? fig.area : null,
      areaKey: fig ? fig.areaKey : null,
      copy: fig ? fig.copy : null,
      decoyPool: fig ? fig.decoyPool : [],
      selectKey: spec.selectKey || null,
      matchKey: spec.matchKey || null,
      recallKey: spec.recallKey || null,
      geo: (land && craft) ? {
        shipCX: craft.cx, shipCY: craft.cy,
        padCX: land.cx, padCY: land.cy,
        fit: Math.sqrt(land.fill / craft.fill)
      } : null,
      el: {
        pads: node.querySelector('.pads'),
        all: all,
        padList: all.slice(),
        ship: node.querySelector('.ship'),
        shipCraft: node.querySelector('.ship__craft'),
        shipDims: node.querySelector('.ship__dims')
      }
    };
  }

  /* Look a built screen up into the object the flow plays: its
     sites, its islets, its lens and every piece of chrome. The
     survey's screen is written in index.html and the others are
     built by sectionHTML(); both come through here, so a class, not
     an id, is how everything is found. */
  function wireScreen(node, round) {
    round.node = node;

    round.sites = round.sites.map(function (spec) {
      return siteOf(round, node.querySelector('.site[data-site="' + spec.key + '"]'), spec);
    });
    round.islets = Array.prototype.slice.call(node.querySelectorAll('.islet'));

    /* the point the lens holds over at survey height: the middle of
       the sites */
    var cx = 0, cy = 0;
    round.sites.forEach(function (s) { cx += s.offset.x + 50; cy += s.offset.y + 50; });
    round.world = { x: cx / round.sites.length, y: cy / round.sites.length };

    round.el = {
      cam: node.querySelector('.cam'),
      bg: node.querySelector('.layer--bg'),
      aerial: node.querySelector('.aerial'),
      fix: node.querySelector('.fix'),
      alt: node.querySelector('.alt'),
      altNum: node.querySelector('.alt__num'),
      altUnit: node.querySelector('.alt__unit'),
      altState: node.querySelector('.alt__state'),
      confetti: node.querySelector('.confetti'),
      hud: node.querySelector('.hud'),
      caption: node.querySelector('.hud__caption'),
      tally: node.querySelector('.hud__tally'),
      topbar: node.querySelector('.topbar'),
      topbarText: node.querySelector('.topbar__text'),
      advance: node.querySelector('.advance__btn'),
      /* the survey's opening only */
      blackout: node.querySelector('.blackout'),
      scanner: node.querySelector('.scanner'),
      bezel: node.querySelector('.drone-hud')
    };

    if (round.el.altUnit) round.el.altUnit.textContent = T('altUnit');

    /* the frame-level chrome every site shares -- the helpers reach
       it through the site, as they reach a site's own */
    round.sites.forEach(function (site) {
      site.screen = round;
      site.el.confetti = round.el.confetti;
      site.el.hud = round.el.hud;
      site.el.caption = round.el.caption;
      site.el.tally = round.el.tally;
      site.el.topbar = round.el.topbar;
      site.el.topbarText = round.el.topbarText;
      site.el.advance = round.el.advance;
    });

    return round;
  }

  /* The survey: its screen is in index.html with its camera plate
     empty; this fills it and wires it. Called at boot, before
     js/water.js dresses the stage, so every island built here gets
     its shoreline with the rest. */
  function buildSurvey(screen) {
    if (!screen) return null;
    var cam = screen.querySelector('.cam');
    if (!cam) return null;

    cam.innerHTML = camHTML(SURVEY);
    return wireScreen(screen, SURVEY);
  }

  /* Show two of a shape site's decoys and hide the rest, and hand the
     pair the slots the site's layout wants them on -- the far rank,
     which is the scatter's fallback. Sets padList to the islands in
     play, decoys first. A site built without decoys (a landing
     site) comes out as its three islands of the shape; the gallery
     keeps every island it has, in the row it was built in. */
  function arrangeSite(site, pair, slots) {
    var tris = [], shown = [];

    if (site.kind === 'gallery') {
      site.el.padList = site.el.all.slice();
      return site.el.padList;
    }

    site.el.all.forEach(function (pad) {
      var shape = pad.dataset.shape;
      if (shape === site.shape) { tris.push(pad); return; }
      var on = pair.indexOf(shape) >= 0;
      pad.hidden = !on;
      if (on) shown.push(pad);
    });

    /* in the order the pair was drawn, so the slot deal is random
       with respect to the shape */
    shown.sort(function (p, q) {
      return pair.indexOf(p.dataset.shape) - pair.indexOf(q.dataset.shape);
    });
    site.el.all.forEach(function (pad) {
      ['pad--far1', 'pad--far2'].forEach(function (c) { pad.classList.remove(c); });
    });
    shown.forEach(function (pad, i) { if (slots[i]) pad.classList.add(slots[i]); });

    site.el.padList = shown.concat(tris);
    return site.el.padList;
  }

  /* Two different decoys, drawn at random */
  function drawPair(pool) {
    var a = shuffled(pool);
    return [a[0], a[1]];
  }


  /* ---------------------------------------------------------- build
     Called once, at load, from boot() in js/script.js — so the
     islands and the craft on every built screen are in
     `document.images` before the start gate counts what it has to
     wait for. Returns the landing screen, the quadrilateral survey
     and the quadrilateral landing, each wired (wireScreen): there
     are no ids on these screens; the flow is handed the screen it
     is playing anyway. */
  function build(stage, before) {
    if (!stage) return [];

    var screens = [LANDING, SURVEY_QUAD, LANDING_QUAD];

    return screens.map(function (round) {
      var host = doc.createElement('div');
      host.innerHTML = sectionHTML(round);

      var node = host.firstChild;
      stage.insertBefore(node, before || null);

      return wireScreen(node, round);
    });
  }

  global.GeoPages = {
    build: build, buildSurvey: buildSurvey,
    scatter: scatter, dealRow: dealRow,
    arrangeSite: arrangeSite, drawPair: drawPair, strewIslets: strewIslets,
    land: LAND
  };
})(window);

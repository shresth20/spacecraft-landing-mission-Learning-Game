/* Generated from the learning module's swiftee.manifest.json -- do not
 * hand-edit. The manifest is the single source of truth for frame counts
 * and grids; the sheets themselves live in assets/images/swiftee/ (the
 * 1x set: on the board the bird never stands taller than its 256px cell).
 */
window.SWIFTEE = {
  fps: 20,
  cell: 256,
  baseline: 0.877,
  idle: "blinking",
  /* clip -> sheet image and its uniform grid */
  clips: {
    blinking:          { img: "assets/images/swiftee/swiftee_blinking@1x.webp", frames: 40, cols: 7, rows: 6 },
    celebrate_start:   { img: "assets/images/swiftee/swiftee_celebrate_start@1x.webp", frames:  8, cols: 3, rows: 3 },
    celebrate_stop:    { img: "assets/images/swiftee/swiftee_celebrate_stop@1x.webp", frames: 10, cols: 4, rows: 3 },
    celebrating:       { img: "assets/images/swiftee/swiftee_celebrating@1x.webp", frames: 50, cols: 8, rows: 7 },
    confused:          { img: "assets/images/swiftee/swiftee_confused@1x.webp", frames: 40, cols: 7, rows: 6 },
    confused_start:    { img: "assets/images/swiftee/swiftee_confused_start@1x.webp", frames:  7, cols: 3, rows: 3 },
    confused_stop:     { img: "assets/images/swiftee/swiftee_confused_stop@1x.webp", frames:  7, cols: 3, rows: 3 },
    happy:             { img: "assets/images/swiftee/swiftee_happy@1x.webp", frames: 40, cols: 7, rows: 6 },
    happy_start:       { img: "assets/images/swiftee/swiftee_happy_start@1x.webp", frames:  7, cols: 3, rows: 3 },
    happy_stop:        { img: "assets/images/swiftee/swiftee_happy_stop@1x.webp", frames:  7, cols: 3, rows: 3 },
    proud:             { img: "assets/images/swiftee/swiftee_proud@1x.webp", frames: 40, cols: 7, rows: 6 },
    proud_start:       { img: "assets/images/swiftee/swiftee_proud_start@1x.webp", frames:  7, cols: 3, rows: 3 },
    proud_stop:        { img: "assets/images/swiftee/swiftee_proud_stop@1x.webp", frames:  7, cols: 3, rows: 3 },
    puzzle_start:      { img: "assets/images/swiftee/swiftee_puzzle_start@1x.webp", frames:  7, cols: 3, rows: 3 },
    puzzle_stop:       { img: "assets/images/swiftee/swiftee_puzzle_stop@1x.webp", frames:  7, cols: 3, rows: 3 },
    puzzleing:         { img: "assets/images/swiftee/swiftee_puzzleing@1x.webp", frames: 37, cols: 7, rows: 6 },
    talk_start:        { img: "assets/images/swiftee/swiftee_talk_start@1x.webp", frames:  3, cols: 2, rows: 2 },
    talk_stop:         { img: "assets/images/swiftee/swiftee_talk_stop@1x.webp", frames:  5, cols: 3, rows: 2 },
    talking:           { img: "assets/images/swiftee/swiftee_talking@1x.webp", frames:  8, cols: 3, rows: 3 },
    wave_start:        { img: "assets/images/swiftee/swiftee_wave_start@1x.webp", frames:  7, cols: 3, rows: 3 },
    wave_stop:         { img: "assets/images/swiftee/swiftee_wave_stop@1x.webp", frames:  8, cols: 3, rows: 3 },
    waving:            { img: "assets/images/swiftee/swiftee_waving@1x.webp", frames: 30, cols: 6, rows: 5 },
  },
  /* expression -> the start / loop / stop triad the animator drew */
  states: {
    waving:        { start: "wave_start",      loop: "waving",      stop: "wave_stop"        },
    talking:       { start: "talk_start",      loop: "talking",     stop: "talk_stop"        },
    happy:         { start: "happy_start",     loop: "happy",       stop: "happy_stop"       },
    confused:      { start: "confused_start",  loop: "confused",    stop: "confused_stop"    },
    puzzleing:     { start: "puzzle_start",    loop: "puzzleing",   stop: "puzzle_stop"      },
    celebrating:   { start: "celebrate_start", loop: "celebrating", stop: "celebrate_stop"   },
    proud:         { start: "proud_start",     loop: "proud",       stop: "proud_stop"       },
  }
};

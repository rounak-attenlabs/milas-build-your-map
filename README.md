# Build your map (greybox)

MILA'S two-minute "Build your map" experience, built on The Pudding's open-source story engine from [the-pudding/ivf](https://github.com/the-pudding/ivf) (MIT). Forked 25 November 2026 by Atten Labs.

What is The Pudding's: the engine (beats sheet, path markers, SVG viewBox camera, sprite along a path, scenery actions, reduced-motion handling). What is ours: every picture, the words, the branching, the ending. The Pudding's illustrations, fonts and logos were removed; the grey world and figure in `src/svg` and `static/assets/sprites` are placeholders drawn by script for layout only.

## Run

```bash
npm install
npm run dev
```

## Where things are

- `src/data/story.json`, the words. Each beat has text, options (label, next beat, the answer it records) and a screen-reader description.
- `src/data/beats.csv`, the choreography. For each beat: walk or pose, from which marker to which, which scenery prop to show.
- `src/svg/world.svg`, the world, with an invisible path (`.mom-path`) and named marker circles (`.markers .mom circle.NAME`). The illustrator draws into this file and keeps the markers.
- `src/svg/world-foreground.svg`, props that appear on cue (`<g class="NAME">`), listed in `src/utils/scenery.js`.
- `static/assets/sprites/mom.png` and `src/data/sprites.json`, the character sheet (5 columns of 200 by 400 frames) and which frame is which pose or walk cycle.
- `src/utils/nextStops.js`, how answers become her three next stops. Placeholder logic.
- `src/components/Ending.svelte`, the result, phone number and consent. Nothing is stored in the greybox.

## Not done

Storage of sign-ups, tracking, languages, real content from Ann, real illustration.

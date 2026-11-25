# Build your map

MILA'S two-minute "Build your map" experience, built on The Pudding's open-source story engine from [the-pudding/ivf](https://github.com/the-pudding/ivf) (MIT). Forked 25 November 2026 by Atten Labs.

What is The Pudding's: the engine (beats sheet, path markers, SVG viewBox camera, sprite along a path, scenery actions, reduced-motion handling). What is ours: every picture, the words, the branching, the ending. The Pudding's illustrations, fonts and logos were removed. The map is a loop road, home to home, that appears piece by piece as she answers: each answer places one named thing (land, the clinic, the hospital, a room tag, the insurance office, the people at home) and the road extends to it. At the end the camera pulls back and the whole loop is her map.

The world, the figures and the labels are built by script from two CC0 sources: Kenney's Sketch Town tiles (the town) and Open Peeps (the people), recoloured in MILA'S teal and cream. See `art-src/README.md` and the two scripts in `tools/`: `build-world.mjs` (land and building chunks as PNGs, labels and figures as vectors, the invisible path and markers, the list of scenery groups) and `build-sprites.mjs` (the mother's sprite sheet). Change the loop, the buildings or the labels in `build-world.mjs`, then run it.

How a stop works: each answer leads to its own beat in `src/data/story.json` (for example `hosp-stp`, `hosp-other`, `hosp-undecided`). In `src/data/beats.csv` that beat first reveals the land chunk, then walks her to the stop while its place appears (`scenery` column = a group name in `world.svg`). Variants of one stop share scenery, and the engine keeps anything a previous beat placed.

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

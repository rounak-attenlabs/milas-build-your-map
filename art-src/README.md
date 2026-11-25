# Art sources

- `sketchtown/`: the tiles used by `tools/build-world.mjs`, from Kenney's **Sketch Town** pack (https://kenney.nl/assets/sketch-town), licence CC0 1.0 (see `sketchtown/License.txt`). The full pack has 350 tiles; only the ones the map uses are kept here.
- `peeps/`: vector parts extracted from **Open Peeps** by Pablo Stanley (https://www.openpeeps.com, CC0 1.0), via the MIT-licensed `react-peeps` port by CeamKrier. Used by `tools/build-sprites.mjs` for the mother sprite sheet and by `tools/build-foreground.mjs` for the doctor and family figures.

Run the three scripts with `node tools/<script>.mjs` from this folder. They need Google Chrome installed (used headless through puppeteer-core) and write into `src/svg/` and `static/assets/`.

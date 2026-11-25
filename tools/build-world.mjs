// Builds the Build-your-map world: a loop road, home to home, that appears piece by piece as she answers.
// Tiles: Kenney Sketch Town (CC0). People: Open Peeps (CC0) via tools/peep.mjs.
// Writes static/assets/world/*.png (land and building chunks), src/svg/world.svg (chunks, labels,
// figures, the invisible path and markers) and src/data/scenery-ids.json. Run: node tools/build-world.mjs
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { peep, brand } from "./peep.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TILES = path.join(ROOT, "art-src/sketchtown");
const OUT = path.join(ROOT, "static/assets/world");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Geometry (measured from the tile images)
const SVG_W = 2755, SVG_H = 6854;
const HW = 116, HH = 55, ANCHOR_X = 128, ANCHOR_Y = 184, STACK = 108, ROOF_Y = 282;
const IMG_W = 256, IMG_H = 352;
const OX = SVG_W / 2, OY = 0;
const BG = "#f4efe6", TEAL = "#0d4e4d", CORAL = "#dd725a", CREAM = "#fff8f0", LEAF = "#5f8f3a";
const xy = (c, r) => ({ x: OX + (c - r) * HW, y: OY + (c + r) * HH });
const key = (c, r) => `${c},${r}`;

// ---- The loop: S at the top, then down-right (A), down-left (B), up-left (C), up-right (D)
const N = 6, c0 = 14, r0 = 14;
const route = [];
for (let i = 0; i <= N; i++) route.push({ c: c0 + i, r: r0 });            // A: S .. R
for (let i = 1; i <= N; i++) route.push({ c: c0 + N, r: r0 + i });        // B: .. bottom
for (let i = 1; i <= N; i++) route.push({ c: c0 + N - i, r: r0 + N });    // C: .. L
for (let i = 1; i < N; i++) route.push({ c: c0, r: r0 + N - i });         // D: .. one before S
const routeIndex = new Map(route.map((p, i) => [key(p.c, p.r), i]));
const S = route[0];
const stops = {
	"hidden-enter": S, start: S,
	clinic: { c: c0 + 3, r: r0 },
	hospital: { c: c0 + N, r: r0 + 3 },
	office: { c: c0 + 3, r: r0 + N },
	"home-end": { c: c0, r: r0 + 1 }
};
const side = (i) => (i <= N ? "a" : i <= 2 * N ? "b" : i <= 3 * N ? "c" : "d");

// Path tile from the edges a route cell connects to (the loop closes at S)
const edgesFor = (i) => {
	const p = route[i], prev = route[(i - 1 + route.length) % route.length], next = route[(i + 1) % route.length];
	const edge = (q) => (q.c < p.c ? "TL" : q.c > p.c ? "BR" : q.r < p.r ? "TR" : "BL");
	return new Set([edge(prev), edge(next)]);
};
const pathTile = (e) => ({
	"BR+TL": "grass_path_N", "BL+TR": "grass_path_E",
	"BL+TL": "grass_pathBend_E", "BL+BR": "grass_pathBend_N", "TL+TR": "grass_pathBend_S", "BR+TR": "grass_pathBend_W"
})[[...e].sort().join("+")] || "grass_path_N";

// ---- Which cells belong to which chunk of land
const land = { base: new Set(), a: new Set(), b: new Set(), c: new Set(), d: new Set() };
const owner = new Map();
const claim = (chunk, cc, rr) => { const k = key(cc, rr); if (owner.has(k)) return; owner.set(k, chunk); land[chunk].add(k); };
const ring = (chunk, cc, rr) => { for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) claim(chunk, cc + dc, rr + dr); };
const HOME = { c: c0, r: r0 - 1 };
ring("base", S.c, S.r); ring("base", HOME.c, HOME.r);
route.forEach((p, i) => { if (i > 0) ring(side(i), p.c, p.r); });
// buildings' own cells and the cells in front of them
const CLINIC = { c: c0 + 3, r: r0 - 1 };
const HOSPITAL = [[c0 + 4, r0 + 3], [c0 + 5, r0 + 3], [c0 + 4, r0 + 4], [c0 + 5, r0 + 4]];
const OFFICE = { c: c0 + 3, r: r0 + 5 };
HOSPITAL.forEach(([cc, rr]) => ring("b", cc, rr));
// the middle of the loop fills in on the way back
for (let cc = c0 + 1; cc < c0 + N; cc++) for (let rr = r0 + 1; rr < r0 + N; rr++) claim("c", cc, rr);

// ---- Decoration (behind the road only, never in front of it)
const deco = new Map();
[[c0 - 1, r0 - 1, "tree_multiple_E"], [c0 + 1, r0 - 1, "tree_single_E"], [c0 + 5, r0 - 1, "tree_single_E"], [c0 + 7, r0 + 1, "rocks_grass_E"],
 [c0 + 7, r0 + 5, "rocks_grass_E"], [c0 + 1, r0 + 7, "rocks_grass_E"], [c0 + 5, r0 + 7, "rocks_grass_E"], [c0 - 1, r0 + 2, "tree_single_E"],
 [c0 - 1, r0 + 5, "tree_multiple_E"], [c0 + 2, r0 + 5, "tree_single_E"], [c0 + 1, r0 + 2, "tree_single_E"], [c0 + 6, r0 - 1, "tree_single_E"]
].forEach(([cc, rr, t]) => deco.set(key(cc, rr), t));

// ---- Placements: one list of positioned tile images per chunk, in depth order
const groundTile = (cc, rr) => { const i = routeIndex.get(key(cc, rr)); return i === undefined ? "grass_center_E" : pathTile(edgesFor(i)); };
const cellsOf = (set) => [...set].map((k) => k.split(",").map(Number)).sort((p, q) => p[1] - q[1] || p[0] - q[0]);
const place = (list, tile, cc, rr, lift = 0, roof = false) => { const { x, y } = xy(cc, rr); list.push({ tile, x: x - ANCHOR_X, y: y - (roof ? ROOF_Y : ANCHOR_Y) - lift }); };
const chunks = {};
for (const name of ["base", "a", "b", "c", "d"]) {
	const list = [];
	for (const [cc, rr] of cellsOf(land[name])) {
		place(list, groundTile(cc, rr), cc, rr);
		if (deco.has(key(cc, rr))) place(list, deco.get(key(cc, rr)), cc, rr);
	}
	chunks[name === "base" ? "home-land" : `land-${name}`] = list;
}
// A building chunk: its blocks, then the ground in front of it drawn again so it sits in the ground properly
const building = (name, cells, levelsOf, roof) => {
	const list = [];
	const front = new Set();
	const sorted = [...cells].sort((p, q) => p[1] - q[1] || p[0] - q[0]);
	for (const [cc, rr] of sorted) {
		levelsOf(cc, rr).forEach((tile, l) => place(list, tile, cc, rr, STACK * (l + 1)));
		if (roof) place(list, roof, cc, rr, STACK * levelsOf(cc, rr).length, true);
		[[cc + 1, rr], [cc, rr + 1], [cc + 1, rr + 1]].forEach(([fc, fr]) => { if (!cells.some(([a, b]) => a === fc && b === fr) && owner.has(key(fc, fr))) front.add(key(fc, fr)); });
	}
	for (const [cc, rr] of cellsOf(front)) { place(list, groundTile(cc, rr), cc, rr); if (deco.has(key(cc, rr))) place(list, deco.get(key(cc, rr)), cc, rr); }
	chunks[name] = list;
};
building("home", [[HOME.c, HOME.r]], () => ["building_door_E"], "roof_pointBrown_E");
building("clinic", [[CLINIC.c, CLINIC.r]], () => ["building_doorWindows_E"], "roof_pointGreen_E");
building("hospital", HOSPITAL, (cc, rr) => [cc === c0 + 5 && rr === r0 + 3 ? "building_doorWindows_S" : "building_windows_E"]);
building("office", [[OFFICE.c, OFFICE.r]], () => ["building_door_E", "building_window_E"]);

// ---- Render every chunk to a transparent PNG cropped to its content
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
fs.mkdirSync(OUT, { recursive: true });
const tmp = path.join(ROOT, "art-src/.chunk.html");
const boxes = {};
for (const [name, list] of Object.entries(chunks)) {
	const x0 = Math.min(...list.map((p) => p.x)), y0 = Math.min(...list.map((p) => p.y));
	const x1 = Math.max(...list.map((p) => p.x)) + IMG_W, y1 = Math.max(...list.map((p) => p.y)) + IMG_H;
	boxes[name] = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
	const html = `<!doctype html><body style="margin:0;background:transparent;overflow:hidden;position:relative;width:${x1 - x0}px;height:${y1 - y0}px">` +
		list.map((p) => `<img src="${pathToFileURL(path.join(TILES, p.tile + ".png")).href}" style="position:absolute;width:${IMG_W}px;height:${IMG_H}px;left:${p.x - x0}px;top:${p.y - y0}px">`).join("") + "</body>";
	fs.writeFileSync(tmp, html);
	await page.setViewport({ width: x1 - x0, height: y1 - y0, deviceScaleFactor: 1 });
	await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
	await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
	await page.screenshot({ path: path.join(OUT, `${name}.png`), omitBackground: true });
}
await browser.close();
fs.unlinkSync(tmp);
for (const f of fs.readdirSync(OUT)) if (!chunks[f.replace(/\.png$/, "")]) fs.unlinkSync(path.join(OUT, f));

// ---- Vector bits: labels, signs, figures
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const FONT = `font-family="Nunito, Arial, sans-serif" font-weight="800"`;
const pill = (x, y, text, { size = 30, fill = CREAM, color = TEAL, tail = true } = {}) => {
	const w = Math.round(text.length * size * 0.58 + 44), h = size + 26;
	return `<g class="label"><rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${TEAL}" stroke-width="3"/>` +
		(tail ? `<path d="M${x - 10} ${y - 1}l10 14 10-14z" fill="${fill}" stroke="${TEAL}" stroke-width="3" stroke-linejoin="round"/><rect x="${x - 11}" y="${y - 4}" width="22" height="4" fill="${fill}"/>` : "") +
		`<text x="${x}" y="${y - h / 2 + size * 0.36}" text-anchor="middle" ${FONT} font-size="${size}" fill="${color}">${esc(text)}</text></g>`;
};
const figure = (x, y, height, opts) => { const s = height / 2980; return `<g class="figure"><g transform="translate(${x - 425 * s} ${y - 2980 * s}) scale(${s})">${peep(opts)}</g></g>`; };
const img = (name) => { const b = boxes[name]; return `<image href="/assets/world/${name}.png" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/>`; };
const top = (cc, rr, levels = 1, roof = 0) => { const p = xy(cc, rr); return { x: p.x, y: p.y - STACK * levels - roof }; };
const docColours = { ...brand, extra: { "#8FA7DF": "#9fc6c3", "#9FD8E5": CORAL, "#FFFFFF": "#ffffff" } };

const Sp = xy(S.c, S.r);
const home = xy(HOME.c, HOME.r), clinic = xy(CLINIC.c, CLINIC.r), office = xy(OFFICE.c, OFFICE.r);
const hospFront = xy(c0 + 5, r0 + 3), hospCentre = xy(c0 + 4.5, r0 + 3.5);
const centre = xy(c0 - 2, r0 + 3); // the stamp sits on the paper beside the map
const FIG = 190;

const groups = {
	// always visible
	"home-land": img("home-land"),
	home: img("home") + pill(home.x, top(HOME.c, HOME.r, 1, 130).y, "Home"),
	// appear as she answers
	"land-a": img("land-a"),
	clinic: img("clinic") + pill(clinic.x, top(CLINIC.c, CLINIC.r, 1, 130).y, "Your doctor"),
	"doctor-yes": figure(clinic.x + 110, clinic.y + 100, FIG, { body: "pose/DocStethoscope", hair: "hair/ShortCurly", face: "face/Smile", colours: docColours }),
	"doctor-no": pill(clinic.x - 40, clinic.y - 60, "?", { size: 40, fill: CORAL, color: CREAM }),
	"land-b": img("land-b"),
	"hospital-stp": img("hospital") + pill(hospCentre.x, top(c0 + 4.5, r0 + 3.5, 1, 80).y, "St. Philomena’s"),
	"hospital-other": img("hospital") + pill(hospCentre.x, top(c0 + 4.5, r0 + 3.5, 1, 80).y, "Your hospital"),
	"hospital-undecided": `<path d="M${hospCentre.x} ${hospCentre.y - 2 * HH}l${2 * HW} ${2 * HH}l${-2 * HW} ${2 * HH}l${-2 * HW} ${-2 * HH}z" fill="rgba(255,248,240,.55)" stroke="${TEAL}" stroke-width="5" stroke-dasharray="14 12" stroke-linejoin="round"/>` + pill(hospCentre.x, hospCentre.y - 70, "Hospital · not decided", { size: 26 }),
	"room-general": pill(hospFront.x - 150, hospFront.y + 10, "General ward", { size: 26, tail: false }),
	"room-single": pill(hospFront.x - 150, hospFront.y + 10, "Single AC room", { size: 26, tail: false }),
	"room-deluxe": pill(hospFront.x - 150, hospFront.y + 10, "Deluxe room", { size: 26, tail: false }),
	"land-c": img("land-c"),
	"ins-yes": img("office") + pill(office.x, top(OFFICE.c, OFFICE.r, 2, 60).y, "Insurance · covered", { fill: "#dff1e3" }),
	"ins-no": img("office") + pill(office.x, top(OFFICE.c, OFFICE.r, 2, 60).y, "Insurance · not covered", { fill: "#fbe0d8" }),
	"ins-unsure": img("office") + pill(office.x, top(OFFICE.c, OFFICE.r, 2, 60).y, "Insurance · to check", { fill: "#fff2cc" }),
	"land-d": img("land-d"),
	"fam-partner": figure(Sp.x + 80, Sp.y + 10, FIG, { body: "pose/ShirtPantsBW", hair: "hair/Short", face: "face/Smile", colours: brand }),
	"fam-mother": figure(Sp.x + 80, Sp.y + 10, FIG * 0.92, { body: "pose/RestingBW", hair: "hair/GrayBun", face: "face/OldAged", colours: brand }),
	"fam-both": figure(Sp.x + 60, Sp.y + 20, FIG, { body: "pose/ShirtPantsBW", hair: "hair/Short", face: "face/Smile", colours: brand }) +
		figure(Sp.x + 180, Sp.y - 40, FIG * 0.92, { body: "pose/RestingBW", hair: "hair/GrayBun", face: "face/OldAged", colours: brand }),
	"fam-solo": pill(Sp.x + 90, Sp.y - 30, "Mila walks with you", { size: 26 }),
	needle: `<g class="needle-sign"><g transform="translate(${centre.x} ${centre.y})"><ellipse rx="150" ry="75" fill="${CREAM}" stroke="${TEAL}" stroke-width="5"/><ellipse rx="122" ry="61" fill="none" stroke="${TEAL}" stroke-width="2" stroke-dasharray="3 10"/><path d="M0 -52l20 52-20 52-20-52z" fill="${CORAL}" stroke="${TEAL}" stroke-width="3"/><path d="M0 52l-20-52h40z" fill="${TEAL}"/><circle r="8" fill="${CREAM}" stroke="${TEAL}" stroke-width="3"/><text y="110" text-anchor="middle" ${FONT} font-size="30" fill="${TEAL}" letter-spacing="4">YOUR MAP</text></g></g>`
};
const sceneryIds = Object.keys(groups).filter((k) => !["home-land", "home"].includes(k));

// ---- world.svg
const pts = route.map((p) => xy(p.c, p.r));
const d = pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
const markers = Object.entries(stops).map(([n, p]) => { const q = xy(p.c, p.r); return `<circle cx="${q.x}" cy="${q.y}" r="12.5" fill="#2FF275" class="${n}"/>`; }).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}" fill="none" viewBox="0 0 ${SVG_W} ${SVG_H}">
<g class="world"><g class="Background">
<rect width="${SVG_W}" height="${SVG_H}" fill="${BG}"/>
<defs><pattern id="paper" width="58" height="58" patternUnits="userSpaceOnUse"><circle cx="29" cy="29" r="2.2" fill="${TEAL}" fill-opacity=".10"/></pattern></defs>
<rect width="${SVG_W}" height="${SVG_H}" fill="url(#paper)"/>
</g>
<g class="Places">
${Object.entries(groups).map(([id, inner]) => `<g class="${id}">${inner}</g>`).join("\n")}
</g>
<g class="mom-path"><path stroke="#2FF275" stroke-width="5" stroke-opacity="0" d="${d}"/></g>
<g class="baby-path"><path stroke="#2FF275" stroke-width="5" stroke-opacity="0" d="${d}"/></g>
<g class="markers"><g class="mom">${markers}</g><g class="baby"></g></g>
</g></svg>
`;
fs.writeFileSync(path.join(ROOT, "src/svg/world.svg"), svg);
fs.writeFileSync(path.join(ROOT, "src/svg/world-foreground.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}" viewBox="0 0 ${SVG_W} ${SVG_H}"><g class="world"><g class="Foreground"></g></g></svg>\n`);
fs.writeFileSync(path.join(ROOT, "src/data/scenery-ids.json"), JSON.stringify(sceneryIds, null, 1) + "\n");
// The map's extent, for the pull-back at the end
const all = Object.values(boxes);
const extent = { x: Math.min(...all.map((b) => b.x)), y: Math.min(...all.map((b) => b.y)) - 90, x2: Math.max(...all.map((b) => b.x + b.w)), y2: Math.max(...all.map((b) => b.y + b.h)) - 60 };
fs.writeFileSync(path.join(ROOT, "src/data/map-extent.json"), JSON.stringify({ x: extent.x, y: extent.y, w: extent.x2 - extent.x, h: extent.y2 - extent.y }) + "\n");
console.log("world ok:", Object.keys(chunks).length, "chunks,", sceneryIds.length, "scenery groups; extent", JSON.stringify(extent));

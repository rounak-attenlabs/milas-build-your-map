// Builds the Build-your-map world from Kenney Sketch Town tiles (CC0).
// Writes static/assets/world/terrain.webp (the picture) and src/svg/world.svg
// (the invisible path and markers the engine reads, plus the picture as an <image>).
// Run: node tools/build-world.mjs
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TILES = path.join(ROOT, "art-src/sketchtown");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// World and tile geometry (measured from the tile images)
const SVG_W = 2755, SVG_H = 6854;
const HW = 116, HH = 55;            // half width / half height of a tile's top face
const ANCHOR_X = 128, ANCHOR_Y = 184; // centre of the top face inside a 256x352 tile image
const STACK = 108;                   // how much a block raises what sits on it
const ROOF_Y = 282;                  // where a roof image's base sits
const OX = SVG_W / 2, OY = 0;
const BG = "#f4efe6";

const xy = (c, r) => ({ x: OX + (c - r) * HW, y: OY + (c + r) * HH });
const key = (c, r) => `${c},${r}`;

// ---- The route: a zigzag down the map. +c runs down-right, +r runs down-left.
const SEG = 6;
let c = 7, r = 10; // k = c + r = 17, j = c - r = -3
const route = [{ c, r }];
let dir = "c";
while (c + r < 112) {
	for (let i = 0; i < SEG && c + r < 112; i++) {
		if (dir === "c") c++; else r++;
		route.push({ c, r });
	}
	dir = dir === "c" ? "r" : "c";
}
const routeAt = (k) => route.find((p) => p.c + p.r === k);
const routeIndex = new Map(route.map((p, i) => [key(p.c, p.r), i]));

// Which edges of a route cell carry the path
const edgesFor = (i) => {
	const p = route[i], prev = route[i - 1], next = route[i + 1];
	const e = new Set();
	if (prev) e.add(prev.c < p.c ? "TL" : "TR");
	if (next) e.add(next.c > p.c ? "BR" : "BL");
	return e;
};
const pathTile = (e) => {
	const s = [...e].sort().join("+");
	return {
		"BR+TL": "grass_path_N", "BL+TR": "grass_path_E",
		"BL+TL": "grass_pathBend_E", "BL+BR": "grass_pathBend_N", "TL+TR": "grass_pathBend_S", "BR+TR": "grass_pathBend_W",
		"BL": "grass_pathEnd_E", "BR": "grass_pathEnd_N", "TL": "grass_pathEnd_S", "TR": "grass_pathEnd_W"
	}[s] || "grass_path_N";
};

// ---- Stops (k = c + r) and the markers the engine needs, in path order
const stops = {
	"hidden-enter": 17, start: 19, stage: 21, weeks: 27, trying: 32, doctor: 38, hospital: 44, room: 50,
	insurance: 62, feeding: 74, family: 80, "end-1": 92, "end-2": 98, end: 110
};

// ---- Scene objects. "behind" a route cell is the side away from the camera.
const objects = new Map(); // key -> { levels: [tile...], roof, deco }
const put = (cc, rr, o) => objects.set(key(cc, rr), { ...(objects.get(key(cc, rr)) || {}), ...o });
const behind = (k, d = 0) => { const p = routeAt(k); const i = routeIndex.get(key(p.c, p.r)); const nx = route[i + 1] || route[i - 1]; const alongC = (route[i + 1] ? nx.c > p.c : p.c > nx.c); return alongC ? { c: p.c, r: p.r - 1 - d, door: "E" } : { c: p.c - 1 - d, r: p.r, door: "S" }; };

// Home
{ const b = behind(19); put(b.c, b.r, { levels: [`building_door_${b.door}`], roof: "roof_pointBrown_E" }); put(b.c - 1, b.r, { deco: "tree_single_E" }); put(b.c, b.r - 1, { deco: "tree_multiple_E" }); }
// Clinic
{ const b = behind(38); put(b.c, b.r, { levels: [`building_doorWindows_${b.door}`], roof: "roof_pointGreen_E" }); put(b.c, b.r - 1, { deco: "tree_single_E" }); }
// Hospital: 2 x 2 footprint, two storeys, flat top
{ const b = behind(44); const cells = [[b.c, b.r], [b.c + 1, b.r], [b.c, b.r - 1], [b.c + 1, b.r - 1]];
	cells.forEach(([cc, rr], i) => put(cc, rr, { levels: [i === 0 ? `building_doorWindows_${b.door}` : "building_windows_E", "building_windows_E"] }));
	put(b.c - 1, b.r, { deco: "tree_single_E" }); put(b.c + 2, b.r - 1, { deco: "tree_single_E" }); }
// Insurance office: two storeys
{ const b = behind(62); put(b.c, b.r, { levels: [`building_door_${b.door}`, "building_window_E"] }); put(b.c, b.r - 1, { deco: "rocks_grass_E" }); }
// Feeding: a little park
{ const b = behind(74); put(b.c, b.r, { deco: "tree_multiple_E" }); put(b.c - 1, b.r, { deco: "tree_single_E" }); put(b.c, b.r - 1, { deco: "structure_arch_E" }); }
// Family: home again
{ const b = behind(80); put(b.c, b.r, { levels: [`building_door_${b.door}`], roof: "roof_pointBeige_E" }); put(b.c + 1, b.r - 1, { deco: "tree_single_E" }); put(b.c - 1, b.r, { deco: "tree_multiple_E" }); }
// End: a gateway
{ const b = behind(110); put(b.c, b.r, { deco: "structure_arch_E" }); const b2 = behind(110, 1); put(b2.c, b2.r, { deco: "tree_multiple_E" }); }

// River crossing the +c segment between "weeks" and "trying": runs along +r through one route cell
const riverC = routeAt(30).c, riverR = routeAt(30).r;

// Trees and rocks elsewhere, with a clear margin around the path
let seed = 7;
const rnd = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
const nearRoute = (cc, rr) => { for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) if (routeIndex.has(key(cc + dc, rr + dr))) return true; return false; };

// ---- Compose
const cells = [];
for (let k = -6; k <= 132; k++) for (let j = -15; j <= 15; j++) {
	if ((k + j) % 2 !== 0) continue;
	cells.push({ c: (k + j) / 2, r: (k - j) / 2 });
}
cells.sort((a, b) => a.r - b.r || a.c - b.c);

const img = (tile, x, y) => `<img src="${pathToFileURL(path.join(TILES, tile + ".png")).href}" style="position:absolute;width:256px;height:352px;left:${x}px;top:${y}px">`;
let html = "";
for (const { c: cc, r: rr } of cells) {
	const { x, y } = xy(cc, rr);
	const ri = routeIndex.get(key(cc, rr));
	let ground = "grass_center_E";
	if (ri !== undefined) ground = pathTile(edgesFor(ri));
	if (cc === riverC) ground = rr === riverR ? "grass_riverBridge_E" : "grass_river_E";
	html += img(ground, x - ANCHOR_X, y - ANCHOR_Y);
	let o = objects.get(key(cc, rr));
	if (!o && ri === undefined && cc !== riverC && !nearRoute(cc, rr)) {
		const t = rnd();
		if (t < 0.07) o = { deco: "tree_single_E" }; else if (t < 0.10) o = { deco: "tree_multiple_E" }; else if (t < 0.115) o = { deco: "rocks_grass_E" };
	}
	if (!o) continue;
	(o.levels || []).forEach((tile, l) => (html += img(tile, x - ANCHOR_X, y - ANCHOR_Y - STACK * (l + 1))));
	if (o.roof) html += img(o.roof, x - ANCHOR_X, y - ROOF_Y - STACK * (o.levels || []).length);
	if (o.deco) html += img(o.deco, x - ANCHOR_X, y - ANCHOR_Y);
}
const page_html = `<!doctype html><body style="margin:0;background:${BG};width:${SVG_W}px;height:${SVG_H}px;overflow:hidden;position:relative">${html}</body>`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: SVG_W, height: SVG_H, deviceScaleFactor: 1 });
const tmp = path.join(ROOT, "art-src/.world-build.html");
fs.writeFileSync(tmp, page_html);
await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
fs.mkdirSync(path.join(ROOT, "static/assets/world"), { recursive: true });
await page.screenshot({ path: path.join(ROOT, "static/assets/world/terrain.webp"), type: "webp", quality: 82 });
await page.setViewport({ width: SVG_W, height: SVG_H, deviceScaleFactor: 0.25 });
await page.screenshot({ path: process.env.PREVIEW || "/tmp/terrain-preview.png", type: "png" });
await browser.close();
fs.unlinkSync(tmp);

// ---- world.svg: picture + invisible path + markers
const pts = route.map(({ c: cc, r: rr }) => xy(cc, rr));
const d = pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
const markers = Object.entries(stops).map(([name, k]) => { const p = xy(routeAt(k).c, routeAt(k).r); return `<circle cx="${p.x}" cy="${p.y}" r="12.5" fill="#2FF275" class="${name}"/>`; }).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}" fill="none" viewBox="0 0 ${SVG_W} ${SVG_H}">
<g class="world"><g class="Background">
<rect width="${SVG_W}" height="${SVG_H}" fill="${BG}"/>
<image href="/assets/world/terrain.webp" x="0" y="0" width="${SVG_W}" height="${SVG_H}"/>
</g>
<g class="mom-path"><path stroke="#2FF275" stroke-width="5" stroke-opacity="0" d="${d}"/></g>
<g class="baby-path"><path stroke="#2FF275" stroke-width="5" stroke-opacity="0" d="${d}"/></g>
<g class="markers"><g class="mom">${markers}</g><g class="baby"></g></g>
</g></svg>
`;
fs.writeFileSync(path.join(ROOT, "src/svg/world.svg"), svg);
// Hand the stop positions to the other build scripts
const stopXY = Object.fromEntries(Object.entries(stops).map(([n, k]) => { const p = routeAt(k); const b = behind(k); return [n, { ...xy(p.c, p.r), behind: xy(b.c, b.r), cell: p }]; }));
fs.writeFileSync(path.join(ROOT, "art-src/stops.json"), JSON.stringify(stopXY, null, 1));
console.log("world ok:", route.length, "route cells,", cells.length, "tiles; terrain", (fs.statSync(path.join(ROOT, "static/assets/world/terrain.webp")).size / 1024).toFixed(0), "KB");

// Renders the mother's sprite sheet from Open Peeps parts: static/assets/sprites/mom.png + src/data/sprites.json.
// Frames are 200 x 400 (drawn at 2x), five per row, feet on a shared baseline.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { peep, svg, brand } from "./peep.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FW = 200, FH = 400, COLS = 5, DPR = 2, BASE = 388;
const HAIR = "hair/Bun";

// A swaddled baby held at the chest (coral wrap, cream face), in peep coordinates
const bundle = `<g transform="translate(440 1150) rotate(-28)"><ellipse rx="300" ry="190" fill="#dd725a"/><ellipse rx="300" ry="190" fill="none" stroke="${brand.stroke}" stroke-width="12"/><path d="M-300 0 q 150 -90 300 0" stroke="${brand.stroke}" stroke-width="10" fill="none" opacity=".35"/><circle cx="-130" cy="-20" r="105" fill="${brand.background}" stroke="${brand.stroke}" stroke-width="12"/><circle cx="-160" cy="-36" r="9" fill="${brand.stroke}"/><circle cx="-104" cy="-36" r="9" fill="${brand.stroke}"/><path d="M-152 10q22 20 44 0" stroke="${brand.stroke}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-200 -90 q 60 -60 140 -30" stroke="${brand.stroke}" stroke-width="12" fill="none" stroke-linecap="round"/></g>`;

const F = (body, face, o = {}) => ({ body, face, ...o });
const frames = [
	F("pose/WalkingBW", "face/Smile", { cycle: "walk" }),                 // 0
	F("pose/RestingBW", "face/Smile", { pose: "standing" }),              // 1
	F("pose/WalkingBW", "face/Smile", { cycle: "walk", bob: true }),      // 2
	F("pose/WalkingBW", "face/Concerned", { cycle: "walk-worried" }),     // 3
	F("pose/CrossedArmsBW", "face/Concerned", { pose: "worried" }),       // 4
	F("pose/WalkingBW", "face/Concerned", { cycle: "walk-worried", bob: true }), // 5
	F("pose/WalkingBW", "face/Cheeky", { cycle: "walk-relieved" }),       // 6
	F("pose/RestingBW", "face/Cheeky", { pose: "relieved" }),             // 7
	F("pose/WalkingBW", "face/Cheeky", { cycle: "walk-relieved", bob: true }), // 8
	F("pose/WalkingBW", "face/Smile", { cycle: "walk-baby", baby: true }), // 9
	F("pose/RestingBW", "face/LoveGrin", { pose: "baby", baby: true }),   // 10
	F("pose/WalkingBW", "face/Smile", { cycle: "walk-baby", baby: true, bob: true }), // 11
	F("pose/PointingFingerBW", "face/SmileBig", { pose: "hand-extended" }) // 12
];
const inner = frames.map((f) => peep({ body: f.body, hair: HAIR, face: f.face, colours: brand, extra: f.baby ? bundle : "" }));

const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage();
await page.setViewport({ width: FW * COLS, height: FH * Math.ceil(frames.length / COLS), deviceScaleFactor: DPR });
await page.goto("about:blank");
// measure
await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="4000" viewBox="-1000 -1000 4000 4000">${inner.map((g, i) => `<g id="f${i}">${g}</g>`).join("")}</svg>`);
const boxes = await page.evaluate((n) => Array.from({ length: n }, (_, i) => { const b = document.getElementById("f" + i).getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }), frames.length);
const maxW = Math.max(...boxes.map((b) => b.w)), maxH = Math.max(...boxes.map((b) => b.h));
const s = Math.min((FW - 10) / maxW, (BASE - 10) / maxH);
// compose: each figure centred in its frame, feet on the baseline (bobbing frames lifted a little)
const cells = frames.map((f, i) => {
	const b = boxes[i], col = i % COLS, row = Math.floor(i / COLS);
	const tx = col * FW + FW / 2 - (b.x + b.w / 2) * s;
	const ty = row * FH + BASE - (b.y + b.h) * s - (f.bob ? 10 : 0);
	return `<g transform="translate(${tx} ${ty}) scale(${s})${f.bob ? ` rotate(2 ${b.x + b.w / 2} ${b.y + b.h})` : ""}">${inner[i]}</g>`;
});
await page.setContent(`<body style="margin:0;background:transparent">${svg(cells.join(""), { w: FW * COLS, h: FH * Math.ceil(frames.length / COLS) })}</body>`);
fs.mkdirSync(path.join(ROOT, "static/assets/sprites"), { recursive: true });
await page.screenshot({ path: path.join(ROOT, "static/assets/sprites/mom.png"), omitBackground: true });
await browser.close();

const data = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/sprites.json"), "utf8"));
const mom = data.find((d) => d.id === "mom");
Object.assign(mom, { rows: Math.ceil(frames.length / COLS), cols: COLS, frameWidth: FW, frameHeight: FH, yOffset: +(BASE / FH).toFixed(3), scaleFactor: 0.7 });
mom.frames = frames.map((f, i) => ({ index: i, x: (i % COLS) * FW, y: Math.floor(i / COLS) * FH, ...(f.cycle ? { cycle: f.cycle } : { pose: f.pose }) }));
fs.writeFileSync(path.join(ROOT, "src/data/sprites.json"), JSON.stringify(data, null, 1) + "\n");
console.log("sprites ok: scale", s.toFixed(4), "figure", Math.round(maxW * s), "x", Math.round(maxH * s));

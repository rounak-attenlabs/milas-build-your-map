// Writes src/svg/world-foreground.svg: the props that appear at each stop (doctor, hospital pin,
// price tag, policy card, the family, the MILA'S needle). Positions come from art-src/stops.json
// (written by build-world.mjs). Figures are Open Peeps parts in the brand colours.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { peep, brand } from "./peep.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stops = JSON.parse(fs.readFileSync(path.join(ROOT, "art-src/stops.json"), "utf8"));
const TEAL = "#0d4e4d", CORAL = "#dd725a", CREAM = "#fff8f0", FONT = "font-family=\"Nunito, Arial, sans-serif\" font-weight=\"800\"";

// A standing peep is about 2980 units tall; place its feet at (x, y) with the given height in world px
const figure = (x, y, height, opts) => {
	const s = height / 2980;
	return `<g transform="translate(${x - 425 * s} ${y - 2980 * s}) scale(${s})">${peep(opts)}</g>`;
};
const docColours = { ...brand, extra: { "#8FA7DF": "#9fc6c3", "#9FD8E5": CORAL, "#FFFFFF": "#ffffff" } };

const pin = (x, y) => `<path d="M${x} ${y}c-34-42-52-68-52-94a52 52 0 0 1 104 0c0 26-18 52-52 94z" fill="${CORAL}" stroke="${TEAL}" stroke-width="4"/><circle cx="${x}" cy="${y - 94}" r="20" fill="${CREAM}"/><path d="M${x - 10} ${y - 94}h20M${x} ${y - 104}v20" stroke="${CORAL}" stroke-width="5" stroke-linecap="round"/>`;
const card = (x, y, w, h, title, lines) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${CREAM}" stroke="${TEAL}" stroke-width="4"/><text x="${x + 22}" y="${y + 44}" ${FONT} font-size="30" fill="${TEAL}">${title}</text>` + lines.map((l, i) => `<rect x="${x + 22}" y="${y + 66 + i * 30}" width="${l}" height="14" rx="7" fill="#9fc6c3"/>`).join("");
const needle = (x, y) => `<circle cx="${x}" cy="${y}" r="70" fill="${CREAM}" stroke="${TEAL}" stroke-width="5"/><circle cx="${x}" cy="${y}" r="56" fill="none" stroke="${TEAL}" stroke-width="2" stroke-dasharray="3 9"/><path d="M${x} ${y - 50}l16 50-16 50-16-50z" fill="${CORAL}" stroke="${TEAL}" stroke-width="3"/><path d="M${x} ${y - 50}l16 50h-32z" fill="${CORAL}"/><path d="M${x} ${y + 50}l-16-50h32z" fill="${TEAL}"/><circle cx="${x}" cy="${y}" r="7" fill="${CREAM}" stroke="${TEAL}" stroke-width="3"/>`;

const g = {};
{ const s = stops.doctor; g["doctor-pin"] = figure(s.x - 150, s.y + 30, 195, { body: "pose/DocStethoscope", hair: "hair/ShortCurly", face: "face/Smile", colours: docColours }); }
{ const s = stops.hospital; const top = s.behind.y - 216 - 70; g["hospital-pin"] = pin(s.behind.x + 116, top); }
{ const s = stops.room; const x = s.x - 330, y = s.y - 330; g["price-tag"] = `<rect x="${x}" y="${y}" width="300" height="84" rx="42" fill="${TEAL}"/><text x="${x + 150}" y="${y + 55}" text-anchor="middle" ${FONT} font-size="38" fill="${CREAM}">Room: ₹ / day</text><path d="M${x + 150} ${y + 84}l0 40" stroke="${TEAL}" stroke-width="6" stroke-linecap="round"/>`; }
{ const s = stops.insurance; g["policy-card"] = card(s.behind.x - 130, s.behind.y - 216 - 200, 260, 150, "Policy", [200, 140, 170]); }
{ const s = stops.family; g["family-heads"] = figure(s.x + 160, s.y + 40, 205, { body: "pose/ShirtPantsBW", hair: "hair/Short", face: "face/Smile", colours: brand }) + figure(s.x + 270, s.y - 10, 180, { body: "pose/RestingBW", hair: "hair/GrayBun", face: "face/OldAged", colours: brand }); }
{ const s = stops.end; g["end-needle"] = needle(s.behind.x, s.behind.y - 250); }

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2755" height="6854" fill="none" viewBox="0 0 2755 6854"><g class="world"><g class="Foreground">
${Object.entries(g).map(([id, inner]) => `<g class="${id}">${inner}</g>`).join("\n")}
</g></g></svg>
`;
fs.writeFileSync(path.join(ROOT, "src/svg/world-foreground.svg"), svg);
console.log("foreground ok:", Object.keys(g).join(", "), (svg.length / 1024).toFixed(0), "KB");

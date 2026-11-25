// Assembles an Open Peeps figure (pose or bust + hair + face) as an SVG fragment, the way react-peeps does.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const parts = JSON.parse(fs.readFileSync(path.join(ROOT, "art-src/peeps/parts.json"), "utf8"));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const paint = (v, colours) => (v === "stroke" ? colours.stroke : v === "background" ? colours.background : colours.extra?.[v] || v || "none");

export const piece = (name, colours) => {
	const p = parts[name];
	if (!p) throw new Error("no part " + name);
	const inner = p.paths
		.map((x) => `<path d="${esc(x.d)}"${x.transform ? ` transform="${x.transform}"` : ""} fill="${paint(x.fill, colours)}" stroke="${paint(x.stroke, colours)}"${x.fillRule ? ` fill-rule="${x.fillRule}"` : ""}${x.strokeWidth ? ` stroke-width="${x.strokeWidth}"` : ""}/>`)
		.join("");
	return p.outer ? `<g transform="${p.outer}">${inner}</g>` : `<g>${inner}</g>`;
};

// body: "pose/Name" or "bust/Name"; coordinates match react-peeps' 850 x 1200 viewBox
export const peep = ({ body, hair, face, colours, extra = "" }) =>
	`<g class="peep">${body ? piece(body, colours) : ""}` +
	`<g transform="translate(225 0)">${hair ? piece(hair, colours) : ""}<g transform="translate(159 186)">${face ? piece(face, colours) : ""}</g></g>${extra}</g>`;

export const svg = (inner, { w = 850, h = 1200, viewBox = `0 0 ${w} ${h}` } = {}) =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">${inner}</svg>`;

export const brand = { stroke: "#0d4e4d", background: "#ffe6d3", extra: { "#8FA7DF": "#9fc6c3", "#9FD8E5": "#dd725a", "#FFFFFF": "#ffffff" } };

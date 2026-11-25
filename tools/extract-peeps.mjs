// One-off: pulls the SVG paths out of the react-peeps TSX files into art-src/peeps/parts.json.
// Usage: node tools/extract-peeps.mjs <path to react-peeps/src/peeps>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.argv[2];
const want = {
	pose: ["WalkingBW", "WalkingWB", "RestingBW", "EasingBW", "PointingFingerBW", "ShirtPantsBW", "DocStethoscope", "Doc", "CrossedArmsBW"],
	bust: ["Dress", "Sweater", "Turtleneck", "PoloSweater", "ButtonShirt", "Explaining", "PointingUp"],
	hair: ["LongCurly", "BunCurly", "Bun", "Long", "MediumBangs", "ShortCurly", "Short", "GrayBun", "GrayShort", "DocBouffant", "Hijab", "Medium"],
	face: ["Smile", "SmileBig", "Calm", "Concerned", "Solemn", "Cheeky", "LoveGrin", "Awe", "Serious", "OldAged", "Explaining", "Driven"]
};
const dirs = { pose: "pose/standing", bust: "pose/bust", hair: "hair", face: "face" };
const out = {};
const attr = (s, name) => { const m = s.match(new RegExp(`\\b${name}=(?:'([^']*)'|"([^"]*)"|\\{([^}]*)\\})`)); return m ? (m[1] ?? m[2] ?? m[3]) : undefined; };
const colour = (v) => { if (v === undefined) return undefined; v = v.trim(); if (/^strokeColor/.test(v)) return "stroke"; if (/^backgroundColor/.test(v)) return "background"; return v.replace(/^'|'$/g, ""); };
for (const [group, names] of Object.entries(want)) {
	for (const name of names) {
		const file = path.join(SRC, dirs[group], name + ".tsx");
		if (!fs.existsSync(file)) { console.warn("missing", file); continue; }
		const src = fs.readFileSync(file, "utf8").replace(/\s+/g, " ");
		const body = src.slice(src.indexOf("return ("), src.lastIndexOf(")"));
		// outer group transform
		const outer = body.match(/^return \( <g transform='([^']+)'/)?.[1] || "";
		const paths = [...body.matchAll(/<path\b([^>]*)\/>/g)].map((m) => {
			const a = m[1];
			return {
				d: attr(a, "d"), transform: attr(a, "transform"), fill: colour(attr(a, "fill")), stroke: colour(attr(a, "stroke")),
				fillRule: attr(a, "fillRule"), strokeWidth: attr(a, "strokeWidth")
			};
		});
		out[`${group}/${name}`] = { outer, paths };
	}
}
fs.writeFileSync(path.join(ROOT, "art-src/peeps/parts.json"), JSON.stringify(out));
console.log(Object.keys(out).length, "parts;", Object.values(out).reduce((n, p) => n + p.paths.length, 0), "paths");

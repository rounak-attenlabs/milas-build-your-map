// Scenery groups live in src/svg/world.svg as <g class="NAME"> (land chunks, places, figures, labels).
// The list of names is written by tools/build-world.mjs. Every group supports "enter" and "reset".
import ids from "$data/scenery-ids.json";

const ease = "cubic-bezier(.2,.8,.2,1)";
const basic = {
	enter: (els) => {
		els.forEach((el) => {
			const parts = el.querySelectorAll(":scope > *");
			parts.forEach((p, i) => {
				p.style.transition = `opacity calc(var(--1s) * 0.5) calc(var(--1s) * ${0.1 + i * 0.18}) ease-out, transform calc(var(--1s) * 0.7) calc(var(--1s) * ${0.1 + i * 0.18}) ${ease}`;
				p.style.opacity = "1";
				p.style.transform = "translateY(0)";
			});
		});
	},
	reset: (els) => {
		els.forEach((el) => {
			el.querySelectorAll(":scope > *").forEach((p) => {
				p.style.transition = "none";
				p.style.opacity = "0";
				p.style.transform = "translateY(-40px)";
			});
		});
	}
};

export const scenery = Object.fromEntries(ids.map((id) => [id, basic]));

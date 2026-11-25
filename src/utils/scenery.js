// Scenery props live in src/svg/world-foreground.svg as <g class="NAME">.
// Every prop supports "enter" (fade in) and "reset" (hide). Add richer actions per prop if needed.
const ids = ["doctor-pin", "hospital-pin", "price-tag", "policy-card", "family-heads", "end-needle"];

const basic = {
	enter: (els) => {
		els.forEach((el, i) => {
			el.style.transition = `opacity calc(var(--1s) * 0.6) calc(var(--1s) * ${0.3 + i * 0.1}) ease-in-out, transform calc(var(--1s) * 0.6) calc(var(--1s) * ${0.3 + i * 0.1}) cubic-bezier(.2,.8,.2,1)`;
			el.style.opacity = "1";
			el.style.transform = "translateY(0)";
		});
	},
	reset: (els) => {
		els.forEach((el) => {
			el.style.transition = "none";
			el.style.opacity = "0";
			el.style.transform = "translateY(-24px)";
		});
	}
};

export const scenery = Object.fromEntries(ids.map((id) => [id, basic]));

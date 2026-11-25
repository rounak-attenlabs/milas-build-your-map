<script>
	import Side from "$components/Side.svelte";
	import worldSvg from "$svg/world.svg";
	import foregroundSvg from "$svg/world-foreground.svg";
	import maskSvg from "$svg/world-mask.svg";
	import overlaySvg from "$svg/world-overlay.svg";
	import beats from "$data/beats.csv";
	import extent from "$data/map-extent.json";
	import { Tween, prefersReducedMotion } from "svelte/motion";
	import { cubicInOut } from "svelte/easing";
	import { browser } from "$app/environment";

	let { route, beatI, direction, atTheEnd } = $props();

	const svgW = 2755;
	const svgH = 6854;
	const PAD = 110;

	let worldW = $state(0);
	let worldH = $state(0);
	let worldVisible = $state(false);
	let zoomOut = $state(false);

	let beatId = $derived(route[beatI]);
	let phone = $derived(worldW < 700);

	const spotFor = (id) => {
		if (!browser) return null;
		const steps = beats.filter((d) => d.id === id);
		const name = steps.length ? steps.at(-1).endSpot : "start";
		return document.querySelector(`.world .markers .mom circle.${name}`);
	};

	// The camera: a window on the map in map units. Its shape always matches the screen, so nothing letterboxes.
	const view = $derived.by(() => {
		const aspect = worldW && worldH ? worldW / worldH : 0.5;
		if (zoomOut) {
			// Pull back to the whole map. On phones the result sheet covers the lower half, so the map sits in the top half.
			const usable = phone ? 0.5 : 0.92;
			let w = extent.w + PAD * 2;
			let h = extent.h + PAD * 2;
			if (w / (h / usable) < aspect) w = (h / usable) * aspect;
			else h = (w / aspect) * usable;
			const H = h / usable;
			return { x: extent.x + extent.w / 2 - w / 2, y: extent.y + extent.h / 2 - h / 2 - (phone ? 0 : (H - h) / 2), w, h: H };
		}
		const zoom = phone ? 3.4 : 1.8;
		const w = svgW / zoom;
		const h = w / aspect;
		const el = spotFor(beatId);
		const cx = el ? el.cx.baseVal.value : svgW / 2;
		const cy = el ? el.cy.baseVal.value : 1540;
		// Phones: she stands in the upper third, the card sits below. Desktop: the card is on the left, she is right of centre.
		return { x: cx - w * (phone ? 0.5 : 0.62), y: cy - h * (phone ? 0.42 : 0.55), w, h };
	});

	const camera = new Tween({ x: svgW / 2 - 400, y: 1540 - 500, w: 800, h: 1600 }, { duration: 1800, easing: cubicInOut });
	let first = true;

	const updateCamera = () => {
		if (!worldW) return;
		const duration = prefersReducedMotion.current || first ? 0 : zoomOut ? 2600 : 1800;
		first = false;
		camera.set({ ...view }, { duration });
	};

	const animateViewbox = () => {
		document.querySelectorAll(".world svg, .mask svg, .overlay svg, .foreground svg").forEach((el) => {
			const { x, y, w, h } = camera.current;
			el.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
			if (!worldVisible && worldW) worldVisible = true;
		});
	};

	$effect(() => {
		zoomOut = false;
		if (!atTheEnd) return;
		const t = setTimeout(() => (zoomOut = true), 2200);
		return () => clearTimeout(t);
	});
	$effect(() => updateCamera(view));
	$effect(() => animateViewbox(camera.current));
</script>

<div class="world" class:visible={worldVisible} bind:clientHeight={worldH} bind:clientWidth={worldW}>
	{@html worldSvg}
	<div class="foreground">{@html foregroundSvg}</div>
	<div class="mask">{@html maskSvg}</div>
	<div class="overlay">{@html overlaySvg}</div>
	<Side id="mom" {beats} {route} {beatI} {direction} {camera} {worldW} {worldH} />
</div>

<style>
	.world {
		position: relative;
		height: 100%;
		opacity: 0;
		transition: opacity var(--1s) ease;
	}
	.world.visible {
		opacity: 1;
	}
	.foreground,
	.mask,
	.overlay {
		position: absolute;
		top: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.foreground {
		z-index: 3;
	}
	.mask,
	.overlay {
		z-index: 2;
	}
	:global(.world svg) {
		width: 100%;
		height: 100%;
	}
	:global(.world .mom-path, .world .baby-path, .world .markers) {
		opacity: 0;
	}
	:global(.world .Places .label text) {
		paint-order: stroke;
	}
</style>

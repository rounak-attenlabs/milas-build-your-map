<script>
	import Side from "$components/Side.svelte";
	import worldSvg from "$svg/world.svg";
	import foregroundSvg from "$svg/world-foreground.svg";
	import maskSvg from "$svg/world-mask.svg";
	import overlaySvg from "$svg/world-overlay.svg";
	import beats from "$data/beats.csv";
	import { Tween, prefersReducedMotion } from "svelte/motion";
	import { cubicInOut } from "svelte/easing";
	import { browser } from "$app/environment";

	let { route, beatI, direction, atTheEnd } = $props();

	const svgW = 2755;
	const svgH = 6854;
	const initialZoom = 2.25;

	let worldW = $state(0);
	let worldH = $state(0);
	let worldVisible = $state(false);
	let zoomOut = $state(false);

	let beatId = $derived(route[beatI]);
	// Zoom in a little more on narrow screens so the figure reads at phone size
	const zoom = $derived(beatI === 0 ? initialZoom : zoomOut ? 1.6 : worldW < 700 ? 3.2 : 4);
	const viewboxW = $derived(svgW / zoom);
	const viewboxH = $derived(svgH / zoom);

	const spotFor = (id) => {
		if (!browser) return null;
		const steps = beats.filter((d) => d.id === id);
		if (!steps.length) return null;
		return document.querySelector(`.world .markers .mom circle.${steps.at(-1).endSpot}`);
	};

	const viewboxX = $derived.by(() => {
		if (!browser || beatI === 0) return svgW / 2 - viewboxW / 2;
		const el = spotFor(beatId);
		if (!el) return svgW / 2 - viewboxW / 2;
		const cx = el.cx.baseVal.value;
		return Math.max(0, Math.min(svgW - viewboxW, cx - viewboxW / 2));
	});
	const viewboxY = $derived.by(() => {
		if (!browser || beatI === 0) return 0;
		const el = spotFor(beatId);
		if (!el) return 0;
		// Keep the figure in the upper third on phones, since the text sits at the bottom
		return Math.max(0, el.cy.baseVal.value - viewboxH * (worldW < 700 ? 0.3 : 0.45));
	});

	const camera = new Tween(
		{ x: svgW / 2 - svgW / (2 * initialZoom), y: 0, w: svgW / initialZoom, h: svgH / initialZoom },
		{ duration: prefersReducedMotion.current ? 0 : 1800, easing: cubicInOut }
	);

	const updateCamera = () => {
		camera.set({ x: viewboxX, y: viewboxY, w: viewboxW, h: viewboxH }, { duration: prefersReducedMotion.current ? 0 : zoomOut ? 3000 : 1800 });
	};

	const animateViewbox = () => {
		document.querySelectorAll(".world svg, .mask svg, .overlay svg, .foreground svg").forEach((el) => {
			const { x, y, w, h } = camera.current;
			el.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
			if (!worldVisible) worldVisible = true;
		});
	};

	$effect(() => {
		zoomOut = false;
		if (!atTheEnd) return;
		const t = setTimeout(() => (zoomOut = true), 6000);
		return () => clearTimeout(t);
	});
	$effect(() => updateCamera(beatI, zoomOut, worldW));
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
</style>

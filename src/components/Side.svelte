<script>
	import Sprite from "$components/Sprite.svelte";
	import { scenery } from "$utils/scenery.js";
	import { onMount } from "svelte";
	import _ from "lodash";

	let { id, beats, route, beatI, direction, camera, worldW, worldH, onArrive } = $props();

	const everyBeat = Object.entries(_.groupBy(beats, "id")).map(([id, steps]) => ({ id, steps }));
	const group = (beatId) => everyBeat.find((d) => d.id === beatId) ?? { id: beatId, steps: [] };

	// Beats she has walked, in route order, and the rest (whose scenery must stay hidden)
	let allBeats = $derived(route.map(group));
	let otherBeats = $derived(everyBeat.filter((d) => !route.includes(d.id)));

	const sceneryState = {};
	for (const step of beats) {
		if (step.scenery && step.sceneryAction) {
			sceneryState[step.scenery] ??= {};
			sceneryState[step.scenery][step.sceneryAction] ??= false;
		}
	}

	let spritePosition = $state("below");
	let pathEl = $state();
	let beatId = $derived(route[beatI]);
	let steps = $derived(
		direction === "backward" ? [beats.filter((d) => d.id === beatId).at(-1)].filter(Boolean) : beats.filter((d) => d.id === beatId)
	);

	onMount(() => {
		pathEl = document.querySelector(`.${id}-path path`);
		for (const sceneryId in scenery) {
			const els = document.querySelectorAll(`.world .${sceneryId}`);
			if (els.length) scenery[sceneryId].reset(els);
		}
	});
</script>

<div id={`side-${id}`} class="side active" class:above={spritePosition === "above"} class:below={spritePosition === "below"}>
	{#if pathEl && steps.length}
		<Sprite {id} {allBeats} {otherBeats} {beatId} {steps} {pathEl} bind:spritePosition {sceneryState} active={true} {camera} {worldW} {worldH} {onArrive} />
	{/if}
</div>

<style>
	.side {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	.side.below {
		z-index: 1;
	}
	.side.above {
		z-index: 3;
	}
</style>

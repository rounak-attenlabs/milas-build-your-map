<script>
	import { projectState } from "$runes/misc.svelte.js";
	import { onMount } from "svelte";
	import story from "$data/story.json";

	let { start, titleHeight = $bindable() } = $props();
	let visible = $state(true); // rendered visible from the first paint; the fade is only used on the way out

	const go = (option) => {
		visible = false;
		start(option);
	};

	onMount(() => (visible = true));
</script>

<div id="title" class:visible class:hidden={projectState.started} bind:clientHeight={titleHeight}>
	<p class="eyebrow">MILA’S · MAPS for parenthood</p>
	<h1>{story.hed}</h1>
	<p class="intro">{story.intro}</p>

	<div class="card" class:visible>
		<p class="question">{story.landing.question}</p>
		<div class="buttons">
			{#each story.landing.options as option}
				<button onclick={() => go(option)} tabindex={projectState.started ? -1 : 0}>{option.label}</button>
			{/each}
		</div>
		<p class="hint">About two minutes. Nothing is saved until you choose to send your map.</p>
	</div>
</div>

<style>
	#title {
		position: absolute;
		inset: 0;
		z-index: var(--z-top);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: calc(var(--header-height) + 1rem) 1.25rem 2rem;
		text-align: center;
		background: linear-gradient(180deg, rgba(244, 239, 230, 0.55), rgba(244, 239, 230, 0.92) 70%);
		opacity: 0;
		pointer-events: none;
		transition: opacity calc(var(--1s) * 0.6) ease-in-out;
	}
	#title.visible {
		opacity: 1;
		pointer-events: all;
	}
	#title.hidden {
		opacity: 0;
		pointer-events: none;
	}
	.eyebrow {
		font-size: var(--12px);
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--teal-6);
	}
	h1 {
		font-family: var(--serif);
		font-weight: 500;
		font-size: var(--56px);
		line-height: 1.05;
		color: var(--teal);
		max-width: 12ch;
	}
	.intro {
		max-width: 34ch;
		color: var(--muted);
		font-size: var(--18px);
		line-height: 1.5;
	}
	.card {
		width: min(100%, 420px);
		margin-top: 1rem;
		padding: 1.25rem;
		border-radius: 18px;
		background: #fff;
		box-shadow: 0 24px 48px -28px rgba(5, 35, 34, 0.45);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.question {
		font-family: var(--serif);
		font-size: var(--24px);
		color: var(--teal);
	}
	.buttons {
		display: grid;
		gap: 0.5rem;
	}
	button {
		text-transform: none;
		letter-spacing: 0;
		min-height: 3rem;
		border-radius: 999px;
		border: 1.5px solid rgba(13, 78, 77, 0.25);
		background: #fff;
		color: var(--teal);
		font-weight: 700;
		font-size: var(--16px);
		box-shadow: none;
		transition: background calc(var(--1s) * 0.2), border-color calc(var(--1s) * 0.2), transform calc(var(--1s) * 0.2);
	}
	button:hover {
		background: var(--teal-1);
		border-color: var(--teal);
		transform: translateY(-1px);
	}
	.hint {
		font-size: var(--12px);
		color: var(--muted);
	}
	@media (max-width: 600px) {
		h1 {
			font-size: var(--44px);
		}
		.intro {
			font-size: var(--16px);
		}
	}
</style>

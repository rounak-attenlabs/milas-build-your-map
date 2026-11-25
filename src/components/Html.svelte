<script>
	import { fly } from "svelte/transition";
	import { prefersReducedMotion } from "svelte/motion";
	import Ending from "$components/Ending.svelte";

	let { visible, beat, beatI, atTheEnd, answers, route = [], choose } = $props();

	const DELAY = 1600;
	let paragraphs = $derived(beat?.text ?? []);
	let options = $derived(beat?.options ?? []);
</script>

<div class="html-wrapper" class:visible>
	{#if atTheEnd}
		<Ending {answers} {route} />
	{:else}
		{#key beatI}
			<div class="copy">
				{#each paragraphs as paragraph, i (paragraph)}
					<p
						in:fly|local={{
							duration: prefersReducedMotion.current ? 0 : 250,
							delay: prefersReducedMotion.current ? 0 : DELAY + i * 250,
							y: 30
						}}
					>
						{@html paragraph}
					</p>
				{/each}
				<div
					class="options"
					in:fly|local={{
						duration: prefersReducedMotion.current ? 0 : 250,
						delay: prefersReducedMotion.current ? 0 : DELAY + paragraphs.length * 250,
						y: 30
					}}
				>
					{#each options as option}
						<button onclick={() => choose(option)} tabindex={visible ? 0 : -1}>{option.label}</button>
					{/each}
				</div>
			</div>
		{/key}
	{/if}
</div>

<style>
	.html-wrapper {
		position: absolute;
		z-index: 4;
		inset: 0;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 0 0.75rem 4.5rem;
		opacity: 0;
		pointer-events: none;
		transition: opacity calc(var(--1s) * 0.5) calc(var(--1s) * 1.2) ease-in-out;
	}
	.html-wrapper.visible {
		pointer-events: none;
		opacity: 1;
	}
	.copy {
		width: min(100%, 440px);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		pointer-events: all;
	}
	.copy p {
		background: rgba(255, 255, 255, 0.96);
		color: var(--ink);
		border-radius: 14px;
		padding: 0.85rem 1rem;
		font-size: var(--16px);
		line-height: 1.5;
		box-shadow: 0 12px 28px -18px rgba(5, 35, 34, 0.45);
	}
	:global(.copy p strong) {
		color: var(--teal);
	}
	.options {
		display: grid;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
	.options button {
		text-transform: none;
		letter-spacing: 0;
		min-height: 3rem;
		border-radius: 999px;
		border: 1.5px solid rgba(13, 78, 77, 0.25);
		background: #fff;
		color: var(--teal);
		font-weight: 700;
		font-size: var(--16px);
		text-align: left;
		padding: 0 1.1rem;
		box-shadow: 0 12px 28px -18px rgba(5, 35, 34, 0.35);
		transition: background calc(var(--1s) * 0.2), border-color calc(var(--1s) * 0.2);
	}
	.options button:hover {
		background: var(--teal-1);
		border-color: var(--teal);
	}
	@media (min-width: 900px) {
		.html-wrapper {
			align-items: center;
			justify-content: flex-start;
			padding-left: 6vw;
		}
	}
</style>

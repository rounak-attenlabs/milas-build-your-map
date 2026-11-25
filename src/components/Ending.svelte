<script>
	import { fly } from "svelte/transition";
	import { prefersReducedMotion } from "svelte/motion";
	import story from "$data/story.json";
	import nextStops from "$utils/nextStops.js";

	let { answers } = $props();
	let stops = $derived(nextStops(answers));
	let phone = $state("");
	let consent = $state(false);
	let sent = $state(false);
	let ok = $derived(consent && phone.replace(/\D/g, "").length >= 10);

	// Greybox: nothing is stored. The real build posts to the sign-up sheet from Ann's brief, then opens WhatsApp.
	const WHATSAPP = "https://wa.me/message/Q3WSWBPCOA5HO1";
	const send = () => {
		sent = true;
		window.open(WHATSAPP, "_blank", "noopener");
	};
	const share = async () => {
		const text = `My MILA’S map:\n${stops.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
		if (navigator.share) await navigator.share({ title: "My MILA’S map", text });
		else await navigator.clipboard?.writeText(text);
	};
</script>

<div class="ending" in:fly={{ duration: prefersReducedMotion.current ? 0 : 400, delay: prefersReducedMotion.current ? 0 : 2200, y: 40 }}>
	<p class="k">{story.ending.sub}</p>
	<h2>{story.ending.title}</h2>
	<ol>
		{#each stops as stop}
			<li>{stop}</li>
		{/each}
	</ol>

	{#if sent}
		<p class="after">{story.ending.after}</p>
		<button class="ghost" onclick={share}>Share my map</button>
	{:else}
		<label class="field">
			<span>Your phone number</span>
			<input type="tel" inputmode="tel" bind:value={phone} placeholder="98765 43210" autocomplete="tel" />
		</label>
		<label class="consent">
			<input type="checkbox" bind:checked={consent} />
			<span>{story.ending.consent}</span>
		</label>
		<button class="primary" disabled={!ok} onclick={send}>{story.ending.button}</button>
		<button class="ghost" onclick={share}>Share my map without sending a number</button>
	{/if}
</div>

<style>
	.ending {
		width: min(100%, 440px);
		pointer-events: all;
		background: #fff;
		border-radius: 18px;
		padding: 1.25rem;
		box-shadow: 0 24px 48px -28px rgba(5, 35, 34, 0.5);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.k {
		font-size: var(--12px);
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--teal-6);
	}
	h2 {
		font-family: var(--serif);
		font-weight: 500;
		font-size: var(--28px);
		color: var(--teal);
		line-height: 1.15;
	}
	ol {
		padding-left: 1.2rem;
		display: grid;
		gap: 0.4rem;
		color: var(--muted);
		font-size: var(--16px);
		line-height: 1.5;
	}
	.field {
		display: grid;
		gap: 0.3rem;
		font-size: var(--12px);
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--teal-6);
	}
	input[type="tel"] {
		width: 100%;
		min-height: 3rem;
		padding: 0 1rem;
		border-radius: 12px;
		border: 1.5px solid rgba(13, 78, 77, 0.3);
		font-size: var(--16px);
		background: #fff;
		color: var(--ink);
	}
	.consent {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
		font-size: var(--14px);
		color: var(--muted);
		line-height: 1.45;
	}
	.consent input {
		margin-top: 4px;
	}
	button {
		text-transform: none;
		letter-spacing: 0;
		min-height: 3rem;
		border-radius: 999px;
		font-weight: 800;
		font-size: var(--16px);
		box-shadow: none;
		border: 1.5px solid var(--teal);
	}
	.primary {
		background: var(--coral);
		border-color: var(--coral);
		color: var(--deep);
	}
	.primary:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.ghost {
		background: #fff;
		color: var(--teal);
	}
	.after {
		color: var(--muted);
		font-size: var(--14px);
		line-height: 1.5;
	}
</style>

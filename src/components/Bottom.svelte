<script>
	import chevronUpSvg from "$svg/chevron-up.svg";
	let { visible, beatI, prev, atTheEnd } = $props();
</script>

<div class="bottom" class:visible>
	<button class="nav" disabled={beatI <= 1} onclick={prev}>
		<span>{@html chevronUpSvg}</span>
		Back
	</button>
	<span class="counter">{atTheEnd ? "Your map" : `Stop ${beatI}`}</span>
	<span class="hint">{atTheEnd ? "" : "Tap an answer to continue"}</span>
</div>

<style>
	.bottom {
		display: none;
		align-items: center;
		gap: 1rem;
		height: 4rem;
		padding: 0 1rem;
		position: absolute;
		bottom: 0;
		z-index: 5;
		width: 100%;
		background: rgba(242, 248, 247, 0.92);
		border-top: 1px solid rgba(13, 78, 77, 0.14);
		font-size: var(--12px);
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--teal-6);
	}
	.bottom.visible {
		display: flex;
	}
	.nav {
		display: flex;
		align-items: center;
		gap: 4px;
		min-height: 2.5rem;
		padding: 0 0.9rem;
		border-radius: 999px;
		border: 1.5px solid rgba(13, 78, 77, 0.25);
		background: #fff;
		color: var(--teal);
		font-size: var(--14px);
		font-weight: 800;
		box-shadow: none;
		letter-spacing: 0;
		text-transform: none;
	}
	.nav:disabled {
		opacity: 0.4;
	}
	.nav span {
		width: 16px;
		height: 16px;
	}
	.hint {
		margin-left: auto;
		font-weight: 700;
		letter-spacing: 0;
		text-transform: none;
		color: var(--muted);
	}
</style>

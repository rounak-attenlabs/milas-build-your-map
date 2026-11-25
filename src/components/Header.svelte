<script>
	import { projectState } from "$runes/misc.svelte.js";
</script>

<header class:started={projectState.started}>
	<a class="wordmark" href="/" aria-label="MILA’S home">MILA’S</a>
	<a class="close" href="/" aria-label="Leave Build your map">×</a>
</header>

<style>
	header {
		position: fixed;
		top: 0;
		height: var(--header-height);
		width: 100%;
		z-index: 99;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.25rem;
		pointer-events: none;
	}
	.wordmark,
	.close {
		pointer-events: all;
		text-decoration: none;
		color: var(--teal);
	}
	.wordmark {
		font-family: var(--serif);
		font-weight: 600;
		font-size: var(--22px);
		letter-spacing: 0.02em;
	}
	.close {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		border: 1px solid rgba(13, 78, 77, 0.25);
		background: #fff;
		font-size: var(--20px);
		font-weight: 700;
	}
</style>

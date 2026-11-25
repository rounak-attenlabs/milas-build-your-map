<script>
	import { projectState } from "$runes/misc.svelte.js";
	import Title from "$components/Title.svelte";
	import Html from "$components/Html.svelte";
	import World from "$components/World.svelte";
	import Bottom from "$components/Bottom.svelte";
	import Footer from "$components/Footer.svelte";
	import story from "$data/story.json";
	import focusTrap from "$actions/focusTrap.js";

	// The route is the list of beat ids she has walked, in order. Her answers branch it.
	let route = $state(["start"]);
	let beatI = $state(0);
	let direction = $state("forward");
	let answers = $state({});
	let titleHeight = $state(0);
	let locked = $state(true);

	let beatId = $derived(route[beatI]);
	let beat = $derived(story.beats[beatId]);
	let atTheEnd = $derived(beatId === "end");
	let description = $derived(beat?.description);

	const choose = (option) => {
		if (option.key) answers[option.key] = option.value;
		direction = "forward";
		route = [...route.slice(0, beatI + 1), option.next];
		beatI += 1;
		document.querySelector(".main")?.scrollIntoView({ behavior: "instant", block: "end" });
	};

	const start = (option) => {
		projectState.started = true;
		choose(option);
	};

	const prev = () => {
		if (beatI <= 1) return;
		direction = "backward";
		beatI -= 1;
		locked = true;
		document.querySelector(".main")?.scrollIntoView({ behavior: "instant", block: "end" });
	};

	const onKeyDown = (e) => {
		if (!projectState.started) return;
		if (e.key === "ArrowUp") prev();
	};
</script>

<svelte:window on:keydown={onKeyDown} />

<article class:locked>
	<div class="main" use:focusTrap={locked}>
		<Title {start} bind:titleHeight />

		<figure class="story" class:started={projectState.started} style={`--title-height: ${titleHeight}px`}>
			<Html visible={projectState.started} {beat} {beatI} {atTheEnd} {answers} {route} {choose} />
			<World {route} {beatI} {direction} {atTheEnd} />
			<figcaption class="sr-only">{description}</figcaption>
		</figure>

		<Bottom visible={projectState.started} {beatI} {prev} {atTheEnd} label={beat?.place} />
	</div>

	<Footer />
</article>

<style>
	article {
		overflow: auto;
		height: 100svh;
	}
	article.locked {
		overflow: hidden;
	}
	.main {
		position: relative;
		overflow: hidden;
		height: 100svh;
	}
	.story {
		position: relative;
		overflow: hidden;
		width: 100%;
		height: 100svh;
		margin: 0 auto;
	}
</style>

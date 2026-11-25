<script>
	import { setContext } from "svelte";
	import Meta from "$components/Meta.svelte";
	import Index from "$components/Index.svelte";
	import story from "$data/story.json";

	let { data } = $props();
	const { title, description, url, keywords } = story.meta;
	setContext("copy", story);
	setContext("data", data);
</script>

<Meta {title} {description} {url} {keywords} preloadFont={[]} />
<Index />

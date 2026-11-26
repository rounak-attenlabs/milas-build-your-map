import adapterStatic from "@sveltejs/adapter-static";
import { sveltePreprocess } from "svelte-preprocess";
import autoprefixer from "autoprefixer";

const preprocess = sveltePreprocess({
	postcss: {
		plugins: [autoprefixer]
	}
});

const config = {
	compilerOptions: {
		runes: true
	},
	preprocess,
	kit: {
		// BASE_PATH lets the same build live under a sub-path (GitHub Pages) or at a root (Vercel)
		paths: { base: process.env.BASE_PATH || "" },
		adapter: adapterStatic({ strict: false })
	}
};

export default config;

<script lang="ts">
	import "./layout.css"
	import favicon from "$lib/assets/favicon.svg"
	import { env } from "$env/dynamic/public"
	import { setupConvex } from "convex-svelte"

	let { children } = $props()
	setupConvex(env.PUBLIC_CONVEX_URL)
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

<script lang="ts">
	import "./layout.css"
	import favicon from "$lib/assets/favicon.svg"
	import { createSvelteAuthClient } from "@mmailaender/convex-better-auth-svelte/svelte"
	import { authClient } from "$lib/auth-client"
	import { env } from "$env/dynamic/public"
	import { setupConvex } from "convex-svelte"

	let { children } = $props()
	createSvelteAuthClient({ authClient })
	setupConvex(env.PUBLIC_CONVEX_URL)
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

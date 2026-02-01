<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import './global.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Tesla Live Share</title>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
</svelte:head>

{@render children()}

<script lang="ts">
	import { page } from "$app/state"
	import { useConvexClient, useQuery } from "convex-svelte"
	import { api } from "$convex/api"
	import { onMount } from "svelte"
	import Time from "svelte-time/Time.svelte"

	const short = page.url.searchParams.get("s") || ""

	const client = useConvexClient()
	const carData = useQuery(api.public.getCarData, { short })

	onMount(() => {
		client.mutation(api.public.touchLink, { short })
		const interval = setInterval(() => {
			client.mutation(api.public.touchLink, { short })
		}, 10000)
		return () => clearInterval(interval)
	})
</script>

{#if carData.isLoading}
	Loading...
{:else if carData.error || !carData.data}
	Invalid or expired link.
{:else}
	<h2>Car Data</h2>
	<ul>
		<li>Timestamp: <Time relative live timestamp={carData.data.lastUpdate} /></li>
		<li>Car Name: {carData.data.carName}</li>
		<li>Latitude: {carData.data.latitude}</li>
		<li>Longitude: {carData.data.longitude}</li>
		<li>Heading: {carData.data.heading}</li>
		<li>Speed: {carData.data.speed} km/h</li>

		<li>Active Route Destination: {carData.data.activeRouteDestination}</li>
		<li>Active Route Latitude: {carData.data.activeRouteLatitude}</li>
		<li>Active Route Longitude: {carData.data.activeRouteLongitude}</li>
		<li>Active Route Distance to Destination: {carData.data.activeRouteMilesToArrival} m</li>
		<li>Active Route Time to Destination: {carData.data.activeRouteMinutesToArrival} min</li>
	</ul>
{/if}

<script lang="ts">
	import { page } from "$app/state"
	import { useConvexClient, useQuery } from "convex-svelte"
	import { api } from "$convex/api"
	import { onMount } from "svelte"
	import { Map, TileLayer, Marker, DivIcon } from "sveaflet"
	import * as L from "leaflet"
	import "leaflet/dist/leaflet.css"
	import { dev } from "$app/environment"
	import Time from "svelte-time/Time.svelte"
	import dayjs from "dayjs"

	const short = page.url.searchParams.get("s") || ""

	const client = useConvexClient()
	const carData = useQuery(api.public.getCarData, { short })

	let mapInstance: L.Map | undefined = $state(undefined)
	let userLocation: [number, number] | undefined = $state(undefined)

	const hasDestination = $derived(
		carData.data?.activeRouteLatitude !== undefined &&
			carData.data?.activeRouteLongitude !== undefined,
	)

	// Center map on vehicle, or fit bounds if destination exists
	$effect(() => {
		if (!mapInstance || !carData.data) return
		const carLatLng: [number, number] = [carData.data.latitude, carData.data.longitude]

		const boundsList = [carLatLng]
		if (userLocation) boundsList.push(userLocation)
		if (hasDestination) {
			boundsList.push([carData.data.activeRouteLatitude!, carData.data.activeRouteLongitude!])
		}

		if (boundsList.length > 1) {
			const bounds = L.latLngBounds(boundsList).pad(0.2) // Add some padding around the bounds
			mapInstance.fitBounds(bounds, { padding: [50, 50] })
		} else {
			mapInstance.setView(boundsList[0])
		}
	})

	onMount(() => {
		client.mutation(api.public.touchLink, { short })

		let locationWatchId: number | undefined = undefined
		if (typeof navigator !== "undefined" && "geolocation" in navigator) {
			locationWatchId = navigator.geolocation.watchPosition(
				(position) => {
					userLocation = [position.coords.latitude, position.coords.longitude]
				},
				() => {},
				{
					enableHighAccuracy: true,
					maximumAge: 30000,
					timeout: 10000,
				},
			)
		}

		const interval = setInterval(
			() => {
				client.mutation(api.public.touchLink, { short })
			},
			dev ? 300000 : 10000,
		)
		return () => {
			clearInterval(interval)
			if (locationWatchId !== undefined && "geolocation" in navigator) {
				navigator.geolocation.clearWatch(locationWatchId)
			}
		}
	})

	let head = $derived.by(() => {
		let text = "Tesla live share"
		if (carData.data) {
			text = `${carData.data.carName} - ${text}`
			if (carData.data.activeRouteLatitude !== undefined) {
				text = `ETA ${dayjs(carData.data.lastUpdate + carData.data.activeRouteMinutesToArrival! * 60000).format("HH:mm")} - ${text}`
			}
		}
		return text
	})
</script>

<svelte:head>
	<title>{head}</title>
	<link
		rel="stylesheet"
		href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
		integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
		crossorigin=""
	/>
</svelte:head>

{#if carData.isLoading}
	<div class="flex h-screen w-screen items-center justify-center bg-slate-900">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"
			></div>
			<p class="text-slate-400">Loading vehicle data...</p>
		</div>
	</div>
{:else if carData.error || !carData.data}
	<div class="flex h-screen w-screen items-center justify-center bg-slate-900">
		<div class="text-center">
			<p class="mb-2 text-3xl">🔗</p>
			<p class="text-xl font-semibold text-white">Invalid or expired link</p>
			<p class="text-slate-400">This share link is no longer valid.</p>
		</div>
	</div>
{:else}
	<div class="relative h-screen w-screen">
		<!-- Fullscreen Map -->
		<div class="absolute inset-0">
			<Map
				options={{
					center: [carData.data.latitude, carData.data.longitude],
					zoom: 14,
					zoomControl: false,
				}}
				bind:instance={mapInstance}
			>
				<TileLayer
					url={"https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
					options={{
						maxZoom: 19,
						attribution:
							'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
					}}
				/>

				<!-- Vehicle Marker (Red Triangle with heading) -->
				<Marker latLng={[carData.data.latitude, carData.data.longitude]}>
					<DivIcon
						options={{
							className: "vehicle-marker",
							iconSize: [30, 30],
							iconAnchor: [15, 15],
						}}
					>
						<div
							class="vehicle-triangle"
							style="transform: rotate({carData.data.heading}deg);"
						></div>
					</DivIcon>
				</Marker>

				{#if userLocation}
					<Marker latLng={userLocation}>
						<DivIcon
							options={{
								className: "user-marker",
								iconSize: [16, 16],
								iconAnchor: [8, 8],
							}}
						>
							<div class="user-dot"></div>
						</DivIcon>
					</Marker>
				{/if}

				<!-- Destination Marker (if active route) -->
				{#if hasDestination}
					<Marker latLng={[carData.data.activeRouteLatitude!, carData.data.activeRouteLongitude!]}>
						<DivIcon
							options={{
								className: "destination-marker",
								iconSize: [24, 36],
								iconAnchor: [12, 36],
							}}
						>
							<div class="destination-pin"></div>
						</DivIcon>
					</Marker>
				{/if}
			</Map>
		</div>

		<!-- Info Panel Overlay -->
		<div
			class="absolute top-4 left-4 z-[1000] max-w-xs rounded-lg bg-slate-900/90 p-4 text-sm text-white shadow-lg backdrop-blur"
		>
			<h2 class="mb-2 text-lg font-bold">{carData.data.carName}</h2>
			<div class="space-y-1 text-slate-300">
				<p>
					<span class="text-slate-400">Updated:</span>
					<Time relative live timestamp={carData.data.lastUpdate} />
				</p>
				<p>
					<span class="text-slate-400">State:</span>
					{carData.data.state}
				</p>
				<p>
					<span class="text-slate-400">Temp:</span>
					{carData.data.insideTemp}°C ({carData.data.outsideTemp}°C outside)
				</p>
				<p>
					<span class="text-slate-400">Battery:</span>
					{carData.data.batteryLevel}%
				</p>
				<p>
					<span class="text-slate-400">Speed:</span>
					{carData.data.speed} km/h
				</p>
				{#if hasDestination}
					<hr class="my-2 border-slate-700" />
					<p class="font-semibold text-white">
						{carData.data.activeRouteDestination}
					</p>
					<p>
						<span class="text-slate-400">Distance:</span>
						{Math.round((carData.data.activeRouteKilometersToArrival || 0) * 10) / 10} km
					</p>
					<p>
						<span class="text-slate-400">ETA:</span>
						<Time
							timestamp={carData.data.lastUpdate +
								(carData.data.activeRouteMinutesToArrival || 0) * 60000}
							format="HH:mm"
						/>,
						<Time
							timestamp={carData.data.lastUpdate +
								(carData.data.activeRouteMinutesToArrival || 0) * 60000}
							relative
						/>
					</p>
				{/if}
				{#if carData.data.hasUnlockRights}
					<p>
						{carData.data.locked ? "🔒 Vehicle is locked" : "🔓 Vehicle is unlocked"}
					</p>
					<button
						onclick={async () => {
							await client.mutation(api.public.carAction, {
								short,
								action: carData.data!.locked ? "unlock" : "lock",
							})
							await client.mutation(api.public.touchLink, { short })
						}}
						class="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white shadow transition-colors hover:bg-blue-700"
					>
						{carData.data.locked ? "Unlock" : "Lock"} Vehicle
					</button>
				{/if}
				{#if carData.data.hasStartRights && !carData.data.locked}
					<button
						onclick={async () => {
							await client.mutation(api.public.carAction, {
								short,
								action: "remote_start",
							})
							await client.mutation(api.public.touchLink, { short })
						}}
						class="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white shadow transition-colors hover:bg-blue-700"
					>
						Remote Start Vehicle
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.vehicle-marker) {
		background: transparent !important;
		border: none !important;
	}

	:global(.vehicle-triangle) {
		width: 0;
		height: 0;
		border-left: 12px solid transparent;
		border-right: 12px solid transparent;
		border-bottom: 24px solid #dc2626;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
		margin-left: 3px;
		margin-top: 3px;
	}

	:global(.destination-marker) {
		background: transparent !important;
		border: none !important;
	}

	:global(.destination-pin) {
		width: 24px;
		height: 24px;
		background: #3b82f6;
		border-radius: 50% 50% 50% 0;
		transform: rotate(-45deg);
		border: 3px solid white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
	}

	:global(.user-marker) {
		background: transparent !important;
		border: none !important;
	}

	:global(.user-dot) {
		width: 16px;
		height: 16px;
		background: #22c55e;
		border: 2px solid white;
		border-radius: 9999px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
	}
</style>

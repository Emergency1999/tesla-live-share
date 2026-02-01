<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { convexClient } from '$lib/convex';
	import { api } from '../../../convex/_generated/api';

	// Get the link short from the URL
	const linkShort: string = $page.params.link ?? '';

	// State
	let carData = $state<{
		vin: string;
		carName: string;
		lastUpdate: number;
		gpsLatitude?: number;
		gpsLongitude?: number;
		gpsHeading?: number;
		speed?: number;
		activeRouteDestination?: string;
		activeRouteLatitude?: number;
		activeRouteLongitude?: number;
		activeRouteMilesToArrival?: number;
		activeRouteMinutesToArrival?: number;
	} | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let map: L.Map | null = null;
	let carMarker: L.Marker | null = null;
	let destMarker: L.Marker | null = null;
	let routeLine: L.Polyline | null = null;
	let unsubscribe: (() => void) | undefined;

	onMount(async () => {
		if (!browser || !linkShort) return;

		// Subscribe to car data updates
		unsubscribe = convexClient.onUpdate(
			api.carData.getCarData,
			{ linkShort },
			(result) => {
				if (result === null) {
					error = 'Link not found or expired';
					isLoading = false;
				} else {
					carData = result;
					isLoading = false;
					updateMap();
				}
			}
		);

		// Trigger an access to update last viewed and potentially refresh data
		try {
			await convexClient.action(api.public.accessLink, { linkShort });
		} catch (e) {
			console.error('Failed to access link:', e);
		}

		// Initialize map after Leaflet is loaded
		await initMap();
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
		if (map) {
			map.remove();
		}
	});

	async function initMap() {
		if (!browser) return;

		// Dynamically import Leaflet
		const L = await import('leaflet');

		// Create map centered on a default location
		map = L.map('map').setView([37.7749, -122.4194], 13);

		// Add OpenStreetMap tiles
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);

		// Create custom car icon
		const carIcon = L.divIcon({
			className: 'car-marker',
			html: '<div class="car-icon">🚗</div>',
			iconSize: [40, 40],
			iconAnchor: [20, 20]
		});

		// Create destination icon
		const destIcon = L.divIcon({
			className: 'dest-marker',
			html: '<div class="dest-icon">📍</div>',
			iconSize: [30, 30],
			iconAnchor: [15, 30]
		});

		// Initialize markers (will be positioned when data arrives)
		carMarker = L.marker([0, 0], { icon: carIcon });
		destMarker = L.marker([0, 0], { icon: destIcon });

		if (carData) {
			updateMap();
		}
	}

	function updateMap() {
		if (!map || !carMarker || !carData) return;

		const L = (window as unknown as { L: typeof import('leaflet') }).L;

		// Update car position
		if (carData.gpsLatitude && carData.gpsLongitude) {
			const carPos: L.LatLngExpression = [carData.gpsLatitude, carData.gpsLongitude];
			carMarker.setLatLng(carPos);
			
			if (!map.hasLayer(carMarker)) {
				carMarker.addTo(map);
			}

			// Rotate car icon based on heading
			if (carData.gpsHeading !== undefined) {
				const iconElement = carMarker.getElement();
				if (iconElement) {
					iconElement.style.transform = `rotate(${carData.gpsHeading}deg)`;
				}
			}

			// Center map on car
			map.setView(carPos, map.getZoom());
		}

		// Update destination marker and route line
		if (destMarker && carData.activeRouteLatitude && carData.activeRouteLongitude) {
			const destPos: L.LatLngExpression = [carData.activeRouteLatitude, carData.activeRouteLongitude];
			destMarker.setLatLng(destPos);
			
			if (!map.hasLayer(destMarker)) {
				destMarker.addTo(map);
			}

			// Draw route line
			if (carData.gpsLatitude && carData.gpsLongitude) {
				const carPos: L.LatLngExpression = [carData.gpsLatitude, carData.gpsLongitude];
				
				if (routeLine) {
					routeLine.setLatLngs([carPos, destPos]);
				} else {
					routeLine = L.polyline([carPos, destPos], {
						color: '#e82127',
						weight: 3,
						dashArray: '10, 10'
					}).addTo(map);
				}

				// Fit map to show both car and destination
				const bounds = L.latLngBounds([carPos, destPos]);
				map.fitBounds(bounds, { padding: [50, 50] });
			}
		} else if (destMarker && map.hasLayer(destMarker)) {
			map.removeLayer(destMarker);
			if (routeLine && map.hasLayer(routeLine)) {
				map.removeLayer(routeLine);
			}
		}
	}

	function formatSpeed(speedMph: number | undefined): string {
		if (speedMph === undefined || speedMph === null) return 'Parked';
		return `${Math.round(speedMph)} mph`;
	}

	function formatETA(minutes: number | undefined): string {
		if (minutes === undefined || minutes === null) return 'N/A';
		if (minutes < 60) return `${Math.round(minutes)} min`;
		const hours = Math.floor(minutes / 60);
		const mins = Math.round(minutes % 60);
		return `${hours}h ${mins}m`;
	}

	function formatDistance(miles: number | undefined): string {
		if (miles === undefined || miles === null) return 'N/A';
		return `${miles.toFixed(1)} mi`;
	}

	function formatLastUpdate(timestamp: number | undefined): string {
		if (!timestamp) return 'Unknown';
		return new Date(timestamp).toLocaleTimeString();
	}
</script>

<div class="share-page">
	{#if isLoading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading car data...</p>
		</div>
	{:else if error}
		<div class="error-container">
			<h1>⚠️ {error}</h1>
			<p>This share link may have expired or is invalid.</p>
			<a href="/" class="btn-primary">Go Home</a>
		</div>
	{:else if carData}
		<div class="map-container">
			<div id="map"></div>
			
			<div class="info-panel">
				<div class="car-name">
					<span class="icon">🚗</span>
					<h1>{carData.carName}</h1>
				</div>

				<div class="stats-grid">
					<div class="stat-card">
						<span class="stat-label">Speed</span>
						<span class="stat-value">{formatSpeed(carData.speed)}</span>
					</div>

					{#if carData.activeRouteDestination}
						<div class="stat-card destination">
							<span class="stat-label">Destination</span>
							<span class="stat-value dest-name">{carData.activeRouteDestination}</span>
						</div>

						<div class="stat-card">
							<span class="stat-label">ETA</span>
							<span class="stat-value">{formatETA(carData.activeRouteMinutesToArrival)}</span>
						</div>

						<div class="stat-card">
							<span class="stat-label">Distance</span>
							<span class="stat-value">{formatDistance(carData.activeRouteMilesToArrival)}</span>
						</div>
					{/if}
				</div>

				<div class="last-update text-muted">
					Last updated: {formatLastUpdate(carData.lastUpdate)}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.share-page {
		height: 100vh;
		width: 100vw;
		display: flex;
		flex-direction: column;
	}

	.loading,
	.error-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
		text-align: center;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid var(--border-color);
		border-top-color: var(--primary-color);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.map-container {
		flex: 1;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	#map {
		flex: 1;
		min-height: 300px;
	}

	.info-panel {
		background-color: var(--surface-color);
		padding: 1.5rem;
		border-top: 1px solid var(--border-color);
	}

	.car-name {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.car-name .icon {
		font-size: 2rem;
	}

	.car-name h1 {
		font-size: 1.5rem;
		margin: 0;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		background-color: var(--background-color);
		padding: 1rem;
		border-radius: 8px;
		text-align: center;
	}

	.stat-card.destination {
		grid-column: 1 / -1;
	}

	.stat-label {
		display: block;
		color: var(--text-muted);
		font-size: 0.85rem;
		margin-bottom: 0.25rem;
	}

	.stat-value {
		display: block;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.dest-name {
		font-size: 1rem;
		word-break: break-word;
	}

	.last-update {
		margin-top: 1rem;
		text-align: center;
		font-size: 0.85rem;
	}

	:global(.car-marker) {
		background: none;
		border: none;
	}

	:global(.car-icon) {
		font-size: 32px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	:global(.dest-marker) {
		background: none;
		border: none;
	}

	:global(.dest-icon) {
		font-size: 24px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	@media (min-width: 768px) {
		.map-container {
			flex-direction: row;
		}

		.info-panel {
			width: 350px;
			border-top: none;
			border-left: 1px solid var(--border-color);
			overflow-y: auto;
		}

		.stats-grid {
			grid-template-columns: 1fr 1fr;
		}

		.stat-card.destination {
			grid-column: 1 / -1;
		}
	}
</style>
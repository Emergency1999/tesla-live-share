<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { user, isLoading, initAuth, login, logout, handleCallback } from '$lib/auth';
	import { useQuery, convexClient } from '$lib/convex';
	import { api } from '../../convex/_generated/api';

	// State
	let links = $state<Array<{
		_id: string;
		linkShort: string;
		description: string;
		endTime: number;
		lastViewed?: number;
	}>>([]);
	let newDescription = $state('');
	let newEndTime = $state('');
	let isCreating = $state(false);
	let error = $state<string | null>(null);
	let copiedLink = $state<string | null>(null);

	// Get the base URL for sharing links
	const baseUrl = browser ? window.location.origin : '';

	onMount(async () => {
		// Check for callback
		if (window.location.hash) {
			await handleCallback();
		}
		initAuth();
	});

	// Subscribe to links query when authenticated
	$effect(() => {
		if ($user) {
			const unsubscribe = convexClient.onUpdate(
				api.links.getLinks,
				{},
				(result) => {
					if (result) {
						links = result;
					}
				}
			);
			return unsubscribe;
		} else {
			links = [];
		}
	});

	async function createLink() {
		if (!newDescription.trim() || !newEndTime) {
			error = 'Please fill in all fields';
			return;
		}

		isCreating = true;
		error = null;

		try {
			const endTimeMs = new Date(newEndTime).getTime();
			if (endTimeMs <= Date.now()) {
				error = 'End time must be in the future';
				isCreating = false;
				return;
			}

			await convexClient.mutation(api.links.createLink, {
				description: newDescription.trim(),
				endTime: endTimeMs,
			});

			newDescription = '';
			newEndTime = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create link';
		} finally {
			isCreating = false;
		}
	}

	async function deleteLink(linkShort: string) {
		if (!confirm('Are you sure you want to delete this link?')) {
			return;
		}

		try {
			await convexClient.mutation(api.links.deleteLink, { linkShort });
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete link';
		}
	}

	function copyLink(linkShort: string) {
		const url = `${baseUrl}/${linkShort}`;
		navigator.clipboard.writeText(url);
		copiedLink = linkShort;
		setTimeout(() => {
			copiedLink = null;
		}, 2000);
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleString();
	}

	function isExpired(endTime: number): boolean {
		return endTime < Date.now();
	}
</script>

<div class="container">
	<header class="header">
		<h1>🚗 Tesla Live Share</h1>
		<p class="text-muted">Share your Tesla's live location with anyone</p>
	</header>

	{#if $isLoading}
		<div class="card text-center">
			<p>Loading...</p>
		</div>
	{:else if !$user}
		<div class="card text-center">
			<h2>Manager Login Required</h2>
			<p class="text-muted mt-2">Sign in to create and manage share links</p>
			<button class="btn-primary mt-4" onclick={login}>
				Sign In with SSO
			</button>
		</div>
	{:else}
		<div class="user-info card mb-4">
			<div class="flex justify-between items-center">
				<div>
					<p>Welcome, <strong>{$user.name}</strong></p>
					{#if $user.email}
						<p class="text-muted">{$user.email}</p>
					{/if}
				</div>
				<button class="btn-secondary" onclick={logout}>
					Sign Out
				</button>
			</div>
		</div>

		<div class="card mb-4">
			<h2>Create New Share Link</h2>
			
			{#if error}
				<div class="error-message mt-2">
					{error}
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); createLink(); }} class="create-form mt-4">
				<div class="form-group">
					<label for="description">Description</label>
					<input
						type="text"
						id="description"
						bind:value={newDescription}
						placeholder="e.g., Road trip to LA"
						required
					/>
				</div>

				<div class="form-group">
					<label for="endTime">Share Until</label>
					<input
						type="datetime-local"
						id="endTime"
						bind:value={newEndTime}
						required
					/>
				</div>

				<button type="submit" class="btn-primary w-full" disabled={isCreating}>
					{isCreating ? 'Creating...' : 'Create Share Link'}
				</button>
			</form>
		</div>

		<div class="card">
			<h2>Active Share Links</h2>
			
			{#if links.length === 0}
				<p class="text-muted mt-4">No active share links. Create one above!</p>
			{:else}
				<div class="links-list mt-4">
					{#each links as link (link._id)}
						<div class="link-item" class:expired={isExpired(link.endTime)}>
							<div class="link-info">
								<h3>{link.description}</h3>
								<p class="link-url">
									{baseUrl}/{link.linkShort}
								</p>
								<div class="link-meta text-muted">
									<span>Expires: {formatDate(link.endTime)}</span>
									{#if link.lastViewed}
										<span>• Last viewed: {formatDate(link.lastViewed)}</span>
									{/if}
								</div>
								{#if isExpired(link.endTime)}
									<span class="expired-badge">Expired</span>
								{/if}
							</div>
							<div class="link-actions">
								<button
									class="btn-secondary"
									onclick={() => copyLink(link.linkShort)}
								>
									{copiedLink === link.linkShort ? '✓ Copied!' : 'Copy Link'}
								</button>
								<button
									class="btn-danger"
									onclick={() => deleteLink(link.linkShort)}
								>
									Delete
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.header {
		text-align: center;
		padding: 2rem 0;
	}

	.header h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.user-info {
		background-color: var(--surface-color);
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
	}

	.error-message {
		background-color: rgba(220, 38, 38, 0.2);
		border: 1px solid #dc2626;
		color: #fca5a5;
		padding: 0.75rem;
		border-radius: 8px;
	}

	.links-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.link-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 1rem;
		background-color: var(--background-color);
		border-radius: 8px;
		border: 1px solid var(--border-color);
		gap: 1rem;
		flex-wrap: wrap;
	}

	.link-item.expired {
		opacity: 0.6;
	}

	.link-info {
		flex: 1;
		min-width: 200px;
	}

	.link-info h3 {
		margin-bottom: 0.25rem;
	}

	.link-url {
		font-family: monospace;
		color: var(--primary-color);
		word-break: break-all;
		font-size: 0.9rem;
	}

	.link-meta {
		font-size: 0.85rem;
		margin-top: 0.5rem;
	}

	.expired-badge {
		display: inline-block;
		background-color: #dc2626;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		margin-top: 0.5rem;
	}

	.link-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	@media (max-width: 600px) {
		.link-actions {
			width: 100%;
		}

		.link-actions button {
			flex: 1;
		}
	}
</style>

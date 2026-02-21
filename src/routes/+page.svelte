<script lang="ts">
	import { useConvexClient, useQuery } from "convex-svelte"
	import { api } from "$convex/api.js"
	import { onMount } from "svelte"

	import CreateLinkForm from "$lib/components/CreateLinkForm.svelte"
	import EmptyState from "$lib/components/EmptyState.svelte"
	import ErrorState from "$lib/components/ErrorState.svelte"
	import LinkCard from "$lib/components/LinkCard.svelte"
	import LoadingState from "$lib/components/LoadingState.svelte"
	import PageHeader from "$lib/components/PageHeader.svelte"
	import { SvelteURL } from "svelte/reactivity"
	import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte"
	import LogoutButton from "$lib/components/LogoutButton.svelte"
	import LoginState from "$lib/components/LoginState.svelte"

	const auth = useAuth()

	const client = useConvexClient()
	const links = useQuery(api.links.get, {})

	let now = $state(Date.now())

	const createLink = (description: string, validMs: number) => {
		return client.mutation(api.links.add, {
			description,
			endTime: Date.now() + validMs,
		})
	}

	const handleCreateSubmit = async (event: SubmitEvent) => {
		event.preventDefault()
		const form = event.currentTarget as HTMLFormElement | null
		if (!form) return
		const formData = new FormData(form)
		const description = formData.get("description") as string
		const validMs = parseInt(formData.get("validM") as string) * 60000
		const short = await createLink(description, validMs)
		handleCopyLink(short)
		form.reset()
	}

	const handleCopyLink = (linkShort: string) => {
		const urlLink = new SvelteURL(window.location.href.split("?")[0])
		urlLink.pathname = "/share"
		urlLink.searchParams.set("s", linkShort)
		navigator.clipboard.writeText(urlLink.toString())
	}

	const handleDeleteLink = async (linkShort: string) => {
		await client.mutation(api.links.del, {
			linkShort,
		})
	}

	const handleEditLink = async (linkShort: string, description: string, endTime: number) => {
		await client.mutation(api.links.edit, {
			linkShort,
			description,
			endTime,
			expired: endTime <= Date.now(),
		})
	}

	onMount(() => {
		const interval = setInterval(() => {
			now = Date.now()
		}, 1000)
		return () => clearInterval(interval)
	})
</script>

<svelte:head>
	<title>Tesla live share</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-12">
	<div class="mx-auto max-w-5xl">
		{#if auth.isLoading}
			<LoadingState message="Authentifizieren..." />
		{:else if !auth.isLoading && !auth.isAuthenticated}
			<LoginState />
		{:else}
			<div class="mb-6 flex items-start justify-between md:mb-12">
				<PageHeader />
				<LogoutButton />
			</div>
			<CreateLinkForm onSubmit={handleCreateSubmit} />

			<!-- Links List -->
			<div>
				{#if links.isLoading}
					<LoadingState />
				{:else if links.error}
					<ErrorState message={links.error.toString()} />
				{:else if links.data && links.data.length > 0}
					<div class="space-y-4">
						{#each links.data as link (link._id)}
							<LinkCard
								{link}
								{now}
								onCopy={handleCopyLink}
								onDelete={handleDeleteLink}
								onEdit={handleEditLink}
							/>
						{/each}
					</div>
				{:else}
					<EmptyState />
				{/if}
			</div>
		{/if}
	</div>
</div>

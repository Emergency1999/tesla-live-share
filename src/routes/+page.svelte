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
	import { env } from "$env/dynamic/public"

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
		await createLink(description, validMs)
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

	onMount(() => {
		// Set up authentication with token from localStorage
		client.setAuth(async () => {
			return localStorage.getItem("authToken") //TODO fix this stupid code and actually handle token expiration
		})

		// Check if we have a token, if not redirect to login
		if (!localStorage.getItem("authToken")) {
			const authUrl = new SvelteURL(env.PUBLIC_AUTHENTIK_AUTHORIZE_URL || "")
			authUrl.searchParams.set("client_id", env.PUBLIC_AUTHENTIK_CLIENT_ID || "")
			authUrl.searchParams.set("redirect_uri", window.location.origin + "/auth/callback")
			authUrl.searchParams.set("response_type", "id_token")
			authUrl.searchParams.set("response_mode", "fragment")
			authUrl.searchParams.set("scope", "openid profile email")
			authUrl.searchParams.set("nonce", Math.random().toString(36))
			window.location.href = authUrl.toString()
			return
		}

		const interval = setInterval(() => {
			now = Date.now()
		}, 1000)
		return () => clearInterval(interval)
	})
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-12">
	<div class="mx-auto max-w-5xl">
		<PageHeader />
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
						<LinkCard {link} {now} onCopy={handleCopyLink} onDelete={handleDeleteLink} />
					{/each}
				</div>
			{:else}
				<EmptyState />
			{/if}
		</div>
	</div>
</div>

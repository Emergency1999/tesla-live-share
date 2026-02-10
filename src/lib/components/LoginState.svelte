<script lang="ts">
	import { authClient } from "$lib/auth-client"
	import { Progress } from "@skeletonlabs/skeleton-svelte"

	const {
		title = "You are not logged in",
		message = "Please log in to create and manage your share links.",
		buttonLabel = "Log in",
	} = $props<{ title?: string; message?: string; buttonLabel?: string }>()

	let loggingIn = $state(false)

	const handleLogin = async () => {
		loggingIn = true
		await authClient.signIn.oauth2({ providerId: "authentik" })
		await new Promise((resolve) => setTimeout(resolve, 5000)) // Simulate loading time
		loggingIn = false
	}
</script>

<div class="flex min-h-[60vh] items-center justify-center">
	<div class="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
		<p class="text-xl font-semibold text-white">{title}</p>
		<p class="mt-2 text-slate-400">{message}</p>
		{#if loggingIn}
			<Progress class="mx-auto mt-4 w-fit items-center justify-center" value={null}>
				<Progress.Circle>
					<Progress.CircleTrack />
					<Progress.CircleRange />
				</Progress.Circle>
				<Progress.ValueText />
			</Progress>
		{:else}
			<button
				onclick={handleLogin}
				type="button"
				class="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
			>
				{buttonLabel}
			</button>
		{/if}
	</div>
</div>

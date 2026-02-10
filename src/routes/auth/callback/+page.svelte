<script lang="ts">
	import { onMount } from "svelte"
	import { goto } from "$app/navigation"
	import { resolve } from "$app/paths"
	import { useConvexClient } from "convex-svelte"

	const client = useConvexClient()

	let status = $state<"loading" | "error" | "success">("loading")
	let errorMessage = $state("")

	onMount(async () => {
		try {
			// Get tokens from URL fragment (implicit flow)
			const hash = window.location.hash.substring(1)
			const params = new URLSearchParams(hash)

			const error = params.get("error")
			if (error) {
				const errorDesc = params.get("error_description") || error
				throw new Error(`Authentication error: ${errorDesc}`)
			}

			const idToken = params.get("id_token")
			if (!idToken) {
				throw new Error("No ID token received")
			}

			// Store token in localStorage
			localStorage.setItem("authToken", idToken)

			// Set authentication in Convex with a function that retrieves the token
			await client.setAuth(async () => {
				return localStorage.getItem("authToken")
			})

			status = "success"

			// Clear the hash and redirect to home page
			setTimeout(() => {
				goto(resolve("/"))
			}, 1000)
		} catch (err) {
			status = "error"
			errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
		}
	})
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6"
>
	<div
		class="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur-sm"
	>
		{#if status === "loading"}
			<div class="text-center">
				<div
					class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500"
				></div>
				<h2 class="mb-2 text-xl font-semibold text-white">Authenticating...</h2>
				<p class="text-slate-400">Please wait while we complete your login.</p>
			</div>
		{:else if status === "success"}
			<div class="text-center">
				<div
					class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20"
				>
					<svg class="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
						></path>
					</svg>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-white">Success!</h2>
				<p class="text-slate-400">Redirecting to dashboard...</p>
			</div>
		{:else}
			<div class="text-center">
				<div
					class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20"
				>
					<svg class="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-white">Authentication Failed</h2>
				<p class="mb-4 text-slate-400">{errorMessage}</p>
				<a
					href={resolve("/")}
					class="inline-block rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Back to Home
				</a>
			</div>
		{/if}
	</div>
</div>

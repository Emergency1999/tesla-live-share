<script lang="ts">
	import { useConvexClient, useQuery } from "convex-svelte"
	import { api } from "$convex/api.js"
	import { onMount } from "svelte"
	import Time from "svelte-time/Time.svelte"

	const client = useConvexClient()
	const links = useQuery(api.links.get, {})

	let now = $state(Date.now())

	const createLink = (description: string, validMs: number) => {
		return client.mutation(api.links.add, {
			description,
			endTime: Date.now() + validMs,
		})
	}

	onMount(() => {
		const interval = setInterval(() => {
			now = Date.now()
		}, 1000)
		return () => clearInterval(interval)
	})
</script>

{#if links.isLoading}
	Loading...
{:else if links.error}
	failed to load: {links.error.toString()}
{:else}
	<ul>
		{#each links.data as link (link._id)}
			{@const valid = link.endTime > now}
			<li>
				{valid ? "☑" : "☐"}
				<span>{link.description}</span>
				|
				<span>
					{valid ? "valid for" : "expired"}
					<Time withoutSuffix={valid} relative timestamp={link.endTime} />
				</span>
				| <span>last viewed: <Time relative timestamp={link.lastViewed} /></span>
				| <span>short: {link.linkShort}</span>
				<button
					onclick={() => {
						// copy URL/share?s=linkShort
						const urlLink = new URL(window.location.href.split("?")[0])
						urlLink.pathname = "/share"

						urlLink.searchParams.set("s", link.linkShort)
						navigator.clipboard.writeText(urlLink.toString())
					}}>Copy Link</button
				>
				<button
					onclick={async () => {
						await client.mutation(api.links.del, {
							linkShort: link.linkShort,
						})
					}}>Delete</button
				>
			</li>
		{/each}
	</ul>
{/if}

<!-- Create new Link via form with description and valid time -->
<form
	onsubmit={async (e) => {
		const formData = new FormData(e.target as HTMLFormElement)
		const description = formData.get("description") as string
		const validMs = parseInt(formData.get("validM") as string) * 60000
		await createLink(description, validMs)
	}}
>
	<input name="description" placeholder="Description" required />
	<input name="validM" type="number" placeholder="Valid time (minutes)" required />
	<button type="submit">Create Link</button>
</form>

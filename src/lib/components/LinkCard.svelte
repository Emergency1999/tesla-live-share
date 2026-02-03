<script lang="ts">
	import Time from "svelte-time/Time.svelte"

	type LinkItem = {
		_id: string
		description: string
		endTime: number
		lastViewed?: number
		linkShort: string
		isExpired?: boolean
	}

	const { link, now, onCopy, onDelete } = $props<{
		link: LinkItem
		now: number
		onCopy: (linkShort: string) => void
		onDelete: (linkShort: string) => void | Promise<void>
	}>()

	const valid = $derived(link.endTime > now)
</script>

<div
	class="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-xl transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-2xl"
>
	<div class="mb-4 flex items-start justify-between gap-4">
		<div class="min-w-0 flex-1">
			<div class="mb-2 flex items-center gap-3">
				<span class={`text-2xl ${valid ? "text-green-400" : "text-slate-500"}`}>
					{valid ? "✓" : "✗"}
				</span>
				<h3 class="truncate text-xl font-semibold text-white">{link.description}</h3>
			</div>
			<div class="flex flex-wrap gap-6 text-sm">
				<div class="text-slate-400">
					<span class="font-semibold text-slate-300">Status:</span>
					<span class={`ml-2 font-semibold ${link.isExpired ? "text-red-400" : "text-green-400"}`}>
						{link.isExpired ? "Expired" : "Valid"}
					</span>
				</div>
				<div class="text-slate-400">
					<span class="font-semibold text-slate-300">{valid ? "Expires" : "Expired"}:</span>
					<span class="ml-2">
						<Time withoutSuffix={valid} relative timestamp={link.endTime} />
					</span>
				</div>
				<div class="text-slate-400">
					<span class="font-semibold text-slate-300">Last viewed:</span>
					<span class="ml-2">
						<Time relative timestamp={link.lastViewed} />
					</span>
				</div>
			</div>
		</div>
	</div>

	<div class="mb-4 rounded-lg border border-slate-600 bg-slate-700/50 p-3">
		<p class="mb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">Short Link Code</p>
		<code class="font-mono text-base break-all text-blue-400 md:text-lg">{link.linkShort}</code>
	</div>

	<div class="flex flex-col gap-3 sm:flex-row">
		<button
			onclick={() => onCopy(link.linkShort)}
			class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white shadow-lg transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-500/30"
		>
			<span>📋</span>
			Copy Link
		</button>
		<button
			onclick={() => onDelete(link.linkShort)}
			class="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white shadow-lg transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-red-500/30"
		>
			<span>🗑️</span>
			Delete
		</button>
	</div>
</div>

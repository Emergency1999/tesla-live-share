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

	const { link, now, onCopy, onDelete, onEdit } = $props<{
		link: LinkItem
		now: number
		onCopy: (linkShort: string) => void
		onDelete: (linkShort: string) => void | Promise<void>
		onEdit: (linkShort: string, description: string, endTime: number) => void | Promise<void>
	}>()

	const valid = $derived(link.endTime > now)

	let isEditing = $state(false)
	let isSaving = $state(false)
	let editError = $state("")
	let editDescription = $state("")
	let editDateTime = $state("")

	function formatDateTimeLocal(timestamp: number) {
		const date = new Date(timestamp)
		const pad = (value: number) => value.toString().padStart(2, "0")
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
	}

	function openEdit() {
		editDescription = link.description
		editDateTime = formatDateTimeLocal(link.endTime)
		editError = ""
		isEditing = true
	}

	function closeEdit() {
		editError = ""
		isEditing = false
	}

	const handleSaveEdit = async () => {
		const description = editDescription.trim()
		if (!description || !editDateTime) {
			editError = "Description and expiration date are required"
			return
		}

		const endTime = new Date(editDateTime).getTime()
		if (Number.isNaN(endTime)) {
			editError = "Invalid expiration date"
			return
		}

		isSaving = true
		editError = ""

		try {
			await onEdit(link.linkShort, description, endTime)
			isEditing = false
		} catch (error) {
			editError = error instanceof Error ? error.message : "Failed to save changes"
		} finally {
			isSaving = false
		}
	}
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
					</span>,
					<span class="ml-2">
						<Time timestamp={link.endTime} format="HH:mm · D.MM.YYYY" />
					</span>
				</div>
				<div class="text-slate-400">
					<span class="font-semibold text-slate-300">Last viewed:</span>
					<span class="ml-2">
						<Time relative timestamp={link.lastViewed} />,
						<span class="ml-2">
							<Time timestamp={link.lastViewed} format="HH:mm · D.MM.YYYY" />
						</span>
					</span>
				</div>
			</div>
		</div>
	</div>

	<div class="mb-4 rounded-lg border border-slate-600 bg-slate-700/50 p-3">
		<p class="mb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">Short Link Code</p>
		<code class="font-mono text-base break-all text-blue-400 md:text-lg">{link.linkShort}</code>
	</div>

	{#if isEditing}
		<div
			class="mb-4 grid gap-3 rounded-lg border border-slate-600 bg-slate-700/50 p-4 md:grid-cols-[1fr_280px]"
		>
			<input
				bind:value={editDescription}
				placeholder="Description"
				required
				class="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
			/>
			<input
				type="datetime-local"
				bind:value={editDateTime}
				required
				class="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white [color-scheme:dark] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
			/>
			{#if editError}
				<p class="text-sm text-red-400 md:col-span-2">{editError}</p>
			{/if}
		</div>
	{/if}

	<div class="flex flex-col gap-3 sm:flex-row">
		{#if isEditing}
			<button
				onclick={handleSaveEdit}
				disabled={isSaving}
				class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-lg transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70"
			>
				<span>💾</span>
				{isSaving ? "Saving..." : "Save"}
			</button>
			<button
				onclick={closeEdit}
				disabled={isSaving}
				class="flex items-center justify-center gap-2 rounded-lg bg-slate-600 px-4 py-2 font-semibold text-white shadow-lg transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-slate-500 disabled:cursor-not-allowed disabled:opacity-70"
			>
				<span>↩️</span>
				Cancel
			</button>
		{:else}
			<button
				onclick={openEdit}
				class="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-lg transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-500/30"
			>
				<span>✏️</span>
				Edit
			</button>
		{/if}

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

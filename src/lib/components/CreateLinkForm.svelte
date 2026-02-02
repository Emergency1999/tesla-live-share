<script lang="ts">
	const {
		onSubmit,
		submitLabel = "Create",
		descriptionPlaceholder = "e.g. Person name or purpose",
		minutesPlaceholder = "Minutes",
	} = $props<{
		onSubmit: (event: SubmitEvent) => void | Promise<void>
		submitLabel?: string
		descriptionPlaceholder?: string
		minutesPlaceholder?: string
	}>()
</script>

<div class="mb-10 rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-2xl md:p-8">
	<h2 class="mb-6 text-2xl font-bold text-white">Create New Link</h2>
	<form onsubmit={onSubmit} class="grid gap-4 md:grid-cols-[1fr_150px_120px]">
		<input
			name="description"
			placeholder={descriptionPlaceholder}
			required
			class="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
		/>
		<input
			name="validM"
			type="number"
			placeholder={minutesPlaceholder}
			min="1"
			required
			class="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
		/>
		<button
			type="submit"
			class="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white shadow-lg transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-500/30"
		>
			{submitLabel}
		</button>
	</form>
</div>

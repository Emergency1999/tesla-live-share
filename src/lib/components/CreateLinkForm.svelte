<script lang="ts">
	import { SvelteDate } from "svelte/reactivity"

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

	function formatDateTimeLocal(date: SvelteDate) {
		const pad = (value: number) => value.toString().padStart(2, "0")
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
	}

	function getCurrentDateTime() {
		return formatDateTimeLocal(new SvelteDate())
	}

	function calculateMinutesUntil(dateTime: string) {
		if (!dateTime) {
			return null
		}

		const now = new SvelteDate()
		const selected = new SvelteDate(dateTime)
		const diffMs = selected.getTime() - now.getTime()
		const diffMinutes = Math.ceil(diffMs / 60000)
		return Math.max(1, diffMinutes)
	}

	const initialDateTime = getCurrentDateTime()

	let inputMode = $state<"minutes" | "datetime">("minutes")
	let selectedDateTime = $state(initialDateTime)
	let calculatedMinutes = $state<number | null>(calculateMinutesUntil(initialDateTime))

	function handleDateTimeChange(event: Event) {
		const target = event.target as HTMLInputElement
		selectedDateTime = target.value
		calculatedMinutes = calculateMinutesUntil(selectedDateTime)
	}

	function handleFormSubmit(event: SubmitEvent) {
		if (inputMode === "datetime" && calculatedMinutes !== null) {
			const form = event.target as HTMLFormElement
			const validMInput = form.elements.namedItem("validM") as HTMLInputElement
			if (validMInput) {
				validMInput.value = calculatedMinutes.toString()
			}
		}
		onSubmit(event)
	}

	function getMinDateTime() {
		return getCurrentDateTime()
	}
</script>

<div class="mb-10 rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-2xl md:p-8">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-2xl font-bold text-white">Create New Link</h2>

		<div class="inline-flex rounded-lg border border-slate-600 bg-slate-700 p-1">
			<button
				type="button"
				onclick={() => (inputMode = "minutes")}
				class="rounded-md px-4 py-2 text-sm font-medium transition-all {inputMode === 'minutes'
					? 'bg-blue-600 text-white shadow-sm'
					: 'text-slate-300 hover:text-white'}"
			>
				Enter Minutes
			</button>
			<button
				type="button"
				onclick={() => (inputMode = "datetime")}
				class="rounded-md px-4 py-2 text-sm font-medium transition-all {inputMode === 'datetime'
					? 'bg-blue-600 text-white shadow-sm'
					: 'text-slate-300 hover:text-white'}"
			>
				Select Date & Time
			</button>
		</div>
	</div>

	<form onsubmit={handleFormSubmit} class="grid gap-4 md:grid-cols-[1fr_280px_120px]">
		<input
			name="description"
			placeholder={descriptionPlaceholder}
			required
			class="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
		/>

		{#if inputMode === "minutes"}
			<input
				name="validM"
				type="number"
				placeholder={minutesPlaceholder}
				min="1"
				required
				class="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
			/>
		{:else}
			<div class="flex flex-col gap-1">
				<input
					type="datetime-local"
					min={getMinDateTime()}
					value={selectedDateTime}
					oninput={handleDateTimeChange}
					required
					class="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 [color-scheme:dark] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
				/>
				{#if calculatedMinutes !== null}
					<span class="text-center text-xs text-slate-400">≈ {calculatedMinutes} minutes</span>
				{/if}
				<input name="validM" type="hidden" value={calculatedMinutes ?? ""} />
			</div>
		{/if}

		<button
			type="submit"
			class="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white shadow-lg transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-500/30"
		>
			{submitLabel}
		</button>
	</form>
</div>

<script lang="ts">
	const {
		title = "No links yet",
		message = "Create your first share link using the form above",
		icon = "🔗",
	} = $props<{ title?: string; message?: string; icon?: string }>()
</script>

<div class="rounded-lg border border-dashed border-slate-700 bg-slate-800 p-12 text-center">
	<p class="mb-3 text-3xl">{icon}</p>
	<p class="mb-2 text-xl font-semibold text-white">{title}</p>
	<p class="text-slate-400">{message}</p>
</div>

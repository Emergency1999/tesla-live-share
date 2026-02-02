<script lang="ts">
	const { message = "Loading your links..." } = $props<{ message?: string }>()
</script>

<div class="flex items-center justify-center py-20">
	<div class="text-center">
		<div
			class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"
		></div>
		<p class="text-slate-400">{message}</p>
	</div>
</div>

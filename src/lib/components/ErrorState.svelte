<script lang="ts">
	const { message } = $props<{ message: string }>()
</script>

<div class="rounded-lg border border-red-700 bg-red-900/30 p-6">
	<p class="text-red-200">
		<span class="font-semibold">Error:</span>
		{message}
	</p>
</div>

<script lang="ts">
	const {
		title = "Tesla Live Share",
		subtitle = "Manage your temporary live share links with ease",
	} = $props<{ title?: string; subtitle?: string }>()
</script>

<div class="mb-12">
	<h1 class="mb-2 text-4xl font-bold text-white md:text-5xl">{title}</h1>
	<p class="text-slate-400">{subtitle}</p>
</div>

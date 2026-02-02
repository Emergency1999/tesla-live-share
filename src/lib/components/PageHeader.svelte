<script lang="ts">
	import { version } from "$app/environment"

	const {
		title = "Tesla Live Share",
		subtitle = "Manage your temporary live share links with ease",
	} = $props<{ title?: string; subtitle?: string }>()
</script>

<div class="mb-12">
	<div class="flex items-baseline gap-3">
		<h1 class="text-4xl font-bold text-white md:text-5xl">{title}</h1>
		<span class="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">v{version}</span>
	</div>
	<p class="mt-2 text-slate-400">{subtitle}</p>
</div>

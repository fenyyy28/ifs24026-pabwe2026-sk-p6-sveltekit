<script lang="ts">
	let {
		name,
		photo = null,
		size = 40,
		decorative = false
	}: { name: string; photo?: string | null; size?: number; decorative?: boolean } = $props();

	let failed = $state(false);
	const initial = $derived(name?.trim().charAt(0).toUpperCase() || '?');

	$effect(() => {
		photo;
		failed = false;
	});
</script>

{#if photo && !failed}
	<img
		src={photo}
		alt={decorative ? '' : name}
		class="shrink-0 rounded-full object-cover"
		style="width:{size}px;height:{size}px"
		onerror={() => (failed = true)}
	/>
{:else}
	<span
		class="inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700"
		style="width:{size}px;height:{size}px;font-size:{size / 2.5}px"
	>
		{initial}
	</span>
{/if}

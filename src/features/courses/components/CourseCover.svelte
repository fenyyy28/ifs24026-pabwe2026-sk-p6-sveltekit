<script lang="ts">
	import { GraduationCap } from 'lucide-svelte';

	let { cover = null, class: className = '' }: { cover?: string | null; class?: string } = $props();
</script>

<div class="relative overflow-hidden bg-indigo-100 text-indigo-300 {className}">
	<div class="absolute inset-0 flex items-center justify-center"><GraduationCap size={40} /></div>
	{#if cover}
		<img
			src={cover}
			alt=""
			class="absolute inset-0 h-full w-full object-cover"
			onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
		/>
	{/if}
</div>
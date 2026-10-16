<script lang="ts">
	import { GraduationCap } from 'lucide-svelte';

	let { size = 28, showText = true }: { size?: number; showText?: boolean } = $props();
</script>

<span class="inline-flex items-center gap-2 font-semibold text-indigo-600">
	<GraduationCap {size} />
	{#if showText}<span>Delcom Courses</span>{/if}
</span>
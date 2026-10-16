<script lang="ts">
	import type { Snippet } from 'svelte';

	let { active, children }: { active?: string; children: Snippet } = $props();
</script>

<div data-testid="course-layout" data-active={active}>{@render children()}</div>

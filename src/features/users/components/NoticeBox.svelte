<script lang="ts">
	import type { Notice } from '../types';

	let { notice }: { notice?: Notice } = $props();
</script>

{#if notice}
	<div
		class="rounded-lg p-3 text-sm {notice.type === 'success'
			? 'bg-green-50 text-green-700'
			: 'bg-red-50 text-red-700'}"
	>
		<p>{notice.text}</p>
		{#each notice.fields as msg}<p>{msg}</p>{/each}
	</div>
{/if}
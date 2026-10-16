<script lang="ts">
	import type { MutationResult } from '../types';

	let { result }: { result: MutationResult | null } = $props();
</script>

{#if result && !result.ok}
	<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
		<p>{result.message}</p>
		{#each result.fields as msg}<p>{msg}</p>{/each}
	</div>
{/if}
<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { authStore } from '../states/authStore.svelte';

	/** guest: halaman login/register. protected: halaman yang wajib login. */
	let { mode }: { mode: 'guest' | 'protected' } = $props();

	$effect(() => {
		untrack(() => authStore.init());
	});

	$effect(() => {
		if (!authStore.ready) return;

		if (mode === 'guest' && authStore.user) goto('/');
		if (mode === 'protected' && !authStore.user) goto('/auth/login');
	});
</script>
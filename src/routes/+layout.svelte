<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import CourseLayout from '../features/courses/layouts/CourseLayout.svelte';

	let { children } = $props();

	const pathname = $derived(page.url.pathname);
	const isAuth = $derived(pathname === '/auth' || pathname.startsWith('/auth/'));

	const active = $derived(
		pathname.startsWith('/users') ? 'users' : pathname.startsWith('/profile') ? 'profile' : 'courses'
	);

	// Halaman error (misalnya 404) tampil mandiri, tanpa navbar dan tanpa wajib login.
	const bare = $derived(isAuth || page.error !== null);
</script>

{#if bare}
	{@render children()}
{:else}
	<CourseLayout {active}>
		{@render children()}
	</CourseLayout>
{/if}
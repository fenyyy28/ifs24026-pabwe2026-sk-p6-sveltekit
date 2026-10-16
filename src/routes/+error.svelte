<script lang="ts">
	import { page } from '$app/state';
	import Logo from '../lib/components/Logo.svelte';

	const notFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{notFound ? 'Halaman Tidak Ditemukan' : 'Terjadi Kesalahan'} | Delcom Courses</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
	<Logo size={36} />

	<p class="text-6xl font-bold text-indigo-600">{page.status}</p>
	<h1 class="text-2xl font-semibold text-slate-900">
		{notFound ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan'}
	</h1>
	<p class="max-w-md text-slate-500">
		{notFound
			? 'Alamat yang Anda buka tidak ada atau sudah dipindahkan.'
			: (page.error?.message ?? 'Silakan coba lagi beberapa saat lagi.')}
	</p>

	<a
		href="/"
		class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
	>
		Kembali ke Semua Kursus
	</a>
</div>
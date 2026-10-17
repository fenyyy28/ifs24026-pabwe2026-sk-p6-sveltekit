<script lang="ts">
	import { untrack } from 'svelte';
	import { authStore } from '../../auth/states/authStore.svelte';
	import UserAvatar from '../components/UserAvatar.svelte';
	import { usersStore } from '../states/usersStore.svelte';

	let search = $state('');
	const filtered = $derived(usersStore.filter(search));

	$effect(() => {
		if (authStore.ready && authStore.user) untrack(() => usersStore.loadUsers());
	});
</script>

<svelte:head><title>Pengguna | Delcom Courses</title></svelte:head>

<div class="mx-auto max-w-3xl">
	<h1 class="mb-6 text-2xl font-bold text-slate-900">Pengguna</h1>

	<input
		type="search"
		placeholder="Cari nama atau email..."
		bind:value={search}
		class="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
	/>

	{#if usersStore.loading}
		<p class="text-slate-500">Memuat pengguna...</p>
	{:else if usersStore.error}
		<p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{usersStore.error}</p>
	{:else if filtered.length === 0}
		<p class="text-slate-500">Tidak ada pengguna ditemukan.</p>
	{:else}
		<ul class="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
			{#each filtered as user (user.id)}
				<li class="flex items-center gap-3 p-4">
					<UserAvatar name={user.name} photo={user.photo} decorative />
					<div class="min-w-0">
						<p class="truncate font-medium text-slate-900">
							<span>{user.name}</span>
							{#if user.id === authStore.user?.id}
								<span class="ml-1 text-xs text-indigo-600">(Anda)</span>
							{/if}
						</p>
						<p class="truncate text-sm text-slate-500">{user.email}</p>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

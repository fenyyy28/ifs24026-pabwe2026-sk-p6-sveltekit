<script lang="ts">
	import type { Snippet } from 'svelte';
	import { BookOpen, LogOut, User, Users } from 'lucide-svelte';
	import Logo from '../../../lib/components/Logo.svelte';
	import AuthSessionRedirect from '../../auth/components/AuthSessionRedirect.svelte';
	import { authStore } from '../../auth/states/authStore.svelte';
	import UserAvatar from '../../users/components/UserAvatar.svelte';
	import { coursesStore } from '../states/coursesStore.svelte';

	type MenuKey = 'courses' | 'users' | 'profile';

	let { active = 'courses', children }: { active?: MenuKey; children: Snippet } = $props();

	const menus = [
		{ key: 'courses', label: 'Semua Kursus', href: '/', icon: BookOpen },
		{ key: 'users', label: 'Pengguna', href: '/users', icon: Users },
		{ key: 'profile', label: 'Profil', href: '/profile', icon: User }
	] as const;
</script>

<AuthSessionRedirect mode="protected" />

<div class="flex min-h-screen flex-col bg-slate-50">
	<header class="sticky top-0 z-40 border-b border-slate-200 bg-white">
		<div class="flex h-14 items-center justify-between px-4">
			<a href="/"><Logo /></a>

			{#if authStore.user}
				<div class="flex items-center gap-4">
					<a href="/profile" class="flex items-center gap-2 text-sm text-slate-700 hover:text-indigo-600">
						<UserAvatar name={authStore.user.name} photo={authStore.user.photo} size={32} decorative />
						<span class="hidden sm:inline">{authStore.user.name}</span>
					</a>
					<button
						type="button"
						onclick={() => authStore.logout()}
						class="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
					>
						<LogOut size={16} /> Keluar
					</button>
				</div>
			{/if}
		</div>

		<!-- Menu untuk layar kecil -->
		<nav class="flex gap-4 overflow-x-auto border-t border-slate-100 px-4 py-2 text-sm md:hidden">
			{#each menus as menu}
				<a
					href={menu.href}
					class={menu.key === active ? 'font-semibold text-indigo-600' : 'text-slate-600'}
				>
					{menu.label}
				</a>
			{/each}
		</nav>
	</header>

	<div class="flex flex-1">
		<aside class="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-3 md:block">
			<nav class="space-y-1">
				{#each menus as menu}
					<a
						href={menu.href}
						class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium {menu.key === active
							? 'bg-indigo-50 text-indigo-700'
							: 'text-slate-600 hover:bg-slate-50'}"
					>
						<menu.icon size={18} />
						<span>{menu.label}</span>
					</a>
				{/each}
			</nav>
		</aside>

		<main class="min-w-0 flex-1 p-6">
			{#if authStore.user}
				{@render children()}
			{:else}
				<p class="text-slate-500">Memuat...</p>
			{/if}
		</main>
	</div>

	{#if coursesStore.toast}
		<div
			class="fixed right-4 bottom-4 z-50 rounded-lg px-4 py-3 text-sm text-white shadow-lg {coursesStore
				.toast.type === 'success'
				? 'bg-green-600'
				: 'bg-red-600'}"
		>
			{coursesStore.toast.text}
		</div>
	{/if}
</div>

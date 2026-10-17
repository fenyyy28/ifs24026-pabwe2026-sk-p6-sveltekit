<script lang="ts">
	import { untrack } from 'svelte';
	import { Plus, Search, Star, Trash2, Users, Video } from 'lucide-svelte';
	import { formatRating } from '../../../lib/helpers/toolsHelper';
	import { authStore } from '../../auth/states/authStore.svelte';
	import UserAvatar from '../../users/components/UserAvatar.svelte';
	import AddModal from '../components/AddModal.svelte';
	import CourseCover from '../components/CourseCover.svelte';
	import { coursesStore } from '../states/coursesStore.svelte';
	import type { Course } from '../types';
	import { dangerButton, getCourseRole, primaryButton } from '../utils';

	let search = $state('');
	let onlyMine = $state(false);
	let showAdd = $state(false);

	const userId = $derived(authStore.user?.id);
	const mineCount = $derived(coursesStore.courses.filter((c) => c.user_id === userId).length);

	const filtered = $derived(
		coursesStore.courses.filter((c) => {
			if (onlyMine && c.user_id !== userId) return false;
			const q = search.trim().toLowerCase();
			return !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
		})
	);

	$effect(() => {
		if (authStore.ready && authStore.user) untrack(() => coursesStore.loadCourses());
	});

	async function removeCourse(course: Course) {
		if (!confirm(`Hapus kursus "${course.title}"?`)) return;
		await coursesStore.deleteCourse(course.id);
	}

	async function removeAll() {
		if (!confirm('Hapus SEMUA kursus milik Anda? Tindakan ini permanen.')) return;
		await coursesStore.deleteAllCourses();
	}
</script>

<svelte:head><title>Semua Kursus | Delcom Courses</title></svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-bold text-slate-900">Semua Kursus</h1>
		<p class="text-sm text-slate-500">{`${coursesStore.courses.length} kursus tersedia`}</p>
	</div>
	<div class="flex flex-wrap gap-2">
		{#if mineCount > 0}
			<button
				type="button"
				class={dangerButton}
				onclick={removeAll}
				disabled={coursesStore.busy.removeAll}
			>
				<Trash2 size={16} /> Hapus Semua Milik Saya
			</button>
		{/if}
		<button type="button" class={primaryButton} onclick={() => (showAdd = true)}>
			<Plus size={16} /> Tambah Kursus
		</button>
	</div>
</div>

<div class="mb-6 flex flex-wrap items-center gap-4">
	<div class="relative min-w-60 flex-1">
		<Search size={16} class="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
		<input
			type="search"
			placeholder="Cari kursus..."
			bind:value={search}
			class="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 outline-none focus:border-indigo-500"
		/>
	</div>
	<label class="flex items-center gap-2 text-sm text-slate-700">
		<input type="checkbox" bind:checked={onlyMine} class="accent-indigo-600" />
		Hanya milik saya
	</label>
</div>

{#if coursesStore.loading && coursesStore.courses.length === 0}
	<p class="text-slate-500">Memuat kursus...</p>
{:else if coursesStore.error}
	<p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{coursesStore.error}</p>
{:else if filtered.length === 0}
	<p class="text-slate-500">Tidak ada kursus ditemukan.</p>
{:else}
	<div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
		{#each filtered as course (course.id)}
			{@const role = getCourseRole(course, userId)}
			<article class="overflow-hidden rounded-xl border border-slate-200 bg-white">
				<a href={`/courses/${course.id}`} class="block">
					<CourseCover cover={course.cover} class="h-36" />
					<div class="space-y-2 p-4">
						<div class="flex items-start justify-between gap-2">
							<h2 class="font-semibold text-slate-900">{course.title}</h2>
							{#if role === 'owner'}
								<span class="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700"
									>Milik Anda</span
								>
							{:else if role === 'student'}
								<span class="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
									>Diikuti</span
								>
							{/if}
						</div>
						<p class="line-clamp-2 text-sm text-slate-500">{course.description}</p>

						<div class="flex items-center gap-2 text-sm text-slate-600">
							<UserAvatar name={course.author.name} photo={course.author.photo} size={24} decorative />
							<span class="truncate">{course.author.name}</span>
						</div>

						<div class="flex items-center gap-4 text-xs text-slate-500">
							<span class="inline-flex items-center gap-1">
								<Video size={14} /><span>{course.total_contents}</span>
							</span>
							<span class="inline-flex items-center gap-1">
								<Users size={14} /><span>{course.students.length}</span>
							</span>
							<span class="inline-flex items-center gap-1">
								<Star size={14} />
								{course.avg_ratings ? formatRating(course.avg_ratings) : '-'}
							</span>
						</div>
					</div>
				</a>

				{#if role === 'owner'}
					<div class="border-t border-slate-100 px-4 py-2">
						<button
							type="button"
							class="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
							onclick={() => removeCourse(course)}
						>
							<Trash2 size={14} /> Hapus
						</button>
					</div>
				{/if}
			</article>
		{/each}
	</div>
{/if}

{#if showAdd}<AddModal onclose={() => (showAdd = false)} />{/if}

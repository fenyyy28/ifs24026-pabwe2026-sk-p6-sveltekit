<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { Camera, Check, Lock, Pencil, Plus, Star, Trash2, Users, Video } from 'lucide-svelte';
	import { formatDate, formatPercentage, formatRating } from '../../../lib/helpers/toolsHelper';
	import { authStore } from '../../auth/states/authStore.svelte';
	import UserAvatar from '../../users/components/UserAvatar.svelte';
	import ChangeCoverModal from '../components/ChangeCoverModal.svelte';
	import ChangeModal from '../components/ChangeModal.svelte';
	import ContentModal from '../components/ContentModal.svelte';
	import CourseCover from '../components/CourseCover.svelte';
	import FormAlert from '../components/FormAlert.svelte';
	import { coursesStore } from '../states/coursesStore.svelte';
	import type { CourseContent, CourseDetail, MutationResult } from '../types';
	import {
		dangerButton,
		getCourseRole,
		inputClass,
		primaryButton,
		secondaryButton
	} from '../utils';

	let { courseId }: { courseId: number } = $props();

	const course = $derived(coursesStore.course?.id === courseId ? coursesStore.course : null);

	let showEdit = $state(false);
	let showCover = $state(false);
	let contentModal = $state<{ content?: CourseContent } | null>(null);

	let rating = $state(0);
	let comment = $state('');
	let ratingResult = $state<MutationResult | null>(null);

	$effect(() => {
		const id = courseId;
		if (authStore.ready && authStore.user) untrack(() => coursesStore.loadDetail(id));
	});

	async function removeCourse(target: CourseDetail) {
		if (!confirm(`Hapus kursus "${target.title}"?`)) return;
		const result = await coursesStore.deleteCourse(target.id);
		if (result.ok) await goto('/');
	}

	async function leaveCourse(target: CourseDetail) {
		if (!confirm('Keluar dari kursus ini?')) return;
		await coursesStore.leaveCourse(target.id);
	}

	async function removeContent(content: CourseContent) {
		if (!confirm(`Hapus konten "${content.title}"?`)) return;
		await coursesStore.deleteContent(courseId, content.id);
	}

	async function submitRating(e: SubmitEvent, target: CourseDetail) {
		e.preventDefault();
		if (rating < 1) {
			ratingResult = { ok: false, message: 'Pilih rating 1 sampai 5', fields: [] };
			return;
		}
		ratingResult = await coursesStore.rateCourse(target.id, {
			ratings: rating,
			comment: comment.trim()
		});
		if (ratingResult.ok) {
			rating = 0;
			comment = '';
		}
	}
</script>

<svelte:head><title>{`${course?.title ?? 'Detail Kursus'} | Delcom Courses`}</title></svelte:head>

<a href="/" class="mb-4 inline-block text-sm text-indigo-600 hover:underline">&larr; Semua Kursus</a>

{#if coursesStore.detailLoading && !course}
	<p class="text-slate-500">Memuat kursus...</p>
{:else if coursesStore.detailError && !course}
	<p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{coursesStore.detailError}</p>
{:else if course}
	{@const role = getCourseRole(course, authStore.user?.id)}

	<div class="mx-auto max-w-3xl space-y-6">
		<CourseCover cover={course.cover} class="h-52 rounded-xl" />

		<section class="space-y-3">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<h1 class="text-2xl font-bold text-slate-900">{course.title}</h1>

				<div class="flex flex-wrap gap-2">
					{#if role === 'owner'}
						<button type="button" class={secondaryButton} onclick={() => (showCover = true)}>
							<Camera size={16} /> Ubah Sampul
						</button>
						<button type="button" class={secondaryButton} onclick={() => (showEdit = true)}>
							<Pencil size={16} /> Ubah
						</button>
						<button
							type="button"
							class={dangerButton}
							onclick={() => removeCourse(course)}
							disabled={coursesStore.busy.remove}
						>
							<Trash2 size={16} /> Hapus
						</button>
					{:else if role === 'student'}
						<button
							type="button"
							class={dangerButton}
							onclick={() => leaveCourse(course)}
							disabled={coursesStore.busy.student}
						>
							Keluar dari Kursus
						</button>
					{:else}
						<button
							type="button"
							class={primaryButton}
							onclick={() => coursesStore.joinCourse(course.id)}
							disabled={coursesStore.busy.student}
						>
							{coursesStore.busy.student ? 'Memproses...' : 'Ikuti Kursus'}
						</button>
					{/if}
				</div>
			</div>

			<p class="whitespace-pre-line text-slate-600">{course.description}</p>

			<div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
				<span class="inline-flex items-center gap-2">
					<UserAvatar name={course.author.name} photo={course.author.photo} size={24} decorative />
					<span>{course.author.name}</span>
				</span>
				<span class="inline-flex items-center gap-1">
					<Users size={16} /><span>{`${course.students.length} peserta`}</span>
				</span>
				<span class="inline-flex items-center gap-1">
					<Video size={16} /><span>{`${course.total_contents} konten`}</span>
				</span>
				<span class="inline-flex items-center gap-1">
					<Star size={16} /><span
						>{course.avg_ratings ? formatRating(course.avg_ratings) : 'Belum ada rating'}</span
					>
				</span>
				<span class="text-slate-600">{`Dibuat ${formatDate(course.created_at)}`}</span>
			</div>

			{#if role === 'student'}
				{@const progress = Math.min(100, Number(course.my_percentage_finished) || 0)}
				<div>
					<div class="mb-1 flex justify-between text-sm text-slate-600">
						<span>Progres belajar</span>
						<span>{formatPercentage(course.my_percentage_finished)}</span>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-slate-200">
						<div class="h-full bg-indigo-600" style={`width:${progress}%`}></div>
					</div>
				</div>
			{/if}
		</section>

		<!-- Konten -->
		<section class="rounded-xl border border-slate-200 bg-white p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-semibold text-slate-900">Konten Kursus</h2>
				{#if role === 'owner'}
					<button type="button" class={primaryButton} onclick={() => (contentModal = {})}>
						<Plus size={16} /> Tambah Konten
					</button>
				{/if}
			</div>

			{#if course.contents.length === 0}
				<p class="text-sm text-slate-500">Belum ada konten.</p>
			{:else}
				<ul class="divide-y divide-slate-100">
					{#each course.contents as content, i (content.id)}
						<li class="flex items-center gap-3 py-3">
							<span class="w-6 text-sm text-slate-600">{i + 1}</span>

							{#if role === 'visitor'}
								<span class="flex flex-1 items-center gap-2 text-slate-600">
									<Lock size={16} /><span>{content.title}</span>
								</span>
							{:else}
								<a
									href={`/courses/${course.id}/contents/${content.id}`}
									class="flex flex-1 items-center gap-2 text-slate-800 hover:text-indigo-600"
								>
									<Video size={16} /><span>{content.title}</span>
								</a>
							{/if}

							{#if role === 'student' && content.my_status_finished}
								<span class="inline-flex items-center gap-1 text-xs text-green-600">
									<Check size={14} /> Selesai
								</span>
							{/if}

							{#if role === 'owner'}
								<button
									type="button"
									aria-label="Ubah konten"
									class="text-slate-500 hover:text-indigo-600"
									onclick={() => (contentModal = { content })}
								>
									<Pencil size={16} />
								</button>
								<button
									type="button"
									aria-label="Hapus konten"
									class="text-slate-500 hover:text-red-600"
									onclick={() => removeContent(content)}
								>
									<Trash2 size={16} />
								</button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			{#if role === 'visitor'}
				<p class="mt-3 text-sm text-slate-500">Ikuti kursus ini untuk membuka konten.</p>
			{/if}
		</section>

		<!-- Rating -->
		<section class="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
			<h2 class="font-semibold text-slate-900">Rating &amp; Ulasan</h2>

			{#if role === 'student'}
				<form
					onsubmit={(e) => submitRating(e, course)}
					class="space-y-3 rounded-lg bg-slate-50 p-4"
				>
					<p class="text-sm font-medium text-slate-700">Beri rating Anda</p>
					<FormAlert result={ratingResult} />
					{#if ratingResult?.ok}
						<p class="rounded-lg bg-green-50 p-3 text-sm text-green-700">{ratingResult.message}</p>
					{/if}

					<div class="flex gap-1 text-amber-500">
						{#each [1, 2, 3, 4, 5] as n}
							<button type="button" aria-label={`Rating ${n}`} onclick={() => (rating = n)}>
								<Star size={26} fill={n <= rating ? 'currentColor' : 'none'} />
							</button>
						{/each}
					</div>

					<textarea
						rows="2"
						placeholder="Tulis komentar (opsional)"
						bind:value={comment}
						class={inputClass}
					></textarea>

					<button type="submit" class={primaryButton} disabled={coursesStore.busy.rating}>
						{coursesStore.busy.rating ? 'Menyimpan...' : 'Kirim Rating'}
					</button>
				</form>
			{/if}

			{#if course.ratings.length === 0}
				<p class="text-sm text-slate-500">Belum ada ulasan.</p>
			{:else}
				<ul class="space-y-3">
					{#each course.ratings as item}
						<li class="border-b border-slate-100 pb-3 last:border-0">
							<div class="flex items-center justify-between">
								<span class="font-medium text-slate-800">{item.name}</span>
								<span class="flex text-amber-500">
									{#each [1, 2, 3, 4, 5] as n}
										<Star size={14} fill={n <= item.ratings ? 'currentColor' : 'none'} />
									{/each}
								</span>
							</div>
							{#if item.comment}<p class="mt-1 text-sm text-slate-600">{item.comment}</p>{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>

	{#if showEdit}<ChangeModal {course} onclose={() => (showEdit = false)} />{/if}
	{#if showCover}
		<ChangeCoverModal
			courseId={course.id}
			currentCover={course.cover}
			onclose={() => (showCover = false)}
		/>
	{/if}
	{#if contentModal}
		<ContentModal
			courseId={course.id}
			content={contentModal.content}
			onclose={() => (contentModal = null)}
		/>
	{/if}
{/if}

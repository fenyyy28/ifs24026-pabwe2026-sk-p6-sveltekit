<script lang="ts">
	import { untrack } from 'svelte';
	import { Check, ChevronLeft, ChevronRight, Lock } from 'lucide-svelte';
	import { getYoutubeEmbedUrl } from '../../../lib/helpers/toolsHelper';
	import { authStore } from '../../auth/states/authStore.svelte';
	import { coursesStore } from '../states/coursesStore.svelte';
	import type { CourseContent } from '../types';
	import { getCourseRole, primaryButton, secondaryButton } from '../utils';

	let { courseId, contentId }: { courseId: number; contentId: number } = $props();

	const course = $derived(coursesStore.course?.id === courseId ? coursesStore.course : null);
	const content = $derived(coursesStore.content?.id === contentId ? coursesStore.content : null);

	$effect(() => {
		const cId = courseId;
		const ctId = contentId;
		if (authStore.ready && authStore.user) {
			untrack(() => {
				coursesStore.loadDetail(cId, true);
				coursesStore.loadContent(ctId);
			});
		}
	});

	async function toggleStatus(target: CourseContent) {
		await coursesStore.setContentStatus(courseId, contentId, target.my_status_finished ? 0 : 1);
	}
</script>

<svelte:head><title>{`${content?.title ?? 'Konten'} | Delcom Courses`}</title></svelte:head>

<a
	href={`/courses/${courseId}`}
	class="mb-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
>
	<ChevronLeft size={16} /> Kembali ke kursus
</a>

{#if coursesStore.contentError && !content}
	<p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{coursesStore.contentError}</p>
{:else if !content || !course}
	<p class="text-slate-500">Memuat konten...</p>
{:else}
	{@const role = getCourseRole(course, authStore.user?.id)}
	{@const index = course.contents.findIndex((c) => c.id === contentId)}
	{@const prev = index > 0 ? course.contents[index - 1] : null}
	{@const next =
		index >= 0 && index < course.contents.length - 1 ? course.contents[index + 1] : null}
	{@const embedUrl = getYoutubeEmbedUrl(content.youtube)}

	<div class="mx-auto max-w-3xl space-y-4">
		<div>
			<p class="text-sm text-slate-500">{course.title}</p>
			<h1 class="text-2xl font-bold text-slate-900">{content.title}</h1>
		</div>

		{#if role === 'visitor'}
			<div
				class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"
			>
				<Lock size={32} class="text-slate-400" />
				<p class="text-slate-600">Ikuti kursus ini untuk menonton konten.</p>
				<a href={`/courses/${courseId}`} class={primaryButton}>Ke halaman kursus</a>
			</div>
		{:else if embedUrl}
			<div class="aspect-video overflow-hidden rounded-xl bg-black">
				<iframe
					src={embedUrl}
					title={content.title}
					class="h-full w-full"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
				></iframe>
			</div>
		{:else}
			<p class="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
				Tautan tidak dapat diputar di sini.
				<a href={content.youtube} target="_blank" rel="noopener noreferrer" class="underline"
					>Buka di YouTube</a
				>
			</p>
		{/if}

		{#if role === 'student'}
			<button
				type="button"
				onclick={() => toggleStatus(content)}
				disabled={coursesStore.busy.content}
				class={content.my_status_finished ? secondaryButton : primaryButton}
			>
				<Check size={16} />
				<span>{content.my_status_finished ? 'Tandai Belum Selesai' : 'Tandai Selesai'}</span>
			</button>
		{/if}

		<div class="flex justify-between pt-2">
			{#if prev}
				<a href={`/courses/${courseId}/contents/${prev.id}`} class={secondaryButton}>
					<ChevronLeft size={16} /> Sebelumnya
				</a>
			{:else}
				<span></span>
			{/if}

			{#if next}
				<a href={`/courses/${courseId}/contents/${next.id}`} class={secondaryButton}>
					Berikutnya <ChevronRight size={16} />
				</a>
			{/if}
		</div>
	</div>
{/if}

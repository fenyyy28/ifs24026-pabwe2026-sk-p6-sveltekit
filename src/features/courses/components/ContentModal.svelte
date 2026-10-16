<script lang="ts">
	import { useInput } from '../../../lib/hooks/useInput';
	import { getYoutubeId } from '../../../lib/helpers/toolsHelper';
	import { coursesStore } from '../states/coursesStore.svelte';
	import type { CourseContent, MutationResult } from '../types';
	import { inputClass, primaryButton, required, secondaryButton } from '../utils';
	import FormAlert from './FormAlert.svelte';
	import Modal from './Modal.svelte';

	let {
		courseId,
		content = undefined,
		onclose
	}: { courseId: number; content?: CourseContent; onclose: () => void } = $props();

	// svelte-ignore state_referenced_locally
	const isEdit = content !== undefined;

	// svelte-ignore state_referenced_locally
	const { value: title, error: titleError, check: checkTitle } = useInput(content?.title ?? '', required('Judul'));
	// svelte-ignore state_referenced_locally
	const {
		value: youtube,
		error: youtubeError,
		check: checkYoutube
	} = useInput(content?.youtube ?? '', (v) =>
		getYoutubeId(v.trim()) ? null : 'Tautan YouTube tidak valid'
	);

	let result = $state<MutationResult | null>(null);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (![checkTitle(), checkYoutube()].every(Boolean)) return;

		const payload = { title: $title.trim(), youtube: $youtube.trim() };
		result = content
			? await coursesStore.updateContent(courseId, content.id, payload)
			: await coursesStore.addContent(courseId, payload);

		if (result.ok) onclose();
	}
</script>

<Modal title={isEdit ? 'Ubah Konten' : 'Tambah Konten'} {onclose}>
	<form onsubmit={submit} class="space-y-4" novalidate>
		<FormAlert {result} />

		<div>
			<label for="content-title" class="mb-1 block text-sm font-medium">Judul</label>
			<input id="content-title" bind:value={$title} class={inputClass} />
			{#if $titleError}<p class="mt-1 text-sm text-red-600">{$titleError}</p>{/if}
		</div>

		<div>
			<label for="content-yt" class="mb-1 block text-sm font-medium">Tautan YouTube</label>
			<input
				id="content-yt"
				bind:value={$youtube}
				placeholder="https://youtu.be/..."
				class={inputClass}
			/>
			{#if $youtubeError}<p class="mt-1 text-sm text-red-600">{$youtubeError}</p>{/if}
		</div>

		<div class="flex justify-end gap-2">
			<button type="button" class={secondaryButton} onclick={onclose}>Batal</button>
			<button type="submit" class={primaryButton} disabled={coursesStore.busy.content}>
				{coursesStore.busy.content ? 'Menyimpan...' : 'Simpan'}
			</button>
		</div>
	</form>
</Modal>
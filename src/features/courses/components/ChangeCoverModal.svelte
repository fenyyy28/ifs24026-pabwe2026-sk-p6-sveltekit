<script lang="ts">
	import { coursesStore } from '../states/coursesStore.svelte';
	import type { MutationResult } from '../types';
	import { primaryButton, secondaryButton } from '../utils';
	import CourseCover from './CourseCover.svelte';
	import FormAlert from './FormAlert.svelte';
	import Modal from './Modal.svelte';

	let {
		courseId,
		currentCover = null,
		onclose
	}: { courseId: number; currentCover?: string | null; onclose: () => void } = $props();

	let file = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let localError = $state<string | null>(null);
	let result = $state<MutationResult | null>(null);

	$effect(() => {
		if (!file) {
			previewUrl = null;
			return;
		}
		const url = URL.createObjectURL(file);
		previewUrl = url;
		return () => URL.revokeObjectURL(url);
	});

	function pickFile(e: Event) {
		const picked = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
		localError = null;
		if (picked && !picked.type.startsWith('image/')) {
			localError = 'File harus berupa gambar';
			file = null;
			return;
		}
		file = picked;
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!file) {
			localError = 'Pilih gambar terlebih dahulu';
			return;
		}
		result = await coursesStore.changeCover(courseId, file);
		if (result.ok) onclose();
	}
</script>

<Modal title="Ubah Sampul" {onclose}>
	<form onsubmit={submit} class="space-y-4">
		<FormAlert {result} />

		<CourseCover cover={previewUrl ?? currentCover} class="h-40 rounded-lg" />

		<input
			type="file"
			accept="image/*"
			aria-label="Pilih gambar sampul"
			onchange={pickFile}
			class="text-sm"
		/>
		{#if localError}<p class="text-sm text-red-600">{localError}</p>{/if}

		<div class="flex justify-end gap-2">
			<button type="button" class={secondaryButton} onclick={onclose}>Batal</button>
			<button type="submit" class={primaryButton} disabled={coursesStore.busy.cover}>
				{coursesStore.busy.cover ? 'Mengunggah...' : 'Simpan'}
			</button>
		</div>
	</form>
</Modal>

<script lang="ts">
	import { useInput } from '../../../lib/hooks/useInput';
	import { coursesStore } from '../states/coursesStore.svelte';
	import type { Course, MutationResult } from '../types';
	import { inputClass, primaryButton, required, secondaryButton } from '../utils';
	import FormAlert from './FormAlert.svelte';
	import Modal from './Modal.svelte';

	let {
		course,
		onclose
	}: { course: Pick<Course, 'id' | 'title' | 'description'>; onclose: () => void } = $props();

	// Modal dibuat ulang setiap dibuka, jadi nilai awal cukup diambil sekali.
	// svelte-ignore state_referenced_locally
	const { value: title, error: titleError, check: checkTitle } = useInput(course.title, required('Judul'));
	// svelte-ignore state_referenced_locally
	const {
		value: description,
		error: descriptionError,
		check: checkDescription
	} = useInput(course.description, required('Deskripsi'));

	let result = $state<MutationResult | null>(null);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (![checkTitle(), checkDescription()].every(Boolean)) return;

		result = await coursesStore.updateCourse(course.id, {
			title: $title.trim(),
			description: $description.trim()
		});
		if (result.ok) onclose();
	}
</script>

<Modal title="Ubah Kursus" {onclose}>
	<form onsubmit={submit} class="space-y-4" novalidate>
		<FormAlert {result} />

		<div>
			<label for="edit-title" class="mb-1 block text-sm font-medium">Judul</label>
			<input id="edit-title" bind:value={$title} class={inputClass} />
			{#if $titleError}<p class="mt-1 text-sm text-red-600">{$titleError}</p>{/if}
		</div>

		<div>
			<label for="edit-desc" class="mb-1 block text-sm font-medium">Deskripsi</label>
			<textarea id="edit-desc" rows="4" bind:value={$description} class={inputClass}></textarea>
			{#if $descriptionError}<p class="mt-1 text-sm text-red-600">{$descriptionError}</p>{/if}
		</div>

		<div class="flex justify-end gap-2">
			<button type="button" class={secondaryButton} onclick={onclose}>Batal</button>
			<button type="submit" class={primaryButton} disabled={coursesStore.busy.change}>
				{coursesStore.busy.change ? 'Menyimpan...' : 'Simpan'}
			</button>
		</div>
	</form>
</Modal>
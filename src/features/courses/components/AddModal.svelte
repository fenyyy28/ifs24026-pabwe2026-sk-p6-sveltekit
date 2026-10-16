<script lang="ts">
	import { useInput } from '../../../lib/hooks/useInput';
	import { coursesStore } from '../states/coursesStore.svelte';
	import type { MutationResult } from '../types';
	import { inputClass, primaryButton, required, secondaryButton } from '../utils';
	import FormAlert from './FormAlert.svelte';
	import Modal from './Modal.svelte';

	let { onclose }: { onclose: () => void } = $props();

	const { value: title, error: titleError, check: checkTitle } = useInput('', required('Judul'));
	const {
		value: description,
		error: descriptionError,
		check: checkDescription
	} = useInput('', required('Deskripsi'));

	let result = $state<MutationResult | null>(null);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (![checkTitle(), checkDescription()].every(Boolean)) return;

		result = await coursesStore.addCourse({
			title: $title.trim(),
			description: $description.trim()
		});
		if (result.ok) onclose();
	}
</script>

<Modal title="Tambah Kursus" {onclose}>
	<form onsubmit={submit} class="space-y-4" novalidate>
		<FormAlert {result} />

		<div>
			<label for="add-title" class="mb-1 block text-sm font-medium">Judul</label>
			<input id="add-title" bind:value={$title} class={inputClass} />
			{#if $titleError}<p class="mt-1 text-sm text-red-600">{$titleError}</p>{/if}
		</div>

		<div>
			<label for="add-desc" class="mb-1 block text-sm font-medium">Deskripsi</label>
			<textarea id="add-desc" rows="4" bind:value={$description} class={inputClass}></textarea>
			{#if $descriptionError}<p class="mt-1 text-sm text-red-600">{$descriptionError}</p>{/if}
		</div>

		<div class="flex justify-end gap-2">
			<button type="button" class={secondaryButton} onclick={onclose}>Batal</button>
			<button type="submit" class={primaryButton} disabled={coursesStore.busy.add}>
				{coursesStore.busy.add ? 'Menyimpan...' : 'Simpan'}
			</button>
		</div>
	</form>
</Modal>
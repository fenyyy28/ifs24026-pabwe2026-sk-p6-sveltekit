<script lang="ts">
	import { get } from 'svelte/store';
	import { useInput } from '../../../lib/hooks/useInput';
	import { authStore } from '../../auth/states/authStore.svelte';
	import NoticeBox from '../components/NoticeBox.svelte';
	import UserAvatar from '../components/UserAvatar.svelte';
	import { profileStore } from '../states/profileStore.svelte';

	const required = (label: string) => (v: string) => (v.trim() ? null : `${label} wajib diisi`);

	/* ---- Informasi profil ---- */
	const { value: name, error: nameError, check: checkName } = useInput('', required('Nama'));
	const { value: email, error: emailError, check: checkEmail } = useInput('', required('Email'));

	let synced = false;
	$effect(() => {
		if (authStore.user && !synced) {
			name.set(authStore.user.name);
			email.set(authStore.user.email);
			synced = true;
		}
	});

	async function saveProfile(e: SubmitEvent) {
		e.preventDefault();
		if (![checkName(), checkEmail()].every(Boolean)) return;
		await profileStore.updateProfile($name.trim(), $email.trim());
	}

	/* ---- Foto ---- */
	let file = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let photoError = $state<string | null>(null);

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
		photoError = null;
		if (picked && !picked.type.startsWith('image/')) {
			photoError = 'File harus berupa gambar';
			file = null;
			return;
		}
		file = picked;
	}

	async function savePhoto(e: SubmitEvent) {
		e.preventDefault();
		if (!file) {
			photoError = 'Pilih foto terlebih dahulu';
			return;
		}
		if (await profileStore.changePhoto(file)) file = null;
	}

	/* ---- Kata sandi ---- */
	const {
		value: currentPassword,
		error: currentError,
		check: checkCurrent,
		reset: resetCurrent
	} = useInput('', required('Kata sandi saat ini'));
	const {
		value: newPassword,
		error: newError,
		check: checkNew,
		reset: resetNew
	} = useInput('', required('Kata sandi baru'));
	const {
		value: confirmPassword,
		error: confirmError,
		check: checkConfirm,
		reset: resetConfirm
	} = useInput('', (v) => (v === get(newPassword) ? null : 'Konfirmasi kata sandi tidak sama'));

	async function savePassword(e: SubmitEvent) {
		e.preventDefault();
		if (![checkCurrent(), checkNew(), checkConfirm()].every(Boolean)) return;
		if (await profileStore.changePassword($currentPassword, $newPassword)) {
			resetCurrent();
			resetNew();
			resetConfirm();
		}
	}

	const inputClass =
		'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500';
	const buttonClass =
		'rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60';
</script>

<svelte:head><title>Profil | Delcom Courses</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<h1 class="text-2xl font-bold text-slate-900">Profil</h1>

	<!-- Informasi profil -->
	<form
		onsubmit={saveProfile}
		class="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
		novalidate
	>
		<h2 class="font-semibold">Informasi Profil</h2>
		<NoticeBox notice={profileStore.notices.profile} />

		<div>
			<label for="name" class="mb-1 block text-sm font-medium">Nama</label>
			<input id="name" bind:value={$name} class={inputClass} />
			{#if $nameError}<p class="mt-1 text-sm text-red-600">{$nameError}</p>{/if}
		</div>
		<div>
			<label for="email" class="mb-1 block text-sm font-medium">Email</label>
			<input id="email" type="email" bind:value={$email} class={inputClass} />
			{#if $emailError}<p class="mt-1 text-sm text-red-600">{$emailError}</p>{/if}
		</div>

		<button type="submit" disabled={profileStore.saving === 'profile'} class={buttonClass}>
			{profileStore.saving === 'profile' ? 'Menyimpan...' : 'Simpan'}
		</button>
	</form>

	<!-- Foto -->
	<form onsubmit={savePhoto} class="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
		<h2 class="font-semibold">Foto Profil</h2>
		<NoticeBox notice={profileStore.notices.photo} />

		<div class="flex items-center gap-4">
			<UserAvatar
				name={authStore.user?.name ?? ''}
				photo={previewUrl ?? authStore.user?.photo}
				size={72}
			/>
			<input
				type="file"
				accept="image/*"
				aria-label="Pilih foto profil"
				onchange={pickFile}
				class="text-sm"
			/>
		</div>
		{#if photoError}<p class="text-sm text-red-600">{photoError}</p>{/if}

		<button type="submit" disabled={profileStore.saving === 'photo'} class={buttonClass}>
			{profileStore.saving === 'photo' ? 'Mengunggah...' : 'Ganti Foto'}
		</button>
	</form>

	<!-- Kata sandi -->
	<form
		onsubmit={savePassword}
		class="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
		novalidate
	>
		<h2 class="font-semibold">Ganti Kata Sandi</h2>
		<NoticeBox notice={profileStore.notices.password} />

		<div>
			<label for="current" class="mb-1 block text-sm font-medium">Kata sandi saat ini</label>
			<input id="current" type="password" bind:value={$currentPassword} class={inputClass} />
			{#if $currentError}<p class="mt-1 text-sm text-red-600">{$currentError}</p>{/if}
		</div>
		<div>
			<label for="new" class="mb-1 block text-sm font-medium">Kata sandi baru</label>
			<input id="new" type="password" bind:value={$newPassword} class={inputClass} />
			{#if $newError}<p class="mt-1 text-sm text-red-600">{$newError}</p>{/if}
		</div>
		<div>
			<label for="confirm" class="mb-1 block text-sm font-medium">Konfirmasi kata sandi baru</label>
			<input id="confirm" type="password" bind:value={$confirmPassword} class={inputClass} />
			{#if $confirmError}<p class="mt-1 text-sm text-red-600">{$confirmError}</p>{/if}
		</div>

		<button type="submit" disabled={profileStore.saving === 'password'} class={buttonClass}>
			{profileStore.saving === 'password' ? 'Menyimpan...' : 'Ganti Kata Sandi'}
		</button>
	</form>
</div>

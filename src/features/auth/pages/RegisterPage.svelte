<script lang="ts">
	import { goto } from '$app/navigation';
	import { useInput } from '../../../lib/hooks/useInput';
	import AuthSessionRedirect from '../components/AuthSessionRedirect.svelte';
	import AuthLayout from '../layouts/AuthLayout.svelte';
	import { authStore } from '../states/authStore.svelte';

	const required = (label: string) => (v: string) => (v.trim() ? null : `${label} wajib diisi`);

	const { value: name, error: nameError, check: checkName } = useInput('', required('Nama'));
	const { value: email, error: emailError, check: checkEmail } = useInput('', required('Email'));
	const {
		value: password,
		error: passwordError,
		check: checkPassword
	} = useInput('', required('Kata sandi'));

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const valid = [checkName(), checkEmail(), checkPassword()].every(Boolean);
		if (!valid) return;

		const ok = await authStore.register({
			name: $name.trim(),
			email: $email.trim(),
			password: $password
		});
		if (ok) await goto('/auth/login');
	}
</script>

<svelte:head><title>Daftar | Delcom Courses</title></svelte:head>

<AuthSessionRedirect mode="guest" />

<AuthLayout title="Daftar" subtitle="Buat akun untuk mulai belajar atau mengajar.">
	<form onsubmit={handleSubmit} class="space-y-4" novalidate>
		{#if authStore.error}
			<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
				<p>{authStore.error}</p>
				{#each authStore.fieldErrors as msg}<p>{msg}</p>{/each}
			</div>
		{/if}

		<div>
			<label for="name" class="mb-1 block text-sm font-medium">Nama</label>
			<input
				id="name"
				bind:value={$name}
				class="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
			/>
			{#if $nameError}<p class="mt-1 text-sm text-red-600">{$nameError}</p>{/if}
		</div>

		<div>
			<label for="email" class="mb-1 block text-sm font-medium">Email</label>
			<input
				id="email"
				type="email"
				bind:value={$email}
				class="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
			/>
			{#if $emailError}<p class="mt-1 text-sm text-red-600">{$emailError}</p>{/if}
		</div>

		<div>
			<label for="password" class="mb-1 block text-sm font-medium">Kata sandi</label>
			<input
				id="password"
				type="password"
				bind:value={$password}
				class="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
			/>
			{#if $passwordError}<p class="mt-1 text-sm text-red-600">{$passwordError}</p>{/if}
		</div>

		<button
			type="submit"
			disabled={authStore.loading}
			class="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
		>
			{authStore.loading ? 'Memproses...' : 'Daftar'}
		</button>

		<p class="text-center text-sm text-slate-500">
			Sudah punya akun?
			<a href="/auth/login" class="font-medium text-indigo-600 hover:underline">Masuk</a>
		</p>
	</form>
</AuthLayout>
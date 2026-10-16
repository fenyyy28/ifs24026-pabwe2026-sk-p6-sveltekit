<script lang="ts">
	import { useInput } from '../../../lib/hooks/useInput';
	import AuthSessionRedirect from '../components/AuthSessionRedirect.svelte';
	import AuthLayout from '../layouts/AuthLayout.svelte';
	import { authStore } from '../states/authStore.svelte';

	const required = (label: string) => (v: string) => (v.trim() ? null : `${label} wajib diisi`);

	const { value: email, error: emailError, check: checkEmail } = useInput('', required('Email'));
	const {
		value: password,
		error: passwordError,
		check: checkPassword
	} = useInput('', required('Kata sandi'));

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const valid = [checkEmail(), checkPassword()].every(Boolean);
		if (!valid) return;
		await authStore.login($email.trim(), $password);
	}
</script>

<svelte:head><title>Masuk | Delcom Courses</title></svelte:head>

<AuthSessionRedirect mode="guest" />

<AuthLayout title="Masuk" subtitle="Lanjutkan belajar di akun Anda.">
	<form onsubmit={handleSubmit} class="space-y-4" novalidate>
		{#if authStore.error}
			<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
				<p>{authStore.error}</p>
				{#each authStore.fieldErrors as msg}<p>{msg}</p>{/each}
			</div>
		{/if}

		<div>
			<label for="login-email-input" class="mb-1 block text-sm font-medium">Email</label>
			<input
				id="login-email-input"
				type="email"
				bind:value={$email}
				class="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
			/>
			{#if $emailError}<p class="mt-1 text-sm text-red-600">{$emailError}</p>{/if}
		</div>

		<div>
			<label for="login-password-input" class="mb-1 block text-sm font-medium">Kata sandi</label>
			<input
				id="login-password-input"
				type="password"
				bind:value={$password}
				class="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
			/>
			{#if $passwordError}<p class="mt-1 text-sm text-red-600">{$passwordError}</p>{/if}
		</div>

		<button
			id="login-submit-button"
			type="submit"
			disabled={authStore.loading}
			class="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
		>
			{authStore.loading ? 'Memproses...' : 'Masuk'}
		</button>

		<p class="text-center text-sm text-slate-500">
			Belum punya akun?
			<a href="/auth/register" class="font-medium text-indigo-600 hover:underline">Daftar</a>
		</p>
	</form>
</AuthLayout>
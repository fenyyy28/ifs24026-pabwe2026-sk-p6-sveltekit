import { goto } from '$app/navigation';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, ok } from '../../../test/api';
import { authApi } from '../api/authApi';
import { authStore } from '../states/authStore.svelte';
import RegisterPage from './RegisterPage.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('../api/authApi', () => ({
	authApi: { register: vi.fn(), login: vi.fn(), me: vi.fn() }
}));

beforeEach(() => {
	vi.resetAllMocks();
	authStore.user = null;
	authStore.ready = false;
	authStore.loading = false;
	authStore.error = null;
	authStore.fieldErrors = [];
});

async function fillForm() {
	const user = userEvent.setup();
	await user.type(screen.getByLabelText('Nama'), ' Ani ');
	await user.type(screen.getByLabelText('Email'), ' ani@mail.com ');
	await user.type(screen.getByLabelText('Kata sandi'), 'rahasia');
	await user.click(screen.getByRole('button', { name: 'Daftar' }));
}

describe('RegisterPage', () => {
	it('menampilkan judul, formulir, dan tautan ke halaman masuk', () => {
		render(RegisterPage);

		expect(screen.getByRole('heading', { level: 1, name: 'Daftar' })).toBeInTheDocument();
		expect(screen.getByLabelText('Nama')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Masuk' })).toHaveAttribute('href', '/auth/login');
	});

	it('menolak isian kosong', async () => {
		const user = userEvent.setup();
		render(RegisterPage);

		await user.click(screen.getByRole('button', { name: 'Daftar' }));

		expect(screen.getByText('Nama wajib diisi')).toBeInTheDocument();
		expect(screen.getByText('Email wajib diisi')).toBeInTheDocument();
		expect(screen.getByText('Kata sandi wajib diisi')).toBeInTheDocument();
		expect(authApi.register).not.toHaveBeenCalled();
	});

	it('mendaftar lalu diarahkan ke halaman masuk', async () => {
		vi.mocked(authApi.register).mockResolvedValue(ok());
		render(RegisterPage);

		await fillForm();

		await waitFor(() => expect(goto).toHaveBeenCalledWith('/auth/login'));
		expect(authApi.register).toHaveBeenCalledWith({
			name: 'Ani',
			email: 'ani@mail.com',
			password: 'rahasia'
		});
	});

	it('menampilkan error dan tidak berpindah halaman jika gagal', async () => {
		vi.mocked(authApi.register).mockResolvedValue(fail('Email dipakai', { email: ['sudah ada'] }));
		render(RegisterPage);

		await fillForm();

		expect(await screen.findByText('Email dipakai')).toBeInTheDocument();
		expect(screen.getByText('sudah ada')).toBeInTheDocument();
		expect(goto).not.toHaveBeenCalledWith('/auth/login');
	});

	it('menonaktifkan tombol saat memproses', () => {
		authStore.loading = true;
		render(RegisterPage);

		expect(screen.getByRole('button', { name: 'Memproses...' })).toBeDisabled();
	});
});

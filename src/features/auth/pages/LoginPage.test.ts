import { goto } from '$app/navigation';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, ok } from '../../../test/api';
import { me } from '../../../test/fixtures';
import { authApi } from '../api/authApi';
import { authStore } from '../states/authStore.svelte';
import LoginPage from './LoginPage.svelte';

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

describe('LoginPage', () => {
	it('menampilkan judul, formulir, dan tautan ke pendaftaran', () => {
		render(LoginPage);

		expect(screen.getByRole('heading', { level: 1, name: 'Masuk' })).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText('Kata sandi')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Daftar' })).toHaveAttribute('href', '/auth/register');
	});

	it('menolak isian kosong', async () => {
		const user = userEvent.setup();
		render(LoginPage);

		await user.click(screen.getByRole('button', { name: 'Masuk' }));

		expect(screen.getByText('Email wajib diisi')).toBeInTheDocument();
		expect(screen.getByText('Kata sandi wajib diisi')).toBeInTheDocument();
		expect(authApi.login).not.toHaveBeenCalled();
	});

	it('masuk lalu diarahkan ke beranda setelah profil tersedia', async () => {
		vi.mocked(authApi.login).mockResolvedValue(ok({ token: 'tok' }));
		vi.mocked(authApi.me).mockResolvedValue(ok({ user: me }));
		const user = userEvent.setup();
		render(LoginPage);

		await user.type(screen.getByLabelText('Email'), ' ani@mail.com ');
		await user.type(screen.getByLabelText('Kata sandi'), 'rahasia');
		await user.click(screen.getByRole('button', { name: 'Masuk' }));

		await waitFor(() => expect(goto).toHaveBeenCalledWith('/'));
		expect(authApi.login).toHaveBeenCalledWith({ email: 'ani@mail.com', password: 'rahasia' });
	});

	it('menampilkan pesan error dan daftar field jika gagal', async () => {
		vi.mocked(authApi.login).mockResolvedValue(fail('Kredensial salah', { email: ['tidak cocok'] }));
		const user = userEvent.setup();
		render(LoginPage);

		await user.type(screen.getByLabelText('Email'), 'a@b.c');
		await user.type(screen.getByLabelText('Kata sandi'), 'salah');
		await user.click(screen.getByRole('button', { name: 'Masuk' }));

		expect(await screen.findByText('Kredensial salah')).toBeInTheDocument();
		expect(screen.getByText('tidak cocok')).toBeInTheDocument();
		expect(goto).not.toHaveBeenCalled();
	});

	it('menonaktifkan tombol saat memproses', () => {
		authStore.loading = true;
		render(LoginPage);

		expect(screen.getByRole('button', { name: 'Memproses...' })).toBeDisabled();
	});

	it('langsung diarahkan ke beranda jika sudah login', async () => {
		authStore.user = me;
		authStore.ready = true;
		render(LoginPage);

		await waitFor(() => expect(goto).toHaveBeenCalledWith('/'));
	});
});

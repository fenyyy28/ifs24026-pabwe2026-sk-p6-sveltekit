import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, ok } from '../../../test/api';
import { me } from '../../../test/fixtures';
import { authStore } from '../../auth/states/authStore.svelte';
import { usersApi } from '../api/usersApi';
import { usersStore } from '../states/usersStore.svelte';
import UsersPage from './UsersPage.svelte';

vi.mock('../api/usersApi', () => ({ usersApi: { list: vi.fn() } }));

const users = [
	{ id: 1, name: 'Ani', email: 'ani@mail.com', photo: null },
	{ id: 2, name: 'Budi', email: 'budi@kampus.id', photo: null }
];

beforeEach(() => {
	vi.resetAllMocks();
	authStore.user = me;
	authStore.ready = true;
	usersStore.users = [];
	usersStore.loading = false;
	usersStore.error = null;
	vi.mocked(usersApi.list).mockResolvedValue(ok({ users }));
});

describe('UsersPage', () => {
	it('menampilkan daftar pengguna dan menandai pengguna saat ini', async () => {
		render(UsersPage);

		expect(await screen.findByText('Budi')).toBeInTheDocument();
		expect(screen.getByText('ani@mail.com')).toBeInTheDocument();
		expect(screen.getAllByText('(Anda)')).toHaveLength(1);
		expect(screen.getByText('Ani')).toBeInTheDocument();
	});

	it('menampilkan status memuat', async () => {
		vi.mocked(usersApi.list).mockReturnValue(new Promise(() => {}) as never);
		render(UsersPage);

		expect(await screen.findByText('Memuat pengguna...')).toBeInTheDocument();
	});

	it('menampilkan pesan error', async () => {
		vi.mocked(usersApi.list).mockResolvedValue(fail('Gagal memuat pengguna'));
		render(UsersPage);

		expect(await screen.findByText('Gagal memuat pengguna')).toBeInTheDocument();
	});

	it('menampilkan pesan kosong jika tidak ada pengguna', async () => {
		vi.mocked(usersApi.list).mockResolvedValue(ok({ users: [] }));
		render(UsersPage);

		expect(await screen.findByText('Tidak ada pengguna ditemukan.')).toBeInTheDocument();
	});

	it('mencari berdasarkan nama atau email', async () => {
		const user = userEvent.setup();
		render(UsersPage);
		await screen.findByText('Budi');

		await user.type(screen.getByPlaceholderText('Cari nama atau email...'), 'budi');
		await waitFor(() => expect(screen.queryByText('Ani')).not.toBeInTheDocument());
		expect(screen.getByText('Budi')).toBeInTheDocument();

		await user.clear(screen.getByPlaceholderText('Cari nama atau email...'));
		await user.type(screen.getByPlaceholderText('Cari nama atau email...'), 'zzz');
		expect(await screen.findByText('Tidak ada pengguna ditemukan.')).toBeInTheDocument();
	});

	it('tidak memuat data sebelum sesi siap', async () => {
		authStore.ready = false;
		render(UsersPage);
		await tick();

		expect(usersApi.list).not.toHaveBeenCalled();
	});

	it('tidak memuat data jika belum login', async () => {
		authStore.user = null;
		render(UsersPage);
		await tick();

		expect(usersApi.list).not.toHaveBeenCalled();
	});
});

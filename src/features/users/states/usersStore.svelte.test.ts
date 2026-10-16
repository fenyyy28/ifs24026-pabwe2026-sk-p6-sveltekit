import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usersApi } from '../api/usersApi';
import { usersStore } from './usersStore.svelte';

vi.mock('../api/usersApi', () => ({ usersApi: { list: vi.fn() } }));

const users = [
	{ id: 1, name: 'Ani', email: 'ani@mail.com' },
	{ id: 2, name: 'Budi', email: 'budi@kampus.id' }
];

beforeEach(() => {
	vi.resetAllMocks();
	usersStore.users = [];
	usersStore.loading = false;
	usersStore.error = null;
});

describe('loadUsers', () => {
	it('mengisi daftar pengguna', async () => {
		vi.mocked(usersApi.list).mockResolvedValue({ status: 'success', message: 'OK', data: { users } });

		await usersStore.loadUsers();

		expect(usersStore.users).toEqual(users);
		expect(usersStore.error).toBeNull();
		expect(usersStore.loading).toBe(false);
	});

	it('menjadi daftar kosong jika data tidak ada', async () => {
		vi.mocked(usersApi.list).mockResolvedValue({ status: 'success', message: 'OK' });

		await usersStore.loadUsers();

		expect(usersStore.users).toEqual([]);
	});

	it('menyimpan pesan error saat gagal', async () => {
		vi.mocked(usersApi.list).mockResolvedValue({ status: 'fail', message: 'Gagal memuat' });

		await usersStore.loadUsers();

		expect(usersStore.error).toBe('Gagal memuat');
		expect(usersStore.loading).toBe(false);
	});

	it('loading bernilai true selama permintaan', async () => {
		let seen = false;
		vi.mocked(usersApi.list).mockImplementation(async () => {
			seen = usersStore.loading;
			return { status: 'success', message: 'OK', data: { users } };
		});

		await usersStore.loadUsers();

		expect(seen).toBe(true);
	});
});

describe('filter', () => {
	beforeEach(() => {
		usersStore.users = users;
	});

	it('mengembalikan semua jika kata kunci kosong', () => {
		expect(usersStore.filter('   ')).toEqual(users);
	});

	it('mencari berdasarkan nama tanpa memperhatikan huruf besar', () => {
		expect(usersStore.filter('ANI')).toEqual([users[0]]);
	});

	it('mencari berdasarkan email', () => {
		expect(usersStore.filter('kampus')).toEqual([users[1]]);
	});

	it('kosong jika tidak ada yang cocok', () => {
		expect(usersStore.filter('zzz')).toEqual([]);
	});
});
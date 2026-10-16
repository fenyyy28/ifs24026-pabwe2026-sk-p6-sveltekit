import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiResponse } from '../../../lib/helpers/apiHelper';
import { getAuthToken, setAuthToken } from '../../../lib/helpers/toolsHelper';
import { authApi } from '../api/authApi';
import { authStore } from './authStore.svelte';

vi.mock('../api/authApi', () => ({
	authApi: { register: vi.fn(), login: vi.fn(), me: vi.fn() }
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ok = (data?: unknown): ApiResponse<any> => ({ status: 'success', message: 'OK', data });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fail = (message = 'Gagal', data?: unknown): ApiResponse<any> => ({
	status: 'fail',
	message,
	data
});

const user = { id: 1, name: 'Ani', email: 'ani@mail.com' };

beforeEach(() => {
	vi.resetAllMocks();
	authStore.user = null;
	authStore.loading = false;
	authStore.ready = false;
	authStore.error = null;
	authStore.fieldErrors = [];
});

describe('init', () => {
	it('tanpa token: langsung siap tanpa memanggil API', async () => {
		await authStore.init();

		expect(authStore.ready).toBe(true);
		expect(authStore.user).toBeNull();
		expect(authApi.me).not.toHaveBeenCalled();
	});

	it('dengan token: memuat profil', async () => {
		setAuthToken('tok');
		vi.mocked(authApi.me).mockResolvedValue(ok({ user }));

		await authStore.init();

		expect(authStore.user).toEqual(user);
		expect(authStore.ready).toBe(true);
	});

	it('tidak berjalan lagi jika sudah siap', async () => {
		authStore.ready = true;
		setAuthToken('tok');

		await authStore.init();

		expect(authApi.me).not.toHaveBeenCalled();
	});

	it('pemanggilan bersamaan hanya memuat sekali', async () => {
		setAuthToken('tok');
		vi.mocked(authApi.me).mockResolvedValue(ok({ user }));

		await Promise.all([authStore.init(), authStore.init()]);

		expect(authApi.me).toHaveBeenCalledOnce();
	});
});

describe('loadProfile', () => {
	it('berhasil', async () => {
		vi.mocked(authApi.me).mockResolvedValue(ok({ user }));

		expect(await authStore.loadProfile()).toBe(true);
		expect(authStore.user).toEqual(user);
	});

	it('gagal: token dibuang dan pengguna dikosongkan', async () => {
		setAuthToken('tok');
		authStore.user = user;
		vi.mocked(authApi.me).mockResolvedValue(fail());

		expect(await authStore.loadProfile()).toBe(false);
		expect(authStore.user).toBeNull();
		expect(getAuthToken()).toBeNull();
	});

	it('dianggap gagal jika data pengguna tidak ada', async () => {
		vi.mocked(authApi.me).mockResolvedValue(ok({}));

		expect(await authStore.loadProfile()).toBe(false);
	});
});

describe('login', () => {
	it('berhasil: menyimpan token dan memuat profil', async () => {
		vi.mocked(authApi.login).mockResolvedValue(ok({ token: 'tok' }));
		vi.mocked(authApi.me).mockResolvedValue(ok({ user }));

		expect(await authStore.login('a@b.c', 'rahasia')).toBe(true);

		expect(authApi.login).toHaveBeenCalledWith({ email: 'a@b.c', password: 'rahasia' });
		expect(getAuthToken()).toBe('tok');
		expect(authStore.user).toEqual(user);
		expect(authStore.ready).toBe(true);
		expect(authStore.loading).toBe(false);
		expect(authStore.error).toBeNull();
	});

	it('loading bernilai true selama permintaan', async () => {
		let seen = false;
		vi.mocked(authApi.login).mockImplementation(async () => {
			seen = authStore.loading;
			return fail();
		});

		await authStore.login('a', 'b');

		expect(seen).toBe(true);
	});

	it('gagal: menyimpan pesan dan daftar error field', async () => {
		vi.mocked(authApi.login).mockResolvedValue(fail('Kredensial salah', { email: ['tidak cocok'] }));

		expect(await authStore.login('a@b.c', 'x')).toBe(false);

		expect(authStore.error).toBe('Kredensial salah');
		expect(authStore.fieldErrors).toEqual(['tidak cocok']);
		expect(authStore.loading).toBe(false);
		expect(getAuthToken()).toBeNull();
	});

	it('dianggap gagal jika respons sukses tanpa token', async () => {
		vi.mocked(authApi.login).mockResolvedValue(ok({}));

		expect(await authStore.login('a', 'b')).toBe(false);
		expect(authApi.me).not.toHaveBeenCalled();
	});

	it('gagal jika profil tidak bisa dimuat', async () => {
		vi.mocked(authApi.login).mockResolvedValue(ok({ token: 'tok' }));
		vi.mocked(authApi.me).mockResolvedValue(fail());

		expect(await authStore.login('a', 'b')).toBe(false);

		expect(authStore.error).toBe('Gagal memuat profil pengguna');
		expect(authStore.ready).toBe(true);
		expect(authStore.loading).toBe(false);
	});
});

describe('register', () => {
	const payload = { name: 'Ani', email: 'a@b.c', password: 'rahasia' };

	it('berhasil', async () => {
		vi.mocked(authApi.register).mockResolvedValue(ok());

		expect(await authStore.register(payload)).toBe(true);
		expect(authApi.register).toHaveBeenCalledWith(payload);
		expect(authStore.loading).toBe(false);
	});

	it('gagal', async () => {
		vi.mocked(authApi.register).mockResolvedValue(fail('Email dipakai', { email: ['sudah ada'] }));

		expect(await authStore.register(payload)).toBe(false);
		expect(authStore.error).toBe('Email dipakai');
		expect(authStore.fieldErrors).toEqual(['sudah ada']);
		expect(authStore.loading).toBe(false);
	});
});

describe('logout', () => {
	it('menghapus token dan pengguna', () => {
		setAuthToken('tok');
		authStore.user = user;

		authStore.logout();

		expect(getAuthToken()).toBeNull();
		expect(authStore.user).toBeNull();
	});
});

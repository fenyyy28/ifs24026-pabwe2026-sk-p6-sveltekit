import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStore } from '../../auth/states/authStore.svelte';
import { usersApi } from '../api/usersApi';
import { profileStore } from './profileStore.svelte';

vi.mock('../api/usersApi', () => ({
	usersApi: { updateProfile: vi.fn(), changePhoto: vi.fn(), changePassword: vi.fn() }
}));
vi.mock('../../auth/states/authStore.svelte', () => ({
	authStore: { loadProfile: vi.fn() }
}));

const ok = { status: 'success' as const, message: 'Berhasil' };
const fail = { status: 'fail' as const, message: 'Gagal', data: { email: ['sudah dipakai'] } };

beforeEach(() => {
	vi.resetAllMocks();
	profileStore.saving = null;
	profileStore.notices = {};
});

describe('updateProfile', () => {
	it('berhasil: memuat ulang profil dan menampilkan notifikasi sukses', async () => {
		vi.mocked(usersApi.updateProfile).mockResolvedValue(ok);

		const result = await profileStore.updateProfile('Ani', 'a@b.c');

		expect(result).toBe(true);
		expect(usersApi.updateProfile).toHaveBeenCalledWith({ name: 'Ani', email: 'a@b.c' });
		expect(authStore.loadProfile).toHaveBeenCalledOnce();
		expect(profileStore.notices.profile).toEqual({ type: 'success', text: 'Berhasil', fields: [] });
		expect(profileStore.saving).toBeNull();
	});

	it('gagal: tidak memuat ulang profil dan menampilkan error beserta field-nya', async () => {
		vi.mocked(usersApi.updateProfile).mockResolvedValue(fail);

		const result = await profileStore.updateProfile('Ani', 'a@b.c');

		expect(result).toBe(false);
		expect(authStore.loadProfile).not.toHaveBeenCalled();
		expect(profileStore.notices.profile).toEqual({
			type: 'error',
			text: 'Gagal',
			fields: ['sudah dipakai']
		});
	});

	it('saving terisi nama bagian selama permintaan', async () => {
		let seen: string | null = null;
		vi.mocked(usersApi.updateProfile).mockImplementation(async () => {
			seen = profileStore.saving;
			return ok;
		});

		await profileStore.updateProfile('Ani', 'a@b.c');

		expect(seen).toBe('profile');
	});
});

describe('changePhoto', () => {
	it('berhasil dan memuat ulang profil', async () => {
		vi.mocked(usersApi.changePhoto).mockResolvedValue(ok);
		const file = new File(['x'], 'f.png', { type: 'image/png' });

		expect(await profileStore.changePhoto(file)).toBe(true);
		expect(usersApi.changePhoto).toHaveBeenCalledWith(file);
		expect(authStore.loadProfile).toHaveBeenCalledOnce();
		expect(profileStore.notices.photo?.type).toBe('success');
	});
});

describe('changePassword', () => {
	it('berhasil tanpa memuat ulang profil', async () => {
		vi.mocked(usersApi.changePassword).mockResolvedValue(ok);

		expect(await profileStore.changePassword('lama', 'baru')).toBe(true);
		expect(usersApi.changePassword).toHaveBeenCalledWith({ password: 'lama', new_password: 'baru' });
		expect(authStore.loadProfile).not.toHaveBeenCalled();
	});

	it('gagal', async () => {
		vi.mocked(usersApi.changePassword).mockResolvedValue(fail);

		expect(await profileStore.changePassword('lama', 'baru')).toBe(false);
		expect(profileStore.notices.password?.type).toBe('error');
	});
});

describe('clearNotice', () => {
	it('menghapus notifikasi satu bagian', async () => {
		vi.mocked(usersApi.changePassword).mockResolvedValue(ok);
		await profileStore.changePassword('a', 'b');

		profileStore.clearNotice('password');

		expect(profileStore.notices.password).toBeUndefined();
	});
});
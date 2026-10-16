import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPost, apiPut } from '../../../lib/helpers/apiHelper';
import { usersApi } from './usersApi';

vi.mock('../../../lib/helpers/apiHelper', () => ({
	apiGet: vi.fn(),
	apiPost: vi.fn(),
	apiPut: vi.fn()
}));

beforeEach(() => vi.clearAllMocks());

describe('usersApi', () => {
	it('list', () => {
		usersApi.list();
		expect(apiGet).toHaveBeenCalledWith('/users');
	});

	it('updateProfile', () => {
		usersApi.updateProfile({ name: 'Ani', email: 'a@b.c' });
		expect(apiPut).toHaveBeenCalledWith('/users/me', { name: 'Ani', email: 'a@b.c' });
	});

	it('changePhoto mengirim FormData berisi berkas', () => {
		const file = new File(['x'], 'foto.png', { type: 'image/png' });
		usersApi.changePhoto(file);

		const [path, body] = vi.mocked(apiPost).mock.calls[0];
		expect(path).toBe('/users/me/photo');
		expect((body as FormData).get('photo')).toBe(file);
	});

	it('changePassword', () => {
		usersApi.changePassword({ password: 'lama', new_password: 'baru' });
		expect(apiPut).toHaveBeenCalledWith('/users/password', {
			password: 'lama',
			new_password: 'baru'
		});
	});
});
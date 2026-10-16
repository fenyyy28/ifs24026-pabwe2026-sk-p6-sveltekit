import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPost } from '../../../lib/helpers/apiHelper';
import { authApi } from './authApi';

vi.mock('../../../lib/helpers/apiHelper', () => ({
	apiGet: vi.fn(),
	apiPost: vi.fn()
}));

beforeEach(() => vi.clearAllMocks());

describe('authApi', () => {
	it('register tanpa token', () => {
		const payload = { name: 'Ani', email: 'a@b.c', password: 'rahasia' };
		authApi.register(payload);
		expect(apiPost).toHaveBeenCalledWith('/auth/register', payload, { token: null });
	});

	it('login tanpa token', () => {
		const payload = { email: 'a@b.c', password: 'rahasia' };
		authApi.login(payload);
		expect(apiPost).toHaveBeenCalledWith('/auth/login', payload, { token: null });
	});

	it('me', () => {
		authApi.me();
		expect(apiGet).toHaveBeenCalledWith('/users/me');
	});
});
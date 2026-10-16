import { apiGet, apiPost } from '../../../lib/helpers/apiHelper';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types';

export const authApi = {
	register: (payload: RegisterPayload) => apiPost('/auth/register', payload, { token: null }),

	login: (payload: LoginPayload) =>
		apiPost<{ token: string }>('/auth/login', payload, { token: null }),

	me: () => apiGet<{ user: AuthUser }>('/users/me')
};
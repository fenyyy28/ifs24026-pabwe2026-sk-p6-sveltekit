import { apiGet, apiPost, apiPut } from '../../../lib/helpers/apiHelper';
import type { UserItem } from '../types';

export const usersApi = {
	list: () => apiGet<{ users: UserItem[] }>('/users'),

	updateProfile: (payload: { name: string; email: string }) => apiPut('/users/me', payload),

	changePhoto: (file: File) => {
		const form = new FormData();
		form.append('photo', file);
		return apiPost('/users/me/photo', form);
	},

	changePassword: (payload: { password: string; new_password: string }) =>
		apiPut('/users/password', payload)
};
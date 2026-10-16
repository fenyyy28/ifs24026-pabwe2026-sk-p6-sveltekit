import { usersApi } from '../api/usersApi';
import type { UserItem } from '../types';

class UsersStore {
	users = $state<UserItem[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	async loadUsers(): Promise<void> {
		this.loading = true;
		this.error = null;

		const res = await usersApi.list();
		if (res.status === 'success') {
			this.users = res.data?.users ?? [];
		} else {
			this.error = res.message;
		}
		this.loading = false;
	}

	filter(keyword: string): UserItem[] {
		const q = keyword.trim().toLowerCase();
		if (!q) return this.users;
		return this.users.filter(
			(u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
		);
	}
}

export const usersStore = new UsersStore();
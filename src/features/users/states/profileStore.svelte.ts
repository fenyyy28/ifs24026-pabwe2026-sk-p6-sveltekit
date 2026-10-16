import type { ApiResponse } from '../../../lib/helpers/apiHelper';
import { flattenErrors } from '../../../lib/helpers/toolsHelper';
import { authStore } from '../../auth/states/authStore.svelte';
import { usersApi } from '../api/usersApi';
import type { Notice, ProfileSection } from '../types';

class ProfileStore {
	saving = $state<ProfileSection | null>(null);
	notices = $state<Partial<Record<ProfileSection, Notice>>>({});

	async updateProfile(name: string, email: string): Promise<boolean> {
		return this.#run('profile', () => usersApi.updateProfile({ name, email }), true);
	}

	async changePhoto(file: File): Promise<boolean> {
		return this.#run('photo', () => usersApi.changePhoto(file), true);
	}

	async changePassword(current: string, next: string): Promise<boolean> {
		return this.#run(
			'password',
			() => usersApi.changePassword({ password: current, new_password: next }),
			false
		);
	}

	clearNotice(section: ProfileSection): void {
		this.notices[section] = undefined;
	}

	async #run(
		section: ProfileSection,
		request: () => Promise<ApiResponse>,
		refreshProfile: boolean
	): Promise<boolean> {
		this.saving = section;
		this.notices[section] = undefined;

		const res = await request();
		const ok = res.status === 'success';

		if (ok && refreshProfile) await authStore.loadProfile();

		this.notices[section] = {
			type: ok ? 'success' : 'error',
			text: res.message,
			fields: ok ? [] : flattenErrors(res.data)
		};
		this.saving = null;
		return ok;
	}
}

export const profileStore = new ProfileStore();
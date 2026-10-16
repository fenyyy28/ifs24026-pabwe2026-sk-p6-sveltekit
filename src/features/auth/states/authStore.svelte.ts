import {
	flattenErrors,
	getAuthToken,
	removeAuthToken,
	setAuthToken
} from '../../../lib/helpers/toolsHelper';
import { authApi } from '../api/authApi';
import type { AuthUser, RegisterPayload } from '../types';

class AuthStore {
	user = $state<AuthUser | null>(null);
	loading = $state(false);
	/** true setelah sesi (token + profil) selesai dicek. */
	ready = $state(false);
	error = $state<string | null>(null);
	fieldErrors = $state<string[]>([]);

	#initializing = false;

	/** Dipanggil sekali: memuat profil jika ada token. */
	async init(): Promise<void> {
		if (this.ready || this.#initializing) return;
		this.#initializing = true;

		if (getAuthToken()) await this.loadProfile();
		this.ready = true;
		this.#initializing = false;
	}

	async loadProfile(): Promise<boolean> {
		const res = await authApi.me();
		if (res.status === 'success' && res.data?.user) {
			this.user = res.data.user;
			return true;
		}
		// Token tidak valid atau kedaluwarsa
		removeAuthToken();
		this.user = null;
		return false;
	}

	async login(email: string, password: string): Promise<boolean> {
		this.#start();
		const res = await authApi.login({ email, password });

		if (res.status !== 'success' || !res.data?.token) {
			this.#fail(res.message, res.data);
			return false;
		}

		setAuthToken(res.data.token);
		const hasProfile = await this.loadProfile();
		this.ready = true;
		this.loading = false;

		if (!hasProfile) this.error = 'Gagal memuat profil pengguna';
		return hasProfile;
	}

	async register(payload: RegisterPayload): Promise<boolean> {
		this.#start();
		const res = await authApi.register(payload);

		if (res.status !== 'success') {
			this.#fail(res.message, res.data);
			return false;
		}
		this.loading = false;
		return true;
	}

	logout(): void {
		removeAuthToken();
		this.user = null;
	}

	#start(): void {
		this.loading = true;
		this.error = null;
		this.fieldErrors = [];
	}

	#fail(message: string, data: unknown): void {
		this.error = message;
		this.fieldErrors = flattenErrors(data);
		this.loading = false;
	}
}

export const authStore = new AuthStore();
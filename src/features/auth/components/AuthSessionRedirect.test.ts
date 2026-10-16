import { goto } from '$app/navigation';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthSessionRedirect from './AuthSessionRedirect.svelte';

const auth = vi.hoisted(() => ({
	init: vi.fn(),
	ready: false,
	user: null as null | { id: number }
}));

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('../states/authStore.svelte', () => ({ authStore: auth }));

beforeEach(() => {
	vi.resetAllMocks();
	auth.ready = false;
	auth.user = null;
});

async function mount(mode: 'guest' | 'protected') {
	render(AuthSessionRedirect, { props: { mode } });
	await tick();
}

describe('AuthSessionRedirect', () => {
	it('memeriksa sesi saat dimuat', async () => {
		await mount('guest');

		expect(auth.init).toHaveBeenCalledOnce();
	});

	describe('mode guest', () => {
		it('mengarahkan ke beranda jika sudah login', async () => {
			auth.ready = true;
			auth.user = { id: 1 };

			await mount('guest');

			expect(goto).toHaveBeenCalledWith('/');
		});

		it('diam jika sesi belum siap', async () => {
			auth.user = { id: 1 };

			await mount('guest');

			expect(goto).not.toHaveBeenCalled();
		});

		it('diam jika belum login', async () => {
			auth.ready = true;

			await mount('guest');

			expect(goto).not.toHaveBeenCalled();
		});
	});

	describe('mode protected', () => {
		it('mengarahkan ke halaman masuk jika belum login', async () => {
			auth.ready = true;

			await mount('protected');

			expect(goto).toHaveBeenCalledWith('/auth/login');
		});

		it('diam jika sudah login', async () => {
			auth.ready = true;
			auth.user = { id: 1 };

			await mount('protected');

			expect(goto).not.toHaveBeenCalled();
		});

		it('diam jika sesi belum siap', async () => {
			await mount('protected');

			expect(goto).not.toHaveBeenCalled();
		});
	});
});

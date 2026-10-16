import { goto } from '$app/navigation';
import { render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { courseApi } from './features/courses/api/courseApi';
import { authStore } from './features/auth/states/authStore.svelte';
import { coursesStore } from './features/courses/states/coursesStore.svelte';
import { ok } from './test/api';
import { makeCourse, me } from './test/fixtures';
import AppHarness from './test/stubs/AppHarness.svelte';

const pageMock = vi.hoisted(() => ({
	url: new URL('http://localhost/'),
	params: {} as Record<string, string>,
	error: null as null | { message: string },
	status: 200
}));

vi.mock('$app/state', () => ({ page: pageMock }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('./features/courses/api/courseApi', () => ({
	courseApi: { create: vi.fn(), list: vi.fn(), remove: vi.fn(), removeAll: vi.fn() }
}));

beforeEach(() => {
	vi.resetAllMocks();
	pageMock.url = new URL('http://localhost/');
	pageMock.error = null;
	authStore.user = me;
	authStore.ready = true;
	coursesStore.courses = [];
	coursesStore.loading = false;
	coursesStore.error = null;
	coursesStore.busy = {};
	coursesStore.toast = null;
	vi.mocked(courseApi.list).mockResolvedValue(ok({ courses: [makeCourse()] }));
});

describe('aplikasi (layout akar + halaman utama)', () => {
	it('menampilkan navbar, sidebar, dan daftar kursus bagi pengguna yang login', async () => {
		const { container } = render(AppHarness);

		expect(await screen.findByText('Belajar Svelte')).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 1, name: 'Semua Kursus' })).toBeInTheDocument();
		expect(container.querySelector('header')).toHaveTextContent('Ani');
		expect(container.querySelector('aside a[href="/"]')).toHaveClass('bg-indigo-50');
		expect(goto).not.toHaveBeenCalled();
	});

	it('mengarahkan ke halaman masuk jika belum login', async () => {
		authStore.user = null;
		render(AppHarness);

		expect(screen.getByText('Memuat...')).toBeInTheDocument();
		await waitFor(() => expect(goto).toHaveBeenCalledWith('/auth/login'));
		expect(courseApi.list).not.toHaveBeenCalled();
	});
});

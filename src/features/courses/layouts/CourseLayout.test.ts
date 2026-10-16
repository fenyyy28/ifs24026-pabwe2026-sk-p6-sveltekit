import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { goto } from '$app/navigation';
import CourseLayout from './CourseLayout.svelte';

type TestUser = { id: number; name: string; email: string; photo: string | null };

const auth = vi.hoisted(() => ({
	init: vi.fn(),
	logout: vi.fn(),
	ready: true,
	user: null as TestUser | null
}));
const courses = vi.hoisted(() => ({
	toast: null as null | { type: 'success' | 'error'; text: string }
}));

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('../../auth/states/authStore.svelte', () => ({ authStore: auth }));
vi.mock('../states/coursesStore.svelte', () => ({ coursesStore: courses }));

const children = createRawSnippet(() => ({ render: () => '<p>konten halaman</p>' }));
const me: TestUser = { id: 1, name: 'Ani', email: 'ani@mail.com', photo: null };

beforeEach(() => {
	vi.resetAllMocks();
	auth.ready = true;
	auth.user = me;
	courses.toast = null;
});

describe('CourseLayout (sudah login)', () => {
	it('menampilkan logo, nama pengguna, dan isi halaman', () => {
		render(CourseLayout, { props: { children } });

		expect(screen.getAllByText('Delcom Courses').length).toBeGreaterThan(0);
		expect(screen.getByText('Ani')).toBeInTheDocument();
		expect(screen.getByText('konten halaman')).toBeInTheDocument();
		expect(screen.queryByText('Memuat...')).not.toBeInTheDocument();
	});

	it('menampilkan tiga menu di sidebar dan navigasi seluler', () => {
		const { container } = render(CourseLayout, { props: { children } });

		for (const href of ['/', '/users', '/profile']) {
			expect(container.querySelector(`aside a[href="${href}"]`)).not.toBeNull();
			expect(container.querySelector(`header nav a[href="${href}"]`)).not.toBeNull();
		}
		expect(container.querySelector('aside a[href="/"]')).toHaveTextContent('Semua Kursus');
	});

	it('menandai menu "Semua Kursus" aktif secara bawaan', () => {
		const { container } = render(CourseLayout, { props: { children } });

		expect(container.querySelector('aside a[href="/"]')).toHaveClass('bg-indigo-50');
		expect(container.querySelector('aside a[href="/users"]')).not.toHaveClass('bg-indigo-50');
		expect(container.querySelector('header nav a[href="/"]')).toHaveClass('font-semibold');
	});

	it('menandai menu sesuai prop active', () => {
		const { container } = render(CourseLayout, { props: { active: 'users', children } });

		expect(container.querySelector('aside a[href="/users"]')).toHaveClass('bg-indigo-50');
		expect(container.querySelector('aside a[href="/"]')).not.toHaveClass('bg-indigo-50');
		expect(container.querySelector('header nav a[href="/users"]')).toHaveClass('font-semibold');
		expect(container.querySelector('header nav a[href="/"]')).toHaveClass('text-slate-600');
	});

	it('tombol Keluar memanggil logout', async () => {
		const user = userEvent.setup();
		render(CourseLayout, { props: { children } });

		await user.click(screen.getByRole('button', { name: /Keluar/ }));

		expect(auth.logout).toHaveBeenCalledOnce();
	});

	it('tidak mengarahkan ke halaman masuk', () => {
		render(CourseLayout, { props: { children } });

		expect(goto).not.toHaveBeenCalled();
	});
});

describe('CourseLayout (belum login)', () => {
	beforeEach(() => {
		auth.user = null;
	});

	it('menampilkan "Memuat..." tanpa isi halaman maupun tombol Keluar', () => {
		render(CourseLayout, { props: { children } });

		expect(screen.getByText('Memuat...')).toBeInTheDocument();
		expect(screen.queryByText('konten halaman')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Keluar/ })).not.toBeInTheDocument();
	});

	it('mengarahkan ke halaman masuk', async () => {
		render(CourseLayout, { props: { children } });

		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith('/auth/login'));
	});
});

describe('CourseLayout (toast)', () => {
	it('tanpa toast tidak menampilkan apa pun', () => {
		render(CourseLayout, { props: { children } });

		expect(screen.queryByText('Tersimpan')).not.toBeInTheDocument();
	});

	it('toast sukses berwarna hijau', () => {
		courses.toast = { type: 'success', text: 'Tersimpan' };
		render(CourseLayout, { props: { children } });

		expect(screen.getByText('Tersimpan')).toHaveClass('bg-green-600');
	});

	it('toast error berwarna merah', () => {
		courses.toast = { type: 'error', text: 'Gagal' };
		render(CourseLayout, { props: { children } });

		expect(screen.getByText('Gagal')).toHaveClass('bg-red-600');
	});
});

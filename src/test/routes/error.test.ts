import { render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorPage from '../../routes/+error.svelte';

const pageMock = vi.hoisted(() => ({
	url: new URL('http://localhost/'),
	params: {} as Record<string, string>,
	error: null as null | { message: string },
	status: 404
}));

vi.mock('$app/state', () => ({ page: pageMock }));

beforeEach(() => {
	pageMock.status = 404;
	pageMock.error = null;
});

describe('+error.svelte', () => {
	it('menampilkan halaman tidak ditemukan untuk status 404', async () => {
		render(ErrorPage);

		expect(screen.getByText('404')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeInTheDocument();
		expect(screen.getByText(/tidak ada atau sudah dipindahkan/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Kembali ke Semua Kursus' })).toHaveAttribute('href', '/');
		await waitFor(() =>
			expect(document.title).toBe('Halaman Tidak Ditemukan | Delcom Courses')
		);
	});

	it('menampilkan pesan error untuk status lain', async () => {
		pageMock.status = 500;
		pageMock.error = { message: 'Server bermasalah' };
		render(ErrorPage);

		expect(screen.getByText('500')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Terjadi kesalahan' })).toBeInTheDocument();
		expect(screen.getByText('Server bermasalah')).toBeInTheDocument();
		await waitFor(() => expect(document.title).toBe('Terjadi Kesalahan | Delcom Courses'));
	});

	it('memakai pesan bawaan jika error tidak punya pesan', () => {
		pageMock.status = 500;
		render(ErrorPage);

		expect(screen.getByText('Silakan coba lagi beberapa saat lagi.')).toBeInTheDocument();
	});
});

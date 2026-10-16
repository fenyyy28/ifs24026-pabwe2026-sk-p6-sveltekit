import { render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, ok } from '../../../test/api';
import { makeCourse, me } from '../../../test/fixtures';
import { authStore } from '../../auth/states/authStore.svelte';
import { courseApi } from '../api/courseApi';
import { coursesStore } from '../states/coursesStore.svelte';
import HomePage from './HomePage.svelte';

vi.mock('../api/courseApi', () => ({
	courseApi: { create: vi.fn(), list: vi.fn(), remove: vi.fn(), removeAll: vi.fn() }
}));

const mine = makeCourse({
	id: 1,
	user_id: 1,
	title: 'Svelte Dasar',
	description: 'Belajar runes',
	avg_ratings: '4.0000',
	total_contents: 3,
	students: [2, 3]
});
const joined = makeCourse({
	id: 2,
	user_id: 2,
	title: 'React Lanjut',
	description: 'Tentang hooks',
	students: [1],
	author: { name: 'Budi', photo: null },
	avg_ratings: null
});
const other = makeCourse({
	id: 3,
	user_id: 3,
	title: 'Vue Pemula',
	description: 'Dibandingkan dengan Svelte',
	students: [],
	author: { name: 'Cici', photo: null }
});
const courses = [mine, joined, other];

beforeEach(() => {
	vi.resetAllMocks();
	authStore.user = me;
	authStore.ready = true;
	coursesStore.courses = [];
	coursesStore.loading = false;
	coursesStore.error = null;
	coursesStore.busy = {};
	coursesStore.toast = null;
	vi.mocked(courseApi.list).mockResolvedValue(ok({ courses }));
});

describe('daftar kursus', () => {
	it('menampilkan semua kursus beserta jumlahnya', async () => {
		render(HomePage);

		expect(await screen.findByText('Svelte Dasar')).toBeInTheDocument();
		expect(screen.getByText('React Lanjut')).toBeInTheDocument();
		expect(screen.getByText('Vue Pemula')).toBeInTheDocument();
		expect(screen.getByText('3 kursus tersedia')).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 1, name: 'Semua Kursus' })).toBeInTheDocument();
	});

	it('menandai peran pengguna pada tiap kursus', async () => {
		render(HomePage);
		await screen.findByText('Svelte Dasar');

		const own = screen.getByText('Svelte Dasar').closest('article') as HTMLElement;
		const joinedCard = screen.getByText('React Lanjut').closest('article') as HTMLElement;
		const otherCard = screen.getByText('Vue Pemula').closest('article') as HTMLElement;

		expect(within(own).getByText('Milik Anda')).toBeInTheDocument();
		expect(within(joinedCard).getByText('Diikuti')).toBeInTheDocument();
		expect(within(otherCard).queryByText('Milik Anda')).not.toBeInTheDocument();
		expect(within(otherCard).queryByText('Diikuti')).not.toBeInTheDocument();
	});

	it('menampilkan rating atau tanda strip jika belum ada', async () => {
		render(HomePage);
		await screen.findByText('Svelte Dasar');

		const own = screen.getByText('Svelte Dasar').closest('article') as HTMLElement;
		const joinedCard = screen.getByText('React Lanjut').closest('article') as HTMLElement;

		expect(within(own).getByText('4.0')).toBeInTheDocument();
		expect(within(joinedCard).getByText('-')).toBeInTheDocument();
	});

	it('menampilkan status memuat', async () => {
		vi.mocked(courseApi.list).mockReturnValue(new Promise(() => {}) as never);
		render(HomePage);

		expect(await screen.findByText('Memuat kursus...')).toBeInTheDocument();
	});

	it('tetap menampilkan daftar yang ada saat memuat ulang', async () => {
		coursesStore.courses = courses;
		vi.mocked(courseApi.list).mockReturnValue(new Promise(() => {}) as never);
		render(HomePage);

		await waitFor(() => expect(coursesStore.loading).toBe(true));
		expect(screen.queryByText('Memuat kursus...')).not.toBeInTheDocument();
		expect(screen.getByText('Svelte Dasar')).toBeInTheDocument();
	});

	it('menampilkan pesan error', async () => {
		vi.mocked(courseApi.list).mockResolvedValue(fail('Gagal memuat kursus'));
		render(HomePage);

		expect(await screen.findByText('Gagal memuat kursus')).toBeInTheDocument();
	});

	it('menampilkan pesan kosong jika tidak ada kursus', async () => {
		vi.mocked(courseApi.list).mockResolvedValue(ok({ courses: [] }));
		render(HomePage);

		expect(await screen.findByText('Tidak ada kursus ditemukan.')).toBeInTheDocument();
	});

	it('tidak memuat data sebelum sesi siap', async () => {
		authStore.ready = false;
		render(HomePage);
		await tick();

		expect(courseApi.list).not.toHaveBeenCalled();
	});

	it('tidak memuat data jika belum login', async () => {
		authStore.user = null;
		render(HomePage);
		await tick();

		expect(courseApi.list).not.toHaveBeenCalled();
	});
});

describe('pencarian dan filter', () => {
	it('mencari lewat judul maupun deskripsi', async () => {
		const user = userEvent.setup();
		render(HomePage);
		await screen.findByText('Svelte Dasar');
		const search = screen.getByPlaceholderText('Cari kursus...');

		await user.type(search, 'svelte');
		await waitFor(() => expect(screen.queryByText('React Lanjut')).not.toBeInTheDocument());
		expect(screen.getByText('Svelte Dasar')).toBeInTheDocument();
		expect(screen.getByText('Vue Pemula')).toBeInTheDocument();

		await user.clear(search);
		await user.type(search, 'react');
		await waitFor(() => expect(screen.queryByText('Svelte Dasar')).not.toBeInTheDocument());
		expect(screen.getByText('React Lanjut')).toBeInTheDocument();

		await user.clear(search);
		await user.type(search, 'zzz');
		expect(await screen.findByText('Tidak ada kursus ditemukan.')).toBeInTheDocument();
	});

	it('menyaring kursus milik sendiri', async () => {
		const user = userEvent.setup();
		render(HomePage);
		await screen.findByText('Svelte Dasar');

		await user.click(screen.getByRole('checkbox', { name: 'Hanya milik saya' }));

		await waitFor(() => expect(screen.queryByText('React Lanjut')).not.toBeInTheDocument());
		expect(screen.getByText('Svelte Dasar')).toBeInTheDocument();
		expect(screen.queryByText('Vue Pemula')).not.toBeInTheDocument();
	});
});

describe('menghapus kursus', () => {
	it('menghapus kursus milik sendiri setelah dikonfirmasi', async () => {
		vi.stubGlobal('confirm', vi.fn(() => true));
		vi.mocked(courseApi.remove).mockResolvedValue(ok());
		const user = userEvent.setup();
		render(HomePage);
		await screen.findByText('Svelte Dasar');

		await user.click(screen.getByRole('button', { name: 'Hapus' }));

		expect(courseApi.remove).toHaveBeenCalledWith(1);
		await waitFor(() => expect(screen.queryByText('Svelte Dasar')).not.toBeInTheDocument());
	});

	it('membatalkan penghapusan jika tidak dikonfirmasi', async () => {
		vi.stubGlobal('confirm', vi.fn(() => false));
		const user = userEvent.setup();
		render(HomePage);
		await screen.findByText('Svelte Dasar');

		await user.click(screen.getByRole('button', { name: 'Hapus' }));

		expect(courseApi.remove).not.toHaveBeenCalled();
		expect(screen.getByText('Svelte Dasar')).toBeInTheDocument();
	});

	it('menghapus semua kursus milik sendiri setelah dikonfirmasi', async () => {
		vi.stubGlobal('confirm', vi.fn(() => true));
		vi.mocked(courseApi.removeAll).mockResolvedValue(ok());
		const user = userEvent.setup();
		render(HomePage);
		await screen.findByText('Svelte Dasar');

		await user.click(screen.getByRole('button', { name: 'Hapus Semua Milik Saya' }));

		expect(courseApi.removeAll).toHaveBeenCalledOnce();
	});

	it('membatalkan hapus semua jika tidak dikonfirmasi', async () => {
		vi.stubGlobal('confirm', vi.fn(() => false));
		const user = userEvent.setup();
		render(HomePage);
		await screen.findByText('Svelte Dasar');

		await user.click(screen.getByRole('button', { name: 'Hapus Semua Milik Saya' }));

		expect(courseApi.removeAll).not.toHaveBeenCalled();
	});

	it('menonaktifkan tombol hapus semua saat diproses', async () => {
		coursesStore.busy = { removeAll: true };
		render(HomePage);
		await screen.findByText('Svelte Dasar');

		expect(screen.getByRole('button', { name: 'Hapus Semua Milik Saya' })).toBeDisabled();
	});

	it('menyembunyikan tombol hapus jika tidak ada kursus milik sendiri', async () => {
		vi.mocked(courseApi.list).mockResolvedValue(ok({ courses: [joined, other] }));
		render(HomePage);
		await screen.findByText('React Lanjut');

		expect(screen.queryByRole('button', { name: 'Hapus Semua Milik Saya' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();
	});
});

describe('tambah kursus', () => {
	it('membuka dan menutup modal tambah', async () => {
		const user = userEvent.setup();
		render(HomePage);
		await screen.findByText('Svelte Dasar');

		await user.click(screen.getByRole('button', { name: 'Tambah Kursus' }));
		expect(screen.getByRole('heading', { name: 'Tambah Kursus' })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Batal' }));
		await waitFor(() =>
			expect(screen.queryByRole('heading', { name: 'Tambah Kursus' })).not.toBeInTheDocument()
		);
	});
});

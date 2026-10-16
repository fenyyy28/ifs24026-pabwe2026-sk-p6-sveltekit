import { goto } from '$app/navigation';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, ok } from '../../../test/api';
import { makeContent, makeDetail, me } from '../../../test/fixtures';
import { authStore } from '../../auth/states/authStore.svelte';
import { courseApi } from '../api/courseApi';
import { coursesStore } from '../states/coursesStore.svelte';
import type { CourseDetail } from '../types';
import DetailPage from './DetailPage.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('../api/courseApi', () => ({
	courseApi: {
		detail: vi.fn(),
		update: vi.fn(),
		changeCover: vi.fn(),
		remove: vi.fn(),
		join: vi.fn(),
		leave: vi.fn(),
		rate: vi.fn(),
		addContent: vi.fn(),
		updateContent: vi.fn(),
		removeContent: vi.fn()
	}
}));

/** Pengguna (id 1) adalah pemilik. */
const owner = (o: Partial<CourseDetail> = {}) => makeDetail(o);
/** Pengguna (id 1) adalah peserta. */
const student = (o: Partial<CourseDetail> = {}) =>
	makeDetail({ user_id: 2, students: [1], author: { name: 'Budi', photo: null }, ...o });
/** Pengguna (id 1) bukan pemilik maupun peserta. */
const visitor = (o: Partial<CourseDetail> = {}) =>
	makeDetail({ user_id: 2, students: [], author: { name: 'Budi', photo: null }, ...o });

async function show(detail: CourseDetail) {
	vi.mocked(courseApi.detail).mockResolvedValue(ok({ course: detail }));
	const view = render(DetailPage, { props: { courseId: 10 } });
	await screen.findByRole('heading', { level: 1, name: detail.title });
	return view;
}

const confirmYes = () => vi.stubGlobal('confirm', vi.fn(() => true));
const confirmNo = () => vi.stubGlobal('confirm', vi.fn(() => false));

beforeEach(() => {
	vi.resetAllMocks();
	authStore.user = me;
	authStore.ready = true;
	coursesStore.courses = [];
	coursesStore.course = null;
	coursesStore.content = null;
	coursesStore.detailLoading = false;
	coursesStore.detailError = null;
	coursesStore.busy = {};
	coursesStore.toast = null;
});

describe('status halaman', () => {
	it('menampilkan status memuat', async () => {
		vi.mocked(courseApi.detail).mockReturnValue(new Promise(() => {}) as never);
		render(DetailPage, { props: { courseId: 10 } });

		expect(await screen.findByText('Memuat kursus...')).toBeInTheDocument();
		await waitFor(() => expect(document.title).toBe('Detail Kursus | Delcom Courses'));
	});

	it('menampilkan pesan error', async () => {
		vi.mocked(courseApi.detail).mockResolvedValue(fail('Kursus tidak ditemukan'));
		render(DetailPage, { props: { courseId: 10 } });

		expect(await screen.findByText('Kursus tidak ditemukan')).toBeInTheDocument();
	});

	it('tidak menampilkan apa pun dan tidak memuat sebelum sesi siap', async () => {
		authStore.ready = false;
		render(DetailPage, { props: { courseId: 10 } });
		await tick();

		expect(courseApi.detail).not.toHaveBeenCalled();
		expect(screen.queryByText('Memuat kursus...')).not.toBeInTheDocument();
	});

	it('tidak memuat jika belum login', async () => {
		authStore.user = null;
		render(DetailPage, { props: { courseId: 10 } });
		await tick();

		expect(courseApi.detail).not.toHaveBeenCalled();
	});

	it('mengabaikan kursus lain yang tersisa di store', async () => {
		coursesStore.course = owner({ id: 99, title: 'Kursus Lama' });
		vi.mocked(courseApi.detail).mockReturnValue(new Promise(() => {}) as never);
		render(DetailPage, { props: { courseId: 10 } });

		expect(await screen.findByText('Memuat kursus...')).toBeInTheDocument();
		expect(screen.queryByText('Kursus Lama')).not.toBeInTheDocument();
	});

	it('tetap menampilkan kursus saat dimuat ulang', async () => {
		coursesStore.course = owner();
		vi.mocked(courseApi.detail).mockReturnValue(new Promise(() => {}) as never);
		render(DetailPage, { props: { courseId: 10 } });

		await waitFor(() => expect(coursesStore.detailLoading).toBe(true));
		expect(screen.queryByText('Memuat kursus...')).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 1, name: 'Belajar Svelte' })).toBeInTheDocument();
	});

	it('tetap menampilkan kursus jika pemuatan ulang gagal', async () => {
		coursesStore.course = owner();
		vi.mocked(courseApi.detail).mockResolvedValue(fail('Gagal memuat'));
		render(DetailPage, { props: { courseId: 10 } });

		await waitFor(() => expect(coursesStore.detailError).toBe('Gagal memuat'));
		expect(screen.queryByText('Gagal memuat')).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 1, name: 'Belajar Svelte' })).toBeInTheDocument();
	});

	it('mengatur judul tab sesuai kursus', async () => {
		await show(owner());

		await waitFor(() => expect(document.title).toBe('Belajar Svelte | Delcom Courses'));
	});
});

describe('tampilan pemilik', () => {
	it('menampilkan informasi kursus', async () => {
		await show(owner({ total_contents: 3, students: [2, 3], avg_ratings: '4.0000' }));

		expect(screen.getByText('Dasar-dasar Svelte')).toBeInTheDocument();
		expect(screen.getByText('Ani')).toBeInTheDocument();
		expect(screen.getByText('2 peserta')).toBeInTheDocument();
		expect(screen.getByText('3 konten')).toBeInTheDocument();
		expect(screen.getByText('4.0')).toBeInTheDocument();
		expect(screen.getByText(/Dibuat 15 Oktober 2026/)).toBeInTheDocument();
	});

	it('menampilkan "Belum ada rating" jika belum dinilai', async () => {
		await show(owner({ avg_ratings: null }));

		expect(screen.getByText('Belum ada rating')).toBeInTheDocument();
	});

	it('menampilkan tombol khusus pemilik', async () => {
		await show(owner());

		for (const name of ['Ubah Sampul', 'Ubah', 'Hapus', 'Tambah Konten']) {
			expect(screen.getByRole('button', { name })).toBeInTheDocument();
		}
		expect(screen.queryByRole('button', { name: 'Ikuti Kursus' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Keluar dari Kursus' })).not.toBeInTheDocument();
		expect(screen.queryByText('Progres belajar')).not.toBeInTheDocument();
		expect(screen.queryByText('Beri rating Anda')).not.toBeInTheDocument();
	});

	it('menautkan konten ke halaman materi', async () => {
		await show(owner());

		expect(screen.getByRole('link', { name: 'Pengenalan' })).toHaveAttribute(
			'href',
			'/courses/10/contents/5'
		);
	});

	it('menampilkan pesan jika belum ada konten', async () => {
		await show(owner({ contents: [] }));

		expect(screen.getByText('Belum ada konten.')).toBeInTheDocument();
	});

	it('menghapus kursus lalu kembali ke beranda', async () => {
		confirmYes();
		vi.mocked(courseApi.remove).mockResolvedValue(ok());
		const user = userEvent.setup();
		await show(owner());

		await user.click(screen.getByRole('button', { name: 'Hapus' }));

		await waitFor(() => expect(goto).toHaveBeenCalledWith('/'));
		expect(courseApi.remove).toHaveBeenCalledWith(10);
	});

	it('membatalkan penghapusan jika tidak dikonfirmasi', async () => {
		confirmNo();
		const user = userEvent.setup();
		await show(owner());

		await user.click(screen.getByRole('button', { name: 'Hapus' }));

		expect(courseApi.remove).not.toHaveBeenCalled();
		expect(goto).not.toHaveBeenCalled();
	});

	it('tidak berpindah halaman jika penghapusan gagal', async () => {
		confirmYes();
		vi.mocked(courseApi.remove).mockResolvedValue(fail());
		const user = userEvent.setup();
		await show(owner());

		await user.click(screen.getByRole('button', { name: 'Hapus' }));

		await waitFor(() => expect(courseApi.remove).toHaveBeenCalled());
		await tick();
		expect(goto).not.toHaveBeenCalled();
	});

	it('menonaktifkan tombol hapus saat diproses', async () => {
		coursesStore.busy = { remove: true };
		await show(owner());

		expect(screen.getByRole('button', { name: 'Hapus' })).toBeDisabled();
	});

	it('membuka dan menutup modal ubah data', async () => {
		const user = userEvent.setup();
		await show(owner());

		await user.click(screen.getByRole('button', { name: 'Ubah' }));
		expect(screen.getByRole('heading', { name: 'Ubah Kursus' })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Batal' }));
		await waitFor(() =>
			expect(screen.queryByRole('heading', { name: 'Ubah Kursus' })).not.toBeInTheDocument()
		);
	});

	it('membuka dan menutup modal ubah sampul', async () => {
		const user = userEvent.setup();
		await show(owner({ cover: 'http://x.test/c.png' }));

		await user.click(screen.getByRole('button', { name: 'Ubah Sampul' }));
		expect(screen.getByRole('heading', { name: 'Ubah Sampul' })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Batal' }));
		await waitFor(() =>
			expect(screen.queryByRole('heading', { name: 'Ubah Sampul' })).not.toBeInTheDocument()
		);
	});

	it('membuka dan menutup modal tambah konten', async () => {
		const user = userEvent.setup();
		await show(owner());

		await user.click(screen.getByRole('button', { name: 'Tambah Konten' }));
		expect(screen.getByRole('heading', { name: 'Tambah Konten' })).toBeInTheDocument();
		expect(screen.getByLabelText('Judul')).toHaveValue('');

		await user.click(screen.getByRole('button', { name: 'Batal' }));
		await waitFor(() =>
			expect(screen.queryByRole('heading', { name: 'Tambah Konten' })).not.toBeInTheDocument()
		);
	});

	it('membuka dan menutup modal ubah konten', async () => {
		const user = userEvent.setup();
		await show(owner());

		await user.click(screen.getByRole('button', { name: 'Ubah konten' }));
		expect(screen.getByRole('heading', { name: 'Ubah Konten' })).toBeInTheDocument();
		expect(screen.getByLabelText('Judul')).toHaveValue('Pengenalan');

		await user.click(screen.getByRole('button', { name: 'Batal' }));
		await waitFor(() =>
			expect(screen.queryByRole('heading', { name: 'Ubah Konten' })).not.toBeInTheDocument()
		);
	});

	it('menghapus konten setelah dikonfirmasi', async () => {
		confirmYes();
		vi.mocked(courseApi.removeContent).mockResolvedValue(ok());
		const user = userEvent.setup();
		await show(owner());

		await user.click(screen.getByRole('button', { name: 'Hapus konten' }));

		expect(courseApi.removeContent).toHaveBeenCalledWith(5);
	});

	it('membatalkan penghapusan konten jika tidak dikonfirmasi', async () => {
		confirmNo();
		const user = userEvent.setup();
		await show(owner());

		await user.click(screen.getByRole('button', { name: 'Hapus konten' }));

		expect(courseApi.removeContent).not.toHaveBeenCalled();
	});
});

/**
 * Props `courseId` pada modal sampul dan modal konten dibaca secara lazy (getter),
 * jadi baris 292 dan 299 di DetailPage.svelte baru tercover kalau formulir modal
 * benar-benar dikirim dari halaman ini.
 */
describe('mengirim formulir modal dari halaman detail', () => {
	it('mengirim perubahan sampul untuk kursus ini', async () => {
		vi.mocked(courseApi.changeCover).mockResolvedValue(ok());
		const user = userEvent.setup();
		const { container } = await show(owner({ cover: 'http://x.test/c.png' }));

		await user.click(screen.getByRole('button', { name: 'Ubah Sampul' }));
		await screen.findByRole('heading', { name: 'Ubah Sampul' });

		const input = container.ownerDocument.querySelector<HTMLInputElement>('input[type="file"]');
		await user.upload(input!, new File(['x'], 'baru.png', { type: 'image/png' }));
		await user.click(screen.getByRole('button', { name: /simpan|unggah/i }));

		await waitFor(() => expect(courseApi.changeCover).toHaveBeenCalled());
		expect(vi.mocked(courseApi.changeCover).mock.calls[0][0]).toBe(10);
	});

	it('menambah konten untuk kursus ini', async () => {
		vi.mocked(courseApi.addContent).mockResolvedValue(ok());
		const user = userEvent.setup();
		await show(owner());

		await user.click(screen.getByRole('button', { name: 'Tambah Konten' }));
		await screen.findByRole('heading', { name: 'Tambah Konten' });

		await user.type(screen.getByLabelText('Judul'), 'Materi Baru');
		await user.type(screen.getByLabelText(/youtube/i), 'https://youtu.be/abc123');
		await user.click(screen.getByRole('button', { name: /simpan/i }));

		await waitFor(() => expect(courseApi.addContent).toHaveBeenCalled());
		expect(vi.mocked(courseApi.addContent).mock.calls[0][0]).toBe(10);
	});
});

describe('tampilan peserta', () => {
	it('menampilkan tombol keluar tanpa tombol pemilik', async () => {
		await show(student());

		expect(screen.getByRole('button', { name: 'Keluar dari Kursus' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Tambah Konten' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Ikuti Kursus' })).not.toBeInTheDocument();
	});

	it.each([
		['50', '50%', '50%'],
		['0', '0%', '0%'],
		['150', '150%', '100%']
	])('progres belajar %s ditampilkan sebagai %s dengan bilah %s', async (value, label, width) => {
		const { container } = await show(student({ my_percentage_finished: value }));

		expect(screen.getByText('Progres belajar')).toBeInTheDocument();
		expect(screen.getByText(label)).toBeInTheDocument();
		expect(container.querySelector('.h-full.bg-indigo-600')).toHaveStyle({ width });
	});

	it('menandai konten yang sudah selesai', async () => {
		await show(
			student({
				contents: [
					makeContent({ id: 5, title: 'Satu', my_status_finished: true }),
					makeContent({ id: 6, title: 'Dua', my_status_finished: false })
				]
			})
		);

		expect(screen.getAllByText('Selesai')).toHaveLength(1);
	});

	it('keluar dari kursus setelah dikonfirmasi', async () => {
		confirmYes();
		vi.mocked(courseApi.leave).mockResolvedValue(ok());
		const user = userEvent.setup();
		await show(student());

		await user.click(screen.getByRole('button', { name: 'Keluar dari Kursus' }));

		expect(courseApi.leave).toHaveBeenCalledWith(10);
	});

	it('membatalkan keluar jika tidak dikonfirmasi', async () => {
		confirmNo();
		const user = userEvent.setup();
		await show(student());

		await user.click(screen.getByRole('button', { name: 'Keluar dari Kursus' }));

		expect(courseApi.leave).not.toHaveBeenCalled();
	});

	it('menonaktifkan tombol keluar saat diproses', async () => {
		coursesStore.busy = { student: true };
		await show(student());

		expect(screen.getByRole('button', { name: 'Keluar dari Kursus' })).toBeDisabled();
	});
});

describe('rating', () => {
	const commentBox = () => screen.getByPlaceholderText('Tulis komentar (opsional)');

	it('meminta rating sebelum mengirim', async () => {
		const user = userEvent.setup();
		await show(student());

		await user.click(screen.getByRole('button', { name: 'Kirim Rating' }));

		expect(screen.getByText('Pilih rating 1 sampai 5')).toBeInTheDocument();
		expect(courseApi.rate).not.toHaveBeenCalled();
	});

	it('mengirim rating lalu mengosongkan formulir', async () => {
		vi.mocked(courseApi.rate).mockResolvedValue(ok());
		const user = userEvent.setup();
		await show(student());

		await user.click(screen.getByRole('button', { name: 'Rating 4' }));
		await user.type(commentBox(), ' Bagus ');
		await user.click(screen.getByRole('button', { name: 'Kirim Rating' }));

		expect(courseApi.rate).toHaveBeenCalledWith(10, { ratings: 4, comment: 'Bagus' });
		expect(await screen.findByText('OK')).toBeInTheDocument();
		expect(commentBox()).toHaveValue('');
	});

	it('menampilkan error dan mempertahankan isian jika gagal', async () => {
		vi.mocked(courseApi.rate).mockResolvedValue(fail('Gagal kirim', { ratings: ['tidak valid'] }));
		const user = userEvent.setup();
		await show(student());

		await user.click(screen.getByRole('button', { name: 'Rating 2' }));
		await user.type(commentBox(), 'Cukup');
		await user.click(screen.getByRole('button', { name: 'Kirim Rating' }));

		expect(await screen.findByText('Gagal kirim')).toBeInTheDocument();
		expect(screen.getByText('tidak valid')).toBeInTheDocument();
		expect(commentBox()).toHaveValue('Cukup');
	});

	it('menonaktifkan tombol saat menyimpan', async () => {
		coursesStore.busy = { rating: true };
		await show(student());

		expect(screen.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled();
	});

	it('menampilkan pesan jika belum ada ulasan', async () => {
		await show(student({ ratings: [] }));

		expect(screen.getByText('Belum ada ulasan.')).toBeInTheDocument();
	});

	it('menampilkan daftar ulasan dengan atau tanpa komentar', async () => {
		await show(
			owner({
				ratings: [
					{ name: 'Budi', ratings: 4, comment: 'Mantap' },
					{ name: 'Cici', ratings: 5, comment: '' }
				]
			})
		);

		expect(screen.getByText('Budi')).toBeInTheDocument();
		expect(screen.getByText('Mantap')).toBeInTheDocument();
		expect(screen.getByText('Cici')).toBeInTheDocument();
		expect(screen.queryByText('Belum ada ulasan.')).not.toBeInTheDocument();
	});
});

describe('tampilan pengunjung', () => {
	it('menampilkan tombol ikuti dan mengunci konten', async () => {
		await show(visitor());

		expect(screen.getByRole('button', { name: 'Ikuti Kursus' })).toBeInTheDocument();
		expect(screen.getByText('Pengenalan')).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Pengenalan' })).not.toBeInTheDocument();
		expect(screen.getByText('Ikuti kursus ini untuk membuka konten.')).toBeInTheDocument();
		expect(screen.queryByText('Beri rating Anda')).not.toBeInTheDocument();
		expect(screen.queryByText('Progres belajar')).not.toBeInTheDocument();
	});

	it('mengikuti kursus', async () => {
		vi.mocked(courseApi.join).mockResolvedValue(ok());
		const user = userEvent.setup();
		await show(visitor());

		await user.click(screen.getByRole('button', { name: 'Ikuti Kursus' }));

		expect(courseApi.join).toHaveBeenCalledWith(10);
	});

	it('menonaktifkan tombol saat diproses', async () => {
		coursesStore.busy = { student: true };
		await show(visitor());

		expect(screen.getByRole('button', { name: 'Memproses...' })).toBeDisabled();
	});
});
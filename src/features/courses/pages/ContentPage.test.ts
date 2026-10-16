import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, ok } from '../../../test/api';
import { makeContent, makeDetail, me } from '../../../test/fixtures';
import { authStore } from '../../auth/states/authStore.svelte';
import { courseApi } from '../api/courseApi';
import { coursesStore } from '../states/coursesStore.svelte';
import type { CourseContent, CourseDetail } from '../types';
import ContentPage from './ContentPage.svelte';

vi.mock('../api/courseApi', () => ({
	courseApi: { detail: vi.fn(), contentDetail: vi.fn(), setContentStatus: vi.fn() }
}));

const c1 = makeContent({ id: 4, title: 'Intro', youtube: 'https://youtu.be/aaa111' });
const c2 = makeContent({ id: 5, title: 'Materi Inti', youtube: 'https://youtu.be/abc123' });
const c3 = makeContent({ id: 6, title: 'Penutup', youtube: 'https://youtu.be/zzz999' });

/** Pengguna (id 1) adalah pemilik. */
const owner = () => makeDetail({ contents: [c1, c2, c3] });
/** Pengguna (id 1) adalah peserta. */
const student = () => makeDetail({ user_id: 2, students: [1], contents: [c1, c2, c3] });
/** Pengguna (id 1) bukan pemilik maupun peserta. */
const visitor = () => makeDetail({ user_id: 2, students: [], contents: [c1, c2, c3] });

async function show(options: { content?: CourseContent; course?: CourseDetail } = {}) {
	const content = options.content ?? c2;
	vi.mocked(courseApi.detail).mockResolvedValue(ok({ course: options.course ?? owner() }));
	vi.mocked(courseApi.contentDetail).mockResolvedValue(ok({ course_content: content }));
	const view = render(ContentPage, { props: { courseId: 10, contentId: content.id } });
	await screen.findByRole('heading', { level: 1, name: content.title });
	return view;
}

beforeEach(() => {
	vi.resetAllMocks();
	authStore.user = me;
	authStore.ready = true;
	coursesStore.course = null;
	coursesStore.content = null;
	coursesStore.contentLoading = false;
	coursesStore.contentError = null;
	coursesStore.busy = {};
	coursesStore.toast = null;
});

describe('status halaman', () => {
	it('menampilkan pesan error', async () => {
		vi.mocked(courseApi.detail).mockResolvedValue(ok({ course: owner() }));
		vi.mocked(courseApi.contentDetail).mockResolvedValue(fail('Konten tidak ditemukan'));
		render(ContentPage, { props: { courseId: 10, contentId: 5 } });

		expect(await screen.findByText('Konten tidak ditemukan')).toBeInTheDocument();
	});

	it('menampilkan status memuat saat konten belum tiba', async () => {
		vi.mocked(courseApi.detail).mockResolvedValue(ok({ course: owner() }));
		vi.mocked(courseApi.contentDetail).mockReturnValue(new Promise(() => {}) as never);
		render(ContentPage, { props: { courseId: 10, contentId: 5 } });

		expect(await screen.findByText('Memuat konten...')).toBeInTheDocument();
		await waitFor(() => expect(document.title).toBe('Konten | Delcom Courses'));
	});

	it('menampilkan status memuat saat kursus belum tiba', async () => {
		vi.mocked(courseApi.detail).mockReturnValue(new Promise(() => {}) as never);
		vi.mocked(courseApi.contentDetail).mockResolvedValue(ok({ course_content: c2 }));
		render(ContentPage, { props: { courseId: 10, contentId: 5 } });

		await waitFor(() => expect(coursesStore.content?.id).toBe(5));
		expect(screen.getByText('Memuat konten...')).toBeInTheDocument();
		expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
	});

	it('tidak memuat dan menampilkan status memuat sebelum sesi siap', async () => {
		authStore.ready = false;
		render(ContentPage, { props: { courseId: 10, contentId: 5 } });
		await tick();

		expect(courseApi.contentDetail).not.toHaveBeenCalled();
		expect(screen.getByText('Memuat konten...')).toBeInTheDocument();
	});

	it('tidak memuat jika belum login', async () => {
		authStore.user = null;
		render(ContentPage, { props: { courseId: 10, contentId: 5 } });
		await tick();

		expect(courseApi.detail).not.toHaveBeenCalled();
	});

	it('mengabaikan konten dan kursus lain yang tersisa di store', async () => {
		coursesStore.content = makeContent({ id: 99, title: 'Konten Lama' });
		coursesStore.course = makeDetail({ id: 77, title: 'Kursus Lama' });
		vi.mocked(courseApi.detail).mockReturnValue(new Promise(() => {}) as never);
		vi.mocked(courseApi.contentDetail).mockReturnValue(new Promise(() => {}) as never);
		render(ContentPage, { props: { courseId: 10, contentId: 5 } });

		expect(await screen.findByText('Memuat konten...')).toBeInTheDocument();
		expect(screen.queryByText('Konten Lama')).not.toBeInTheDocument();
		expect(screen.queryByText('Kursus Lama')).not.toBeInTheDocument();
	});

	it('tetap menampilkan konten jika pemuatan ulang gagal', async () => {
		coursesStore.course = owner();
		coursesStore.content = c2;
		vi.mocked(courseApi.detail).mockResolvedValue(ok({ course: owner() }));
		vi.mocked(courseApi.contentDetail).mockResolvedValue(fail('Gagal memuat'));
		render(ContentPage, { props: { courseId: 10, contentId: 5 } });

		await waitFor(() => expect(coursesStore.contentError).toBe('Gagal memuat'));
		expect(screen.queryByText('Gagal memuat')).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 1, name: 'Materi Inti' })).toBeInTheDocument();
	});

	it('mengatur judul tab sesuai konten', async () => {
		await show();

		await waitFor(() => expect(document.title).toBe('Materi Inti | Delcom Courses'));
	});
});

describe('pemutar video', () => {
	it('memutar video YouTube untuk pemilik', async () => {
		const { container } = await show();

		const iframe = container.querySelector('iframe');
		expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/abc123');
		expect(iframe).toHaveAttribute('title', 'Materi Inti');
		expect(screen.getByText('Belajar Svelte')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Tandai/ })).not.toBeInTheDocument();
	});

	it('memutar video YouTube untuk peserta', async () => {
		const { container } = await show({ course: student() });

		expect(container.querySelector('iframe')).not.toBeNull();
	});

	it('menyediakan tautan cadangan jika bukan tautan YouTube', async () => {
		const { container } = await show({
			content: makeContent({ id: 5, title: 'Video Lain', youtube: 'https://example.com/v' })
		});

		expect(container.querySelector('iframe')).toBeNull();
		expect(screen.getByText(/Tautan tidak dapat diputar/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Buka di YouTube' })).toHaveAttribute(
			'href',
			'https://example.com/v'
		);
	});

	it('mengunci konten bagi pengunjung', async () => {
		const { container } = await show({ course: visitor() });

		expect(container.querySelector('iframe')).toBeNull();
		expect(screen.getByText('Ikuti kursus ini untuk menonton konten.')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Ke halaman kursus' })).toHaveAttribute(
			'href',
			'/courses/10'
		);
		expect(screen.queryByRole('button', { name: /Tandai/ })).not.toBeInTheDocument();
	});

	it('menyediakan tautan kembali ke kursus', async () => {
		await show();

		expect(screen.getByRole('link', { name: 'Kembali ke kursus' })).toHaveAttribute(
			'href',
			'/courses/10'
		);
	});
});

describe('status belajar', () => {
	it('menandai konten sebagai selesai', async () => {
		vi.mocked(courseApi.setContentStatus).mockResolvedValue(ok());
		const user = userEvent.setup();
		await show({ course: student() });

		await user.click(screen.getByRole('button', { name: 'Tandai Selesai' }));

		expect(courseApi.setContentStatus).toHaveBeenCalledWith(5, 1);
	});

	it('menandai konten sebagai belum selesai', async () => {
		vi.mocked(courseApi.setContentStatus).mockResolvedValue(ok());
		const user = userEvent.setup();
		await show({
			course: student(),
			content: makeContent({ id: 5, title: 'Materi Inti', my_status_finished: true })
		});

		await user.click(screen.getByRole('button', { name: 'Tandai Belum Selesai' }));

		expect(courseApi.setContentStatus).toHaveBeenCalledWith(5, 0);
	});

	it('menonaktifkan tombol saat diproses', async () => {
		coursesStore.busy = { content: true };
		await show({ course: student() });

		expect(screen.getByRole('button', { name: 'Tandai Selesai' })).toBeDisabled();
	});
});

describe('navigasi antar konten', () => {
	it('konten pertama hanya punya tombol berikutnya', async () => {
		await show({ content: c1 });

		expect(screen.getByRole('link', { name: 'Berikutnya' })).toHaveAttribute(
			'href',
			'/courses/10/contents/5'
		);
		expect(screen.queryByRole('link', { name: 'Sebelumnya' })).not.toBeInTheDocument();
	});

	it('konten tengah punya kedua tombol', async () => {
		await show({ content: c2 });

		expect(screen.getByRole('link', { name: 'Sebelumnya' })).toHaveAttribute(
			'href',
			'/courses/10/contents/4'
		);
		expect(screen.getByRole('link', { name: 'Berikutnya' })).toHaveAttribute(
			'href',
			'/courses/10/contents/6'
		);
	});

	it('konten terakhir hanya punya tombol sebelumnya', async () => {
		await show({ content: c3 });

		expect(screen.getByRole('link', { name: 'Sebelumnya' })).toHaveAttribute(
			'href',
			'/courses/10/contents/5'
		);
		expect(screen.queryByRole('link', { name: 'Berikutnya' })).not.toBeInTheDocument();
	});

	it('konten yang tidak ada di daftar tidak punya tombol navigasi', async () => {
		await show({ content: makeContent({ id: 99, title: 'Tidak Terdaftar' }) });

		expect(screen.queryByRole('link', { name: 'Sebelumnya' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Berikutnya' })).not.toBeInTheDocument();
	});
});

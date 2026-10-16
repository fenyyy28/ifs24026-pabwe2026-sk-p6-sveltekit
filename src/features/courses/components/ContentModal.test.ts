import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeContent } from '../../../test/fixtures';
import ContentModal from './ContentModal.svelte';

const store = vi.hoisted(() => ({
	addContent: vi.fn(),
	updateContent: vi.fn(),
	busy: {} as Record<string, boolean>
}));
vi.mock('../states/coursesStore.svelte', () => ({ coursesStore: store }));

const onclose = vi.fn();
const okResult = { ok: true, message: 'OK', fields: [] };
const failResult = { ok: false, message: 'Gagal simpan', fields: ['judul terlalu panjang'] };

beforeEach(() => {
	vi.resetAllMocks();
	store.busy = {};
});

describe('ContentModal (tambah)', () => {
	it('menampilkan judul tambah', () => {
		render(ContentModal, { props: { courseId: 10, onclose } });

		expect(screen.getByRole('heading', { name: 'Tambah Konten' })).toBeInTheDocument();
		expect(screen.getByLabelText('Judul')).toHaveValue('');
	});

	it('menolak isian kosong', async () => {
		const user = userEvent.setup();
		render(ContentModal, { props: { courseId: 10, onclose } });

		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(screen.getByText('Judul wajib diisi')).toBeInTheDocument();
		expect(screen.getByText('Tautan YouTube tidak valid')).toBeInTheDocument();
		expect(store.addContent).not.toHaveBeenCalled();
	});

	it('menolak tautan yang bukan YouTube', async () => {
		const user = userEvent.setup();
		render(ContentModal, { props: { courseId: 10, onclose } });

		await user.type(screen.getByLabelText('Judul'), 'Video');
		await user.type(screen.getByLabelText('Tautan YouTube'), 'bukan-url');
		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(screen.getByText('Tautan YouTube tidak valid')).toBeInTheDocument();
		expect(store.addContent).not.toHaveBeenCalled();
	});

	it('menambah konten dan menutup modal', async () => {
		store.addContent.mockResolvedValue(okResult);
		const user = userEvent.setup();
		render(ContentModal, { props: { courseId: 10, onclose } });

		await user.type(screen.getByLabelText('Judul'), ' Video 1 ');
		await user.type(screen.getByLabelText('Tautan YouTube'), 'https://youtu.be/abc123');
		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(store.addContent).toHaveBeenCalledWith(10, {
			title: 'Video 1',
			youtube: 'https://youtu.be/abc123'
		});
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('menampilkan error dan tetap terbuka jika gagal', async () => {
		store.addContent.mockResolvedValue(failResult);
		const user = userEvent.setup();
		render(ContentModal, { props: { courseId: 10, onclose } });

		await user.type(screen.getByLabelText('Judul'), 'Video');
		await user.type(screen.getByLabelText('Tautan YouTube'), 'https://youtu.be/abc123');
		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(screen.getByText('Gagal simpan')).toBeInTheDocument();
		expect(screen.getByText('judul terlalu panjang')).toBeInTheDocument();
		expect(onclose).not.toHaveBeenCalled();
	});
});

describe('ContentModal (ubah)', () => {
	const content = makeContent();

	it('mengisi formulir dengan data konten', () => {
		render(ContentModal, { props: { courseId: 10, content, onclose } });

		expect(screen.getByRole('heading', { name: 'Ubah Konten' })).toBeInTheDocument();
		expect(screen.getByLabelText('Judul')).toHaveValue('Pengenalan');
		expect(screen.getByLabelText('Tautan YouTube')).toHaveValue('https://youtu.be/abc123');
	});

	it('menyimpan perubahan lewat updateContent', async () => {
		store.updateContent.mockResolvedValue(okResult);
		const user = userEvent.setup();
		render(ContentModal, { props: { courseId: 10, content, onclose } });

		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(store.updateContent).toHaveBeenCalledWith(10, 5, {
			title: 'Pengenalan',
			youtube: 'https://youtu.be/abc123'
		});
		expect(store.addContent).not.toHaveBeenCalled();
		expect(onclose).toHaveBeenCalledOnce();
	});
});

describe('ContentModal (umum)', () => {
	it('tombol Batal menutup modal', async () => {
		const user = userEvent.setup();
		render(ContentModal, { props: { courseId: 10, onclose } });

		await user.click(screen.getByRole('button', { name: 'Batal' }));

		expect(onclose).toHaveBeenCalledOnce();
	});

	it('menonaktifkan tombol saat menyimpan', () => {
		store.busy = { content: true };
		render(ContentModal, { props: { courseId: 10, onclose } });

		expect(screen.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled();
	});
});

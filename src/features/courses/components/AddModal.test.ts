import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddModal from './AddModal.svelte';

const store = vi.hoisted(() => ({
	addCourse: vi.fn(),
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

async function fillAndSubmit(title: string, description: string) {
	const user = userEvent.setup();
	await user.type(screen.getByLabelText('Judul'), title);
	await user.type(screen.getByLabelText('Deskripsi'), description);
	await user.click(screen.getByRole('button', { name: 'Simpan' }));
}

describe('AddModal', () => {
	it('menampilkan judul modal', () => {
		render(AddModal, { props: { onclose } });

		expect(screen.getByRole('heading', { name: 'Tambah Kursus' })).toBeInTheDocument();
	});

	it('menolak isian kosong', async () => {
		const user = userEvent.setup();
		render(AddModal, { props: { onclose } });

		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(screen.getByText('Judul wajib diisi')).toBeInTheDocument();
		expect(screen.getByText('Deskripsi wajib diisi')).toBeInTheDocument();
		expect(store.addCourse).not.toHaveBeenCalled();
	});

	it('menyimpan kursus dan menutup modal', async () => {
		store.addCourse.mockResolvedValue(okResult);
		render(AddModal, { props: { onclose } });

		await fillAndSubmit(' Svelte ', ' Dasar ');

		expect(store.addCourse).toHaveBeenCalledWith({ title: 'Svelte', description: 'Dasar' });
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('menampilkan error dan tetap terbuka jika gagal', async () => {
		store.addCourse.mockResolvedValue(failResult);
		render(AddModal, { props: { onclose } });

		await fillAndSubmit('Svelte', 'Dasar');

		expect(screen.getByText('Gagal simpan')).toBeInTheDocument();
		expect(screen.getByText('judul terlalu panjang')).toBeInTheDocument();
		expect(onclose).not.toHaveBeenCalled();
	});

	it('tombol Batal menutup modal', async () => {
		const user = userEvent.setup();
		render(AddModal, { props: { onclose } });

		await user.click(screen.getByRole('button', { name: 'Batal' }));

		expect(onclose).toHaveBeenCalledOnce();
	});

	it('menonaktifkan tombol saat menyimpan', () => {
		store.busy = { add: true };
		render(AddModal, { props: { onclose } });

		expect(screen.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled();
	});
});

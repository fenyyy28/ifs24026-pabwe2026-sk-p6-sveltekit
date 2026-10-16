import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChangeModal from './ChangeModal.svelte';

const store = vi.hoisted(() => ({
	updateCourse: vi.fn(),
	busy: {} as Record<string, boolean>
}));
vi.mock('../states/coursesStore.svelte', () => ({ coursesStore: store }));

const onclose = vi.fn();
const course = { id: 10, title: 'Judul lama', description: 'Deskripsi lama' };
const okResult = { ok: true, message: 'OK', fields: [] };
const failResult = { ok: false, message: 'Gagal ubah', fields: ['judul sudah ada'] };

beforeEach(() => {
	vi.resetAllMocks();
	store.busy = {};
});

describe('ChangeModal', () => {
	it('mengisi formulir dengan data kursus', () => {
		render(ChangeModal, { props: { course, onclose } });

		expect(screen.getByRole('heading', { name: 'Ubah Kursus' })).toBeInTheDocument();
		expect(screen.getByLabelText('Judul')).toHaveValue('Judul lama');
		expect(screen.getByLabelText('Deskripsi')).toHaveValue('Deskripsi lama');
	});

	it('menolak isian yang dikosongkan', async () => {
		const user = userEvent.setup();
		render(ChangeModal, { props: { course, onclose } });

		await user.clear(screen.getByLabelText('Judul'));
		await user.clear(screen.getByLabelText('Deskripsi'));
		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(screen.getByText('Judul wajib diisi')).toBeInTheDocument();
		expect(screen.getByText('Deskripsi wajib diisi')).toBeInTheDocument();
		expect(store.updateCourse).not.toHaveBeenCalled();
	});

	it('menyimpan perubahan dan menutup modal', async () => {
		store.updateCourse.mockResolvedValue(okResult);
		const user = userEvent.setup();
		render(ChangeModal, { props: { course, onclose } });

		await user.clear(screen.getByLabelText('Judul'));
		await user.type(screen.getByLabelText('Judul'), ' Judul baru ');
		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(store.updateCourse).toHaveBeenCalledWith(10, {
			title: 'Judul baru',
			description: 'Deskripsi lama'
		});
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('menampilkan error dan tetap terbuka jika gagal', async () => {
		store.updateCourse.mockResolvedValue(failResult);
		const user = userEvent.setup();
		render(ChangeModal, { props: { course, onclose } });

		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(screen.getByText('Gagal ubah')).toBeInTheDocument();
		expect(screen.getByText('judul sudah ada')).toBeInTheDocument();
		expect(onclose).not.toHaveBeenCalled();
	});

	it('tombol Batal menutup modal', async () => {
		const user = userEvent.setup();
		render(ChangeModal, { props: { course, onclose } });

		await user.click(screen.getByRole('button', { name: 'Batal' }));

		expect(onclose).toHaveBeenCalledOnce();
	});

	it('menonaktifkan tombol saat menyimpan', () => {
		store.busy = { change: true };
		render(ChangeModal, { props: { course, onclose } });

		expect(screen.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled();
	});
});

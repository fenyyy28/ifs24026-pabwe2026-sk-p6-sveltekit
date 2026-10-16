import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChangeCoverModal from './ChangeCoverModal.svelte';

const store = vi.hoisted(() => ({
	changeCover: vi.fn(),
	busy: {} as Record<string, boolean>
}));
vi.mock('../states/coursesStore.svelte', () => ({ coursesStore: store }));

const onclose = vi.fn();
const okResult = { ok: true, message: 'OK', fields: [] };
const failResult = { ok: false, message: 'Gagal unggah', fields: ['ukuran terlalu besar'] };

const image = () => new File(['x'], 'cover.png', { type: 'image/png' });
const textFile = () => new File(['x'], 'catatan.txt', { type: 'text/plain' });
const fileInput = (container: HTMLElement) =>
	container.querySelector('input[type="file"]') as HTMLInputElement;
// applyAccept: false supaya berkas bukan gambar tetap sampai ke penangan perubahan
const setup = () => userEvent.setup({ applyAccept: false });

beforeEach(() => {
	vi.resetAllMocks();
	store.busy = {};
	URL.createObjectURL = vi.fn(() => 'blob:preview');
	URL.revokeObjectURL = vi.fn();
});

describe('ChangeCoverModal', () => {
	it('menampilkan sampul saat ini', () => {
		const { container } = render(ChangeCoverModal, {
			props: { courseId: 10, currentCover: 'http://x.test/lama.png', onclose }
		});

		expect(screen.getByRole('heading', { name: 'Ubah Sampul' })).toBeInTheDocument();
		expect(container.querySelector('img')).toHaveAttribute('src', 'http://x.test/lama.png');
	});

	it('tanpa sampul saat ini hanya menampilkan placeholder', () => {
		const { container } = render(ChangeCoverModal, { props: { courseId: 10, onclose } });

		expect(container.querySelector('img')).toBeNull();
	});

	it('meminta gambar jika belum memilih berkas', async () => {
		const user = setup();
		render(ChangeCoverModal, { props: { courseId: 10, onclose } });

		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(screen.getByText('Pilih gambar terlebih dahulu')).toBeInTheDocument();
		expect(store.changeCover).not.toHaveBeenCalled();
	});

	it('menolak berkas yang bukan gambar', async () => {
		const user = setup();
		const { container } = render(ChangeCoverModal, { props: { courseId: 10, onclose } });

		await user.upload(fileInput(container), textFile());

		expect(screen.getByText('File harus berupa gambar')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Simpan' }));
		expect(screen.getByText('Pilih gambar terlebih dahulu')).toBeInTheDocument();
		expect(store.changeCover).not.toHaveBeenCalled();
	});

	it('menampilkan pratinjau gambar yang dipilih dan membersihkannya saat ditutup', async () => {
		const user = setup();
		const { container, unmount } = render(ChangeCoverModal, {
			props: { courseId: 10, onclose }
		});

		await user.upload(fileInput(container), image());

		await waitFor(() =>
			expect(container.querySelector('img')).toHaveAttribute('src', 'blob:preview')
		);

		unmount();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
	});

	it('menghapus pratinjau jika pilihan dikosongkan', async () => {
		const user = setup();
		const { container } = render(ChangeCoverModal, { props: { courseId: 10, onclose } });

		await user.upload(fileInput(container), image());
		await waitFor(() => expect(container.querySelector('img')).not.toBeNull());

		await fireEvent.change(fileInput(container), { target: { files: [] } });

		await waitFor(() => expect(container.querySelector('img')).toBeNull());
	});

	it('mengunggah sampul dan menutup modal', async () => {
		store.changeCover.mockResolvedValue(okResult);
		const user = setup();
		const file = image();
		const { container } = render(ChangeCoverModal, { props: { courseId: 10, onclose } });

		await user.upload(fileInput(container), file);
		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(store.changeCover).toHaveBeenCalledWith(10, file);
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('menampilkan error dan tetap terbuka jika gagal', async () => {
		store.changeCover.mockResolvedValue(failResult);
		const user = setup();
		const { container } = render(ChangeCoverModal, { props: { courseId: 10, onclose } });

		await user.upload(fileInput(container), image());
		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(screen.getByText('Gagal unggah')).toBeInTheDocument();
		expect(screen.getByText('ukuran terlalu besar')).toBeInTheDocument();
		expect(onclose).not.toHaveBeenCalled();
	});

	it('tombol Batal menutup modal', async () => {
		const user = setup();
		render(ChangeCoverModal, { props: { courseId: 10, onclose } });

		await user.click(screen.getByRole('button', { name: 'Batal' }));

		expect(onclose).toHaveBeenCalledOnce();
	});

	it('menonaktifkan tombol saat mengunggah', () => {
		store.busy = { cover: true };
		render(ChangeCoverModal, { props: { courseId: 10, onclose } });

		expect(screen.getByRole('button', { name: 'Mengunggah...' })).toBeDisabled();
	});
});

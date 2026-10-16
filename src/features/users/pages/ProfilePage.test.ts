import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, ok } from '../../../test/api';
import { me } from '../../../test/fixtures';
import { authApi } from '../../auth/api/authApi';
import { authStore } from '../../auth/states/authStore.svelte';
import { usersApi } from '../api/usersApi';
import { profileStore } from '../states/profileStore.svelte';
import ProfilePage from './ProfilePage.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('../api/usersApi', () => ({
	usersApi: { updateProfile: vi.fn(), changePhoto: vi.fn(), changePassword: vi.fn() }
}));
vi.mock('../../auth/api/authApi', () => ({
	authApi: { register: vi.fn(), login: vi.fn(), me: vi.fn() }
}));

const image = () => new File(['x'], 'foto.png', { type: 'image/png' });
const textFile = () => new File(['x'], 'catatan.txt', { type: 'text/plain' });
const fileInput = (container: HTMLElement) =>
	container.querySelector('input[type="file"]') as HTMLInputElement;
// applyAccept: false supaya berkas bukan gambar tetap sampai ke penangan perubahan
const setup = () => userEvent.setup({ applyAccept: false });

beforeEach(() => {
	vi.resetAllMocks();
	authStore.user = me;
	authStore.ready = true;
	profileStore.saving = null;
	profileStore.notices = {};
	vi.mocked(authApi.me).mockResolvedValue(ok({ user: me }));
	URL.createObjectURL = vi.fn(() => 'blob:preview');
	URL.revokeObjectURL = vi.fn();
});

describe('informasi profil', () => {
	it('mengisi formulir dari profil yang sedang login', () => {
		render(ProfilePage);

		expect(screen.getByRole('heading', { level: 1, name: 'Profil' })).toBeInTheDocument();
		expect(screen.getByLabelText('Nama')).toHaveValue('Ani');
		expect(screen.getByLabelText('Email')).toHaveValue('ani@mail.com');
	});

	it('mengisi formulir saat profil tersedia dan tidak menimpanya lagi sesudahnya', async () => {
		authStore.user = null;
		render(ProfilePage);
		const name = screen.getByLabelText('Nama');
		expect(name).toHaveValue('');

		authStore.user = { ...me, name: 'Budi' };
		await waitFor(() => expect(name).toHaveValue('Budi'));

		authStore.user = { ...me, name: 'Cici' };
		await tick();
		expect(name).toHaveValue('Budi');
	});

	it('menolak nama dan email kosong', async () => {
		const user = setup();
		render(ProfilePage);

		await user.clear(screen.getByLabelText('Nama'));
		await user.clear(screen.getByLabelText('Email'));
		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(screen.getByText('Nama wajib diisi')).toBeInTheDocument();
		expect(screen.getByText('Email wajib diisi')).toBeInTheDocument();
		expect(usersApi.updateProfile).not.toHaveBeenCalled();
	});

	it('menyimpan profil dan memuat ulang data pengguna', async () => {
		vi.mocked(usersApi.updateProfile).mockResolvedValue(ok());
		const user = setup();
		render(ProfilePage);

		await user.clear(screen.getByLabelText('Nama'));
		await user.type(screen.getByLabelText('Nama'), ' Ani Baru ');
		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(await screen.findByText('OK')).toBeInTheDocument();
		expect(usersApi.updateProfile).toHaveBeenCalledWith({
			name: 'Ani Baru',
			email: 'ani@mail.com'
		});
		expect(authApi.me).toHaveBeenCalled();
	});

	it('menampilkan error jika gagal menyimpan', async () => {
		vi.mocked(usersApi.updateProfile).mockResolvedValue(
			fail('Gagal simpan', { email: ['sudah dipakai'] })
		);
		const user = setup();
		render(ProfilePage);

		await user.click(screen.getByRole('button', { name: 'Simpan' }));

		expect(await screen.findByText('Gagal simpan')).toBeInTheDocument();
		expect(screen.getByText('sudah dipakai')).toBeInTheDocument();
	});

	it('menonaktifkan tombol saat menyimpan', () => {
		profileStore.saving = 'profile';
		render(ProfilePage);

		expect(screen.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled();
	});
});

describe('foto profil', () => {
	it('menampilkan foto pengguna jika ada', () => {
		authStore.user = { ...me, photo: 'http://x.test/foto.png' };
		render(ProfilePage);

		expect(screen.getByRole('img')).toHaveAttribute('src', 'http://x.test/foto.png');
	});

	it('meminta foto jika belum memilih berkas', async () => {
		const user = setup();
		render(ProfilePage);

		await user.click(screen.getByRole('button', { name: 'Ganti Foto' }));

		expect(screen.getByText('Pilih foto terlebih dahulu')).toBeInTheDocument();
		expect(usersApi.changePhoto).not.toHaveBeenCalled();
	});

	it('menolak berkas yang bukan gambar', async () => {
		const user = setup();
		const { container } = render(ProfilePage);

		await user.upload(fileInput(container), textFile());

		expect(screen.getByText('File harus berupa gambar')).toBeInTheDocument();
	});

	it('menampilkan pratinjau, lalu membersihkannya saat ditutup', async () => {
		const user = setup();
		const { container, unmount } = render(ProfilePage);

		await user.upload(fileInput(container), image());
		await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:preview'));

		unmount();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
	});

	it('menghapus pratinjau jika pilihan dikosongkan', async () => {
		const user = setup();
		const { container } = render(ProfilePage);

		await user.upload(fileInput(container), image());
		await waitFor(() => expect(screen.queryByRole('img')).not.toBeNull());

		await fireEvent.change(fileInput(container), { target: { files: [] } });

		await waitFor(() => expect(screen.queryByRole('img')).toBeNull());
	});

	it('mengunggah foto dan mengosongkan pilihan setelah berhasil', async () => {
		vi.mocked(usersApi.changePhoto).mockResolvedValue(ok());
		const user = setup();
		const file = image();
		const { container } = render(ProfilePage);

		await user.upload(fileInput(container), file);
		await user.click(screen.getByRole('button', { name: 'Ganti Foto' }));

		expect(usersApi.changePhoto).toHaveBeenCalledWith(file);
		await waitFor(() => expect(screen.queryByRole('img')).toBeNull());
	});

	it('mempertahankan pilihan dan menampilkan error jika gagal', async () => {
		vi.mocked(usersApi.changePhoto).mockResolvedValue(fail('Gagal unggah'));
		const user = setup();
		const { container } = render(ProfilePage);

		await user.upload(fileInput(container), image());
		await user.click(screen.getByRole('button', { name: 'Ganti Foto' }));

		expect(await screen.findByText('Gagal unggah')).toBeInTheDocument();
		expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:preview');
	});

	it('menonaktifkan tombol saat mengunggah', () => {
		profileStore.saving = 'photo';
		render(ProfilePage);

		expect(screen.getByRole('button', { name: 'Mengunggah...' })).toBeDisabled();
	});
});

describe('kata sandi', () => {
	async function fillPasswords(current: string, next: string, confirm: string) {
		const user = setup();
		if (current) await user.type(screen.getByLabelText('Kata sandi saat ini'), current);
		if (next) await user.type(screen.getByLabelText('Kata sandi baru'), next);
		if (confirm) await user.type(screen.getByLabelText('Konfirmasi kata sandi baru'), confirm);
		await user.click(screen.getByRole('button', { name: 'Ganti Kata Sandi' }));
	}

	it('menolak isian kosong', async () => {
		render(ProfilePage);

		await fillPasswords('', '', '');

		expect(screen.getByText('Kata sandi saat ini wajib diisi')).toBeInTheDocument();
		expect(screen.getByText('Kata sandi baru wajib diisi')).toBeInTheDocument();
		expect(usersApi.changePassword).not.toHaveBeenCalled();
	});

	it('menolak konfirmasi yang tidak sama', async () => {
		render(ProfilePage);

		await fillPasswords('lama', 'baru', 'beda');

		expect(screen.getByText('Konfirmasi kata sandi tidak sama')).toBeInTheDocument();
		expect(usersApi.changePassword).not.toHaveBeenCalled();
	});

	it('mengganti kata sandi lalu mengosongkan isian', async () => {
		vi.mocked(usersApi.changePassword).mockResolvedValue(ok());
		render(ProfilePage);

		await fillPasswords('lama', 'baru', 'baru');

		expect(await screen.findByText('OK')).toBeInTheDocument();
		expect(usersApi.changePassword).toHaveBeenCalledWith({
			password: 'lama',
			new_password: 'baru'
		});
		expect(screen.getByLabelText('Kata sandi saat ini')).toHaveValue('');
		expect(screen.getByLabelText('Kata sandi baru')).toHaveValue('');
		expect(screen.getByLabelText('Konfirmasi kata sandi baru')).toHaveValue('');
	});

	it('mempertahankan isian dan menampilkan error jika gagal', async () => {
		vi.mocked(usersApi.changePassword).mockResolvedValue(fail('Kata sandi lama salah'));
		render(ProfilePage);

		await fillPasswords('lama', 'baru', 'baru');

		expect(await screen.findByText('Kata sandi lama salah')).toBeInTheDocument();
		expect(screen.getByLabelText('Kata sandi saat ini')).toHaveValue('lama');
	});

	it('menonaktifkan tombol saat menyimpan', () => {
		profileStore.saving = 'password';
		render(ProfilePage);

		expect(screen.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled();
	});
});

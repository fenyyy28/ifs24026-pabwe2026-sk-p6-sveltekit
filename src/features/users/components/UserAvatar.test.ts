import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import UserAvatar from './UserAvatar.svelte';

describe('UserAvatar', () => {
	it('menampilkan inisial huruf besar jika tidak ada foto', () => {
		render(UserAvatar, { props: { name: 'ani' } });

		expect(screen.getByText('A')).toBeInTheDocument();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	it('menampilkan "?" jika nama kosong', () => {
		render(UserAvatar, { props: { name: '   ' } });

		expect(screen.getByText('?')).toBeInTheDocument();
	});

	it('menampilkan foto dengan ukuran yang diminta', () => {
		render(UserAvatar, { props: { name: 'Ani', photo: 'http://x.test/a.png', size: 64 } });

		const img = screen.getByRole('img', { name: 'Ani' });
		expect(img).toHaveAttribute('src', 'http://x.test/a.png');
		expect(img).toHaveStyle({ width: '64px', height: '64px' });
	});

	it('memakai alt kosong jika dekoratif (nama sudah tertulis di dekatnya)', () => {
		const { container } = render(UserAvatar, {
			props: { name: 'Ani', photo: 'http://x.test/a.png', decorative: true }
		});

		expect(container.querySelector('img')).toHaveAttribute('alt', '');
		expect(screen.queryByRole('img', { name: 'Ani' })).not.toBeInTheDocument();
	});

	it('kembali ke inisial jika foto gagal dimuat', async () => {
		render(UserAvatar, { props: { name: 'Budi', photo: 'http://x.test/rusak.png' } });

		await fireEvent.error(screen.getByRole('img'));

		expect(screen.queryByRole('img')).not.toBeInTheDocument();
		expect(screen.getByText('B')).toBeInTheDocument();
	});

	// Kompilator Svelte menambahkan `?? ''` pada atribut style yang memuat {size}.
	// Cabang itu hanya dijalankan jika size bernilai null.
	it('tetap tampil jika ukuran bernilai null (tanpa foto)', () => {
		render(UserAvatar, { props: { name: 'Ani', size: null as unknown as number } });

		expect(screen.getByText('A')).toBeInTheDocument();
	});

	it('tetap tampil jika ukuran bernilai null (dengan foto)', () => {
		render(UserAvatar, {
			props: { name: 'Ani', photo: 'http://x.test/a.png', size: null as unknown as number }
		});

		expect(screen.getByRole('img', { name: 'Ani' })).toBeInTheDocument();
	});
});

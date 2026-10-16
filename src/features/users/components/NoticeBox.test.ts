import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import NoticeBox from './NoticeBox.svelte';

describe('NoticeBox', () => {
	it('tidak menampilkan apa pun tanpa notifikasi', () => {
		const { container } = render(NoticeBox);

		expect(container.querySelector('div')).toBeNull();
	});

	it('menampilkan notifikasi sukses berwarna hijau', () => {
		render(NoticeBox, { props: { notice: { type: 'success', text: 'Tersimpan', fields: [] } } });

		expect(screen.getByText('Tersimpan').closest('div')).toHaveClass('bg-green-50');
	});

	it('menampilkan notifikasi error berwarna merah beserta daftar field', () => {
		render(NoticeBox, {
			props: { notice: { type: 'error', text: 'Gagal', fields: ['email sudah ada', 'nama kosong'] } }
		});

		expect(screen.getByText('Gagal').closest('div')).toHaveClass('bg-red-50');
		expect(screen.getByText('email sudah ada')).toBeInTheDocument();
		expect(screen.getByText('nama kosong')).toBeInTheDocument();
	});
});

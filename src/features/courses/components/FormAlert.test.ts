import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import FormAlert from './FormAlert.svelte';

describe('FormAlert', () => {
	it('kosong jika hasil null', () => {
		const { container } = render(FormAlert, { props: { result: null } });

		expect(container.querySelector('div')).toBeNull();
	});

	it('kosong jika hasil berhasil', () => {
		const { container } = render(FormAlert, {
			props: { result: { ok: true, message: 'OK', fields: [] } }
		});

		expect(container.querySelector('div')).toBeNull();
	});

	it('menampilkan pesan dan field saat gagal', () => {
		render(FormAlert, {
			props: { result: { ok: false, message: 'Gagal simpan', fields: ['judul wajib'] } }
		});

		expect(screen.getByText('Gagal simpan')).toBeInTheDocument();
		expect(screen.getByText('judul wajib')).toBeInTheDocument();
	});
});

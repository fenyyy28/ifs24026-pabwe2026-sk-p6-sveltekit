import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Modal from './Modal.svelte';

const onclose = vi.fn();
const children = createRawSnippet(() => ({ render: () => '<p>isi modal</p>' }));

beforeEach(() => vi.resetAllMocks());

describe('Modal', () => {
	it('menampilkan judul dan isi', () => {
		render(Modal, { props: { title: 'Judul Modal', onclose, children } });

		expect(screen.getByRole('dialog', { name: 'Judul Modal' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Judul Modal' })).toBeInTheDocument();
		expect(screen.getByText('isi modal')).toBeInTheDocument();
	});

	it('menutup lewat tombol tutup', async () => {
		const user = userEvent.setup();
		render(Modal, { props: { title: 'Judul', onclose, children } });

		await user.click(screen.getByRole('button', { name: 'Tutup' }));

		expect(onclose).toHaveBeenCalledOnce();
	});

	it('menutup dengan tombol Escape, tetapi tidak dengan tombol lain', async () => {
		const user = userEvent.setup();
		render(Modal, { props: { title: 'Judul', onclose, children } });

		await user.keyboard('a');
		expect(onclose).not.toHaveBeenCalled();

		await user.keyboard('{Escape}');
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('menutup saat latar belakang diklik, tetapi tidak saat isi dialog diklik', async () => {
		const user = userEvent.setup();
		render(Modal, { props: { title: 'Judul', onclose, children } });
		const dialog = screen.getByRole('dialog');

		await user.click(dialog);
		expect(onclose).not.toHaveBeenCalled();

		await user.click(dialog.parentElement as HTMLElement);
		expect(onclose).toHaveBeenCalledOnce();
	});
});

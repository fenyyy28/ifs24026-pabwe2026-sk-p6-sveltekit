import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import AuthLayout from './AuthLayout.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>isi formulir</p>' }));

describe('AuthLayout', () => {
	it('menampilkan judul, subjudul, dan isi', () => {
		render(AuthLayout, { props: { title: 'Masuk', subtitle: 'Lanjutkan belajar.', children } });

		expect(screen.getByRole('heading', { level: 1, name: 'Masuk' })).toBeInTheDocument();
		expect(screen.getByText('Lanjutkan belajar.')).toBeInTheDocument();
		expect(screen.getByText('isi formulir')).toBeInTheDocument();
	});

	it('menampilkan teks pengenal yang menjelaskan kursus', () => {
		render(AuthLayout, { props: { title: 'Masuk', subtitle: 'x', children } });

		expect(screen.getByText('Belajar lewat kursus, kapan saja.')).toBeInTheDocument();
		expect(screen.getByText(/platform kursus daring/)).toBeInTheDocument();
		expect(screen.getByText('Materi berupa video yang tersusun per topik')).toBeInTheDocument();
		expect(screen.getByText('Pantau progres belajar di setiap kursus')).toBeInTheDocument();
		expect(screen.getByText('Beri rating dan ulasan setelah belajar')).toBeInTheDocument();
	});
});

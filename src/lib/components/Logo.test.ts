import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Logo from './Logo.svelte';

describe('Logo', () => {
	it('menampilkan ikon dan teks secara bawaan', () => {
		const { container } = render(Logo);

		expect(screen.getByText('Delcom Courses')).toBeInTheDocument();
		expect(container.querySelector('svg')).toHaveAttribute('width', '28');
	});

	it('menyembunyikan teks dan mengatur ukuran ikon', () => {
		const { container } = render(Logo, { props: { size: 40, showText: false } });

		expect(screen.queryByText('Delcom Courses')).not.toBeInTheDocument();
		expect(container.querySelector('svg')).toHaveAttribute('width', '40');
	});
});

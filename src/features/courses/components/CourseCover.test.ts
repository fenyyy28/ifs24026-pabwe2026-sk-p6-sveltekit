import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import CourseCover from './CourseCover.svelte';

describe('CourseCover', () => {
	it('hanya menampilkan placeholder jika tidak ada sampul', () => {
		const { container } = render(CourseCover);

		expect(container.querySelector('img')).toBeNull();
		expect(container.querySelector('svg')).not.toBeNull();
	});

	it('menampilkan gambar dan kelas tambahan', () => {
		const { container } = render(CourseCover, {
			props: { cover: 'http://x.test/c.png', class: 'h-40' }
		});

		expect(container.querySelector('img')).toHaveAttribute('src', 'http://x.test/c.png');
		expect(container.firstElementChild).toHaveClass('h-40');
	});

	it('menyembunyikan gambar yang gagal dimuat', async () => {
		const { container } = render(CourseCover, { props: { cover: 'http://x.test/rusak.png' } });
		const img = container.querySelector('img') as HTMLImageElement;

		await fireEvent.error(img);

		expect(img.style.display).toBe('none');
	});

	// Kompilator Svelte menambahkan `?? ''` pada atribut class yang memuat {className}.
	it('tetap tampil jika kelas bernilai null', () => {
		const { container } = render(CourseCover, { props: { class: null as unknown as string } });

		expect(container.firstElementChild).toHaveClass('bg-indigo-100');
	});
});

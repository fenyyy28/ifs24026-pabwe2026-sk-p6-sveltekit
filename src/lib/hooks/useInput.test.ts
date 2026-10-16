import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import { useInput } from './useInput';

describe('useInput', () => {
	it('menyimpan nilai awal dan bisa diubah', () => {
		const input = useInput('awal');
		expect(get(input.value)).toBe('awal');
		input.value.set('baru');
		expect(get(input.value)).toBe('baru');
	});

	it('check() selalu valid jika tidak ada validator', () => {
		const input = useInput('');
		expect(input.check()).toBe(true);
		expect(get(input.error)).toBeNull();
	});

	it('check() mengisi pesan error dari validator', () => {
		const input = useInput('', (v) => (v ? null : 'wajib'));

		expect(input.check()).toBe(false);
		expect(get(input.error)).toBe('wajib');

		input.value.set('isi');
		expect(input.check()).toBe(true);
		expect(get(input.error)).toBeNull();
	});

	it('reset() mengembalikan nilai awal dan menghapus error', () => {
		const input = useInput('awal', (v) => (v === 'awal' ? null : 'salah'));
		input.value.set('lain');
		input.check();

		input.reset();

		expect(get(input.value)).toBe('awal');
		expect(get(input.error)).toBeNull();
	});

	it('mendukung tipe selain string', () => {
		const input = useInput(5);
		input.value.set(9);
		input.reset();
		expect(get(input.value)).toBe(5);
	});
});
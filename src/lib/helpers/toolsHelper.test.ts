import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	flattenErrors,
	formatDate,
	formatPercentage,
	formatRating,
	getAuthToken,
	getYoutubeEmbedUrl,
	getYoutubeId,
	removeAuthToken,
	setAuthToken
} from './toolsHelper';

describe('token', () => {
	it('menyimpan, membaca, dan menghapus token', () => {
		expect(getAuthToken()).toBeNull();
		setAuthToken('abc');
		expect(getAuthToken()).toBe('abc');
		removeAuthToken();
		expect(getAuthToken()).toBeNull();
	});
});

describe('token di server (tanpa window)', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	it('tidak menyentuh localStorage', async () => {
		vi.stubGlobal('window', undefined);
		vi.resetModules();
		const ssr = await import('./toolsHelper');

		expect(ssr.getAuthToken()).toBeNull();
		expect(() => ssr.setAuthToken('x')).not.toThrow();
		expect(() => ssr.removeAuthToken()).not.toThrow();
	});
});

describe('formatDate', () => {
	it('mengembalikan "-" untuk nilai kosong atau tidak valid', () => {
		expect(formatDate(null)).toBe('-');
		expect(formatDate(undefined)).toBe('-');
		expect(formatDate('bukan tanggal')).toBe('-');
	});

	it('memformat tanggal dalam bahasa Indonesia', () => {
		const iso = new Date(2026, 9, 15, 12).toISOString();
		expect(formatDate(iso)).toBe('15 Oktober 2026');
	});
});

describe('formatRating', () => {
	it('menangani nilai kosong dan bukan angka', () => {
		expect(formatRating(null)).toBe('Belum ada rating');
		expect(formatRating(undefined)).toBe('Belum ada rating');
		expect(formatRating('')).toBe('Belum ada rating');
		expect(formatRating('abc')).toBe('Belum ada rating');
	});

	it('membulatkan satu desimal', () => {
		expect(formatRating('4.0000')).toBe('4.0');
		expect(formatRating(3.456)).toBe('3.5');
	});
});

describe('formatPercentage', () => {
	it('membulatkan dan menangani nilai tidak valid', () => {
		expect(formatPercentage('80.4')).toBe('80%');
		expect(formatPercentage(50)).toBe('50%');
		expect(formatPercentage('x')).toBe('0%');
		expect(formatPercentage(undefined)).toBe('0%');
	});
});

describe('getYoutubeId', () => {
	it('membaca berbagai bentuk tautan', () => {
		expect(getYoutubeId('https://youtu.be/abc123')).toBe('abc123');
		expect(getYoutubeId('https://www.youtube.com/watch?v=abc123')).toBe('abc123');
		expect(getYoutubeId('https://youtube.com/embed/abc123')).toBe('abc123');
	});

	it('mengembalikan null untuk tautan yang tidak dikenali', () => {
		expect(getYoutubeId('https://youtu.be/')).toBeNull();
		expect(getYoutubeId('https://youtube.com/watch')).toBeNull();
		expect(getYoutubeId('https://youtube.com/embed/')).toBeNull();
		expect(getYoutubeId('https://youtube.com/channel/x')).toBeNull();
		expect(getYoutubeId('https://example.com/watch?v=abc')).toBeNull();
		expect(getYoutubeId('bukan url')).toBeNull();
	});
});

describe('getYoutubeEmbedUrl', () => {
	it('membuat URL embed atau null', () => {
		expect(getYoutubeEmbedUrl('https://youtu.be/abc123')).toBe(
			'https://www.youtube.com/embed/abc123'
		);
		expect(getYoutubeEmbedUrl('https://example.com')).toBeNull();
	});
});

describe('flattenErrors', () => {
	it('meratakan pesan error API', () => {
		expect(flattenErrors({ email: ['a', 'b'], name: ['c'] })).toEqual(['a', 'b', 'c']);
		expect(flattenErrors({ email: 'pesan' })).toEqual(['pesan']);
	});

	it('mengabaikan data yang bukan pesan', () => {
		expect(flattenErrors(null)).toEqual([]);
		expect(flattenErrors('teks')).toEqual([]);
		expect(flattenErrors({ id: 1 })).toEqual([]);
	});
});
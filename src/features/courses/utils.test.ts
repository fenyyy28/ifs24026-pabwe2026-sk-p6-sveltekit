import { describe, expect, it } from 'vitest';
import { dangerButton, getCourseRole, inputClass, primaryButton, required, secondaryButton } from './utils';

const course = { user_id: 1, students: [2, 3] };

describe('getCourseRole', () => {
	it('visitor jika belum ada pengguna', () => {
		expect(getCourseRole(course, undefined)).toBe('visitor');
	});

	it('owner jika user_id sama', () => {
		expect(getCourseRole(course, 1)).toBe('owner');
	});

	it('owner didahulukan jika pemilik juga terdaftar sebagai peserta', () => {
		expect(getCourseRole({ user_id: 1, students: [1] }, 1)).toBe('owner');
	});

	it('student jika id ada di daftar peserta', () => {
		expect(getCourseRole(course, 2)).toBe('student');
	});

	it('visitor jika bukan keduanya', () => {
		expect(getCourseRole(course, 99)).toBe('visitor');
	});
});

describe('required', () => {
	it('memvalidasi isian wajib', () => {
		const check = required('Judul');
		expect(check('')).toBe('Judul wajib diisi');
		expect(check('   ')).toBe('Judul wajib diisi');
		expect(check('isi')).toBeNull();
	});
});

describe('kelas gaya', () => {
	it('berupa string tidak kosong', () => {
		for (const c of [inputClass, primaryButton, secondaryButton, dangerButton]) {
			expect(c).toBeTruthy();
		}
	});
});
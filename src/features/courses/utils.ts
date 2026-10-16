import type { Course } from './types';

export type CourseRole = 'owner' | 'student' | 'visitor';

/** Pemilik didahulukan jika pengguna memenuhi keduanya (pemilik sekaligus peserta). */
export function getCourseRole(
	course: Pick<Course, 'user_id' | 'students'>,
	userId?: number
): CourseRole {
	if (userId === undefined) return 'visitor';
	if (course.user_id === userId) return 'owner';
	if (course.students.includes(userId)) return 'student';
	return 'visitor';
}

export const required = (label: string) => (v: string) =>
	v.trim() ? null : `${label} wajib diisi`;

export const inputClass =
	'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500';

export const primaryButton =
	'inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60';

export const secondaryButton =
	'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60';

export const dangerButton =
	'inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60';
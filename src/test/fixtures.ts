import type { AuthUser } from '../features/auth/types';
import type { Course, CourseContent, CourseDetail } from '../features/courses/types';

export const me: AuthUser = { id: 1, name: 'Ani', email: 'ani@mail.com', photo: null };

export const makeCourse = (override: Partial<Course> = {}): Course => ({
	id: 10,
	user_id: 1,
	title: 'Belajar Svelte',
	cover: null,
	description: 'Dasar-dasar Svelte',
	created_at: '2026-10-15T12:00:00.000Z',
	updated_at: '2026-10-15T12:00:00.000Z',
	author: { name: 'Ani', photo: null },
	students: [],
	total_contents: 1,
	avg_ratings: null,
	...override
});

export const makeContent = (override: Partial<CourseContent> = {}): CourseContent => ({
	id: 5,
	course_id: 10,
	title: 'Pengenalan',
	youtube: 'https://youtu.be/abc123',
	created_at: '2026-10-15T12:00:00.000Z',
	updated_at: '2026-10-15T12:00:00.000Z',
	my_status_finished: false,
	...override
});

export const makeDetail = (override: Partial<CourseDetail> = {}): CourseDetail => ({
	...makeCourse(),
	contents: [makeContent()],
	ratings: [],
	my_percentage_finished: '0',
	...override
});

export interface CourseAuthor {
	name: string;
	photo?: string | null;
}

export interface Course {
	id: number;
	user_id: number;
	title: string;
	cover?: string | null;
	description: string;
	created_at: string;
	updated_at: string;
	author: CourseAuthor;
	/** Daftar id pengguna yang menjadi peserta. */
	students: number[];
	total_contents: number;
	avg_ratings: string | null;
}

export interface CourseContent {
	id: number;
	course_id: number;
	title: string;
	youtube: string;
	created_at: string;
	updated_at: string;
	my_status_finished: boolean;
}

export interface CourseRating {
	name: string;
	ratings: number;
	comment: string;
}

export interface CourseDetail extends Course {
	contents: CourseContent[];
	ratings: CourseRating[];
	my_percentage_finished: string;
}

export interface CoursePayload {
	title: string;
	description: string;
}

export interface ContentPayload {
	title: string;
	youtube: string;
}

export interface RatingPayload {
	ratings: number;
	comment: string;
}

export type MutationKey =
	| 'add'
	| 'change'
	| 'cover'
	| 'remove'
	| 'removeAll'
	| 'student'
	| 'rating'
	| 'content';

export interface MutationResult {
	ok: boolean;
	message: string;
	fields: string[];
}

export interface Toast {
	type: 'success' | 'error';
	text: string;
}
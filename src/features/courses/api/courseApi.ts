import { apiDelete, apiGet, apiPost, apiPut } from '../../../lib/helpers/apiHelper';
import type {
	ContentPayload,
	Course,
	CourseContent,
	CourseDetail,
	CoursePayload,
	RatingPayload
} from '../types';

export const courseApi = {
	/* ---- Kursus ---- */
	create: (payload: CoursePayload) => apiPost('/courses', payload),

	changeCover: (id: number, file: File) => {
		const form = new FormData();
		form.append('cover', file);
		return apiPost(`/courses/${id}/cover`, form);
	},

	update: (id: number, payload: CoursePayload) => apiPut(`/courses/${id}`, payload),

	list: (isMe = false) =>
		apiGet<{ courses: Course[] }>('/courses', { query: { is_me: isMe ? 1 : undefined } }),

	detail: (id: number) => apiGet<{ course: CourseDetail }>(`/courses/${id}`),

	remove: (id: number) => apiDelete(`/courses/${id}`),

	removeAll: () => apiDelete('/courses'),

	/* ---- Peserta ---- */
	join: (id: number) => apiPost(`/courses/${id}/students`),

	leave: (id: number) => apiDelete(`/courses/${id}/students`),

	rate: (id: number, payload: RatingPayload) => apiPut(`/courses/${id}/students/ratings`, payload),

	/* ---- Konten ---- */
	addContent: (courseId: number, payload: ContentPayload) =>
		apiPost<{ content_id: number }>(`/courses/${courseId}/contents`, payload),

	updateContent: (contentId: number, payload: ContentPayload) =>
		apiPut(`/courses/-/contents/${contentId}`, payload),

	contentDetail: (contentId: number) =>
		apiGet<{ course_content: CourseContent }>(`/courses/-/contents/${contentId}`),

	removeContent: (contentId: number) => apiDelete(`/courses/-/contents/${contentId}`),

	setContentStatus: (contentId: number, status: 0 | 1) =>
		apiPost(`/courses/-/contents/${contentId}/learns`, { status })
};
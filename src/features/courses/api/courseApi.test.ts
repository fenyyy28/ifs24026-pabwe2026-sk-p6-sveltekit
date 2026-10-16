import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiDelete, apiGet, apiPost, apiPut } from '../../../lib/helpers/apiHelper';
import { courseApi } from './courseApi';

vi.mock('../../../lib/helpers/apiHelper', () => ({
	apiGet: vi.fn(),
	apiPost: vi.fn(),
	apiPut: vi.fn(),
	apiDelete: vi.fn()
}));

beforeEach(() => vi.clearAllMocks());

describe('courseApi', () => {
	it('kursus', () => {
		const payload = { title: 'A', description: 'B' };

		courseApi.create(payload);
		expect(apiPost).toHaveBeenCalledWith('/courses', payload);

		courseApi.update(3, payload);
		expect(apiPut).toHaveBeenCalledWith('/courses/3', payload);

		courseApi.detail(3);
		expect(apiGet).toHaveBeenCalledWith('/courses/3');

		courseApi.remove(3);
		expect(apiDelete).toHaveBeenCalledWith('/courses/3');

		courseApi.removeAll();
		expect(apiDelete).toHaveBeenCalledWith('/courses');
	});

	it('list dengan dan tanpa filter milik saya', () => {
		courseApi.list();
		expect(apiGet).toHaveBeenLastCalledWith('/courses', { query: { is_me: undefined } });

		courseApi.list(true);
		expect(apiGet).toHaveBeenLastCalledWith('/courses', { query: { is_me: 1 } });
	});

	it('changeCover mengirim FormData', () => {
		const file = new File(['x'], 'c.png', { type: 'image/png' });
		courseApi.changeCover(3, file);

		const [path, body] = vi.mocked(apiPost).mock.calls[0];
		expect(path).toBe('/courses/3/cover');
		expect((body as FormData).get('cover')).toBe(file);
	});

	it('peserta dan rating', () => {
		courseApi.join(3);
		expect(apiPost).toHaveBeenCalledWith('/courses/3/students');

		courseApi.leave(3);
		expect(apiDelete).toHaveBeenCalledWith('/courses/3/students');

		courseApi.rate(3, { ratings: 5, comment: 'bagus' });
		expect(apiPut).toHaveBeenCalledWith('/courses/3/students/ratings', {
			ratings: 5,
			comment: 'bagus'
		});
	});

	it('konten', () => {
		const payload = { title: 'V', youtube: 'https://youtu.be/x' };

		courseApi.addContent(3, payload);
		expect(apiPost).toHaveBeenCalledWith('/courses/3/contents', payload);

		courseApi.updateContent(9, payload);
		expect(apiPut).toHaveBeenCalledWith('/courses/-/contents/9', payload);

		courseApi.contentDetail(9);
		expect(apiGet).toHaveBeenCalledWith('/courses/-/contents/9');

		courseApi.removeContent(9);
		expect(apiDelete).toHaveBeenCalledWith('/courses/-/contents/9');

		courseApi.setContentStatus(9, 1);
		expect(apiPost).toHaveBeenCalledWith('/courses/-/contents/9/learns', { status: 1 });
	});
});
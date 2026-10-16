import { render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DetailRoute from '../../routes/courses/[courseId]/+page.svelte';
import ContentRoute from '../../routes/courses/[courseId]/contents/[contentId]/+page.svelte';

const pageMock = vi.hoisted(() => ({
	url: new URL('http://localhost/'),
	params: {} as Record<string, string>,
	error: null as null | { message: string },
	status: 200
}));

vi.mock('$app/state', () => ({ page: pageMock }));
vi.mock('../../features/courses/pages/DetailPage.svelte', async () => ({
	default: (await import('../stubs/Stub.svelte')).default
}));
vi.mock('../../features/courses/pages/ContentPage.svelte', async () => ({
	default: (await import('../stubs/Stub.svelte')).default
}));

beforeEach(() => {
	pageMock.params = {};
});

describe('/courses/[courseId]', () => {
	it('meneruskan id kursus ke halaman detail', () => {
		pageMock.params = { courseId: '10' };
		render(DetailRoute);

		expect(screen.getByTestId('stub')).toHaveTextContent('halaman:10:-');
	});

	it.each(['abc', '0', '-3', '1.5'])('menolak id "%s"', (id) => {
		pageMock.params = { courseId: id };
		render(DetailRoute);

		expect(screen.getByText('Kursus tidak valid.')).toBeInTheDocument();
		expect(screen.queryByTestId('stub')).not.toBeInTheDocument();
	});
});

describe('/courses/[courseId]/contents/[contentId]', () => {
	it('meneruskan kedua id ke halaman materi', () => {
		pageMock.params = { courseId: '10', contentId: '5' };
		render(ContentRoute);

		expect(screen.getByTestId('stub')).toHaveTextContent('halaman:10:5');
	});

	it.each([
		['abc', '5'],
		['0', '5'],
		['10', 'abc'],
		['10', '0']
	])('menolak courseId "%s" dengan contentId "%s"', (courseId, contentId) => {
		pageMock.params = { courseId, contentId };
		render(ContentRoute);

		expect(screen.getByText('Konten tidak valid.')).toBeInTheDocument();
		expect(screen.queryByTestId('stub')).not.toBeInTheDocument();
	});
});

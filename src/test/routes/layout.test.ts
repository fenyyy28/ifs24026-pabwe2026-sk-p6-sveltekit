import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Layout from '../../routes/+layout.svelte';

const pageMock = vi.hoisted(() => ({
	url: new URL('http://localhost/'),
	params: {} as Record<string, string>,
	error: null as null | { message: string },
	status: 200
}));

vi.mock('$app/state', () => ({ page: pageMock }));
vi.mock('../../features/courses/layouts/CourseLayout.svelte', async () => ({
	default: (await import('../stubs/LayoutStub.svelte')).default
}));

const children = createRawSnippet(() => ({ render: () => '<p>isi halaman</p>' }));

beforeEach(() => {
	pageMock.url = new URL('http://localhost/');
	pageMock.error = null;
});

const at = (path: string) => {
	pageMock.url = new URL(`http://localhost${path}`);
};

describe('+layout.svelte', () => {
	it.each([
		['/', 'courses'],
		['/courses/10', 'courses'],
		['/users', 'users'],
		['/users/1', 'users'],
		['/profile', 'profile']
	])('membungkus %s dengan CourseLayout aktif "%s"', (path, active) => {
		at(path);
		render(Layout, { props: { children } });

		expect(screen.getByTestId('course-layout')).toHaveAttribute('data-active', active);
		expect(screen.getByText('isi halaman')).toBeInTheDocument();
	});

	it.each(['/auth', '/auth/login', '/auth/register'])(
		'%s tidak memakai layout kursus',
		(path) => {
			at(path);
			render(Layout, { props: { children } });

			expect(screen.queryByTestId('course-layout')).not.toBeInTheDocument();
			expect(screen.getByText('isi halaman')).toBeInTheDocument();
		}
	);

	it('halaman error tampil mandiri tanpa layout kursus', () => {
		pageMock.error = { message: 'Tidak ditemukan' };
		render(Layout, { props: { children } });

		expect(screen.queryByTestId('course-layout')).not.toBeInTheDocument();
		expect(screen.getByText('isi halaman')).toBeInTheDocument();
	});
});

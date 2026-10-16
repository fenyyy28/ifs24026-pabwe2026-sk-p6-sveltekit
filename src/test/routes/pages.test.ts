import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import RootRoute from '../../routes/+page.svelte';
import LoginRoute from '../../routes/auth/login/+page.svelte';
import RegisterRoute from '../../routes/auth/register/+page.svelte';
import ProfileRoute from '../../routes/profile/+page.svelte';
import UsersRoute from '../../routes/users/+page.svelte';

vi.mock('../../features/courses/pages/HomePage.svelte', async () => ({
	default: (await import('../stubs/Stub.svelte')).default
}));
vi.mock('../../features/auth/pages/LoginPage.svelte', async () => ({
	default: (await import('../stubs/Stub.svelte')).default
}));
vi.mock('../../features/auth/pages/RegisterPage.svelte', async () => ({
	default: (await import('../stubs/Stub.svelte')).default
}));
vi.mock('../../features/users/pages/UsersPage.svelte', async () => ({
	default: (await import('../stubs/Stub.svelte')).default
}));
vi.mock('../../features/users/pages/ProfilePage.svelte', async () => ({
	default: (await import('../stubs/Stub.svelte')).default
}));

describe('rute sederhana', () => {
	it.each([
		['/', RootRoute],
		['/auth/login', LoginRoute],
		['/auth/register', RegisterRoute],
		['/users', UsersRoute],
		['/profile', ProfileRoute]
	])('%s menampilkan halamannya', (_path, Route) => {
		render(Route);

		expect(screen.getByTestId('stub')).toHaveTextContent('halaman:-:-');
	});
});

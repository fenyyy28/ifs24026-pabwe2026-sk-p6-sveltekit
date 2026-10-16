import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			}
		})
	],
	resolve: { conditions: ['browser'] },
	test: {
		environment: 'jsdom',
		testTimeout: 15000,
		include: ['src/**/*.test.ts'],
		setupFiles: ['./src/vitest-setup.ts'],
		env: { VITE_DELCOM_BASEURL: 'https://api.test/api/v1' },
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,svelte}'],
			exclude: [
				'src/**/*.test.ts',
				'src/test/**',
				'src/**/types.ts',
				'src/**/*.d.ts',
				'src/vitest-setup.ts',
				'src/lib/index.ts'
			],
			reporter: ['text', 'html'],
			thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 }
		}
	}
});

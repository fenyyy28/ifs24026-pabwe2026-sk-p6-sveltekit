import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
	// jsdom tidak menyediakan kedua fungsi ini
	URL.createObjectURL = vi.fn(() => 'blob:preview');
	URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
	cleanup();
	localStorage.clear();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

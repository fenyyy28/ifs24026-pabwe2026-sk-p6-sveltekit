import { get, writable } from 'svelte/store';

/** Melebarkan tipe literal: '' menjadi string, 0 menjadi number, true menjadi boolean. */
type Widen<T> = T extends string
	? string
	: T extends number
		? number
		: T extends boolean
			? boolean
			: T;

/**
 * Hook input berbasis store, dipakai dengan bind:value={$nama}.
 * Memakai store (bukan $state) supaya file tetap bernama useInput.ts.
 */
export function useInput<T = string>(
	initial: T,
	validate?: (value: Widen<T>) => string | null
) {
	const value = writable<Widen<T>>(initial as Widen<T>);
	const error = writable<string | null>(null);

	function check(): boolean {
		const message = validate ? validate(get(value)) : null;
		error.set(message);
		return message === null;
	}

	function reset(): void {
		value.set(initial as Widen<T>);
		error.set(null);
	}

	return { value, error, check, reset };
}
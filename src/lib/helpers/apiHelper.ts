import { getAuthToken } from './toolsHelper';

const BASE_URL = import.meta.env.VITE_DELCOM_BASEURL;

export interface ApiResponse<T = unknown> {
	status: 'success' | 'fail' | 'error';
	message: string;
	data?: T;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
	method?: Method;
	body?: unknown;
	query?: Record<string, string | number | boolean | undefined>;
	/** Jika kosong, token diambil otomatis dari localStorage (hanya di browser). Isi null untuk tanpa token. */
	token?: string | null;
	/** Isi dengan `fetch` dari fungsi load SvelteKit bila dipanggil di server. */
	fetcher?: typeof fetch;
	signal?: AbortSignal;
}

type ShortcutOptions = Omit<RequestOptions, 'method' | 'body'>;

const VALID_STATUS = ['success', 'fail', 'error'];

export async function apiRequest<T = unknown>(
	path: string,
	options: RequestOptions = {}
): Promise<ApiResponse<T>> {
	const { method = 'GET', body, query, token = getAuthToken(), fetcher = fetch, signal } = options;

	const url = new URL(`${BASE_URL.replace(/\/$/, '')}${path}`);
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined) url.searchParams.set(key, String(value));
		}
	}

	const headers: Record<string, string> = { Accept: 'application/json' };
	if (token) headers.Authorization = `Bearer ${token}`;

	let payload: BodyInit | undefined;
	if (body instanceof FormData) {
		payload = body; // browser mengatur Content-Type + boundary sendiri
	} else if (body !== undefined) {
		headers['Content-Type'] = 'application/json';
		payload = JSON.stringify(body);
	}

	try {
		const res = await fetcher(url, { method, headers, body: payload, signal });
		const json = await res.json().catch(() => null);

		if (json && VALID_STATUS.includes(json.status)) {
			return json as ApiResponse<T>;
		}
		return {
			status: res.ok ? 'success' : 'fail',
			message: res.ok ? 'Berhasil' : res.statusText || 'Terjadi kesalahan'
		};
	} catch {
		return { status: 'fail', message: 'Tidak dapat terhubung ke server' };
	}
}

export const apiGet = <T = unknown>(path: string, options?: ShortcutOptions) =>
	apiRequest<T>(path, { ...options, method: 'GET' });

export const apiPost = <T = unknown>(path: string, body?: unknown, options?: ShortcutOptions) =>
	apiRequest<T>(path, { ...options, method: 'POST', body });

export const apiPut = <T = unknown>(path: string, body?: unknown, options?: ShortcutOptions) =>
	apiRequest<T>(path, { ...options, method: 'PUT', body });

export const apiDelete = <T = unknown>(path: string, options?: ShortcutOptions) =>
	apiRequest<T>(path, { ...options, method: 'DELETE' });
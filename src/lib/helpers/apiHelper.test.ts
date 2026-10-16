import { describe, expect, it, vi } from 'vitest';
import { apiDelete, apiGet, apiPost, apiPut, apiRequest } from './apiHelper';
import { setAuthToken } from './toolsHelper';

const jsonResponse = (body: unknown, init?: ResponseInit) =>
	new Response(JSON.stringify(body), init);

function makeFetcher(result: Response | Error) {
	return vi.fn(async (_url: URL | string, _init?: RequestInit) => {
		if (result instanceof Error) throw result;
		return result;
	});
}

const asFetch = (fn: ReturnType<typeof makeFetcher>) => fn as unknown as typeof fetch;

describe('apiRequest', () => {
	it('membangun URL, query, dan header dasar', async () => {
		const fetcher = makeFetcher(jsonResponse({ status: 'success', message: 'OK' }));

		await apiRequest('/courses', {
			query: { is_me: 1, q: 'a', kosong: undefined, aktif: true },
			token: null,
			fetcher: asFetch(fetcher)
		});

		const [url, init] = fetcher.mock.calls[0];
		expect(String(url)).toBe('https://api.test/api/v1/courses?is_me=1&q=a&aktif=true');
		expect(init?.method).toBe('GET');
		expect(init?.headers).toEqual({ Accept: 'application/json' });
		expect(init?.body).toBeUndefined();
	});

	it('memakai token dari localStorage jika tidak diberikan', async () => {
		setAuthToken('abc');
		const fetcher = makeFetcher(jsonResponse({ status: 'success', message: 'OK' }));

		await apiRequest('/users/me', { fetcher: asFetch(fetcher) });

		const headers = fetcher.mock.calls[0][1]?.headers as Record<string, string>;
		expect(headers.Authorization).toBe('Bearer abc');
	});

	it('memakai token eksplisit', async () => {
		const fetcher = makeFetcher(jsonResponse({ status: 'success', message: 'OK' }));

		await apiRequest('/x', { token: 'xyz', fetcher: asFetch(fetcher) });

		const headers = fetcher.mock.calls[0][1]?.headers as Record<string, string>;
		expect(headers.Authorization).toBe('Bearer xyz');
	});

	it('mengirim body JSON', async () => {
		const fetcher = makeFetcher(jsonResponse({ status: 'success', message: 'OK' }));

		await apiRequest('/x', { method: 'POST', body: { a: 1 }, token: null, fetcher: asFetch(fetcher) });

		const init = fetcher.mock.calls[0][1];
		expect(init?.body).toBe('{"a":1}');
		expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
	});

	it('mengirim FormData apa adanya tanpa Content-Type', async () => {
		const fetcher = makeFetcher(jsonResponse({ status: 'success', message: 'OK' }));
		const form = new FormData();
		form.append('cover', new File(['x'], 'a.png', { type: 'image/png' }));

		await apiRequest('/x', { method: 'POST', body: form, token: null, fetcher: asFetch(fetcher) });

		const init = fetcher.mock.calls[0][1];
		expect(init?.body).toBe(form);
		expect(init?.headers).not.toHaveProperty('Content-Type');
	});

	it('memakai fetch global jika fetcher tidak diberikan', async () => {
		const globalFetch = makeFetcher(jsonResponse({ status: 'success', message: 'OK' }));
		vi.stubGlobal('fetch', globalFetch);

		const res = await apiRequest('/x', { token: null });

		expect(res.status).toBe('success');
		expect(globalFetch).toHaveBeenCalledOnce();
	});

	it.each(['success', 'fail', 'error'] as const)('meneruskan respons berstatus %s', async (status) => {
		const body = { status, message: 'pesan', data: { a: 1 } };
		const fetcher = makeFetcher(jsonResponse(body));

		expect(await apiRequest('/x', { token: null, fetcher: asFetch(fetcher) })).toEqual(body);
	});

	it('membuat respons cadangan jika bentuk JSON tidak dikenal', async () => {
		const ok = makeFetcher(jsonResponse({ foo: 'bar' }, { status: 200 }));
		expect(await apiRequest('/x', { token: null, fetcher: asFetch(ok) })).toEqual({
			status: 'success',
			message: 'Berhasil'
		});

		const bad = makeFetcher(jsonResponse({ foo: 'bar' }, { status: 500, statusText: 'Server Error' }));
		expect(await apiRequest('/x', { token: null, fetcher: asFetch(bad) })).toEqual({
			status: 'fail',
			message: 'Server Error'
		});
	});

	it('menangani body yang bukan JSON', async () => {
		const noText = makeFetcher(new Response('bukan json', { status: 500 }));
		expect(await apiRequest('/x', { token: null, fetcher: asFetch(noText) })).toEqual({
			status: 'fail',
			message: 'Terjadi kesalahan'
		});
	});

	it('menangani kegagalan jaringan', async () => {
		const fetcher = makeFetcher(new Error('putus'));

		expect(await apiRequest('/x', { token: null, fetcher: asFetch(fetcher) })).toEqual({
			status: 'fail',
			message: 'Tidak dapat terhubung ke server'
		});
	});
});

describe('shortcut', () => {
	it('memakai metode HTTP yang benar', async () => {
		const fetcher = makeFetcher(jsonResponse({ status: 'success', message: 'OK' }));
		const options = { token: null, fetcher: asFetch(fetcher) };

		await apiGet('/a', options);
		await apiPost('/b', { x: 1 }, options);
		await apiPut('/c', { y: 2 }, options);
		await apiDelete('/d', options);

		const methods = fetcher.mock.calls.map(([, init]) => init?.method);
		expect(methods).toEqual(['GET', 'POST', 'PUT', 'DELETE']);
	});
});
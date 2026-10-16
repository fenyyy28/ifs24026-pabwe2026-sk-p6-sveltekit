const AUTH_TOKEN_KEY = 'auth_token';

const isBrowser = typeof window !== 'undefined';

/* ---------- Token ---------- */

export function getAuthToken(): string | null {
	if (!isBrowser) return null;
	return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
	if (isBrowser) localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken(): void {
	if (isBrowser) localStorage.removeItem(AUTH_TOKEN_KEY);
}

/* ---------- Format ---------- */

export function formatDate(iso: string | null | undefined): string {
	if (!iso) return '-';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '-';
	return date.toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

/** avg_ratings dari API berupa string ("4.0000") atau null. */
export function formatRating(value: string | number | null | undefined): string {
	if (value === null || value === undefined || value === '') return 'Belum ada rating';
	const num = Number(value);
	return Number.isNaN(num) ? 'Belum ada rating' : num.toFixed(1);
}

export function formatPercentage(value: string | number | null | undefined): string {
	const num = Number(value);
	return Number.isNaN(num) ? '0%' : `${Math.round(num)}%`;
}

/* ---------- YouTube ---------- */

/** Mendukung youtu.be/ID, youtube.com/watch?v=ID, dan youtube.com/embed/ID */
export function getYoutubeId(url: string): string | null {
	try {
		const u = new URL(url);
		if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
		if (u.hostname.endsWith('youtube.com')) {
			if (u.pathname === '/watch') return u.searchParams.get('v');
			if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null;
		}
	} catch {
		// URL tidak valid
	}
	return null;
}

export function getYoutubeEmbedUrl(url: string): string | null {
	const id = getYoutubeId(url);
	return id ? `https://www.youtube.com/embed/${id}` : null;
}

/* ---------- Validasi ---------- */

/** Mengubah data error API ({ field: ["pesan"] }) menjadi daftar pesan. */
export function flattenErrors(data: unknown): string[] {
	if (!data || typeof data !== 'object') return [];
	return Object.values(data as Record<string, unknown>)
		.flat()
		.filter((msg): msg is string => typeof msg === 'string');
}
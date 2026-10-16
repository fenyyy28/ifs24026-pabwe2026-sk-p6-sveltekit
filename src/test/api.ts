import type { ApiResponse } from '../lib/helpers/apiHelper';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const ok = (data?: unknown): ApiResponse<any> => ({ status: 'success', message: 'OK', data });

export const fail = (message = 'Gagal', data?: unknown): ApiResponse<any> => ({
	status: 'fail',
	message,
	data
});

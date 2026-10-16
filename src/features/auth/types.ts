export interface AuthUser {
	id: number;
	name: string;
	email: string;
	photo?: string | null;
}

export interface LoginPayload {
	email: string;
	password: string;
}

export interface RegisterPayload extends LoginPayload {
	name: string;
}
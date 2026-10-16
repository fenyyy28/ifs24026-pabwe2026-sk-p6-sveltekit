export interface UserItem {
	id: number;
	name: string;
	email: string;
	photo?: string | null;
}

export type ProfileSection = 'profile' | 'photo' | 'password';

export interface Notice {
	type: 'success' | 'error';
	text: string;
	fields: string[];
}
/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_DELCOM_BASEURL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
/// <reference types="vite/client" />

declare global {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const qz: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const KEYUTIL: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const KJUR: any;
	const stob64: (s: string) => string;
	const hextorstr: (hex: string) => string;
}

// 이 파일이 모듈이 아닌 전역 선언 파일임을 명확히 하기 위해 추가
export {};

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_MAIN_DOMAIN: string;        // example.co.kr / localtest.me
    readonly VITE_BACKEND_PROTOCOL?: string;  // http|https
    readonly VITE_BACKEND_PORT?: string;      // "8080" | "" (비우면 생략)
    readonly VITE_API_PREFIX?: string;        // "/api" 등 (선택)
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

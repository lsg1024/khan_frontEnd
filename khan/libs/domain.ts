// src/lib/domain.ts

/** 호스트에서 서브도메인 추출 */
export function extractSubdomain(hostname: string): string {
    console.log("hostname:", hostname);
    if (!hostname) return "";
    const pure = hostname.split(":")[0];
    console.log("pure hostname:", pure);

    if (
        pure === "localhost" ||
        pure === "127.0.0.1" ||
        pure === "0.0.0.0" ||
        pure.endsWith(".lan") ||
        pure.includes("localtest.me") ||
        pure.includes("localhost")
    ) {
        console.log("Local development detected, returning 'lim'");
        return "lim";
    }

    const parts = pure.split(".");
    console.log("domain parts:", parts);
    // ex) khan.example.co.kr -> ["khan","example","co","kr"]
    const subdomain = parts.length >= 3 ? parts[0] : "";
    console.log("extracted subdomain:", subdomain);
    return subdomain;
}

/** .env에서 메인 도메인 읽기 */
export function getMainDomain(): string {
    const main = import.meta.env.VITE_MAIN_DOMAIN?.trim();
    if (!main) throw new Error("VITE_MAIN_DOMAIN 이 설정되어 있지 않습니다.");
    return main;
}

/** 프로토콜 결정 (.env 우선, 없으면 window.location) */
export function resolveProtocol(): string {
    const fromEnv = (import.meta.env.VITE_BACKEND_PROTOCOL || "").trim();
    if (fromEnv) return fromEnv.replace(/:$/, "");
    if (typeof window === "undefined") return "https";
    return window.location.protocol.replace(":", "") || "https";
}

/** 포트 접미사 생성 (비어있으면 "") */
export function resolvePortSuffix(): string {
    const raw = (import.meta.env.VITE_BACKEND_PORT || "").trim();
    return raw ? `:${raw}` : "";
}

/** API prefix 정규화 */
export function resolveApiPrefix(): string {
    const raw = (import.meta.env.VITE_API_PREFIX || "").trim();
    if (!raw) return "";
    return raw.startsWith("/") ? raw : `/${raw}`;
}

/** 최종 API Origin 생성 (서브도메인 + 메인 도메인 + 포트) */
export function buildApiOriginFromEnv(hostname: string): string {
    const sub = extractSubdomain(hostname);
    const main = getMainDomain();
    const proto = resolveProtocol();
    const port = resolvePortSuffix();
    const host = sub ? `${sub}.${main}` : main; // 서브도메인 없으면 메인만
    return `${proto}://${host}${port}`;
}

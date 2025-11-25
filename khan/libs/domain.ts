export function extractSubdomain(hostname: string): string {
	if (!hostname) return "";
	const pure = hostname.split(":")[0];

	// 1. 로컬 개발 환경 및 테스트 도메인 검사 (기존 로직 유지)
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

	if (pure.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
		return "";
	}

	const parts = pure.split(".");
	const subdomain = parts.length >= 4 ? parts[0] : "";
	return subdomain;
}

/** .env에서 메인 도메인 읽기 */
export function getMainDomain(): string {
	const main = import.meta.env.VITE_MAIN_DOMAIN?.trim();
	if (!main) {
		throw new Error("VITE_MAIN_DOMAIN 이 설정되어 있지 않습니다.");
	}
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
export function buildApiOriginFromEnv(): string {
	const apiHost = "api.kkhan.co.kr";

	return `https://${apiHost}`;
}

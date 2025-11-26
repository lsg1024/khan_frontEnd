export function extractSubdomain(hostname: string): string {
	if (!hostname) return "";
	const pure = hostname.split(":")[0];

	// 로컬 개발 환경
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

	// IP 주소
	if (pure.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
		return "";
	}

	// 서브도메인 추출 (예: khan.kkhan.co.kr -> khan)
	const parts = pure.split(".");
	const subdomain = parts.length >= 3 ? parts[0] : "";
	return subdomain;
}

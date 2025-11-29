export function extractSubdomain(hostname: string): string {
	if (!hostname) return "";
	const pure = hostname.split(":")[0];

	// IP 주소
	if (pure.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
		return "";
	}

	// 서브도메인 추출 (예: khan.kkhan.co.kr -> khan)
	const parts = pure.split(".");
	const subdomain = parts.length >= 3 ? parts[0] : "";
	return subdomain;
}

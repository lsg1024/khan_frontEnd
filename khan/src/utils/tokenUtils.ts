// 토큰 관리 유틸리티

interface TokenPayload {
	exp?: number;
	iat?: number;
	sub?: string;
	[key: string]: unknown;
}

export const tokenUtils = {
	// AccessToken 저장
	setToken: (token: string) => {
		localStorage.setItem("app:accessToken", token);
		// 토큰 변경 이벤트 발생
		window.dispatchEvent(new Event("tokenChange"));
	},

	// AccessToken 조회
	getToken: (): string | null => {
		return localStorage.getItem("app:accessToken");
	},

	// AccessToken 삭제 (로그아웃)
	removeToken: () => {
		localStorage.removeItem("app:accessToken");
		window.dispatchEvent(new Event("tokenChange"));
	},

	// AccessToken 존재 여부 확인
	hasToken: (): boolean => {
		return !!localStorage.getItem("app:accessToken");
	},

	// Authorization 헤더에서 토큰 추출
	extractTokenFromHeader: (authHeader: string): string | null => {
		if (authHeader && authHeader.startsWith("Bearer ")) {
			return authHeader.substring(7);
		}
		return null;
	},

	// JWT 토큰 디코딩 (페이로드만)
	decodeToken: (token: string): TokenPayload | null => {
		try {
			const base64Url = token.split(".")[1];
			const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
			const jsonPayload = decodeURIComponent(
				atob(base64)
					.split("")
					.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
					.join("")
			);
			return JSON.parse(jsonPayload) as TokenPayload;
		} catch (error) {
			console.error("토큰 디코딩 실패:", error);
			return null;
		}
	},

	// 토큰에서 닉네임 추출
	getNickname: (): string | null => {
		const token = localStorage.getItem("app:accessToken");
		if (!token) return null;

		const decoded = tokenUtils.decodeToken(token);
		if (!decoded) return null;

		// 토큰에서 닉네임 필드 찾기 (nickname, name, preferred_username 등 가능)
		return (
			(decoded.nickname as string) ||
			(decoded.name as string) ||
			(decoded.preferred_username as string) ||
			(decoded.sub as string) ||
			null
		);
	},

	// 토큰에서 사용자 ID 추출
	getUserId: (): string | null => {
		const token = localStorage.getItem("app:accessToken");
		if (!token) return null;

		const decoded = tokenUtils.decodeToken(token);
		if (!decoded) return null;

		return (decoded.userId as string) || (decoded.sub as string) || null;
	},

	// 토큰에서 테넌트 ID 추출
	getTenantId: (): string | null => {
		const token = localStorage.getItem("app:accessToken");
		if (!token) return null;

		const decoded = tokenUtils.decodeToken(token);
		if (!decoded) return null;

		return (decoded.tenantId as string) || (decoded.tenant as string) || null;
	},

	// 현재 서브도메인과 토큰의 테넌트가 일치하는지 확인
	// 일치하지 않으면 토큰을 제거하고 false 반환
	validateTenant: (currentSubdomain: string): boolean => {
		const token = localStorage.getItem("app:accessToken");
		if (!token) return false;

		const decoded = tokenUtils.decodeToken(token);
		if (!decoded) {
			tokenUtils.removeToken();
			return false;
		}

		const tokenTenantId =
			(decoded.tenantId as string) || (decoded.tenant as string);

		// 테넌트 ID가 없거나 현재 서브도메인과 일치하면 유효
		if (!tokenTenantId || !currentSubdomain) {
			return true;
		}

		// 테넌트가 일치하지 않으면 토큰 제거
		if (tokenTenantId !== currentSubdomain) {
			console.warn(
				`테넌트 불일치 감지: 토큰(${tokenTenantId}) !== 현재(${currentSubdomain})`
			);
			tokenUtils.removeToken();
			return false;
		}

		return true;
	},
};

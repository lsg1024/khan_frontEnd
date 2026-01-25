import type { ApiResponse } from "./config";
import { getApiBaseUrl } from "./config";
import { tokenUtils } from "../../src/utils/tokenUtils";
import { extractSubdomain } from "../../libs/domain";

// 중복 호출 방지를 위한 상태 관리
let isSignRequestInProgress = false;
let pendingSignRequest: Promise<ApiResponse<{ signature: string }>> | null =
	null;

export const qzApi = {
	// qz 서명 인증 - fetch를 사용하여 axios 인터셉터를 우회
	getQzSign: async (data: { toSign: string }) => {
		// 이미 진행 중인 요청이 있으면 해당 Promise 반환
		if (isSignRequestInProgress && pendingSignRequest) {
			console.log(
				"QZ sign request already in progress, returning existing promise"
			);
			return pendingSignRequest;
		}

		// 요청 시작 플래그 설정
		isSignRequestInProgress = true;

		const requestBody = { dataToSign: data.toSign };

		const url = `${getApiBaseUrl()}/order/api/qz/sign`;

		const subdomain = extractSubdomain(window.location.hostname);
		document.title = subdomain.toUpperCase();

		const token = tokenUtils.getToken();
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
			headers["X-Tenant-ID"] = subdomain;
		}

		// Promise를 저장하여 중복 요청 시 재사용
		pendingSignRequest = (async () => {
			try {
				const response = await fetch(url, {
					method: "POST",
					headers,
					credentials: "include", // 쿠키 (HttpOnly) 포함
					body: JSON.stringify(requestBody),
				});

				if (!response.ok) {
					// fetch 에러를 axios 스타일 ApiResponse 형태로 맞춤
					const text = await response.text();
					throw new Error(
						`QZ sign request failed: ${response.status} ${response.statusText} - ${text}`
					);
				}

				const parsed = (await response.json()) as ApiResponse<{
					signature: string;
				}>;
				return parsed;
			} finally {
				// 요청 완료 후 플래그 및 캐시 초기화
				isSignRequestInProgress = false;
				pendingSignRequest = null;
			}
		})();

		return pendingSignRequest;
	},
};

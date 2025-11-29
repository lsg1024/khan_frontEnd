import type { ApiResponse } from "./config";
import { getApiBaseUrl } from "./config";
import { tokenUtils } from "../../src/utils/tokenUtils";
import { extractSubdomain } from "../../libs/domain";

export const qzApi = {
	// qz 서명 인증 - fetch를 사용하여 axios 인터셉터를 우회
	getQzSign: async (data: { toSign: string }) => {
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
	},
};

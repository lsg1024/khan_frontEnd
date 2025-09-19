// libs/api/config.ts
import axios, { AxiosHeaders } from "axios";
import type { AxiosRequestConfig } from "axios";
import { buildApiOriginFromEnv, resolveApiPrefix } from "../domain";
import { tokenUtils } from "../../src/utils/tokenUtils";

export function getApiBaseUrl(): string {
	const { hostname } = window.location;
	const origin = buildApiOriginFromEnv(hostname);
	const prefix = resolveApiPrefix();
	return `${origin}${prefix}`;
}

export const api = axios.create({
	baseURL: getApiBaseUrl(),
	withCredentials: true,
	timeout: 15000,
});

// 개발용 Bearer 토큰 인터셉터
api.interceptors.request.use((config) => {
	const token = tokenUtils.getToken();

	if (token) {
		if (!config.headers) {
			config.headers = new AxiosHeaders();
		} else {
			config.headers = AxiosHeaders.from(config.headers);
		}
		(config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
	}
	return config;
});

api.interceptors.response.use(
	(res) => {
		const authHeader =
			res.headers["authorization"] ||
			res.headers["Authorization"] ||
			res.headers.authorization;

		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.substring(7);
			tokenUtils.setToken(token);
		}

		if (res.data && typeof res.data === "object" && "data" in res.data) {
			const responseData = res.data.data as Record<string, unknown>;
			if (responseData && typeof responseData === "object") {
				if ("accessToken" in responseData || "token" in responseData) {
					const token = (responseData.accessToken ||
						responseData.token) as string;
					if (typeof token === "string" && token.length > 0) {
						tokenUtils.setToken(token);
					}
				}
			}
		}

		return res;
	},
	async (err) => {
		const originalRequest = err.config;

		// 로그인, 재발급 요청은 리트라이 하지 않음
		if (
			originalRequest.url?.includes("/auth/login") ||
			originalRequest.url?.includes("/auth/reissue")
		) {
			return Promise.reject(err);
		}

		// 이미 재시도한 요청은 다시 시도하지 않음
		if (originalRequest._retry) {
			tokenUtils.removeToken();
			window.dispatchEvent(new CustomEvent("tokenExpired"));

			if (window.location.pathname !== "/login") {
				window.location.href = "/login";
			}
			return Promise.reject(err);
		}

		if (err.response?.status === 401) {
			originalRequest._retry = true;

			try {
				// 동적 import로 순환 참조 방지
				const { authApi } = await import("./auth");
				const response = await authApi.refreshToken();

				if (response.success && response.data?.token) {
					tokenUtils.setToken(response.data.token);

					// 새 토큰으로 원래 요청 재시도
					const token = tokenUtils.getToken();
					if (token) {
						originalRequest.headers = originalRequest.headers || {};
						originalRequest.headers["Authorization"] = `Bearer ${token}`;
					}

					return api(originalRequest);
				} else {
					throw new Error("Token refresh failed");
				}
			} catch {
				tokenUtils.removeToken();
				window.dispatchEvent(new CustomEvent("tokenExpired"));

				if (window.location.pathname !== "/login") {
					window.location.href = "/login";
				}
				return Promise.reject(err);
			}
		}

		return Promise.reject(err);
	}
);

// API 응답 타입 정의
export interface ApiResponse<T = unknown> {
	success: boolean;
	message: string;
	data: T | null;
}

// API 에러 처리 유틸리티
export function isApiSuccess<T>(
	response: ApiResponse<T>
): response is ApiResponse<T> & { success: true } {
	return response.success === true;
}

export function getApiErrorMessage<T>(response: ApiResponse<T>): string {
	return response.message || "알 수 없는 오류가 발생했습니다.";
}

// API 요청 래퍼 함수들
export const apiRequest = {
	async get<T>(
		url: string,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		const response = await api.get<ApiResponse<T>>(url, config);
		return response.data;
	},

	async post<T, D = unknown>(
		url: string,
		data?: D,
		config?: AxiosRequestConfig<D>
	): Promise<ApiResponse<T>> {
		const response = await api.post<ApiResponse<T>>(url, data, config);
		return response.data;
	},

	async patch<T, D = unknown>(
		url: string,
		data?: D,
		config?: AxiosRequestConfig<D>
	): Promise<ApiResponse<T>> {
		const response = await api.patch<ApiResponse<T>>(url, data, config);
		return response.data;
	},

	async delete<T>(
		url: string,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<T>> {
		const response = await api.delete<ApiResponse<T>>(url, config);
		return response.data;
	},

	async login<T, D = unknown>(url: string, data?: D): Promise<ApiResponse<T>> {
		const response = await api.post<ApiResponse<T>>(url, data);

		const authHeader =
			response.headers["Authorization"] ||
			response.headers["authorization"] ||
			response.headers.Authorization;

		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.substring(7);
			tokenUtils.setToken(token);
		} else {
			if (
				response.data &&
				typeof response.data === "object" &&
				"data" in response.data
			) {
				const responseData = response.data.data as Record<string, unknown>;
				if (
					responseData &&
					typeof responseData === "object" &&
					"token" in responseData
				) {
					const token = responseData.token;
					if (typeof token === "string" && token.length > 0) {
						tokenUtils.setToken(token);
					}
				}
			}
		}

		return response.data;
	},
};

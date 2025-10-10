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

let isRefreshing = false;
let failedQueue: Array<{
	resolve: (value?: unknown) => void;
	reject: (reason?: unknown) => void;
}> = [];

// 큐에 쌓인 요청들을 처리하는 함수
const processQueue = (error: Error | null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve();
		}
	});
	failedQueue = [];
};

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
		// 401 에러 시 재발급 요청 실패 시 로그아웃 처리
		console.log("API 응답 에러 인터셉터:", err);
		const originalRequest = err.config;
		if (err.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				// 이미 토큰 재발급이 진행 중이라면, 현재 요청을 큐에 추가하고 대기
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then(() => {
						// 재발급 성공 후, 헤더에 새 토큰을 설정하여 원래 요청을 다시 보냄
						originalRequest.headers["Authorization"] =
							"Bearer " + tokenUtils.getToken();
						return api(originalRequest);
					})
					.catch((err) => {
						return Promise.reject(err);
					});
			}

			originalRequest._retry = true; // 재시도 플래그 설정 (무한 루프 방지)
			isRefreshing = true;

			try {
				// reissue 요청은 인터셉터를 우회하여 직접 fetch 사용
				const response = await fetch(`${getApiBaseUrl()}/auth/reissue`, {
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				if (!data.success) {
					throw new Error("Token refresh failed");
				}

				// Authorization 헤더에서 새 토큰 추출
				const authHeader =
					response.headers.get("Authorization") ||
					response.headers.get("authorization");
				if (authHeader && authHeader.startsWith("Bearer ")) {
					const newToken = authHeader.substring(7);
					tokenUtils.setToken(newToken);
				}

				// 재발급 성공 시
				console.log("토큰 재발급 성공");

				processQueue(null);

				originalRequest.headers["Authorization"] =
					"Bearer " + tokenUtils.getToken();
				return api(originalRequest);
			} catch (refreshError) {
				console.error("토큰 재발급 실패:", refreshError);

				processQueue(refreshError as Error);

				// 로그아웃 처리
				tokenUtils.removeToken();
				window.dispatchEvent(new CustomEvent("tokenExpired"));

				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
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
		}

		return response.data;
	},
};

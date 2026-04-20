// libs/api/config.ts
import axios, { AxiosHeaders } from "axios";
import type { AxiosRequestConfig } from "axios";
import { extractSubdomain } from "../domain";
import { tokenUtils } from "../../src/utils/tokenUtils";
import { cleanPayload } from "../utils/cleanPayload";

const API_PROD_URL = "https://api.kkhan.co.kr";
const API_LOCAL_URL = "http://localhost:8080";

/**
 * API Base URL 결정 우선순위:
 *   1) VITE_API_BASE_URL 환경 변수 (빌드 시 주입 가능: .env.production 또는 Docker --build-arg)
 *   2) import.meta.env.PROD === true  → API_PROD_URL
 *   3) 그 외 (npm run dev)            → API_LOCAL_URL
 *
 * Dockerfile 의 `npm run build` 는 자동으로 PROD 모드로 동작하므로
 * 이미지 빌드 시 별도 설정 없이 API_PROD_URL 이 사용된다.
 */
export function getApiBaseUrl(): string {
	const override = import.meta.env.VITE_API_BASE_URL;
	if (typeof override === "string" && override.length > 0) {
		return override;
	}
	return import.meta.env.PROD ? API_PROD_URL : API_LOCAL_URL;
}

function parseJwt(token: string) {
	try {
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			window
				.atob(base64)
				.split("")
				.map(function (c) {
					return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join("")
		);

		return JSON.parse(jsonPayload);
	} catch {
		return null;
	}
}

export const api = axios.create({
	baseURL: getApiBaseUrl(),
	withCredentials: true,
	timeout: 15000,
	transformResponse: [
		(data) => {
			if (typeof data === "string") {
				try {
					const processedData = data.replace(
						/"(saleCode|flowCode|id)":\s*(\d{16,})/g,
						(_match, key, value) => {
							// 16자리 이상의 숫자는 문자열로 변환
							return `"${key}":"${value}"`;
						}
					);
					return JSON.parse(processedData);
				} catch {
					return data;
				}
			}
			return data;
		},
	],
});

let isRefreshing = false;
let reissueFailCount = 0;
const MAX_REISSUE_ATTEMPTS = 1;
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

api.interceptors.request.use((config) => {
	// cleanPayload 적용: 빈 문자열을 null로 변환하여 NumberFormatException 방지
	if (config.data && typeof config.data === "object") {
		config.data = cleanPayload(config.data);
	}

	const token = tokenUtils.getToken();
	const currentSubdomain = extractSubdomain(window.location.hostname);

	if (!config.headers) {
		config.headers = new AxiosHeaders();
	} else {
		config.headers = AxiosHeaders.from(config.headers);
	}

	(config.headers as AxiosHeaders).set("X-Tenant-ID", currentSubdomain || "");

	if (token) {
		const decoded = parseJwt(token);

		const tokenTenantId = decoded?.tenantId || decoded?.tenant;

		if (
			tokenTenantId &&
			currentSubdomain &&
			tokenTenantId !== currentSubdomain
		) {
			tokenUtils.removeToken();

			const controller = new AbortController();
			config.signal = controller.signal;
			controller.abort("Cross-Tenant Access Detected");

			window.dispatchEvent(new CustomEvent("tokenExpired"));

			throw new Error("Tenant mismatch: Please login again.");
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
		if (err.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then(() => {
						originalRequest.headers["Authorization"] =
							"Bearer " + tokenUtils.getToken();
						originalRequest.headers["X-Tenant-ID"] = extractSubdomain(
							window.location.hostname
						);
						return api(originalRequest);
					})
					.catch((err) => {
						return Promise.reject(err.message);
					});
			}

			originalRequest._retry = true;

			// 로그인, 회원가입, 재발급 요청은 인터셉터를 우회
			if (
				originalRequest.url?.includes("/login") ||
				originalRequest.url?.includes("/auth/login") ||
				originalRequest.url?.includes("/join") ||
				originalRequest.url?.includes("/auth/join") ||
				originalRequest.url?.includes("/reissue") ||
				originalRequest.url?.includes("/auth/reissue")
			) {
				isRefreshing = false;
				return Promise.reject(err);
			}

			// 재발급 실패 횟수 초과 시 즉시 로그아웃 (무한 루프 방지)
			if (reissueFailCount >= MAX_REISSUE_ATTEMPTS) {
				tokenUtils.removeToken();
				window.dispatchEvent(new CustomEvent("tokenExpired"));
				return Promise.reject(new Error("Maximum reissue attempts exceeded"));
			}

			isRefreshing = true;

			try {
				const response = await fetch(`${getApiBaseUrl()}/auth/reissue`, {
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
						"X-Tenant-ID": extractSubdomain(window.location.hostname),
					},
				});

				if (!response.ok) {
					reissueFailCount++;

					// 서버가 tenant mismatch로 세션을 무효화한 경우
					if (response.status === 401) {
						const errorData = await response.json().catch(() => null);
						const isTenantMismatch = errorData?.message?.includes("Tenant mismatch");

						if (isTenantMismatch) {
							// 서버에서 이미 refresh token을 삭제함 → 즉시 로그아웃
							reissueFailCount = MAX_REISSUE_ATTEMPTS;
							throw new Error("Cross-tenant session invalidated");
						}
					}

					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				if (!data.success) {
					reissueFailCount++;
					throw new Error("Token refresh failed");
				}

				const authHeader =
					response.headers.get("Authorization") ||
					response.headers.get("authorization");
				if (authHeader && authHeader.startsWith("Bearer ")) {
					const newToken = authHeader.substring(7);

					const decoded = parseJwt(newToken);
					const tokenTenantId = decoded?.tenantId || decoded?.tenant;
					const currentSubdomain = extractSubdomain(window.location.hostname);

					if (tokenTenantId && currentSubdomain && tokenTenantId !== currentSubdomain) {
						// 토큰 tenant 불일치 → 서버에 로그아웃 요청하여 refresh token 완전 삭제
						reissueFailCount = MAX_REISSUE_ATTEMPTS;
						fetch(`${getApiBaseUrl()}/auth/reissue`, {
							method: "POST",
							credentials: "include",
							headers: {
								"Content-Type": "application/json",
								"X-Tenant-ID": currentSubdomain,
							},
						}).catch(() => {});
						throw new Error("Tenant mismatch on reissue");
					}

					tokenUtils.setToken(newToken);
				}

				// 성공 시 카운터 리셋
				reissueFailCount = 0;
				processQueue(null);

				originalRequest.headers["Authorization"] =
					"Bearer " + tokenUtils.getToken();
				return api(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError as Error);

				tokenUtils.removeToken();
				window.dispatchEvent(new CustomEvent("tokenExpired"));

				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		const responseData = err.response?.data;
		let errorMessage = "알 수 없는 오류가 발생했습니다.";

		if (
			responseData &&
			typeof responseData === "object" &&
			"message" in responseData
		) {
			errorMessage = responseData.message as string;
		} else if (err.message) {
			errorMessage = err.message;
		}

		return Promise.reject(new Error(errorMessage));
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

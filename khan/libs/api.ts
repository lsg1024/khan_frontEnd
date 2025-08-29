// src/api.ts
import axios, {AxiosHeaders} from "axios";
import { buildApiOriginFromEnv, resolveApiPrefix } from "./domain";

export function getApiBaseUrl(): string {
    const { hostname } = window.location;
    const origin = buildApiOriginFromEnv(hostname);
    const prefix = resolveApiPrefix();
    console.log("API Base URL:", origin + prefix);
    return `${origin}${prefix}`;
}


export const api = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,  // 쿠키 인증 시 true (Bearer만 쓰면 false여도 가능)
    timeout: 15000,
});

// 개발용 Bearer 토큰(운영에선 HttpOnly 쿠키 권장)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("app:accessToken");
    if (token) {
        // headers가 없으면 AxiosHeaders 인스턴스로 초기화
        if (!config.headers) {
            config.headers = new AxiosHeaders();
        } else {
            // 기존 헤더를 AxiosHeaders로 변환(객체여도 안전)
            config.headers = AxiosHeaders.from(config.headers);
        }
        (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem("app:accessToken");
            // 필요 시 로그인으로 이동
            // window.location.href = "/login";
        }
    return Promise.reject(err);
    }
);

// API 응답 타입 정의 (백엔드 ApiResponse<T> 클래스와 매칭)
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T | null;
}

// API 에러 처리를 위한 유틸리티 함수
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true } {
    return response.success === true;
}

export function getApiErrorMessage<T>(response: ApiResponse<T>): string {
    return response.message || "알 수 없는 오류가 발생했습니다.";
}

// API 응답 타입 안전성을 위한 래퍼 함수들
export const apiRequest = {
    // GET 요청
    async get<T>(url: string): Promise<ApiResponse<T>> {
        const response = await api.get<ApiResponse<T>>(url);
        return response.data;
    },
    
    // POST 요청
    async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
        const response = await api.post<ApiResponse<T>>(url, data);
        return response.data;
    },
    
    // PUT 요청
    async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
        const response = await api.put<ApiResponse<T>>(url, data);
        return response.data;
    },
    
    // DELETE 요청
    async delete<T>(url: string): Promise<ApiResponse<T>> {
        const response = await api.delete<ApiResponse<T>>(url);
        return response.data;
    }
};

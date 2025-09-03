// src/api.ts
import axios, {AxiosHeaders} from "axios";
import { buildApiOriginFromEnv, resolveApiPrefix } from "./domain";
import { tokenUtils } from "../src/utils/tokenUtils";

export function getApiBaseUrl(): string {
    const { hostname } = window.location;
    const origin = buildApiOriginFromEnv(hostname);
    const prefix = resolveApiPrefix();
    return `${origin}${prefix}`;
}


export const api = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,  // 쿠키 인증 시 true (Bearer만 쓰면 false여도 가능)
    timeout: 15000,
});

// 개발용 Bearer 토큰(운영에선 HttpOnly 쿠키 권장)
api.interceptors.request.use((config) => {
    const token = tokenUtils.getToken();
    
    if (token) {
        // headers가 없으면 AxiosHeaders 인스턴스로 초기화
        if (!config.headers) {
            config.headers = new AxiosHeaders();
        } else {
            // 기존 헤더를 AxiosHeaders로 변환(객체여도 안전)
            config.headers = AxiosHeaders.from(config.headers);
        }
        (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
    } else {
        console.log("API 요청 인터셉터 - 토큰이 없어서 Authorization 헤더 설정 안됨");
    }
    return config;
});

api.interceptors.response.use(
    (res) => {        
        // 응답 헤더에서 Authorization 토큰 추출 및 저장 (대소문자 구분 없이)
        const authHeader = res.headers['authorization'] || res.headers['Authorization'] || res.headers.authorization;
        
        // AccessToken 저장
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7); // 'Bearer ' 제거
            tokenUtils.setToken(token);
        }
        
        // 응답 본문에서도 AccessToken 확인 (백업)
        if (res.data && typeof res.data === 'object' && 'data' in res.data) {
            const responseData = res.data.data as Record<string, unknown>;
            if (responseData && typeof responseData === 'object') {
                // AccessToken 체크
                if ('accessToken' in responseData || 'token' in responseData) {
                    const token = (responseData.accessToken || responseData.token) as string;
                    if (typeof token === 'string' && token.length > 0) {
                        tokenUtils.setToken(token);
                    }
                }
            }
        }
        
        return res;
    },
    async (err) => {
        const originalRequest = err.config;
        
        // 로그인 요청인 경우 인터셉터 처리 건너뛰기
        if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/reissue')) {
            return Promise.reject(err);
        }
        
        // 401 에러인 경우 토큰 제거 및 로그인 페이지로 리다이렉트
        // (자동 갱신 서비스에서 미리 처리하므로 여기까지 온 경우는 RefreshToken도 만료된 상황)
        if (err.response?.status === 401) {
            tokenUtils.removeToken();
            
            // 토큰 만료 이벤트 발생
            window.dispatchEvent(new CustomEvent('tokenExpired'));
            
            // 로그인 페이지로 리다이렉트 (현재 페이지가 로그인 페이지가 아닌 경우만)
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
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
    },
    
    // 로그인 전용 POST 요청 (토큰 자동 저장)
    async login<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
        const response = await api.post<ApiResponse<T>>(url, data);

        // 1. 응답 헤더에서 토큰 확인
        const authHeader = response.headers['Authorization'] || response.headers['authorization'] || response.headers.Authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            tokenUtils.setToken(token);
        } else {
            // 2. 응답 본문에서 토큰 확인 (백업)
            if (response.data && typeof response.data === 'object' && 'data' in response.data) {
                const responseData = response.data.data as Record<string, unknown>;
                if (responseData && typeof responseData === 'object' && 'token' in responseData) {
                    const token = responseData.token;
                    if (typeof token === 'string' && token.length > 0) {
                        tokenUtils.setToken(token);
                    }
                }
            }
        }
        
        return response.data;
    }
};

// 기본 정보 관련 API 함수들
export const basicInfoApi = {
    // 분류 목록 조회
    getClassifications: async (name?: string) => {
        const params = name ? { name } : {};
        return api.get('product/classifications', { params });
    },

    // 재질 목록 조회
    getMaterials: async () => {
        return api.get('product/materials');
    },

    // 세트 타입 목록 조회
    getSetTypes: async () => {
        return api.get('product/set-types');
    },

    // 스톤 검색 (페이징 지원)
    getStones: async (name?: string, page: number = 1) => {
        const params = new URLSearchParams();
        if (name) {
            params.append('search', name);
        }
        params.append('page', page.toString());
        
        return api.get(`product/stones?${params.toString()}`);
    },

    // 제조사 검색 (페이징 지원)
    getFactories: async (name?: string, page: number = 1) => {
        const params = new URLSearchParams();
        if (name) {
            params.append('search', name);
        }
        params.append('page', page.toString());

        return api.get(`account/factories?${params.toString()}`);
    },

    // 카테고리 목록 조회 (페이징 지원)
    getProductCategories: async (name?: string, page: number = 1) => {
        const params = new URLSearchParams();
        if (name) {
            params.append('search', name);
        }
        params.append('page', page.toString());

        return api.get(`product/products?${params.toString()}`);
    }
};

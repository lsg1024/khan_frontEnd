// src/api.ts
import axios, {AxiosHeaders} from "axios";
import { buildApiOriginFromEnv, resolveApiPrefix } from "./domain";
import { tokenUtils } from "../src/utils/tokenUtils";

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
    const token = tokenUtils.getToken();
    console.log("API 요청 인터셉터 - 토큰:", token);
    console.log("API 요청 인터셉터 - URL:", config.url);
    
    if (token) {
        // headers가 없으면 AxiosHeaders 인스턴스로 초기화
        if (!config.headers) {
            config.headers = new AxiosHeaders();
        } else {
            // 기존 헤더를 AxiosHeaders로 변환(객체여도 안전)
            config.headers = AxiosHeaders.from(config.headers);
        }
        (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
        console.log("API 요청 인터셉터 - Authorization 헤더 설정됨");
    } else {
        console.log("API 요청 인터셉터 - 토큰이 없어서 Authorization 헤더 설정 안됨");
    }
    return config;
});

api.interceptors.response.use(
    (res) => {
        console.log("API 응답 인터셉터 - URL:", res.config.url);
        console.log("API 응답 인터셉터 - 상태코드:", res.status);
        
        // 응답 헤더에서 Authorization 토큰 추출 및 저장 (대소문자 구분 없이)
        const authHeader = res.headers['authorization'] || res.headers['Authorization'] || res.headers.authorization;
        
        console.log("Response headers:", res.headers);
        console.log("Authorization header:", authHeader);
        
        // AccessToken 저장
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7); // 'Bearer ' 제거
            tokenUtils.setToken(token);
            console.log("AccessToken이 저장되었습니다:", token.substring(0, 20) + "...");
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
                        console.log("응답 본문에서 AccessToken 저장됨:", token.substring(0, 20) + "...");
                    }
                }
            }
        }
        
        return res;
    },
    async (err) => {
        console.log("API 응답 인터셉터 - 에러 발생:", err.response?.status, err.message);
        const originalRequest = err.config;
        
        // 401 에러이고 재시도하지 않은 요청인 경우
        if (err.response?.status === 401 && !originalRequest._retry) {
            console.log("API 응답 인터셉터 - 401 에러, 토큰 갱신 시도");
            originalRequest._retry = true;
            
            try {
                console.log("토큰 갱신 시도 중...");
                // 쿠키에 있는 refreshToken으로 토큰 재발급 요청
                const refreshResponse = await axios.post(
                    `${getApiBaseUrl()}/auth/reissue`,
                    {},
                    {
                        withCredentials: true, // 쿠키 전송
                        timeout: 10000
                    }
                );
                
                console.log("토큰 갱신 응답:", refreshResponse.headers);
                
                // 새 AccessToken 추출 및 저장
                const newAuthHeader = refreshResponse.headers['authorization'] || 
                                    refreshResponse.headers['Authorization'] || 
                                    refreshResponse.headers.authorization;
                
                let tokenUpdated = false;
                
                if (newAuthHeader && newAuthHeader.startsWith('Bearer ')) {
                    const newToken = newAuthHeader.substring(7);
                    tokenUtils.setToken(newToken);
                    console.log("새 AccessToken이 저장되었습니다:", newToken.substring(0, 20) + "...");
                    tokenUpdated = true;
                    
                    // 원래 요청에 새 토큰 설정
                    if (!originalRequest.headers) {
                        originalRequest.headers = new AxiosHeaders();
                    } else {
                        originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
                    }
                    (originalRequest.headers as AxiosHeaders).set("Authorization", `Bearer ${newToken}`);
                }
                
                // 응답 본문에서도 AccessToken 확인 (백업)
                if (!tokenUpdated && refreshResponse.data && typeof refreshResponse.data === 'object') {
                    const refreshData = refreshResponse.data as Record<string, unknown>;
                    if ('data' in refreshData) {
                        const responseData = refreshData.data as Record<string, unknown>;
                        if (responseData && typeof responseData === 'object') {
                            if ('accessToken' in responseData || 'token' in responseData) {
                                const token = (responseData.accessToken || responseData.token) as string;
                                if (typeof token === 'string' && token.length > 0) {
                                    tokenUtils.setToken(token);
                                    console.log("갱신 응답 본문에서 AccessToken 저장됨:", token.substring(0, 20) + "...");
                                    tokenUpdated = true;
                                    
                                    // 원래 요청에 새 토큰 설정
                                    if (!originalRequest.headers) {
                                        originalRequest.headers = new AxiosHeaders();
                                    } else {
                                        originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
                                    }
                                    (originalRequest.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
                                }
                            }
                        }
                    }
                }
                
                if (tokenUpdated) {
                    // 원래 요청 재시도
                    return api(originalRequest);
                } else {
                    console.log("갱신된 토큰을 찾을 수 없습니다");
                }
            } catch (refreshError) {
                console.error("토큰 갱신 실패:", refreshError);
                // 갱신 실패 시 로그아웃 처리
                tokenUtils.removeToken();
                // 로그인 페이지로 리디렉션
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        // 401이 아니거나 갱신 실패한 경우
        if (err.response?.status === 401) {
            tokenUtils.removeToken();
            window.location.href = '/login';
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
            console.log("헤더에서 토큰 저장됨:", token.substring(0, 20) + "...");
        } else {
            console.log("Authorization 헤더를 찾을 수 없습니다");
            
            // 2. 응답 본문에서 토큰 확인 (백업)
            if (response.data && typeof response.data === 'object' && 'data' in response.data) {
                const responseData = response.data.data as Record<string, unknown>;
                if (responseData && typeof responseData === 'object' && 'token' in responseData) {
                    const token = responseData.token;
                    if (typeof token === 'string' && token.length > 0) {
                        tokenUtils.setToken(token);
                        console.log("응답 본문에서 토큰 저장됨:", token.substring(0, 20) + "...");
                    }
                }
            }
        }
        
        return response.data;
    }
};

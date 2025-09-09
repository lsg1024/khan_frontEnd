// libs/api/auth.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";

interface LoginRequest {
    username: string;
    password: string;
}

interface LoginResponse {
    token: string;
    user: {
        id: string;
        username: string;
        email?: string;
        // 기타 사용자 정보
    };
}

interface JoinRequest {
    username: string;
    password: string;
    email: string;
    // 기타 회원가입 필드
}

export const authApi = {
    // 로그인
    login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
        return apiRequest.login<LoginResponse>("auth/login", credentials);
    },

    // 회원가입
    join: async (userData: JoinRequest): Promise<ApiResponse<unknown>> => {
        return apiRequest.post("auth/join", userData);
    },

    // 로그아웃
    logout: async (): Promise<ApiResponse<unknown>> => {
        return apiRequest.post("auth/logout");
    },

    // 토큰 갱신
    refreshToken: async (): Promise<ApiResponse<LoginResponse>> => {
        return apiRequest.post<LoginResponse>("auth/reissue");
    },

    // 사용자 프로필 조회
    getProfile: async (): Promise<ApiResponse<unknown>> => {
        return apiRequest.get("auth/profile");
    },

    // 사용자 프로필 수정
    updateProfile: async (data: unknown): Promise<ApiResponse<unknown>> => {
        return apiRequest.patch("auth/profile", data);
    },

    // 비밀번호 변경
    changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<unknown>> => {
        return apiRequest.patch("auth/password", data);
    }
};

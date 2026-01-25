// libs/api/auth.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";

interface LoginRequest {
	userId: string;
	password: string;
}

interface LoginResponse {
	token: string;
	user: {
		id: string;
		userId: string;
		email?: string;
	};
}

interface JoinRequest {
	userId: string;
	password: string;
	email: string;
}
export const authApi = {
	// 로그인
	login: async (
		credentials: LoginRequest
	): Promise<ApiResponse<LoginResponse>> => {
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
		return apiRequest.get("/users/info");
	},

};

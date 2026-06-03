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
	nickname: string;
	password: string;
	confirm_password: string;
	role?: string;
	storeId?: number;
}
export const authApi = {
	// 로그인
	login: async (
		credentials: LoginRequest
	): Promise<ApiResponse<LoginResponse>> => {
		return apiRequest.login<LoginResponse>("auth/login", credentials);
	},

	// 회원가입 (jewelry_emp UsersController.signup → gateway 가 /users/** 로 라우팅)
	join: async (userData: JoinRequest): Promise<ApiResponse<unknown>> => {
		return apiRequest.post("users/signup", userData);
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

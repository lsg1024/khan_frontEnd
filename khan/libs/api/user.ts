import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	UserInfo,
	UserUpdateDto,
	UserPasswordDto,
} from "../../src/types/userDto";

export const userApi = {
	// 유저 목록 조회
	async getUserList(): Promise<ApiResponse<UserInfo[]>> {
		return apiRequest.get<UserInfo[]>("/users/list");
	},

	// 유저 정보 수정
	async updateUserInfo(updateDto: UserUpdateDto): Promise<ApiResponse<string>> {
		return apiRequest.patch<string, UserUpdateDto>("/users/info", updateDto);
	},

	// 비밀번호 변경
	async updatePassword(
		passwordDto: UserPasswordDto
	): Promise<ApiResponse<string>> {
		return apiRequest.patch<string, UserPasswordDto>(
			"/users/change-password",
			passwordDto
		);
	},

	// 유저 삭제
	async deleteUser(): Promise<ApiResponse<string>> {
		return apiRequest.delete<string>("/users/delete");
	},
};

import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	SensConfigRequest,
	SensConfigResponse,
	SendMessageRequest,
	SendResult,
	MessageHistoryPageResponse,
} from "../../src/types/messageDto";

export const messageApi = {
	// SENS 설정 저장/수정
	saveSensConfig: async (
		data: SensConfigRequest
	): Promise<ApiResponse<SensConfigResponse>> => {
		return apiRequest.post<SensConfigResponse>("users/sens/config", data);
	},

	// SENS 설정 조회
	getSensConfig: async (): Promise<ApiResponse<SensConfigResponse>> => {
		return apiRequest.get<SensConfigResponse>("users/sens/config");
	},

	// SENS 설정 삭제
	deleteSensConfig: async (): Promise<ApiResponse<string>> => {
		return apiRequest.delete<string>("users/sens/config");
	},

	// SMS 전송
	sendMessage: async (
		data: SendMessageRequest
	): Promise<ApiResponse<SendResult[]>> => {
		return apiRequest.post<SendResult[]>("users/message/send", data);
	},

	// 전송 이력 조회
	getHistory: async (
		page: number = 1,
		size: number = 20
	): Promise<ApiResponse<MessageHistoryPageResponse>> => {
		return apiRequest.get<MessageHistoryPageResponse>(
			"users/message/history",
			{
				params: { page: page - 1, size },
			}
		);
	},
};

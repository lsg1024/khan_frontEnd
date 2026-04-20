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

	// 전송 이력 조회 (선택적 필터: 수신자명/전화번호/내용/날짜 범위)
	getHistory: async (
		page: number = 1,
		size: number = 20,
		filters?: {
			receiverName?: string;
			receiverPhone?: string;
			content?: string;
			startDate?: string;
			endDate?: string;
		}
	): Promise<ApiResponse<MessageHistoryPageResponse>> => {
		const params: Record<string, string | number> = {
			page: page - 1,
			size,
		};
		if (filters?.receiverName && filters.receiverName.trim()) {
			params.receiverName = filters.receiverName.trim();
		}
		if (filters?.receiverPhone && filters.receiverPhone.trim()) {
			params.receiverPhone = filters.receiverPhone.trim();
		}
		if (filters?.content && filters.content.trim()) {
			params.content = filters.content.trim();
		}
		if (filters?.startDate) {
			params.startDate = filters.startDate;
		}
		if (filters?.endDate) {
			params.endDate = filters.endDate;
		}
		return apiRequest.get<MessageHistoryPageResponse>(
			"users/message/history",
			{ params }
		);
	},
};

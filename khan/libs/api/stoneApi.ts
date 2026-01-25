// libs/api/stone.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	StoneSearchResponse,
	StoneCreateRequest,
} from "../../src/types/stoneDto";

export const stoneApi = {
	// 스톤 검색 (페이징 지원)
	getStones: async (
		name?: string,
		page: number = 1,
		size: number = 12,
		shape?: string,
		type?: string,
		sortField?: string,
		sortOrder?: string
	): Promise<ApiResponse<StoneSearchResponse>> => {
		return apiRequest.get<StoneSearchResponse>("product/stones", {
			params: {
				search: name || "",
				page: page,
				size: size,
				shape: shape || "",
				type: type || "",
				sortField: sortField || "",
				sortOrder: sortOrder || "",
			},
		});
	},

	// 스톤 상세 조회
	getStone: async (stoneId: string): Promise<ApiResponse<unknown>> => {
		return apiRequest.get(`product/stones/${stoneId}`);
	},

	// 스톤 생성
	createStone: async (
		data: StoneCreateRequest
	): Promise<ApiResponse<string>> => {
		return apiRequest.post("product/stone", data);
	},

	// 스톤 벌크 생성 (여러 개 한번에 생성)
	createBulkStones: async (
		data: StoneCreateRequest[]
	): Promise<ApiResponse<string>> => {
		return apiRequest.post("product/stones", data);
	},

	// 스톤 수정
	updateStone: async (
		stoneId: string,
		data: unknown
	): Promise<ApiResponse<unknown>> => {
		return apiRequest.patch(`product/stones/${stoneId}`, data);
	},

	// 스톤 삭제
	deleteStone: async (stoneId: string): Promise<ApiResponse<unknown>> => {
		return apiRequest.delete(`product/stones/${stoneId}`);
	},

	// 스톤 중복 검사
	existStone: async (
		stoneType: string,
		stoneShape: string,
		stoneSize: string
	): Promise<ApiResponse<boolean>> => {
		return apiRequest.get<boolean>("product/stones/exists", {
			params: {
				"stone-type": stoneType,
				"stone-shape": stoneShape,
				"stone-size": stoneSize,
			},
		});
	},
};

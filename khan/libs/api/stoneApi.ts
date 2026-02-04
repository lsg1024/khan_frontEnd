// libs/api/stone.ts
import { apiRequest, api } from "./config";
import type { ApiResponse } from "./config";
import type { AxiosResponse } from "axios";
import type {
	StoneSearchResponse,
	StoneCreateRequest,
} from "../../src/types/stoneDto";

export interface StoneSearchParams {
	search?: string;
	searchField?: string; 
	searchMin?: string; 
	searchMax?: string;
	sortField?: string; 
	sortOrder?: string; 
	page?: number;
	pageSize?: number;
}

export const stoneApi = {
	getStones: async (
		params: StoneSearchParams = {}
	): Promise<ApiResponse<StoneSearchResponse>> => {
		const queryParams: Record<string, string | number> = {
			page: params.page || 1,
			size: params.pageSize || 20,
		};

		if (params.search) queryParams.search = params.search;
		if (params.searchField) queryParams.searchField = params.searchField;
		if (params.searchMin) queryParams.searchMin = params.searchMin;
		if (params.searchMax) queryParams.searchMax = params.searchMax;
		if (params.sortField) queryParams.sortField = params.sortField;
		if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

		return apiRequest.get<StoneSearchResponse>("product/stones", {
			params: queryParams,
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

	// 스톤 엑셀 다운로드
	downloadExcel: async (
		search?: string,
		shape?: string,
		type?: string
	): Promise<AxiosResponse<Blob>> => {
		const params: Record<string, string> = {};
		if (search) params.search = search;
		if (shape) params.shape = shape;
		if (type) params.type = type;

		return api.get("product/stones/excel", {
			params,
			responseType: "blob",
		});
	},
};

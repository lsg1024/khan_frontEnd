// libs/api/factoryStonePriceApi.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	FactoryStonePriceRequest,
	FactoryStonePriceResponse,
	FactoryStonePriceBulkRequest,
} from "../../src/types/factoryStonePriceDto";

export const factoryStonePriceApi = {
	// 조각료 등록
	createFactoryStonePrice: async (
		data: FactoryStonePriceRequest
	): Promise<ApiResponse<FactoryStonePriceResponse>> => {
		return apiRequest.post<FactoryStonePriceResponse>(
			"product/factory-stone-prices",
			data
		);
	},

	// 조각료 수정
	updateFactoryStonePrice: async (
		id: string,
		data: FactoryStonePriceRequest
	): Promise<ApiResponse<FactoryStonePriceResponse>> => {
		return apiRequest.patch<FactoryStonePriceResponse>(
			`product/factory-stone-prices/${id}`,
			data
		);
	},

	// 조각료 삭제
	deleteFactoryStonePrice: async (id: string): Promise<ApiResponse<string>> => {
		return apiRequest.delete<string>(`product/factory-stone-prices/${id}`);
	},

	// 공장별 조각료 목록 조회
	getFactoryStonePricesByFactory: async (
		factoryId: string
	): Promise<ApiResponse<FactoryStonePriceResponse[]>> => {
		return apiRequest.get<FactoryStonePriceResponse[]>(
			`product/factory-stone-prices/factory/${factoryId}`
		);
	},

	// 스톤별 공장 조각료 조회
	getFactoryStonePricesByStone: async (
		stoneId: string
	): Promise<ApiResponse<FactoryStonePriceResponse[]>> => {
		return apiRequest.get<FactoryStonePriceResponse[]>(
			`product/factory-stone-prices/stone/${stoneId}`
		);
	},

	// 현재 조각료 조회 (특정 공장 + 스톤)
	getCurrentPrice: async (
		factoryId: string,
		stoneId: string
	): Promise<ApiResponse<number>> => {
		return apiRequest.get<number>("product/factory-stone-prices/current", {
			params: { factoryId, stoneId },
		});
	},

	// 가격 이력 조회
	getPriceHistory: async (
		factoryId: string,
		stoneId: string
	): Promise<ApiResponse<FactoryStonePriceResponse[]>> => {
		return apiRequest.get<FactoryStonePriceResponse[]>(
			"product/factory-stone-prices/history",
			{
				params: { factoryId, stoneId },
			}
		);
	},

	// 일괄 등록
	createBulkFactoryStonePrices: async (
		data: FactoryStonePriceBulkRequest
	): Promise<ApiResponse<string>> => {
		return apiRequest.post<string>("product/factory-stone-prices/bulk", data);
	},
};

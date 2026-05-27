// libs/api/factoryStonePriceApi.ts
//
// @deprecated 2026-04-27
// 공장별 스톤 단가표 모델은 본 시스템에서 사용하지 않습니다.
// 가격 산정은 Factory.factoryHarry (손모율, 일반 1.10) 기반으로 수행되며,
// Order/Stock/Sale 시점에 storeHarry 와 동일하게 스냅샷 저장됩니다.
// 본 파일은 백엔드에 매칭되는 컨트롤러가 없어 모든 호출이 404 를 반환합니다.
// FactoryStonePricePage.tsx 도 라우터에 등록되지 않은 dead page 이며,
// 정리가 필요하면 본 파일과 src/pages/setting/FactoryStonePricePage.tsx,
// src/types/factoryStonePriceDto.ts, styles/pages/settings/FactoryStonePricePage.css
// 를 함께 제거하면 됩니다.
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

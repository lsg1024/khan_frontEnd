import { type AxiosResponse } from "axios";
import { api, apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	FactorySearchResponse,
	FactoryPurchaseResponse,
} from "../../src/types/factoryDto";
import type {
	AccountSingleResponse,
	FactoryCreateRequest,
	FactoryUpdateRequest,
} from "../../src/types/AccountDto";
import type { TransactionPageResponse } from "../../src/types/storeDto";

export const factoryApi = {
	// 제조사 검색 (페이징 지원)
	getFactories: async (
		name?: string,
		page: number = 1,
		un_page?: boolean,
		size: number = 12
	): Promise<ApiResponse<FactorySearchResponse>> => {
		return apiRequest.get<FactorySearchResponse>("account/factories", {
			params: { search: name || "", page: page, un_page: un_page, size: size },
		});
	},

	// 제조사 매입 미수금 조회
	getFactoryPurchase: async (
		start: string,
		end: string,
		accountType?: string,
		accountName?: string,
		page: number = 1,
		size: number = 20
	): Promise<ApiResponse<TransactionPageResponse>> => {
		return apiRequest.get<TransactionPageResponse>("account/purchase/factory", {
			params: {
				start,
				end,
				accountType: accountType || undefined,
				accountName: accountName || undefined,
				page,
				size,
			},
		});
	},

	// 제조사 상세 조회
	getFactory: async (
		factoryId: string
	): Promise<ApiResponse<AccountSingleResponse>> => {
		return apiRequest.get<AccountSingleResponse>(
			`account/factory/${factoryId}`
		);
	},

	// 제조사 생성
	createFactory: async (
		data: FactoryCreateRequest
	): Promise<ApiResponse<unknown>> => {
		return apiRequest.post("account/factory", data);
	},

	// 제조사 수정
	updateFactory: async (
		factoryId: string,
		data: FactoryUpdateRequest
	): Promise<ApiResponse<unknown>> => {
		return apiRequest.patch(`account/factories/${factoryId}`, data);
	},

	getFactoryGrades: async (factoryId: string): Promise<ApiResponse<string>> => {
		return apiRequest.get<string>("account/factories/grade", {
			params: { id: factoryId },
		});
	},

	updateHarry: async (
		factoryId: string,
		harryId: string
	): Promise<ApiResponse<string>> => {
		return apiRequest.patch(`account/factories/harry/${factoryId}/${harryId}`);
	},

	updateGrade: async (
		factoryId: string,
		grade: string
	): Promise<ApiResponse<string>> => {
		return apiRequest.patch(`account/factories/grade/${factoryId}/${grade}`);
	},

	// 제조사 삭제
	deleteFactory: async (factoryId: string): Promise<ApiResponse<unknown>> => {
		return apiRequest.delete(`account/factories/${factoryId}`);
	},

	// 제조사 엑셀 다운로드
	downloadExcel: async (): Promise<AxiosResponse<Blob>> => {
		return api.get("account/factories/excel", {
			responseType: "blob",
		});
	},

	// 제조사 매입금 조회 (새 API)
	getFactoriesPurchase: async (
		endAt?: string,
		page: number = 1,
		size: number = 12
	): Promise<ApiResponse<FactoryPurchaseResponse>> => {
		return apiRequest.get<FactoryPurchaseResponse>(
			"account/factories/purchase",
			{
				params: {
					endAt: endAt || undefined,
					page,
					size,
				},
			}
		);
	},
};

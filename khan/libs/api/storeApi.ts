import { type AxiosResponse } from "axios";
import { api, apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	StoreSearchResponse,
	StoreReceivableResponse,
	StoreReceivableSaleLogResponse,
	AccountInfoDto,
	RecentActivityResponse,
} from "../../src/types/storeDto";
import type {
	AccountSingleResponse,
	StoreCreateRequest,
	StoreUpdateRequest,
} from "../../src/types/AccountDto";

export const storeApi = {
	// 판매처 검색 (페이징 + 정렬 + searchField 지원)
	getStores: async (
		name?: string,
		page: number = 1,
		size = 12,
		searchField?: string,
		sortField?: string,
		sortOrder?: string
	): Promise<ApiResponse<StoreSearchResponse>> => {
		return apiRequest.get<StoreSearchResponse>("account/stores", {
			params: {
				search: name || "",
				page: page,
				size: size,
				searchField: searchField || undefined,
				sortField: sortField || undefined,
				sortOrder: sortOrder || undefined,
			},
		});
	},

	// 판매처 미수 포함
	getStoreReceivable: async (
		name?: string,
		page: number = 1,
		size = 20,
		sortField?: string,
		sortOrder?: string,
		
	): Promise<ApiResponse<StoreReceivableResponse>> => {
		return apiRequest.get<StoreReceivableResponse>(
			"account/stores/receivable",
			{
				params: {
					search: name || "",
					page: page,
					size: size,
					sortField: sortField || undefined,
					sortOrder: sortOrder || undefined,
				},
			}
		);
	},

	// 판매처 상세 조회
	getStore: async (
		storeId: string
	): Promise<ApiResponse<AccountSingleResponse>> => {
		return apiRequest.get<AccountSingleResponse>(`account/store/${storeId}`);
	},

	// 개별 판매처 미수 정보 조회
	getStoreReceivableById: async (
		id: string
	): Promise<ApiResponse<AccountInfoDto>> => {
		return apiRequest.get(`account/stores/receivable/${id}`);
	},

	getStoreReceivableLogById: async (
		id: string,
		saleCode: string
	): Promise<ApiResponse<StoreReceivableSaleLogResponse>> => {
		const params = { saleCode: saleCode };

		return apiRequest.get(`account/stores/receivable/sale-log/${id}`, { params });
	},

	/**
	 * Task 4-3 / 4-4 — 거래처 최근 활동(거래 내역 + 결제 집계) 조회.
	 * StorePage 의 최근거래일/최근결제일 셀 클릭 시 모달에서 호출.
	 */
	getStoreRecentActivity: async (
		id: string,
		limit: number = 20
	): Promise<ApiResponse<RecentActivityResponse>> => {
		return apiRequest.get(`account/stores/${id}/recent-activity`, {
			params: { limit },
		});
	},

	// 판매처 생성
		createStore: async (
			data: StoreCreateRequest
	): Promise<ApiResponse<string>> => {
		return apiRequest.post("account/store", data);
	},

	// 판매처 수정
	updateStore: async (
		storeId: string,
		data: StoreUpdateRequest
	): Promise<ApiResponse<string>> => {
		return apiRequest.patch(`account/stores/${storeId}`, data);
	},

	updateHarry: async (
		storeId: string,
		harryId: string
	): Promise<ApiResponse<string>> => {
		return apiRequest.patch(`account/stores/harry/${storeId}/${harryId}`);
	},

	updateGrade: async (
		storeId: string,
		grade: string
	): Promise<ApiResponse<string>> => {
		return apiRequest.patch(`account/stores/grade/${storeId}/${grade}`);
	},

	// 판매처 삭제
	deleteStore: async (storeId: string): Promise<ApiResponse<unknown>> => {
		return apiRequest.delete(`account/stores/${storeId}`);
	},

	// 판매처 등급
	getStoreGrade: async (storeId: string): Promise<ApiResponse<string>> => {
		return apiRequest.get("account/stores/grade", { params: { id: storeId } });
	},

	// 판매처 엑셀 다운로드
	downloadExcel: async (): Promise<AxiosResponse<Blob>> => {
		return api.get("account/stores/excel", {
			responseType: "blob",
		});
	},

	downloadReceivableExcel: async (
		name?: string
	): Promise<AxiosResponse<Blob>> => {
		const params: Record<string, string> = {};
		if (name) params.search = name;

		return api.get("account/stores/receivable/excel", {
			params,
			responseType: "blob",
		});
	},
};

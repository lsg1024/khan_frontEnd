import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	StockRegisterRequest,
	StockSearchResponse,
	StockCreateRequest,
	StockUpdateRequest,
	StockRentalRequest,
	ResponseDetail,
	InventorySearchResponse,
	InventoryPrepareResponse,
	InventoryCheckResponse,
	InventoryStatisticsResponse,
} from "../../src/types/stockDto";

export const stockApi = {
	// 등록 전 조회
	getStockDetail: async (
		ids: string[]
	): Promise<ApiResponse<ResponseDetail[]>> => {
		const params = { ids: ids.join(",") };
		return apiRequest.get<ResponseDetail[]>("order/orders/stock-register", {
			params,
		});
	},

	// 주문 -> 재고 등록
	updateStockRegister: async (
		flowCode: string,
		order_status: string,
		orderData: StockRegisterRequest
	): Promise<ApiResponse<string>> => {
		const params = { id: flowCode, order_status: order_status };

		const requestBody = {
			...orderData,
		};

		return apiRequest.patch<string>(
			"order/orders/stock-register",
			requestBody,
			{
				params,
			}
		);
	},

	updateStock: async (
		flowCode: string,
		stockData: StockUpdateRequest
	): Promise<ApiResponse<string>> => {
		const params: Record<string, string> = {};
		params.id = flowCode;
		params.order_type = "update";

		return apiRequest.patch<string>("order/stock", stockData, { params });
	},

	getStock: async (
		flowCodes: string[]
	): Promise<ApiResponse<ResponseDetail[]>> => {
		const params = { ids: flowCodes.join(",") };
		return apiRequest.get<ResponseDetail[]>("order/stock", { params });
	},

	getStocks: async (
		start: string,
		end: string,
		search?: string,
		order_status?: string,
		factory?: string,
		store?: string,
		setType?: string,
		color?: string,
		sortField?: string,
		sortOrder?: "ASC" | "DESC" | "",
		page: number = 1,
		size?: number
	): Promise<ApiResponse<StockSearchResponse>> => {
		const params: Record<string, string> = { page: page.toString() };
		if (start) params.start = start;
		if (end) params.end = end;
		if (search) params.search = search;
		if (factory) params.factory = factory;
		if (store) params.store = store;
		if (setType) params.setType = setType;
		if (color) params.color = color;
		if (sortField) params.sortField = sortField;
		if (sortOrder) params.sortOrder = sortOrder;
		if (order_status) params.order_status = order_status;
		if (size) params.size = size.toString();

		return apiRequest.get<StockSearchResponse>("order/stocks", { params });
	},

	getPastRentalHistory: async (
		start: string,
		end: string,
		search?: string,
		factory?: string,
		store?: string,
		setType?: string,
		color?: string,
		sortField?: string,
		sortOrder?: "ASC" | "DESC" | "",
		page: number = 1
	): Promise<ApiResponse<StockSearchResponse>> => {
		const params: Record<string, string> = { page: page.toString() };
		if (start) params.start = start;
		if (end) params.end = end;
		if (search) params.search = search;
		if (factory) params.factory = factory;
		if (store) params.store = store;
		if (setType) params.setType = setType;
		if (color) params.color = color;
		if (sortField) params.sortField = sortField;
		if (sortOrder) params.sortOrder = sortOrder;

		return apiRequest.get<StockSearchResponse>("order/stocks/rental/history", {
			params,
		});
	},

	getFilterFactories: async (
		start: string,
		end: string,
		order_status?: string
	): Promise<ApiResponse<string[]>> => {
		const params: Record<string, string> = {};
		if (start) params.start = start;
		if (end) params.end = end;
		if (order_status) params.order_status = order_status;

		return apiRequest.get<string[]>("order/stocks/filters/factory", { params });
	},

	getFilterStores: async (
		start: string,
		end: string,
		order_status?: string
	): Promise<ApiResponse<string[]>> => {
		const params: Record<string, string> = {};
		if (start) params.start = start;
		if (end) params.end = end;
		if (order_status) params.order_status = order_status;

		return apiRequest.get<string[]>("order/stocks/filters/store", { params });
	},

	getFilterSetTypes: async (
		start: string,
		end: string,
		order_status?: string
	): Promise<ApiResponse<string[]>> => {
		const params: Record<string, string> = {};
		if (start) params.start = start;
		if (end) params.end = end;
		if (order_status) params.order_status = order_status;

		return apiRequest.get<string[]>("order/stocks/filters/set-type", {
			params,
		});
	},

	getFilterColors: async (
		start: string,
		end: string,
		order_status?: string
	): Promise<ApiResponse<string[]>> => {
		const params: Record<string, string> = {};
		if (start) params.start = start;
		if (end) params.end = end;
		if (order_status) params.order_status = order_status;

		return apiRequest.get<string[]>("order/stocks/filters/color", { params });
	},

	// 재고 직접 생성
	createStock: async (
		stockData: StockCreateRequest,
		orderType: string
	): Promise<ApiResponse<string>> => {
		const params = { order_type: orderType };
		return apiRequest.post<string>("order/stocks", stockData, {
			params,
		});
	},

	// 재고 -> 대여
	updateStockToRental: async (
		flowCode: string,
		stockDto: StockRentalRequest
	): Promise<ApiResponse<string>> => {
		const params = { id: flowCode };
		return apiRequest.patch<string>("order/stocks/rental", stockDto, {
			params,
		});
	},

	// 대여 -> 반납
	updateRentalToReturn: async (
		flowCode: string,
		orderType: string
	): Promise<ApiResponse<string>> => {
		const params = {
			id: flowCode,
			order_type: orderType,
		};
		return apiRequest.patch<string>("order/stocks/rental/return", null, {
			params,
		});
	},

	// 반납 -> 재고
	updateReturnToStock: async (
		flowCode: string,
		orderType: string
	): Promise<ApiResponse<string>> => {
		const params = {
			id: flowCode,
			order_type: orderType,
		};
		return apiRequest.patch<string>("order/stocks/rollback", null, {
			params,
		});
	},

	// 재고 -> 삭제
	deleteStock: async (flowCode: string): Promise<ApiResponse<string>> => {
		const params = { id: flowCode };
		return apiRequest.delete<string>("order/stocks/delete", {
			params,
		});
	},

	// 삭제 -> 재고
	updateDeleteToStock: async (
		flowCodes: string[],
		orderType: string
	): Promise<ApiResponse<string>> => {
		const params = {
			ids: flowCodes.join(","),
			order_type: orderType,
		};
		return apiRequest.patch<string>("order/stocks/delete/stock", null, {
			params,
		});
	},

	// ============ 재고 조사 API ============

	// 재고 조사 목록 조회
	getInventory: async (
		searchField?: string,
		searchValue?: string,
		sortField?: string,
		sortOrder?: "ASC" | "DESC",
		stockChecked?: "checked" | "unchecked" | "all",
		orderStatus?: "STOCK" | "RENTAL" | "RETURN" | "NORMAL",
		materialName?: string,
		page: number = 0,
		size: number = 40
	): Promise<ApiResponse<InventorySearchResponse>> => {
		const params: Record<string, string> = {
			page: page.toString(),
			size: size.toString(),
		};
		if (searchField) params.searchField = searchField;
		if (searchValue) params.searchValue = searchValue;
		if (sortField) params.sortField = sortField;
		if (sortOrder) params.sortOrder = sortOrder;
		if (stockChecked && stockChecked !== "all") params.stockChecked = stockChecked;
		if (orderStatus) params.orderStatus = orderStatus;
		if (materialName) params.materialName = materialName;

		return apiRequest.get<InventorySearchResponse>("order/stocks/inventory", {
			params,
		});
	},

	// 재고 조사 재질 필터 조회
	getInventoryMaterialFilters: async (): Promise<ApiResponse<string[]>> => {
		return apiRequest.get<string[]>("order/stocks/inventory/filters/material");
	},

	// 재고 조사 준비 (체크 상태 초기화)
	prepareInventory: async (): Promise<ApiResponse<InventoryPrepareResponse>> => {
		return apiRequest.post<InventoryPrepareResponse>(
			"order/stocks/inventory/prepare",
			null
		);
	},

	// 재고 조사 체크 (바코드 스캔)
	checkInventory: async (
		flowCode: string
	): Promise<ApiResponse<InventoryCheckResponse>> => {
		const params = { flowCode };
		return apiRequest.post<InventoryCheckResponse>(
			"order/stocks/inventory/check",
			null,
			{ params }
		);
	},

	// 재고 조사 통계 조회
	getInventoryStatistics: async (): Promise<
		ApiResponse<InventoryStatisticsResponse>
	> => {
		return apiRequest.get<InventoryStatisticsResponse>(
			"order/stocks/inventory/statistics"
		);
	},
};

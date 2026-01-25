import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	StockRegisterRequest,
	StockSearchResponse,
	StockCreateRequest,
	StockUpdateRequest,
	StockRentalRequest,
	ResponseDetail,
} from "../../src/types/stock";

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
};

import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	StockRegisterRequest,
	StockRegisterResponse,
	StockSearchResponse,
	StockCreateRequest,
} from "../../src/types/stock";

export const stockApi = {
	// 등록 전 조회
	getStockDetail: async (
		ids: string[]
	): Promise<ApiResponse<StockRegisterResponse[]>> => {
		const params = { ids: ids.join(",") };
		return apiRequest.get<StockRegisterResponse[]>(
			"order/orders/stock-register",
			{ params }
		);
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
		if (order_status) params.order_status = order_status;

		return apiRequest.get<StockSearchResponse>("order/stocks", { params });
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
		orderType: string,
		stockData: StockCreateRequest
	): Promise<ApiResponse<string>> => {
		const params = { order_type: orderType };

		return apiRequest.post<string>("order/stocks", stockData, {
			params,
		});
	},
};

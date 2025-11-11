import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	StockRegisterRequest,
	StockSaleRequest,
} from "../../src/types/stock";
import type {
	SaleSearchResponse,
	SaleDetailResponse,
	SaleUpdateRequest,
} from "../../src/types/sale";

export const saleApi = {
	getSale: async (
		flowCode: string,
		orderStatus: string
	): Promise<ApiResponse<SaleDetailResponse>> => {
		const params = { id: flowCode, order_status: orderStatus };
		return apiRequest.get<SaleDetailResponse>("order/sale", { params });
	},

	getSaleResponse: async (
		start: string,
		end: string,
		search?: string,
		type?: string,
		// sortField?: string,
		// sortOrder?: "ASC" | "DESC" | "",
		page: number = 1
	): Promise<ApiResponse<SaleSearchResponse>> => {
		const params = {
			start,
			end,
			search,
			type,
			// sortField,
			// sortOrder,
			page,
		};
		return apiRequest.get<SaleSearchResponse>("order/sales", {
			params,
		});
	},

	updateSale: async (
		flowCode: string,
		updateDto: SaleUpdateRequest,
		eventId: string
	): Promise<ApiResponse<string>> => {
		const params = { id: flowCode };

		const headers = {
			"Idempotency-Key": eventId,
		};

		return apiRequest.patch<string>("order/sale/product", updateDto, {
			params,
			headers
		});
	},

	// 주문 -> 판매 등록
	updateOrderToSale: async (
		flowCode: string,
		order_status: string,
		orderData: StockRegisterRequest
	): Promise<ApiResponse<string>> => {
		const params = { id: flowCode, order_status: order_status };

		const requestBody = {
			...orderData,
		};

		return apiRequest.patch<string>("order/orders/order_sale", requestBody, {
			params,
		});
	},
	updateStockToSale: async (
		flowCodes: string,
		stockData: StockSaleRequest
	): Promise<ApiResponse<string>> => {
		const params = { id: flowCodes };

		return apiRequest.patch<string>("order/sales/stock_sale", stockData, {
			params,
		});
	},
};

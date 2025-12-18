import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import { v4 as uuidv4 } from "uuid";
import type {
	StockRegisterRequest,
	StockSaleRequest,
} from "../../src/types/stock";
import type {
	SaleSearchResponse,
	SaleDetailResponse,
	SaleUpdateRequest,
	SalePaymentRequest,
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

	createPaymentSale: async (
		saleData: SalePaymentRequest,
		newSale: boolean
	): Promise<ApiResponse<string>> => {
		const params = { new: newSale };
		const eventId = uuidv4();
		const headers = {
			"Idempotency-Key": eventId,
		};

		const requestBody = {
			...saleData,
		};

		return apiRequest.post<string>("order/sales/payment", requestBody, {
			params,
			headers,
		});
	},

	updateSale: async (
		flowCode: string,
		updateDto: SaleUpdateRequest
	): Promise<ApiResponse<string>> => {
		const eventId = uuidv4();
		const params = { id: flowCode };

		const headers = {
			"Idempotency-Key": eventId,
		};

		return apiRequest.patch<string>("order/sales/product", updateDto, {
			params,
			headers,
		});
	},

	// 주문 -> 판매 등록
	updateOrderToSale: async (
		flowCode: string,
		order_status: string,
		orderData: StockRegisterRequest,
		newSale: boolean
	): Promise<ApiResponse<string>> => {
		const eventId = uuidv4();
		const params = { id: flowCode, order_status: order_status, new: newSale };

		const headers = {
			"Idempotency-Key": eventId,
		};

		const requestBody = {
			...orderData,
		};

		return apiRequest.patch<string>("order/orders/order_sale", requestBody, {
			params,
			headers,
		});
	},
	updateStockToSale: async (
		flowCodes: string,
		stockData: StockSaleRequest,
		newSale: boolean
	): Promise<ApiResponse<string>> => {
		const eventId = uuidv4();
		const params = { id: flowCodes, new: newSale };
		const headers = {
			"Idempotency-Key": eventId,
		};

		return apiRequest.patch<string>("order/sales/stock_sale", stockData, {
			params,
			headers,
		});
	},

	// 판매 삭제 (반품)
	deleteSale: async (
		type: string,
		flowCode: string
	): Promise<ApiResponse<string>> => {
		const eventId = uuidv4();
		const params = { id: flowCode };
		const headers = {
			"Idempotency-Key": eventId,
		};

		return apiRequest.delete<string>(`order/sales/${type}`, {
			params,
			headers,
		});
	},

	// 판매 등록 전 동일 거래처 확인
	checkBeforeSale: async (accountId: number): Promise<ApiResponse<string>> => {
		const params = { id: accountId };
		return apiRequest.get<string>("order/sale/check", { params });
	},
};

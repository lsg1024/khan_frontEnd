import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { StockRegisterRequest, StockSaleRequest } from "../../src/types/stock";

export const saleApi = {
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
		stockData: StockSaleRequest): Promise<ApiResponse<string>> => {
		const params = { id: flowCodes };

		return apiRequest.patch<string>(
			"order/sales/stock_sale", 
			stockData,
			{ params }
		);
	},
};

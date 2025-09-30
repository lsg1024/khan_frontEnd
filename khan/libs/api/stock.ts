import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	StockRegisterRequest,
	StockRegisterResponse,
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

	// 재고 등록
	updateStockRegister: async (
		flowCode: string,
		order_status: string,
		orderData: StockRegisterRequest
	): Promise<ApiResponse<string>> => {
		const params = { id: flowCode, order_status: order_status };

		const requestBody = {
			...orderData,
		};

		console.log("updateStockRegister requestBody:", requestBody);
		return apiRequest.patch<string>(
			"order/orders/stock-register",
			requestBody,
			{
				params,
			}
		);
	},
};

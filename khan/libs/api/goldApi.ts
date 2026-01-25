import { apiRequest } from "./config";
import type { ApiResponse } from "./config";

export const goldApi = {
	// 금 시세 조회
	getGoldPrice: async (): Promise<ApiResponse<number>> => {
		return apiRequest.get<number>("product/gold-price");
	},

	// 금 시세 설정
	setGoldPrice: async (price: number): Promise<ApiResponse<string>> => {
		return apiRequest.post<string>(`product/gold-price?price=${price}`);
	},
};

import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { goldHarryResponse } from "../../src/types/goldHarry";

export const goldHarryApi = {
	getGoldHarry: async (): Promise<ApiResponse<goldHarryResponse[]>> => {
		return apiRequest.get<goldHarryResponse[]>("account/gold-harries");
	},

	createGoldHarry: async (
		goldHarryLoss: string
	): Promise<ApiResponse<string>> => {
		const data = { goldHarryLoss: goldHarryLoss };
		return apiRequest.post<string>("account/gold-harry", data);
	},

	updateGoldHarryLoss: async (
		id: string,
		lossAmount: string
	): Promise<ApiResponse<string>> => {
		const data = { lossAmount: lossAmount };
		return apiRequest.patch<string>(`account/gold-harry/${id}`, data);
	},

	deleteGoldHarry: async (id: string): Promise<ApiResponse<string>> => {
		return apiRequest.delete<string>(`account/gold-harry/${id}`);
	},
};

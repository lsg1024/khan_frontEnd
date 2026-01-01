import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { goldHarryResponse } from "../../src/types/goldHarry";

export const goldHarryApi = {
	getGoldHarry: async (): Promise<ApiResponse<goldHarryResponse[]>> => {
		return apiRequest.get<goldHarryResponse[]>("account/gold-harries");
	},

	createGoldHarry: async (
		goldHarry: string
	): Promise<ApiResponse<string>> => {
		const data = { goldHarry: goldHarry };
		return apiRequest.post<string>("account/gold-harry", data);
	},

	updateGoldHarry: async (
		id: string,
		goldHarry: string
	): Promise<ApiResponse<string>> => {
		const data = { goldHarry: goldHarry };
		return apiRequest.patch<string>(`account/gold-harry/${id}`, data);
	},

	deleteGoldHarry: async (id: string): Promise<ApiResponse<string>> => {
		return apiRequest.delete<string>(`account/gold-harry/${id}`);
	},
};

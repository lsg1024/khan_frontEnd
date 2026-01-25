import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { ColorDto } from "../../src/types/colorDto";

type ColorResponseSingle = ColorDto;
type ColorResponseList = ColorDto[];

export const colorApi = {
	getColors: async (name?: string): Promise<ApiResponse<ColorResponseList>> => {
		const params = name ? { name } : {};
		return apiRequest.get<ColorResponseList>("product/colors", { params });
	},

	getColor: async (id: string): Promise<ApiResponse<ColorResponseSingle>> => {
		return apiRequest.get<ColorResponseSingle>(`product/colors/${id}`);
	},

	createColor: async (
		data: { name: string; note: string }
	): Promise<ApiResponse<string>> => {
		return apiRequest.post<string>("product/colors", data);
	},

	updateColor: async (
		id: string,
		data: { name: string; note: string }
	): Promise<ApiResponse<string>> => {
		return apiRequest.patch<string>(`product/colors/${id}`, data);
	},

	deleteColor: async (id: string): Promise<ApiResponse<string>> => {
		return apiRequest.delete<string>(`product/colors/${id}`);
	},

	getColorName: async (id: string): Promise<ApiResponse<string>> => {
		return apiRequest.get<string>(`api/color/${id}`);
	},
};

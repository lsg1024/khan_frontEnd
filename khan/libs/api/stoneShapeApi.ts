import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { StoneShapeDto } from "../../src/types/stoneShape";

type StoneShapeResponseSingle = StoneShapeDto;
type StoneShapeResponseList = StoneShapeDto[];

export const stoneShapeApi = {
	getStoneShapes: async (
		name?: string
	): Promise<ApiResponse<StoneShapeResponseList>> => {
		const params = name ? { name } : {};
		return apiRequest.get<StoneShapeResponseList>("product/stone/shapes", {
			params,
		});
	},

	getStoneShape: async (
		id: string
	): Promise<ApiResponse<StoneShapeResponseSingle>> => {
		return apiRequest.get<StoneShapeResponseSingle>(
			`product/stone/shapes/${id}`
		);
	},

	createStoneShape: async (
		data: Partial<StoneShapeDto>
	): Promise<ApiResponse<string>> => {
		return apiRequest.post<string>("product/stone/shapes", data);
	},

	updateStoneShape: async (
		id: string,
		data: Partial<StoneShapeDto>
	): Promise<ApiResponse<string>> => {
		return apiRequest.patch<string>(`product/stone/shapes/${id}`, data);
	},

	deleteStoneShape: async (id: string): Promise<ApiResponse<string>> => {
		return apiRequest.delete<string>(`product/stone/shapes/${id}`);
	},
};

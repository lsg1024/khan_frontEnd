import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { SetTypeDto, SetTypeRequest } from "../../src/types/setType";

type SetTypeResponseSingle = SetTypeDto;
type SetTypeResponseList = SetTypeDto[];

export const setTypeApi = {
	getSetTypes: async (
		name?: string
	): Promise<ApiResponse<SetTypeResponseList>> => {
		const params = name ? { name } : {};
		return apiRequest.get<SetTypeResponseList>("product/set-types", { params });
	},

	getSetType: async (
		id: string
	): Promise<ApiResponse<SetTypeResponseSingle>> => {
		return apiRequest.get<SetTypeResponseSingle>(`product/set-types/${id}`);
	},

	createSetType: async (
		data: Partial<SetTypeRequest>
	): Promise<ApiResponse<string>> => {
		return apiRequest.post<string>("product/set-types", data);
	},

	updateSetType: async (
		id: string,
		data: Partial<SetTypeRequest>
	): Promise<ApiResponse<string>> => {
		return apiRequest.patch<string>(`product/set-types/${id}`, data);
	},

	deleteSetType: async (id: string): Promise<ApiResponse<string>> => {
		return apiRequest.delete<string>(`product/set-types/${id}`);
	},

	getSetTypeName: async (id: string): Promise<ApiResponse<string>> => {
		return apiRequest.get<string>(`api/set-type/${id}`);
	},
};

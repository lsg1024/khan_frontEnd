import { apiRequest } from "./config";
import type { ApiResponse } from "./config";

interface Priority {
	priorityName: string;
	priorityDate: number;
}

export const priorityApi = {
	createPriority: async (
		priorityName: string,
		priorityDate: number
	): Promise<ApiResponse<string>> => {
		const data = { priorityName, priorityDate };
		return apiRequest.post<string>("order/priority", data);
	},

	getPriorities: async (): Promise<ApiResponse<Priority[]>> => {
		return apiRequest.get<Priority[]>("order/priorities");
	},

	updatePriority: async (
		priorityId: string,
		priorityName: string,
		priorityDate: number
	): Promise<ApiResponse<string>> => {
		const data = {
			priorityName,
			priorityDate,
		};

		const url = `order/priorities/${priorityId}`;

		return apiRequest.patch<string>(url, data);
	},

	deletePriority: async (priorityId: string): Promise<ApiResponse<string>> => {
		const url = `order/priorities/${priorityId}`;

		return apiRequest.delete<string>(url);
	},
};

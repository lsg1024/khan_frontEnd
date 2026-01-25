import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { StoneTypeDto, StoneTypeRequest } from "../../src/types/stoneTypeDto";

type StoneTypeResponseSingle = StoneTypeDto;
type StoneTypeResponseList = StoneTypeDto[];

export const stoneTypeApi = {
    getStoneTypes: async (name?: string): Promise<ApiResponse<StoneTypeResponseList>> => {
        const params = name ? { name } : {};
        return apiRequest.get<StoneTypeResponseList>('product/stone/types', { params });
    },

    getStoneType: async (id: string): Promise<ApiResponse<StoneTypeResponseSingle>> => {
        return apiRequest.get<StoneTypeResponseSingle>(`product/stone/types/${id}`);
    },

    createStoneType: async (data: Partial<StoneTypeRequest>): Promise<ApiResponse<string>> => {
        return apiRequest.post<string>("product/stone/types", data);
    },

    updateStoneType: async (id: string, data: Partial<StoneTypeRequest>): Promise<ApiResponse<string>> => {
        return apiRequest.patch<string>(`product/stone/types/${id}`, data);
    },

    deleteStoneType: async (id: string): Promise<ApiResponse<string>> => {
        return apiRequest.delete<string>(`product/stone/types/${id}`);
    }
};
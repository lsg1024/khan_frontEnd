// libs/api/stoneShape.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { StoneTypeDto } from "../../src/types/stoneType";

export const stoneTypeApi = {
    // 스톤 타입 목록 조회
    getStoneTypes: async (name?: string): Promise<ApiResponse<StoneTypeDto[]>> => {
        return apiRequest.get<StoneTypeDto[]>('product/stone/types', 
            { params: {name: name || "" } });
    },

    // 스톤 타입 상세 조회
    getStoneType: async (id: string): Promise<ApiResponse<StoneTypeDto>> => {
        return apiRequest.get<StoneTypeDto>(`product/stone/types/${id}`);
    },

    // 스톤 타입 생성
    createStoneType: async (data: Partial<StoneTypeDto>): Promise<ApiResponse<StoneTypeDto>> => {
        return apiRequest.post<StoneTypeDto>("product/stone/types", data);
    },

    // 스톤 타입 수정
    updateStoneType: async (id: string, data: Partial<StoneTypeDto>): Promise<ApiResponse<StoneTypeDto>> => {
        return apiRequest.patch<StoneTypeDto>(`product/stone/types/${id}`, data);
    },

    // 스톤 타입 삭제
    deleteStoneType: async (id: string): Promise<ApiResponse<void>> => {
        return apiRequest.delete(`product/stone/types/${id}`);
    }
};

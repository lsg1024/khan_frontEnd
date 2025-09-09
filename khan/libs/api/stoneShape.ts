// libs/api/stoneShape.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { StoneShapeDto } from "../../src/types/stoneShape";

export const stoneShapeApi = {
    // 스톤 모양 목록 조회
    getStoneShapes: async (name?: string): Promise<ApiResponse<StoneShapeDto[]>> => {
        return apiRequest.get<StoneShapeDto[]>('product/stone/shapes', 
            { params: {name: name || "" } });
    },

    // 스톤 모양 상세 조회
    getStoneShape: async (id: string): Promise<ApiResponse<StoneShapeDto>> => {
        return apiRequest.get<StoneShapeDto>(`product/stone/shapes/${id}`);
    },
    
    // 스톤 모양 생성
    createStoneShape: async (data: Partial<StoneShapeDto>): Promise<ApiResponse<StoneShapeDto>> => {
        return apiRequest.post<StoneShapeDto>("product/stone/shapes", data);
    },

    // 스톤 모양 수정
    updateStoneShape: async (id: string, data: Partial<StoneShapeDto>): Promise<ApiResponse<StoneShapeDto>> => {
        return apiRequest.patch<StoneShapeDto>(`product/stone/shapes/${id}`, data);
    },

    // 스톤 모양 삭제
    deleteStoneShape: async (id: string): Promise<ApiResponse<void>> => {
        return apiRequest.delete(`product/stone/shapes/${id}`);
    }
};

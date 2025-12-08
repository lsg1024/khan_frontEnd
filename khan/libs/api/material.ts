// libs/api/material.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { MaterialDto } from "../../src/types/material";

export const materialApi = {
    // 재질 목록 조회
    getMaterials: async (name?: string): Promise<ApiResponse<MaterialDto[]>> => {
        const params = name ? { name } : {};
        return apiRequest.get<MaterialDto[]>("product/materials", { params });
    },

    // 재질 상세 조회
    getMaterial: async (id: string): Promise<ApiResponse<MaterialDto>> => {
        return apiRequest.get<MaterialDto>(`product/materials/${id}`);
    },

    // 재질 생성
    createMaterial: async (data: { name: string; materialGoldPurityPercent: string }): Promise<ApiResponse<MaterialDto>> => {
        return apiRequest.post<MaterialDto>("product/materials", data);
    },

    // 재질 수정
    updateMaterial: async (id: string, data: { name: string; materialGoldPurityPercent: string }): Promise<ApiResponse<MaterialDto>> => {
        return apiRequest.patch<MaterialDto>(`product/materials/${id}`, data);
    },

    // 재질 삭제
    deleteMaterial: async (id: string): Promise<ApiResponse<void>> => {
        return apiRequest.delete(`product/materials/${id}`);
    }
};

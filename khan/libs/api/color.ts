// libs/api/color.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { ColorDto } from "../../src/types/color";

export const colorApi = {
    // 색상 목록 조회
    getColors: async (name?: string): Promise<ApiResponse<ColorDto[]>> => {
        const params = name ? { name } : {};
        return apiRequest.get<ColorDto[]>('product/colors', { params });
    },

    // 색상 상세 조회
    getColor: async (id: string): Promise<ApiResponse<ColorDto>> => {
        return apiRequest.get<ColorDto>(`product/colors/${id}`);
    },

    // 색상 생성
    createColor: async (data: Partial<ColorDto>): Promise<ApiResponse<ColorDto>> => {
        return apiRequest.post<ColorDto>("product/colors", data);
    },

    // 색상 수정
    updateColor: async (id: string, data: Partial<ColorDto>): Promise<ApiResponse<ColorDto>> => {
        return apiRequest.patch<ColorDto>(`product/colors/${id}`, data);
    },

    // 색상 삭제
    deleteColor: async (id: string): Promise<ApiResponse<void>> => {
        return apiRequest.delete(`product/colors/${id}`);
    }
};

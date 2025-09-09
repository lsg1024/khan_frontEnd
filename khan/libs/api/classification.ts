// libs/api/classification.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { ClassificationDto } from "../../src/types/classification";

export const classificationApi = {
    // 분류 목록 조회
    getClassifications: async (name?: string): Promise<ApiResponse<ClassificationDto[]>> => {
        const params = name ? { name } : {};
        return apiRequest.get<ClassificationDto[]>('product/classifications', { params });
    },

    // 분류 상세 조회
    getClassification: async (id: string): Promise<ApiResponse<ClassificationDto>> => {
        return apiRequest.get<ClassificationDto>(`product/classifications/${id}`);
    },

    // 분류 생성
    createClassification: async (data: Partial<ClassificationDto>): Promise<ApiResponse<ClassificationDto>> => {
        return apiRequest.post<ClassificationDto>("product/classifications", data);
    },

    // 분류 수정
    updateClassification: async (id: string, data: Partial<ClassificationDto>): Promise<ApiResponse<ClassificationDto>> => {
        return apiRequest.patch<ClassificationDto>(`product/classifications/${id}`, data);
    },

    // 분류 삭제
    deleteClassification: async (id: string): Promise<ApiResponse<void>> => {
        return apiRequest.delete(`product/classifications/${id}`);
    }
};

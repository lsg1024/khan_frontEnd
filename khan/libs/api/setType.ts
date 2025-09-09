// libs/api/setType.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { SetTypeDto } from "../../src/types/setType";

export const setTypeApi = {
    // 세트 타입 목록 조회
    getSetTypes: async (name?: string): Promise<ApiResponse<SetTypeDto[]>> => {
        return apiRequest.get<SetTypeDto[]>('product/set-types', 
            { params: {name: name || "" } });
    },

    // 세트 타입 상세 조회
    getSetType: async (id: string): Promise<ApiResponse<SetTypeDto>> => {
        return apiRequest.get<SetTypeDto>(`product/set-types/${id}`);
    },

    // 세트 타입 생성
    createSetType: async (data: Partial<SetTypeDto>): Promise<ApiResponse<SetTypeDto>> => {
        return apiRequest.post<SetTypeDto>("product/set-types", data);
    },

    // 세트 타입 수정
    updateSetType: async (id: string, data: Partial<SetTypeDto>): Promise<ApiResponse<SetTypeDto>> => {
        return apiRequest.patch<SetTypeDto>(`product/set-types/${id}`, data);
    },

    // 세트 타입 삭제
    deleteSetType: async (id: string): Promise<ApiResponse<void>> => {
        return apiRequest.delete(`product/set-types/${id}`);
    }
};

// libs/api/factory.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { FactorySearchResponse } from "../../src/types/factory";

export const factoryApi = {
    // 제조사 검색 (페이징 지원)
    getFactories: async (name?: string, page: number = 1): Promise<ApiResponse<FactorySearchResponse>> => {
        return apiRequest.get<FactorySearchResponse>("account/factories", 
            { params: {search: name || "", page: page} });
    },

    // 제조사 상세 조회
    getFactory: async (factoryId: string): Promise<ApiResponse<unknown>> => {
        return apiRequest.get(`account/factories/${factoryId}`);
    },

    // 제조사 생성
    createFactory: async (data: unknown): Promise<ApiResponse<unknown>> => {
        return apiRequest.post("account/factories", data);
    },

    // 제조사 수정
    updateFactory: async (factoryId: string, data: unknown): Promise<ApiResponse<unknown>> => {
        return apiRequest.patch(`account/factories/${factoryId}`, data);
    },

    // 제조사 삭제
    deleteFactory: async (factoryId: string): Promise<ApiResponse<unknown>> => {
        return apiRequest.delete(`account/factories/${factoryId}`);
    }
};

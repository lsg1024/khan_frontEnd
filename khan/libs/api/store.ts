// libs/api/factory.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { StoreSearchResponse } from "../../src/types/store";

export const storeApi = {
    // 판매처 검색 (페이징 지원)
    getStores: async (name?: string, page: number = 1, size = 12): Promise<ApiResponse<StoreSearchResponse>> => {
        return apiRequest.get<StoreSearchResponse>("account/stores", 
            { params: {search: name || "", page: page, size: size} });
    },

    // 판매처 상세 조회
    getStore: async (storeId: string): Promise<ApiResponse<unknown>> => {
        return apiRequest.get(`account/stores/${storeId}`);
    },

    // 판매처 생성
    createStore: async (data: unknown): Promise<ApiResponse<unknown>> => {
        return apiRequest.post("account/stores", data);
    },

    // 판매처 수정
    updateStore: async (storeId: string, data: unknown): Promise<ApiResponse<unknown>> => {
        return apiRequest.patch(`account/stores/${storeId}`, data);
    },

    // 판매처 삭제
    deleteStore: async (storeId: string): Promise<ApiResponse<unknown>> => {
        return apiRequest.delete(`account/stores/${storeId}`);
    },

    // 판매처 등급
    getStoreGrade: async (storeId: string): Promise<ApiResponse<string>> => {
        return apiRequest.get("account/stores/grade", { params: { id: storeId } });
    }
};

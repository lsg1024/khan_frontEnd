// libs/api/factory.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { StoreSearchResponse } from "../../src/types/store";

export const storeApi = {
    // 판매처 검색 (페이징 지원)
    getStores: async (start:string, end:string, search?: string, factory?:number, store?:number, page: number = 1): Promise<ApiResponse<StoreSearchResponse>> => {
        return apiRequest.get<StoreSearchResponse>("account/stores", 
            { params: {search: search || "", start: start, end: end, factory: factory || "", store: store || "", page: page} });
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
    }
};

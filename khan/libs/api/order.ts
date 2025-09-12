import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { OrderSearchResponse } from "../../src/types/order";

export const orderApi = {
    getOrders: async (
        start: string,
        end: string,
        search?: string,
        factory?: string,
        store?: string, 
        setType?: string,
        page: number = 1): Promise<ApiResponse<OrderSearchResponse>> => {
        const params: Record<string, string> = { page: page.toString() };

        if (start) params.start = start;
        if (end) params.end = end;
        if (search) params.search = search;
        if (factory) params.factory = factory;
        if (store) params.store = store;
        if (setType) params.setType = setType;

        return apiRequest.get<OrderSearchResponse>("order/orders", { params });
    },

    getFilterFactories: async (start:string, end:string): Promise<ApiResponse<string[]>> => {

        const params: Record<string, string> = {};
        if (start) params.start = start;
        if (end) params.end = end;

        return apiRequest.get("order/filters/factory" , { params });
    },

    getFilterStores: async (start:string, end:string): Promise<ApiResponse<string[]>> => {
        const params: Record<string, string> = {};
        if (start) params.start = start;
        if (end) params.end = end;

        return apiRequest.get("order/filters/store", { params });
    },

    getFilterSetTypes: async (start:string, end:string): Promise<ApiResponse<string[]>> => {
        const params: Record<string, string> = {};
        if (start) params.start = start;
        if (end) params.end = end;

        return apiRequest.get("order/filters/set-type", { params });
    },

    // 주문 상태 변경
    updateOrderStatus: async (flowCode: string, status: string): Promise<ApiResponse<string>> => {
        const statusMap: Record<string, string> = {
            "대기": "WAITING",
            "주문": "RECEIPT"
        };

        const englishStatus = statusMap[status] || status;

        const params = {
            id: flowCode,
            status: englishStatus
        };
        return apiRequest.patch("order/orders/status", null, { params });
    },

    // 제조사 변경
    updateOrderFactory: async (flowCode: string, factoryId: number): Promise<ApiResponse<string>> => {
        const requestBody = {
            factoryId: factoryId
        };
        const params = {
            id: flowCode
        };
        return apiRequest.patch("order/orders/factory", requestBody, { params });
    }

};

import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { StockRegisterRequest } from "../../src/types/stock";

export const saleApi = {
    // 주문 -> 판매 등록
    updateSaleRegister: async (
        flowCode: string,
        order_status: string,
        orderData: StockRegisterRequest
    ): Promise<ApiResponse<string>> => {
        const params = { id: flowCode, order_status: order_status };

        const requestBody = {
            ...orderData,
        };

        return apiRequest.patch<string>(
            "order/orders/sale-register",
            requestBody,
            {
                params,
            }
        );
    }
}
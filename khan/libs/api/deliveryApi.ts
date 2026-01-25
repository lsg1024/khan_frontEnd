import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	OrderSearchResponse,
} from "../../src/types/orderDto";

export const deliveryApi = {
	// Expact 주문 목록 조회 (페이징 및 검색 옵션 지원)
	getExpacts: async (
		start: string,
		end: string,
		order_status: string,
		search?: string,
		factory?: string,
		store?: string,
		setType?: string,
		page: number = 1
	): Promise<ApiResponse<OrderSearchResponse>> => {
		const params: Record<string, string> = { page: page.toString() };

		if (start) params.start = start;
		if (end) params.end = end;
		if (search) params.search = search;
		if (factory) params.factory = factory;
		if (store) params.store = store;
		if (setType) params.setType = setType;
		params.order_status = order_status;

		return apiRequest.get<OrderSearchResponse>("order/orders/deliveries", { params });
	},
};

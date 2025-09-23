import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	OrderSearchResponse,
	OrderResponseDetail,
	OrderRequestDetail,
} from "../../src/types/order";

export const fixApi = {
	// Fix 주문 생성
	createFixOrder: async (
		orderData: OrderRequestDetail
	): Promise<ApiResponse<string>> => {
		return apiRequest.post<string>("order/fix", orderData);
	},

	// Fix 주문 상세 조회
	getFix: async (
		flowCode: string
	): Promise<ApiResponse<OrderResponseDetail>> => {
		const params = { id: flowCode };
		return apiRequest.get<OrderResponseDetail>("order/fix", { params });
	},

	// Fix 주문 목록 조회 (페이징 및 검색 옵션 지원)
	getFixes: async (
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

		return apiRequest.get<OrderSearchResponse>("order/fixes", { params });
	},
};

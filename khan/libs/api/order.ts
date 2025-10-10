import { type AxiosResponse } from "axios";
import { api, apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type {
	OrderSearchResponse,
	OrderCreateRequest,
	PastOrderDto,
	OrderResponseDetail,
	OrderRequestDetail,
} from "../../src/types/order";

export const orderApi = {
	getOrder: async (
		flowCode: string
	): Promise<ApiResponse<OrderResponseDetail>> => {
		const params = { id: flowCode };
		return apiRequest.get<OrderResponseDetail>("order/order", { params });
	},

	getOrders: async (
		start: string,
		end: string,
		order_status: string,
		search?: string,
		factory?: string,
		store?: string,
		setType?: string,
		color?: string,
		sortField?: string,
		sortOrder?: "ASC" | "DESC" | "",
		page: number = 1
	): Promise<ApiResponse<OrderSearchResponse>> => {
		const params: Record<string, string> = { page: page.toString() };

		if (start) params.start = start;
		if (end) params.end = end;
		if (search) params.search = search;
		if (factory) params.factory = factory;
		if (store) params.store = store;
		if (setType) params.setType = setType;
		if (color) params.color = color;
		if (sortField) params.sortField = sortField;
		if (sortOrder) params.sortOrder = sortOrder;
		params.order_status = order_status;

		return apiRequest.get<OrderSearchResponse>("order/orders", { params });
	},

	orderUpdate: async (
		flowCode: string,
		order_status: string,
		orderData: OrderRequestDetail
	): Promise<ApiResponse<string>> => {
		const params = { id: flowCode, order_status };
		return apiRequest.patch<string>("order/order", orderData, { params });
	},

	getFilterFactories: async (
		start: string,
		end: string,
		order_status: string,
		factory?: string,
		store?: string,
		setType?: string
	): Promise<ApiResponse<string[]>> => {
		const params: Record<string, string> = {};
		if (start) params.start = start;
		if (end) params.end = end;
		if (factory) params.factory = factory;
		if (store) params.store = store;
		if (setType) params.setType = setType;
		params.order_status = order_status;

		return apiRequest.get("order/filters/factory", { params });
	},

	getFilterStores: async (
		start: string,
		end: string,
		order_status: string
	): Promise<ApiResponse<string[]>> => {
		const params: Record<string, string> = {};
		if (start) params.start = start;
		if (end) params.end = end;
		params.order_status = order_status;

		return apiRequest.get("order/filters/store", { params });
	},

	getFilterSetTypes: async (
		start: string,
		end: string,
		order_status: string
	): Promise<ApiResponse<string[]>> => {
		const params: Record<string, string> = {};
		if (start) params.start = start;
		if (end) params.end = end;
		params.order_status = order_status;

		return apiRequest.get("order/filters/set-type", { params });
	},

	getFilterColors: async (
		start: string,
		end: string,
		order_status: string
	): Promise<ApiResponse<string[]>> => {
		const params: Record<string, string> = {};
		if (start) params.start = start;
		if (end) params.end = end;
		params.order_status = order_status;

		return apiRequest.get("order/filters/color", { params });
	},

	// 제조사 변경
	updateOrderFactory: async (
		flowCode: string,
		factoryId: number
	): Promise<ApiResponse<string>> => {
		const requestBody = {
			factoryId: factoryId,
		};
		const params = {
			id: flowCode,
		};
		return apiRequest.patch("order/orders/factory", requestBody, { params });
	},

	// 주문 생성
	createOrder: async (
		orderType: string,
		orderData: OrderCreateRequest
	): Promise<ApiResponse<string>> => {
		const params = { order_type: orderType };
		return apiRequest.post("order/orders", orderData, { params });
	},

	//과거 주문 내역 호출
	getPastOrders: async (
		store: number,
		product: number,
		material: string
	): Promise<ApiResponse<PastOrderDto[]>> => {
		const params: Record<string, string | number> = {};
		if (store) params.store = store;
		if (product) params.product = product;
		if (material) params.material = material;

		return apiRequest.get<PastOrderDto[]>("order/sale/past", { params });
	},

	//주문 상태 호출

	// 주문 상태 변경
	updateOrderStatus: async (
		flowCode: string,
		status: string
	): Promise<ApiResponse<string>> => {
		const statusMap: Record<string, string> = {
			대기: "WAITING",
			접수: "RECEIPT",
		};

		const englishStatus = statusMap[status] || status;

		const params = {
			id: flowCode,
			status: englishStatus,
		};
		return apiRequest.patch("order/orders/status", null, { params });
	},

	// 주문 삭제 목록
	getDeletedOrders: async (
		start: string,
		end: string,
		order_status: string,
		search?: string,
		factory?: string,
		store?: string,
		setType?: string,
		color?: string,
		sortField?: string,
		sortOrder?: "ASC" | "DESC" | "",
		page: number = 1
	): Promise<ApiResponse<OrderSearchResponse>> => {
		const params: Record<string, string> = { page: page.toString() };

		if (start) params.start = start;
		if (end) params.end = end;
		if (search) params.search = search;
		if (factory) params.factory = factory;
		if (store) params.store = store;
		if (setType) params.setType = setType;
		if (color) params.color = color;
		if (sortField) params.sortField = sortField;
		if (sortOrder) params.sortOrder = sortOrder;
		params.order_status = order_status;

		return apiRequest.get<OrderSearchResponse>("order/orders/deleted", {
			params,
		});
	},

		// 주문 삭제
	deleteOrder: async (flowCode: string): Promise<ApiResponse<string>> => {
		const params = { id: flowCode };
		return apiRequest.delete<string>("order/orders/delete", { params });
	},


	// 엑셀 다운로드
	downloadOrdersExcel: async (
		start: string,
		end: string,
		order_status: string,
		search?: string,
		factory?: string,
		store?: string,
		setType?: string,
		color?: string
	): Promise<AxiosResponse<Blob>> => {
		const params: Record<string, string> = {};

		if (start) params.start = start;
		if (end) params.end = end;
		if (search) params.search = search;
		if (factory) params.factory = factory;
		if (store) params.store = store;
		if (setType) params.setType = setType;
		if (color) params.color = color;
		params.order_status = order_status;

		Object.keys(params).forEach(
			(key) =>
				(params[key] === undefined || params[key] === null) &&
				delete params[key]
		);

		return api.get("order/orders/excel/order-book", {
			params,
			responseType: "blob",
		});
	},

	updateDeliveryDate: async (
		flowCode: string,
		newDate: string
	): Promise<ApiResponse<string>> => {
		const requestBody = {
			deliveryDate: newDate,
		};
		const params: Record<string, string> = {};
		params.id = flowCode;
		return apiRequest.patch("order/orders/delivery-date", requestBody, {
			params,
		});
	},
};

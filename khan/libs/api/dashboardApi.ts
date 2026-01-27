import { apiRequest } from "./config";
import type {
	MaterialStockSummary,
	StockModelTop,
	SaleModelTop,
	StoreLaborCostTop,
	StockDetailPage,
	StockFilterOption,
	StockDetailSearchParams,
	MonthlySalesSummary,
	StoreTradeStatistics,
	StoreStatisticsSearchParams,
	StoreStatisticsFilterOption,
	ReceivableSummary,
	RentalSummary,
	RentalDetail,
	FactoryUnpaidSummary,
} from "../../src/types/dashboardDto";

// 재질별 현 재고현황 조회
export const getMaterialStockSummary = async () => {
	return apiRequest.get<MaterialStockSummary[]>(
		"/order/dashboard/stocks/material-summary"
	);
};

// 재고 Top5 모델 조회
export const getStockTop5Models = async () => {
	return apiRequest.get<StockModelTop[]>("/order/dashboard/stocks/top5-models");
};

// 재고 상세보기 조회 (페이징 + 검색)
export const getStockDetails = async (params: StockDetailSearchParams = {}) => {
	const queryParams = new URLSearchParams();

	if (params.productName) queryParams.append("productName", params.productName);
	if (params.materialName) queryParams.append("materialName", params.materialName);
	if (params.colorName) queryParams.append("colorName", params.colorName);
	if (params.storeName) queryParams.append("storeName", params.storeName);
	queryParams.append("page", String(params.page ?? 0));
	queryParams.append("size", String(params.size ?? 20));

	return apiRequest.get<StockDetailPage>(
		`/order/dashboard/stocks/details?${queryParams.toString()}`
	);
};

// 재고 필터 옵션 조회
export const getStockFilterOptions = async () => {
	return apiRequest.get<StockFilterOption>(
		"/order/dashboard/stocks/filter-options"
	);
};

// 당월 판매 Top5 모델 조회
export const getSaleTop5Models = async () => {
	return apiRequest.get<SaleModelTop[]>("/order/dashboard/sales/top5-models");
};

// 당월 매출공임 Top5 거래처 조회
export const getLaborCostTop5Stores = async () => {
	return apiRequest.get<StoreLaborCostTop[]>("/order/dashboard/sales/top5-labor-cost");
};

// 8.7 당월 매출 현황 조회
export const getMonthlySalesSummary = async () => {
	return apiRequest.get<MonthlySalesSummary>(
		"/order/dashboard/sales/monthly-summary"
	);
};

// 8.8 거래처별 거래 통계 조회 (필터/검색 지원)
export const getStoreTradeStatistics = async (params: StoreStatisticsSearchParams = {}) => {
	const queryParams = new URLSearchParams();

	if (params.start) queryParams.append("start", params.start);
	if (params.end) queryParams.append("end", params.end);
	if (params.storeName) queryParams.append("storeName", params.storeName);
	if (params.storeGrade) queryParams.append("storeGrade", params.storeGrade);
	if (params.tradeType) queryParams.append("tradeType", params.tradeType);
	if (params.materialName) queryParams.append("materialName", params.materialName);
	if (params.classificationName) queryParams.append("classificationName", params.classificationName);
	if (params.factoryName) queryParams.append("factoryName", params.factoryName);
	if (params.createdBy) queryParams.append("createdBy", params.createdBy);
	if (params.statisticsType) queryParams.append("statisticsType", params.statisticsType);

	const queryString = queryParams.toString();
	const url = queryString
		? `/order/dashboard/sales/store-statistics?${queryString}`
		: "/order/dashboard/sales/store-statistics";

	return apiRequest.get<StoreTradeStatistics[]>(url);
};

// 8.8-2 거래처별 거래 통계 필터 옵션 조회
export const getStoreStatisticsFilterOptions = async () => {
	return apiRequest.get<StoreStatisticsFilterOption>(
		"/order/dashboard/sales/store-statistics/filter-options"
	);
};

// 8.9 현 미수 현황 조회
export const getReceivableSummary = async () => {
	return apiRequest.get<ReceivableSummary>(
		"/order/dashboard/receivable/summary"
	);
};

// 8.10 현 대여 현황 조회
export const getRentalSummary = async () => {
	return apiRequest.get<RentalSummary>("/order/dashboard/rental/summary");
};

// 8.11 대여 현황 상세보기 조회
export const getRentalDetails = async () => {
	return apiRequest.get<RentalDetail[]>("/order/dashboard/rental/details");
};

// 8.12 매입처 미결제 현황 조회
export const getFactoryUnpaidSummary = async () => {
	return apiRequest.get<FactoryUnpaidSummary>(
		"/order/dashboard/factory/unpaid-summary"
	);
};

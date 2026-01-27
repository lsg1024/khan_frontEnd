// 재질별 현 재고현황
export interface MaterialStockSummary {
	material: string;
	totalWeight: string;
	count: number;
}

// 재고 Top5 모델
export interface StockModelTop {
	productName: string;
	stockCount: number;
}

// 당월 판매 Top5 모델
export interface SaleModelTop {
	productName: string;
	saleCount: number;
}

// 당월 매출공임 Top5 거래처
export interface StoreLaborCostTop {
	storeName: string;
	totalLaborCost: number;
}

// 재고 상세보기
export interface StockDetail {
	flowCode: string;
	createAt: string;
	productName: string;
	materialName: string;
	colorName: string;
	size: string;
	goldWeight: string;
	stoneWeight: string;
	factoryName: string;
	storeName: string;
	orderStatus: string;
}

// 재고 상세보기 페이지 응답
export interface StockDetailPage {
	content: StockDetail[];
	totalElements: number;
	totalPages: number;
	size: number;
	number: number;
}

// 재고 필터 옵션
export interface StockFilterOption {
	materials: string[];
	colors: string[];
	stores: string[];
}

// 재고 상세보기 검색 파라미터
export interface StockDetailSearchParams {
	productName?: string;
	materialName?: string;
	colorName?: string;
	storeName?: string;
	page?: number;
	size?: number;
}

// 8.7 당월 매출 현황
export interface MonthlySalesSummary {
	salePureGold: string; // 매출 순금 (g)
	saleLaborCost: number; // 매출 공임 (원)
	marginLaborCost: number; // 마진 공임 (매출공임 - 매입원가) (원)
}

// 8.8 거래처별 거래 통계 검색 파라미터
export interface StoreStatisticsSearchParams {
	start?: string; // 시작일 (yyyy-MM-dd)
	end?: string; // 종료일 (yyyy-MM-dd)
	storeName?: string; // 거래처명 검색 (부분 일치)
	storeGrade?: string; // 매장구분 (등급) 필터
	tradeType?: string; // 거래형태 필터
	materialName?: string; // 재질구분 필터
	classificationName?: string; // 분류구분 필터
	factoryName?: string; // 매입처구분 필터
	createdBy?: string; // 관리자구분 필터
	statisticsType?: string; // 통계선택 (STORE, FACTORY)
}

// 8.8-2 거래처별 거래 통계 필터 옵션
export interface StoreStatisticsFilterOption {
	storeGrades: string[]; // 매장구분 (등급) 옵션 목록
	tradeTypes: string[]; // 거래형태 옵션 목록
	materials: string[]; // 재질구분 옵션 목록
	classifications: string[]; // 분류구분 옵션 목록
	factories: string[]; // 매입처구분 옵션 목록
	managers: string[]; // 관리자구분 옵션 목록
	statisticsTypes: string[]; // 통계선택 옵션 목록
}

// 8.8 거래처별 거래 통계
export interface StoreTradeStatistics {
	storeId: number;
	storeName: string;
	saleLaborCost: number; // 판매 공임 (원)
	salePureGold: string; // 판매 순금 (g)
	saleCount: number; // 판매 수량
	saleMainStoneCount: number; // 판매 메인스톤 수
	saleAssistStoneCount: number; // 판매 보조스톤 수
	returnLaborCost: number; // 반품 공임 (원)
	returnPureGold: string; // 반품 순금 (g)
	returnCount: number; // 반품 수량
	dcLaborCost: number; // DC 공임 (원)
	dcPureGold: string; // DC 순금 (g)
	dcCount: number; // DC 수량
	totalSaleLaborCost: number; // 매출 공임 (판매-반품-DC) (원)
	totalSalePureGold: string; // 매출 순금 (판매-반품-DC) (g)
	totalSaleCount: number; // 매출 수량 (판매-반품-DC)
	paymentAmount: number; // 실 입금 금액 (원)
	paymentPureGold: string; // 실 입금 순금 (g)
	purchaseCost: number; // 매입원가 (원)
	marginLaborCost: number; // 마진 공임 (매출-매입) (원)
	marginPureGold: string; // 마진 순금 (g)
}

// 8.9 현 미수 현황
export interface ReceivableSummary {
	totalPureGold: string; // 미수 순금 (판매 순금 - 결제 순금) (g)
	totalAmount: number; // 미수 금액 (판매 공임 - 결제 금액) (원)
}

// 8.10 현 대여 현황
export interface RentalSummary {
	totalPureGold: string; // 대여 순금 (g)
	totalLaborCost: number; // 대여 공임 (원)
	totalCount: number; // 대여 수량
}

// 8.11 대여 현황 상세보기
export interface RentalDetail {
	storeId: number;
	storeName: string;
	phoneNumber: string; // 대표 전화번호
	contactNumber1: string; // 연락처 1
	contactNumber2: string; // 연락처 2
	pureGold: string; // 순금 (g)
	laborCost: number; // 공임 (원)
	count: number; // 수량
	firstRentalDate: string; // 최초 대여일
	lastRentalDate: string; // 최종 대여일
}

// 8.12 매입처 미결제 현황
export interface FactoryUnpaidSummary {
	totalPureGold: string; // 미결제 순금 (매입 순금 - 결제 순금) (g)
	totalAmount: number; // 미결제 금액 (매입 비용 - 결제 금액) (원)
}

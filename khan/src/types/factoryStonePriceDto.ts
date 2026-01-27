// 공장별 스톤 조각료 DTO

// 조각료 등록/수정 요청
export interface FactoryStonePriceRequest {
	factoryId: number;
	factoryName: string;
	stoneId: number;
	engravingFee: number;
	effectiveDate: string; // YYYY-MM-DD
	expiredDate?: string | null;
	note?: string;
}

// 조각료 응답
export interface FactoryStonePriceResponse {
	id: number;
	factoryId: number;
	factoryName: string;
	stoneId: number;
	stoneName: string;
	engravingFee: number;
	effectiveDate: string;
	expiredDate: string | null;
	note: string | null;
}

// 일괄 등록용 단일 항목
export interface BulkPriceItem {
	stoneId: number;
	stoneName: string;
	engravingFee: number;
}

// 일괄 등록 요청
export interface FactoryStonePriceBulkRequest {
	factoryId: number;
	factoryName: string;
	prices: BulkPriceItem[];
}

// 페이지네이션 정보
export interface FactoryStonePricePageInfo {
	size: number;
	number: number;
	totalElements: number;
	totalPages: number;
}

// 페이지네이션 응답
export interface FactoryStonePricePageResponse {
	content: FactoryStonePriceResponse[];
	page: FactoryStonePricePageInfo;
}

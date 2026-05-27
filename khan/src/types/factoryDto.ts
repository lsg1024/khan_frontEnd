import type { PageInfo } from "./pageDto";

export interface FactorySearchDto {
	factoryId?: number;
	factoryName: string;
	factoryOwnerName: string;
	factoryPhoneNumber: string;
	factoryContactNumber1: string;
	factoryContactNumber2: string;
	factoryFaxNumber: string;
	factoryNote: string;
	address: string;
	tradeType: "WEIGHT" | "PIECE";
	grade: "1" | "2" | "3" | "4";
	goldHarryLoss: string;
	/** 최근 거래일 (Task 4-2). BE findAllFactory 서브쿼리로 계산. 없으면 null. */
	lastSaleDate?: string | null;
	/** 최근 결제일 (Task 4-2). BE findAllFactory 서브쿼리로 계산. 없으면 null. */
	lastPaymentDate?: string | null;
}

// 공장 검색 API 응답
export interface FactorySearchResponse {
	content: FactorySearchDto[];
	page: PageInfo;
}

// 공장 매입금 조회 응답
export interface FactoryPurchaseDto {
	accountId: number;
	accountName: string;
	goldWeight: string;
	moneyAmount: string;
}

export interface FactoryPurchaseResponse {
	content: FactoryPurchaseDto[];
	page: PageInfo;
}

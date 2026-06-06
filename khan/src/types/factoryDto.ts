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

// 공장 매입금(제조사별 잔액) 조회 응답
// BE: /factories/purchase -> AccountDto.AccountResponse (CustomPage)
// goldWeight = factory.currentGoldBalance (순금 기준 누적 잔액)
export interface FactoryPurchaseDto {
	accountId: number;
	accountName: string;
	goldWeight: string;
	moneyAmount: string;
	/** 거래처 수수료(해리). AccountResponse.goldHarryLoss */
	goldHarryLoss?: string;
	/** 거래 구분(표시명). AccountResponse.tradeType */
	tradeType?: string;
	/** 등급. AccountResponse.grade */
	grade?: string;
	/** 최근 거래일. AccountResponse.lastSaleDate */
	lastSaleDate?: string | null;
	/** 최근 결제일. AccountResponse.lastPaymentDate */
	lastPaymentDate?: string | null;
	/** 비고. AccountResponse.note */
	note?: string | null;
}

export interface FactoryPurchaseResponse {
	content: FactoryPurchaseDto[];
	page: PageInfo;
}

// 매입 생성 요청 한 줄 (BE PurchaseDto 와 1:1)
export interface PurchaseCreateLine {
	/** 거래처(제조사) PK */
	accountId: string;
	/** 거래 유형(enum name): PURCHASE/PAYMENT/RETURN/DISCOUNT */
	transactionType: string;
	/** 재질 (14K/18K/24K) */
	material: string;
	/** 순금 환산 중량(g) - 잔액에 가감되는 순금 값 */
	goldAmount: number;
	/** 현금 금액(원) */
	moneyAmount: number;
	/** 거래 비고 */
	transactionNote?: string;
	/** 등록 일시 (LocalDateTime, 예: 2026-06-07T00:00:00) */
	transactionDate?: string;
}

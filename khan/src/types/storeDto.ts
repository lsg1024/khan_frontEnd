import type { PageInfo } from "./pageDto";

// 거래처 공통 인터페이스
export interface StoreSearchDto {
	accountId: number;
	accountName: string;
	tradeType: string;
	grade: string;
	goldHarryLoss: string;
	businessOwnerName: string;
	businessOwnerNumber: string;
	businessNumber1: string;
	businessNumber2: string;
	faxNumber: string;
	note: string;
	address: string;
	/** 최근 거래일 (Task 4-2). BE findAllStore 에서 서브쿼리로 계산. 없으면 null/undefined. */
	lastSaleDate?: string | null;
	/** 최근 결제일 (Task 4-2). BE findAllStore 에서 서브쿼리로 계산. 없으면 null/undefined. */
	lastPaymentDate?: string | null;
}

// 상점 검색 API 응답
export interface StoreSearchResponse {
	content: StoreSearchDto[];
	page: PageInfo;
}

// 거래처 미수 정보 (미수 금액 포함)
export interface AccountInfoDto extends StoreSearchDto {
	goldWeight: string;
	moneyAmount: string;
	lastPaymentDate?: string;
}

export interface StoreReceivableResponse {
	content: AccountInfoDto[];
	page: PageInfo;
}

export interface StoreReceivableSaleLogResponse extends StoreSearchDto {
	previousGoldBalance: string;
	previousMoneyBalance: string;
	afterGoldBalance: string;
	afterMoneyBalance: string;
	lastSaleDate: string;
	lastPaymentDate: string;
}

/**
 * Task 4-3 / 4-4 — 거래처/제조사 최근 활동 응답.
 * - recentTransactions : 최신순 SALE 트랜잭션 내역.
 * - paymentSummary     : PAYMENT 집계(총 순금 중량, 총 결제 금액, 건수, 최근 결제일).
 */
export interface TransactionItem {
	transactionDate: string;
	transactionType: string;
	material: string | null;
	goldAmount: string;
	moneyAmount: string;
	saleCode: string | null;
	note: string | null;
}

export interface PaymentSummary {
	totalGoldWeight: string;
	totalMoneyAmount: string;
	paymentCount: number;
	lastPaymentDate: string | null;
}

export interface RecentActivityResponse {
	recentTransactions: TransactionItem[];
	paymentSummary: PaymentSummary;
}

// 거래 내역 페이지 (매입/판매 미수금)
export interface TransactionPage {
	saleCode: string;
	accountId: string;
	accountName: string;
	accountHarry: string;
	createDate: string;
	material: string;
	goldAmount: string;
	moneyAmount: string;
	tradeType: string;
	transactionNote: string;
}

export interface TransactionPageResponse {
	content: TransactionPage[];
	page: PageInfo;
}

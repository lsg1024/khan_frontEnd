import type { PageInfo } from "./page";

// 거래처 공통 인터페이스
export interface StoreSearchDto {
	accountId: number;
	accountName: string;
	tradeType: string;
	level: string;
	goldHarryLoss: string;
	businessOwnerName: string;
	businessOwnerNumber: string;
	businessNumber1: string;
	businessNumber2: string;
	faxNumber: string;
	note: string;
	address: string;
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

export interface StoreAttemptResponse {
	content: AccountInfoDto[];
	page: PageInfo;
}

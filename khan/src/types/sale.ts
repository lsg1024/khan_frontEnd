import type { PageInfo } from "./page";

export interface SaleSearchResponse {
	content: SaleRow[];
	page: PageInfo;
}

export interface SaleRow {
	createAt: string;
	createBy: string;
	saleType: string;
	storeName: string;
	saleCode: number;
	flowCode: number;
	productName: string;
	materialName: string | null;
	colorName: string | null;
	note: string | null;
	assistantStone: boolean;
	assistantName: string | null;
	totalWeight: number;
	goldWeight: number;
	totalProductLaborCost: number;
	mainStoneLaborCost: number;
	assistanceStoneLaborCost: number;
	stoneAddLaborCost: number;
	mainStoneQuantity: number;
	assistanceStoneQuantity: number;
}

// 판매 생성 페이지 관련 타입

// 구분 타입 정의
export type SaleStatusType = "판매" | "결제" | "DC" | "WG" | "결통" | "반품";

// 판매 구분 카테고리
export const SALE_STATUS_CATEGORY = {
	SALE: "판매" as const,
	OTHERS: ["결제", "DC", "WG", "결통", "반품"] as const,
} as const;

// 구분에 따른 필드 편집 가능 여부 체크 유틸리티
export const isSaleStatus = (status: SaleStatusType): status is "판매" => {
	return status === "판매";
};

export const isOtherStatus = (status: SaleStatusType): boolean => {
	return ["결제", "DC", "WG", "결통", "반품"].includes(status);
};

export interface SaleCreateRow {
	id: string;
	status: SaleStatusType; // 구분
	flowCode: string; // 시리얼
	storeId: string; // 상점 ID
	productId: string; // 상품 ID
	productName: string; // 모델번호
	materialId: string; // 재질 ID
	materialName: string; // 재질
	colorName: string; // 색상
	hasStone: boolean; // 스톤 여부
	assistantStoneId: string; // 보조석 ID
	assistantStoneName: string; // 보조석 이름
	hasAssistantStone: boolean; // 보조석 여부
	assistantStoneArrivalDate: string; // 보조석 입고날짜
	mainStoneNote: string; // 메인 스톤 비고
	assistantStoneNote: string; // 보조 스톤 비고
	productSize: string; // 사이즈
	note: string; // 비고
	quantity: number; // 수량
	unitPrice: number; // 알 단가 - 중심
	productPrice: number; // 상품 단가 - 기본
	additionalProductPrice: number; // 상품 단가 - 추가
	assistantStonePrice: number; // 알 단가 - 보조
	additionalStonePrice: number; // 알 단가 - 추가
	stoneWeightPerUnit: number; // 개당알중량
	totalWeight: number; // 총 중량(g)
	stoneWeight: number; // 알중량
	goldWeight: number; // 금중량
	pureGoldWeight: number; // 순금중량
	pricePerGram: number; // 단가
	stoneCountPerUnit: number; // 개당 알수 - 메인
	mainStoneCount: number; // 메인 알수
	assistantStoneCount: number; // 보조 알수
}

export interface SaleOptionData {
	storeName: string; // 매장
	storeId: string;
	tradeDate: string; // 거래일
	marketPrice: number; // 시세
	customerName: string; // 거래처
	customerId: string;
	saleCode: string; // 거래번호
	tradeType: "중량" | "시세"; // 거래 형태
	grade: string; // 공금 등급
	appliedHarry: string; // 적용해리
}

export interface GoldHistoryData {
	pureGold: number; // 순금
	goldAmount: number; // 금액
	totalPreviousBalance: number; // 전 미수 총합
	previousBalance: number; // 전 미수 이전
	sales: number; // 판매
	returns: number; // 반품
	dc: number; // DC
	payment: number; // 결제
	afterBalance: number; // 후미수
}

import type { PageInfo } from "./page";
import type { StoneInfo } from "./stone";

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

export interface SaleSearchResponse {
	content: SaleRow[];
	page: PageInfo;
}

export interface SaleRow {
	createAt: string;
	createBy: string;
	saleType: string;
	storeId: string;
	storeName: string;
	saleCode: string; // 큰 정수값을 문자열로 처리
	flowCode: string; // 큰 정수값을 문자열로 처리
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

// 상세 조회
export interface SaleDetailResponse {
	flowCode: string;
	createAt: string;
	saleType: string;
	id: string;
	name: string;
	grade: string;
	harry: number;
	productName: string;
	productSize: string;
	materialName: string;
	colorName: string;
	mainStoneNote: string;
	assistanceStoneNote: string;
	note: string;
	goldWeight: number;
	stoneWeight: number;
	productLaborCost: number;
	productAddLaborCost: number;
	addStoneLaborCost: number;
	assistantStone: boolean | false;
	assistantStoneId: string | "";
	assistantStoneName: string | "";
	assistantStoneCreateAt: string | "";
	stoneInfos: StoneInfo[];
}

export interface SaleCreateRow {
	id: string;
	status: SaleStatusType; // 구분
	saleType?: string; // API의 saleType (SALES, RETURN 등)
	flowCode: string; // 시리얼
	storeId: string; // 상점 ID
	productId: string; // 상품 ID
	productName: string; // 모델번호
	materialId: string; // 재질 ID
	materialName: string; // 재질
	colorId: string; // 색상 ID
	colorName: string; // 색상
	assistantStoneId: string;
	assistantStone: boolean; // 입고여부 (Y/N)
	assistantStoneName: string; // 보조석 아이디 (없음, 랩, 천연, 모이사, 유색석)
	assistantStoneCreateAt: string; // 입고날짜
	mainStoneNote: string; // 메인 스톤 비고
	assistanceStoneNote: string; // 보조 스톤 비고
	productSize: string; // 사이즈
	note: string; // 비고
	productPrice: number; // 상품 단가 - 기본
	additionalProductPrice: number; // 상품 단가 - 추가
	stonePurchasePrice: number; // 알 구입가
	mainStonePrice: number; // 알 단가 메인
	assistanceStonePrice: number; // 알 단가 - 보조
	stoneAddLaborCost: number; // 알 단가 - 추가
	stoneWeightTotal: number; // 개당알중량
	totalWeight: number; // 총 중량(g)
	stoneWeight: number; // 알중량
	goldWeight: number; // 금중량
	pureGoldWeight: number; // 순금중량
	pricePerGram: number; // 단가
	mainStoneCount: number; // 메인 알수
	assistanceStoneCount: number; // 보조 알수
	stoneInfos: StoneInfo[];
}

export interface SaleUpdateRequest {
	productSize?: string;
	isProductWeightSale: boolean;
	productPurchaseCost?: number;
	productLaborCost?: number;
	productAddLaborCost?: number;
	stockNote?: string;
	storeHarry?: string;
	goldWeight?: string;
	stoneWeight?: string;
	mainStoneNote?: string;
	assistanceStoneNote?: string;
	assistantStone: boolean;
	assistantStoneId?: string;
	assistantStoneName?: string;
	assistantStoneCreateAt?: string;
	stoneInfos?: StoneInfo[];
	stoneAddLaborCost?: number;
}

export interface SaleOptionData {
	storeName: string; // 매장
	storeId: string;
	tradeDate: string; // 거래일
	marketPrice: number; // 시세
	saleCode: string; // 거래번호
	tradeType: "중량" | "시세"; // 거래 형태
	grade: string; // 공금 등급
	harry: string; // 적용해리
	moneyAmount: number; // 미수금
	goldWeight: string; // 금중량
}

export interface GoldHistoryData {
	salesGoldBalance: number; // 판매 순금
	salesMoneyBalance: number; // 판매 금액
	returnsGoldBalance: number; // 반품 순금
	returnsMoneyBalance: number; // 반품 금액
	dcGoldBalance: number; // DC 순금
	dcMoneyBalance: number; // DC 금액
	paymentGoldBalance: number; // 결제 순금
	paymentMoneyBalance: number; // 결제 금액
	previousGoldBalance: number; // 전 미수 순금
	previousMoneyBalance: number; // 전 미수 금액
	afterGoldBalance: number; // 후미수 순금
	afterMoneyBalance: number; // 후미수 금액
}

export interface SalePaymentRequest {
	id: number;
	name: string;
	harry: string;
	grade: string;
	orderStatus: string;
	material: string;
	note: string;
	goldWeight: string;
	payAmount: number;
}

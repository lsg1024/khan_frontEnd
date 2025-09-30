import type { StoneInfo } from "./stone";

export interface StockOrderRowData {
	createAt: string;
	id: string;
	storeId: string;
	storeName: string;
	grade: string;
	productId: string;
	productName: string;
	materialId: string;
	materialName: string;
	colorId: string;
	colorName: string;
	factoryId: string;
	factoryName: string;
	productSize: string;
	productPurchaseCost: number; // 매입단가
	goldWeight: string;
	stoneWeight: string;
	isProductWeightSale: boolean;
	mainStoneNote: string;
	assistanceStoneNote: string;
	orderNote: string;
	stoneInfos: StoneInfo[];
	productLaborCost: number | ""; // 기본 판매단가
	productAddLaborCost: number | ""; // 추가 판매단가
	mainStonePrice: number | ""; // 중심 판매단가
	assistanceStonePrice: number | ""; // 보조 판매단가
	mainStoneCount: number | ""; // 메인 개당알수
	assistanceStoneCount: number | ""; // 보조 개당알수
	additionalStonePrice: number | ""; // 추가 스톤 판매단가
	stoneWeightTotal: number | ""; // 알중량
	// 보조석 관련 필드
	assistantStoneId: string;
	assistantStone: boolean; // 입고여부 (Y/N)
	assistantStoneName: string; // 보조석 아이디 (없음, 랩, 천연, 모이사, 유색석)
	assistantStoneCreateAt: string; // 입고날짜

	totalWeight: number;
	storeHarry: string;
}

export interface StockRegisterRequest {
	orderRequest: StockOrderRowData;
	productPurchaseCost: number;
	totalWeight: number;
	storeHarry: string;
}

export interface StockRegisterResponse {
	createAt: string;
	flowCode: string;
	storeId: string;
	storeName: string;
	factoryId: string;
	factoryName: string;
	productId: string;
	productName: string;
	productSize: string;
	storeHarry: string;
	productPurchaseCost: number;
	productLaborCost: number;
	productAddLaborCost: number;
	goldWeight: string;
	stoneWeight: string;
	materialName: string;
	colorName: string;
	orderNote: string;
	mainStoneNote: string;
	assistanceStoneNote: string;
	assistantStone: boolean;
	assistantStoneName: string;
	assistantStoneCreateAt: string;
	stoneInfos: StoneInfo[];
}


export interface StockResponseDetail {
	createAt: string;
	shippingAt: string;
	flowCode: string;
	storeId: string;
	storeName: string;
	factoryId: string;
	factoryName: string;
	productId: string;
	productName: string;
	productSize: string;
	productPurchaseCost: number;
	productLaborCost: number;
	productAddLaborCost: number;
	goldWeight: string;
	stoneWeight: string;
	classification: string;
	materialName: string;
	colorName: string;
	setType: string;
	orderNote: string;
	mainStoneNote: string;
	assistanceStoneNote: string;
	priority: string;
	productStatus: string;
	orderStatus: string;
	assistantStone: boolean;
	assistantStoneName: string;
	assistantStoneCreateAt: string;
	stoneInfos: StoneInfo[];
}

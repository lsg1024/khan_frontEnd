import type { StoneInfo } from "./stone";
import type { PageInfo } from "./page";

export interface StockOrderRows {
	createAt: string;
	shippingAt: string;
	id: string;
	storeId: string;
	storeName: string;
	grade: string;
	productId: string;
	productName: string;
	productFactoryName: string;
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
	productLaborCost: number; // 기본 판매단가
	productAddLaborCost: number; // 추가 판매단가
	mainStonePrice: number; // 중심 판매단가
	assistanceStonePrice: number; // 보조 판매단가
	mainStoneCount: number; // 메인 개당알수
	assistanceStoneCount: number; // 보조 개당알수
	stoneAddLaborCost: number; // 추가 스톤 판매단가
	stoneWeightTotal: number; // 알중량 합계 (UI 표시용)
	// 보조석 관련 필드
	assistantStoneId: string;
	assistantStone: boolean; // 입고여부 (Y/N)
	assistantStoneName: string; // 보조석 아이디 (없음, 랩, 천연, 모이사, 유색석)
	assistantStoneCreateAt: string; // 입고날짜

	totalWeight: number; // 총중량
	storeHarry: string;
	// 분류 및 세트 타입 필드 추가
	classificationId: string;
	classificationName: string;
	setTypeId: string;
	setTypeName: string;
	// 재고 상태 필드 추가
	currentStatus?: string; // STOCK, SHIPPED 등
	// 판매 관련 필드
	saleNote?: string; // 판매 비고
}

// 재고 생성 요청 데이터
export interface StockCreateRequest {
	storeId: string;
	storeName: string;
	storeGrade: string;
	storeHarry: string;
	factoryId: string;
	factoryName: string;
	productId: string;
	productName: string;
	productFactoryName: string;
	productSize: string;
	stockNote: string;
	isProductWeightSale: boolean;
	productPurchaseCost: number;
	productLaborCost: number; // 기본 판매단가
	productAddLaborCost: number;
	materialId: string;
	materialName: string;
	colorId: string;
	colorName: string;
	classificationId: string;
	classificationName: string;
	setTypeId: string;
	setTypeName: string;
	goldWeight: number;
	stoneWeight: number;
	mainStoneNote: string;
	assistanceStoneNote: string;
	assistantStone: boolean;
	assistantStoneId: string;
	assistantStoneName: string;
	assistantStoneCreateAt: string;
	stoneInfos: StoneInfo[];
	stoneAddLaborCost: number;
}

export interface StockRegisterResponse {
	flowCode: string;
	createAt: string;
	shippingAt: string;
	storeId: string;
	storeName: string;
	factoryId: string;
	factoryName: string;
	productId: string;
	productName: string;
	productFactoryName: string;
	productSize: string;
	isProductWeightSale: boolean;
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
	assistantStoneId: string;
	assistantStoneName: string;
	assistantStoneCreateAt: string;
	stoneInfos: StoneInfo[];
	stoneAddLaborCost: number;
	classificationId: string;
	classificationName: string;
	setTypeId: string;
	setTypeName: string;
}

export interface StockRegisterRequest {
	createAt: string;
	flowCode: string;
	materialId: string;
	materialName: string;
	colorId: string;
	colorName: string;
	productSize: string;
	isProductWeightSale: boolean;
	productPurchaseCost: number;
	productLaborCost: number;
	productAddLaborCost: number;
	storeHarry: string;
	goldWeight: string;
	stoneWeight: string;
	orderNote: string;
	mainStoneNote: string;
	assistanceStoneNote: string;
	assistantStoneId: string;
	assistantStone: boolean;
	assistantStoneName: string;
	assistantStoneCreateAt: string;
	stoneInfos: StoneInfo[];
	stoneAddLaborCost: number;
}

export interface StockSaleRequest {
	productSize: string;
	isProductWeightSale: boolean;
	addProductLaborCost: number;
	stoneAddLaborCost: number;
	productPurchaseCost: number;
	stonePurchaseCost: number;
	mainStoneNote: string;
	assistanceStoneNote: string;
	stockNote: string;
	assistantStone: boolean;
	assistantStoneId: string;
	assistantStoneCreateAt: string;
	goldWeight: string;
	stoneWeight: string;
	stoneInfos: StoneInfo[];
}

export interface StockSearchResponse {
	content: StockResponse[];
	page: PageInfo;
}

export interface StockResponse {
	flowCode: string;
	createAt: string;
	shippingAt: string;
	originStatus: string;
	currentStatus: string;
	storeName: string;
	productSize: string;
	stockNote: string;
	materialName: string;
	classificationName: string;
	colorName: string;
	productLaborCost: number;
	productAddLaborCost: number;
	assistantStoneName: string;
	assistantStone: boolean;
	mainStoneLaborCost: number;
	assistanceStoneLaborCost: number;
	stoneAddLaborCost: number;
	mainStoneNote: string;
	assistanceStoneNote: string;
	mainStoneQuantity: number;
	assistanceStoneQuantity: number;
	goldWeight: string;
	stoneWeight: string;
	productPurchaseCost: number;
	stonePurchaseCost: number;
}

export interface StockResponseDetail {
	flowCode: string;
	createAt: string;
	shippingAt: string;
	originalProductStatus: string;
	classificationName: string;
	productName: string;
	productFactoryName: string;
	storeName: string;
	factoryName: string;
	materialName: string;
	colorName: string;
	setTypeName: string;
	mainStoneNote: string;
	assistanceStoneNote: string;
	productSize: string;
	stockNote: string;
	productLaborCost: number;
	productAddLaborCost: number;
	goldWeight: string;
	stoneWeight: string;
	productPurchaseCost: number;
	storeHarry: string;
	assistantStoneId: string;
	assistantStone: boolean;
	assistantStoneName: string;
	assistantStoneCreateAt: string;
	stoneInfos: StoneInfo[];
	stoneAddLaborCost: number; // 추가 스톤 판매단가
}

export interface StockUpdateRequest {
	productSize: string;
	isProductWeightSale: boolean;
	stockNote: string;
	productPurchaseCost: number;
	productLaborCost: number;
	productAddLaborCost: number;
	goldWeight: string;
	stoneWeight: string;
	mainStoneNote: string;
	assistanceStoneNote: string;
	assistantStoneId: string;
	assistantStone: boolean;
	assistantStoneName: string;
	assistantStoneCreateAt: string;
	stoneInfos: StoneInfo[];
	stoneAddLaborCost: number;
	totalStonePurchaseCost: number;
}

export interface StockRentalRequest {
	productSize: string;
	mainStoneNote: string;
	assistanceStoneNote: string;
	stockNote: string;
	isProductWeightSale: boolean;
	goldWeight: string;
	stoneWeight: string;
	productAddLaborCost: number;
	stoneAddLaborCost: number;
	stoneInfos: StoneInfo[];
}

export interface ResponseDetail {
	createAt: string;
	flowCode: string;
	originalProductStatus: string;
	storeId: string;
	storeName: string;
	storeGrade: string;
	storeHarry: string;
	factoryId: string;
	factoryName: string;
	productId: string;
	productName: string;
	productSize: string;
	colorId: string;
	colorName: string;
	materialId: string;
	materialName: string;
	note: string;
	isProductWeightSale: boolean;
	productPurchaseCost: number;
	productLaborCost: number;
	productAddLaborCost: number;
	goldWeight: string;
	stoneWeight: string;
	mainStoneNote: string;
	assistanceStoneNote: string;
	assistantStone: boolean;
	assistantStoneId: string;
	assistantStoneName: string;
	assistantStoneCreateAt: string;
	stoneInfos: StoneInfo[];
	stoneAddLaborCost: number;
}

import type { PageInfo } from "./page";

export interface OrderResponseDetail {
	createAt: string;
	shippingAt: string;
	flowCode: string;
	storeId: string;
	storeName: string;
	factoryId: string; // 서버에서 제공하는 factoryId
	factoryName: string;
	productId: string;
	productName: string;
	classification: string;
	materialName: string;
	colorName: string;
	setType: string;
	productSize: string;
	orderNote: string;
	mainStoneNote: string;
	assistanceStoneNote: string;
	priority: string;
	productStatus: string;
	orderStatus: string;
	assistantStone: boolean;
	assistantStoneName: string | null;
	assistantStoneCreateAt: string | null;
	stoneInfos: StoneInfo[];
}

export interface OrderRequestDetail {
	storeId: string;
	orderNote: string;
	factoryId: string;
	productId: string;
	productSize: string;
	isProductWeightSale: boolean;
	productAddLaborCost: number;
	materialId: string;
	colorId: string;
	priorityName: string;
	stoneWeight: number;
	mainStoneNote: string;
	assistanceStoneNote: string;
	assistantStone: boolean;
	assistantStoneId: number;
	assistantStoneName: string | null;
	assistantStoneCreateAt: string | null;
	createAt: string;
	shippingAt: string;
	productStatus: string;
	stoneInfos: StoneInfo[];
}

export interface OrderSearchResponse {
	content: OrderDto[];
	page: PageInfo;
}

export interface OrderDto {
	createAt: string;
	shippingAt: string;
	flowCode: string;
	storeName: string;
	productName: string;
	materialName: string;
	colorName: string;
	setType: string;
	productSize: string;
	productWeight: string;
	stockQuantity: number;
	orderMainStoneNote: string;
	orderAssistanceStoneNote: string;
	stockFlowCodes: string[];
	orderNote: string;
	factoryName: string;
	priority: string;
	imagePath: string;
	productStatus: string;
	orderStatus: string;
}

// 주문 생성을 위한 스톤 정보
export interface StoneInfo {
	stoneId: string;
	stoneName: string;
	stoneWeight: string;
	purchaseCost: string;
	laborCost: number;
	quantity: number;
	mainStone: boolean;
	includeStone: boolean;
	grade?: string; // 스톤 등급
}

// 주문 생성 요청 데이터 (백엔드 JSON 구조와 정확히 일치)
export interface OrderCreateRequest {
	storeId: string;
	orderNote: string;
	factoryId: string;
	productId: string;
	productSize: string;
	isProductWeightSale: boolean;
	productAddLaborCost: number;
	materialId: string;
	classificationName: string;
	colorId: string;
	setTypeName: string;
	priorityName: string;
	stoneWeight: number;
	mainStoneNote: string;
	assistanceStoneNote: string;
	assistantStone: boolean;
	assistantStoneId: number;
	assistantStoneName: string;
	assistantStoneCreateAt: string;
	createAt: string;
	shippingAt: string;
	productStatus: string;
	stoneInfos: StoneInfo[];
}

// 과거 주문 내역
export interface PastOrderDto {
	flowCode: number;
	saleCreateAt: string;
	productName: string;
	productMaterial: string;
	productColor: string;
	stockMainStoneNote: string;
	stockAssistanceStoneNote: string;
	productSize: string;
	stockNote: string;
	goldWeight: number;
	stoneWeight: number;
	mainStoneQuantity: number;
	assistanceStoneQuantity: number;
	productLaborCost: number;
	productAddLaborCost: number;
	mainStoneLaborCost: number;
	assistanceStoneLaborCost: number;
	addStoneLaborCost: number;
	assistantStone: boolean;
	assistantStoneName: string;
	assistantStoneCreateAt: string;
	storeName: string;
}

// 단일 주문 행 데이터 (UI용)
export interface OrderRowData {
	id: string;
	storeId: string;
	storeName: string;
	grade: string;
	productId: string;
	classificationName: string;
	setTypeName: string;
	productName: string;
	materialId: string;
	materialName: string;
	colorId: string;
	colorName: string;
	factoryId: string;
	factoryName: string;
	productSize: string;
	stoneWeight: number;
	productAddLaborCost: number;
	isProductWeightSale: boolean;
	priorityName: string;
	mainStoneNote: string;
	assistanceStoneNote: string;
	orderNote: string;
	stoneInfos: StoneInfo[];
	mainPrice: number | ""; // 기본 판매단가
	additionalPrice: number | ""; // 추가 판매단가
	mainStonePrice: number | ""; // 중심 판매단가
	assistanceStonePrice: number | ""; // 보조 판매단가
	mainStoneCount: number | ""; // 메인 개당알수
	assistanceStoneCount: number | ""; // 보조 개당알수
	additionalStonePrice: number | ""; // 추가 스톤 판매단가
	stoneWeightTotal: number | ""; // 알중량
	createAt: string; // 생성일
	shippingAt: string; // 출고일
	// 보조석 관련 필드
	assistantStoneId: number;
	assistantStone: boolean; // 입고여부 (Y/N)
	assistantStoneName: string; // 보조석 아이디 (없음, 랩, 천연, 모이사, 유색석)
	assistantStoneCreateAt: string; // 입고날짜
}

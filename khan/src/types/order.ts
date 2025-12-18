import type { PageInfo } from "./page";
import type { StoneInfo } from "./stone";

export interface OrderResponseDetail {
    createAt: string;
    shippingAt: string;
    flowCode: string;
    storeId: string;
    storeName: string;
	storeHarry: string;
    storeGrade: string;
    factoryId: string;
    factoryName: string;
    productId: string;
    productName: string;
	productFactoryName: string;
    productSize: string;
    productLaborCost: number; 
    productAddLaborCost: number;
    goldWeight: string;
    stoneWeight: string;
    productStatus: string; 
    classificationId: string;
    classificationName: string;
    materialId: string;
    materialName: string;
    colorId: string;
    colorName: string;
    setTypeId: string;
    setTypeName: string;
    orderNote: string;
    mainStoneNote: string;
    assistanceStoneNote: string;
    priority: string;
    orderStatus: string;

    // 보조석 관련 필드
    assistantStone: boolean;
    assistantStoneId: string;
    assistantStoneName: string;
    assistantStoneCreateAt: string | null; 

    // 스톤 관련
    stoneInfos: StoneInfo[];
    stoneAddLaborCost: string; 
}

export interface OrderRequestDetail {
	storeId: string;
	orderNote: string;
	factoryId: string;
	productId: string;
	productSize: string;
	isProductWeightSale: boolean;
	productLaborCost: number;
	productAddLaborCost: number;
	materialId: string;
	colorId: string;
	priorityName: string;
	stoneWeight: number;
	mainStoneNote: string;
	assistanceStoneNote: string;
	assistantStone: boolean;
	assistantStoneId: string;
	assistantStoneName: string | null;
	assistantStoneCreateAt: string | null;
	createAt: string;
	shippingAt: string;
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
	productId: string;
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

// 주문 생성 요청 데이터 (백엔드 JSON 구조와 정확히 일치)
export interface OrderCreateRequest {
	storeId: string;
	storeName: string;
	storeGrade: string;
	storeHarry: string;
	orderNote: string;
	factoryId: string;
	factoryName: string;
	factoryHarry: string;
	productId: string;
	productName: string;
	productFactoryName: string;
	productSize: string;
	isProductWeightSale: boolean;
	productAddLaborCost: number;
	colorId: string;
	colorName: string;
	materialId: string;
	materialName: string;
	setTypeId: string;
	setTypeName: string;
	classificationId: string;
	classificationName: string;
	priorityName: string;
	stoneWeight: number;
	mainStoneNote: string;
	assistanceStoneNote: string;
	assistantStone: boolean;
	assistantStoneId: string;
	assistantStoneCreateAt: string;
	createAt: string;
	shippingAt: string;
	stoneInfos: StoneInfo[];
	stoneAddLaborCost: number;
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
	storeHarry?: string;
	storeGrade: string;
	productId: string;
	productName: string;
	productFactoryName: string;
	classificationId: string;
	classificationName: string;
	setTypeId: string;
	setTypeName: string;
	materialId: string;
	materialName: string;
	colorId: string;
	colorName: string;
	factoryId: string;
	factoryName: string;
	factoryHarry?: string;
	productSize: string;
	stoneWeight: number;
	isProductWeightSale: boolean;
	priorityName: string;
	mainStoneNote: string;
	assistanceStoneNote: string;
	orderNote: string;
	stoneInfos: StoneInfo[];
	productLaborCost: number; // 기본 판매단가
	productAddLaborCost: number; // 추가 판매단가
	mainStonePrice: number | ""; // 중심 판매단가
	assistanceStonePrice: number | ""; // 보조 판매단가
	mainStoneCount: number | ""; // 메인 개당알수
	assistanceStoneCount: number | ""; // 보조 개당알수
	stoneAddLaborCost: number | ""; // 추가 스톤 판매단가
	stoneWeightTotal: number | ""; // 알중량
	createAt: string; // 생성일
	shippingAt: string; // 출고일

	// 보조석 관련 필드
	assistantStoneId: string | "1"; // 기본값 설정
	assistantStone: boolean; // 입고여부 (Y/N)
	assistantStoneName: string; // 보조석 아이디 (없음, 랩, 천연, 모이사, 유색석)
	assistantStoneCreateAt: string; // 입고날짜

	// 재고 상태 필드 추가
	currentStatus?: string; // ORDER, STOCK, SHIPPED 등
}

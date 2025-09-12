import type { PageInfo } from "./page";

export interface OrderSearchResponse {
    content: OrderDto[];
    page: PageInfo;
}

export interface OrderDto {
    orderDate: string;
    orderExpectDate: string;
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
    isMainStone: boolean;
    isIncludeStone: boolean;
}

// 주문 생성 요청 데이터 (백엔드 JSON 구조와 정확히 일치)
export interface OrderCreateRequest {
    storeId: string;
    orderNote: string;
    factoryId: string;
    productId: string;
    productSize: string;
    productAddLaborCost: number;
    isProductWeightSale: boolean;
    productWeight: number;
    stoneWeight: number;
    materialId: string;
    classificationId: string;
    colorId: string;
    setType: string;
    priorityName: string;
    mainStoneNote: string;
    assistanceStoneNote: string;
    productStatus: string;
    createAt: string;
    stoneInfos: StoneInfo[];
}

// 단일 주문 행 데이터 (UI용)
export interface OrderRowData {
    id: string;
    storeId: string;
    storeName: string;
    productId: string;
    productName: string;
    productImage: string;
    materialId: string;
    materialName: string;
    colorId: string;
    colorName: string;
    classificationId: string;
    classificationName: string;
    setType: string;
    factoryId: string;
    factoryName: string;
    productSize: string;
    productWeight: number;
    stoneWeight: number;
    productAddLaborCost: number;
    isProductWeightSale: boolean;
    priorityName: string;
    mainStoneNote: string;
    assistanceStoneNote: string;
    orderNote: string;
    stoneInfos: StoneInfo[];
    basicPrice: number;         // 기본 판매단가
    additionalPrice: number;    // 추가 판매단가
    centerPrice: number;        // 중심 판매단가
    assistancePrice: number;    // 보조 판매단가
    mainStoneCount: number;     // 메인 개당알수
    assistanceStoneCount: number; // 보조 개당알수
    stoneWeightTotal: number;   // 알중량
    deliveryDate: string;       // 출고일
}

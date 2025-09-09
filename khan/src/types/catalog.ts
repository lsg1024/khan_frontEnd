import type { PageInfo } from "./page";

// 상품 데이터 타입 정의
export interface StoneWorkGradePolicy {
    workGradePolicyId: string;
    grade: string;
    laborCost: number;
}

export interface ProductStone {
    productStoneId: string;
    stoneId: string;
    stoneName: string;
    productStoneMain: boolean;
    includeQuantity: boolean;
    includeWeight: boolean;
    includeLabor: boolean;
    stoneQuantity: number;
    stoneWorkGradePolicyDtos: StoneWorkGradePolicy[];
}

export interface ProductDto {
    productId: string;
    productName: string;
    productWeight: string;
    productMaterial: string;
    productNote: string;
    productPurchaseCost: string;
    productLaborCost: string;
    productImagePath: string | null;
    productStones: ProductStone[];
}

export interface ProductSearchResponse {
    content: ProductDto[];
    page: PageInfo;
}
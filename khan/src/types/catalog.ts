import type { PageInfo } from "./page";

// 상품 데이터 타입 정의
export interface ProductStone {
	productStoneId: string;
	stoneId: string;
	stoneName: string;
	stoneQuantity: number;
	laborCost: number;
	purchasePrice: number;
	mainStone: boolean;
	includeStone: boolean;
}

export interface ProductDto {
	productId: string;
	productName: string;
	productWeight: string;
	productMaterial: string;
	factoryId: string;
	factoryName: string;
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

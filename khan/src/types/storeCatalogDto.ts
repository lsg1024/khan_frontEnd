// 판매처(STORE) 전용 카탈로그 DTO
// 가격 정보가 제외된 상품 정보

// 스톤 정보 (가격 제외)
export interface StoreCatalogStoneDto {
	productStoneId: string;
	stoneId: string;
	stoneName: string;
	stoneQuantity: number;
	mainStone: boolean;
	includeStone: boolean;
}

// 카탈로그 상품 목록용 (가격 제외)
export interface StoreCatalogProductDto {
	productId: string;
	productName: string;
	productFactoryName: string;
	factoryId: number;
	factoryName: string;
	productWeight: string;
	productMaterial: string;
	productColor: string;
	productNote: string;
	image: {
		imageId: string;
		imagePath: string;
	} | null;
	productStones: StoreCatalogStoneDto[];
}

// 스톤 상세 (가격 제외)
export interface StoreCatalogStoneDetailDto {
	productStoneId: string;
	stoneId: string;
	stoneName: string;
	stoneWeight: string;
	mainStone: boolean;
	includeStone: boolean;
	stoneQuantity: number;
	productStoneNote: string;
}

// 상품 상세 (가격 제외)
export interface StoreCatalogProductDetailDto {
	productId: string;
	productName: string;
	productFactoryName: string;
	factoryId: number;
	factoryName: string;
	standardWeight: string;
	productRelatedNumber: string;
	productNote: string;
	setTypeDto: {
		setTypeId: string;
		setTypeName: string;
		setTypeNote?: string;
	};
	classificationDto: {
		classificationId: string;
		classificationName: string;
		classificationNote?: string;
	};
	materialDto: {
		materialId: string;
		materialName: string;
		materialGoldPurityPercent: string;
	};
	productStoneDtos: StoreCatalogStoneDetailDto[];
	productImageDtos: {
		imageId: string;
		imagePath: string;
		imageName?: string;
		imageOriginName?: string;
		imageMain: boolean;
	}[];
}

// 관련 상품
export interface StoreCatalogRelatedProductDto {
	productId: number;
	productName: string;
	imagePath: string | null;
}

// 검색 응답
export interface StoreCatalogSearchResponse {
	content: StoreCatalogProductDto[];
	page: {
		size: number;
		number: number;
		totalElements: number;
		totalPages: number;
	};
}

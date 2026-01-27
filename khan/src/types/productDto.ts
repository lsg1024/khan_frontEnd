import type { SetTypeDto } from "./setTypeDto";
import type { ClassificationDto } from "./classificationDto";
import type { MaterialDto } from "./materialDto";
import type { ProductStoneDto } from "./stoneDto";
import type { ProductWorkGradePolicyGroupDto } from "./priceDto";
import type { PageInfo } from "./pageDto";

// 통합된 Product 타입 (편집과 원본 통합)
export interface ProductData {
	productId: string;
	productName: string;
	productFactoryName: string;
	standardWeight: string;
	productRelatedNumber: string;
	productNote: string;
	factoryId: number;
	factoryName: string;
	setTypeDto: SetTypeDto;
	classificationDto: ClassificationDto;
	materialDto: MaterialDto;
	productImageDtos?: { imageId: string; imagePath: string }[];
}

// 간소화된 BasicInfo Props
export interface ProductInfo {
	product: ProductData;
	showTitle?: boolean;
	editable?: boolean;
	imageFiles?: File[]; // 여러 이미지 지원
	onProductChange?: (updatedProduct: Partial<ProductData>) => void;
	onFactorySelect?: (factoryId: number, factoryName: string) => void;
	onImageAdd?: (file: File) => void; // 이미지 추가
	onImageRemove?: (index: number) => void; // 로컬 이미지 삭제 (인덱스 기반)
	onServerImageRemove?: (imageId: string) => void; // 서버 이미지 삭제
	validationErrors?: Record<string, string>;
	maxImages?: number; // 최대 이미지 개수 (기본값: 5)
}

export interface Product extends ProductData {
	productWorkGradePolicyGroupDto: ProductWorkGradePolicyGroupDto[];
	productStoneDtos: ProductStoneDto[];
	productImageDtos: { imageId: string; imagePath: string }[];
}

/** 서버에 전달할 생성 요청 DTO */
export interface CreateProductRequest {
	factoryId?: number; // 값이 없으면 undefined (JSON 직렬화 시 필드 생략)
	productFactoryName: string;
	productName: string;
	setType: string;
	classification: string;
	material: string;
	standardWeight: string; // 서버가 문자열로 받는 형태 유지
	productRelatedNumber: string;
	productNote: string;

	productWorkGradePolicyGroupDto: Array<{
		productGroupId: string;
		productPurchasePrice: number;
		colorId: string;
		policyDtos: Array<{
			grade: string;
			laborCost: number;
		}>;
		note: string;
	}>;

	productStoneDtos: Array<{
		stoneId: string;
		mainStone: boolean;
		includeStone: boolean;
		stoneQuantity: number;
		productStoneNote: string;
	}>;
}

export interface UpdateProductRequest {
	factoryId?: number; // 값이 없으면 undefined (JSON 직렬화 시 필드 생략)
	productFactoryName: string;
	productName: string;
	setType: string;
	classification: string;
	material: string;
	standardWeight: string; // 서버가 문자열로 받는 형태 유지
	productRelatedNumber: string;
	productNote: string;

	productWorkGradePolicyGroupDto: Array<{
		productGroupId: string;
		productPurchasePrice: number;
		colorId: string;
		policyDtos: Array<{
			workGradePolicyId: string;
			laborCost: number;
		}>;
		note: string;
	}>;

	productStoneDtos: Array<{
		stoneId: string;
		mainStone: boolean;
		includeStone: boolean;
		stoneQuantity: number;
		productStoneNote: string;
	}>;
}

export interface ProductSearchResponse {
	content: ProductDto[];
	page: PageInfo;
}

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
	productFactoryName: string;
	productWeight: string;
	productMaterial: string;
	factoryId: number;
	factoryName: string;
	productColor: string;
	productNote: string;
	productPurchaseCost: string;
	productLaborCost: string;
	productGoldPrice?: number;
	image: {
		imageId: string;
		imagePath: string;
	} | null;
	productStones: ProductStone[];
}

// 상품 이미지 응답 DTO (다중 이미지 지원)
export interface ProductImageDto {
	imageId: string;
	imageName: string;
	imageOriginName: string;
	imagePath: string;
	imageMain: boolean;
}

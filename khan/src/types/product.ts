import type { SetTypeDto } from "./setType";
import type { ClassificationDto } from "./classification";
import type { MaterialDto } from "./material";
import type { ProductStoneDto } from "./stone";
import type { ProductWorkGradePolicyGroupDto } from "./price";
import type { PageInfo } from "./page";

// 통합된 Product 타입 (편집과 원본 통합)
export interface ProductData {
	productId: string;
	productName: string;
	productFactoryName: string;
	standardWeight: string;
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
	onProductChange?: (updatedProduct: Partial<ProductData>) => void;
	onFactorySelect?: (factoryId: number, factoryName: string) => void;
	onImageChange?: (file: File | null) => void;
	validationErrors?: Record<string, string>;
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
	image: {
		imageId: string;
		imagePath: string;
	} | null;
	productStones: ProductStone[];
}

import type { SetTypeDto } from "./setType";
import type { ClassificationDto } from "./classification";
import type { MaterialDto } from "./material";
import type { ProductStoneDto } from "./stone";
import type { ProductWorkGradePolicyGroupDto } from "./price";

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
}

// 간소화된 BasicInfo Props
export interface ProductInfo {
    product: ProductData;
    showTitle?: boolean;
    editable?: boolean;
    onProductChange?: (updatedProduct: Partial<ProductData>) => void;
    onFactorySelect?: (factoryId: number, factoryName: string) => void;
    validationErrors?: Record<string, string>;
}

export interface Product extends ProductData {
    productWorkGradePolicyGroupDto: ProductWorkGradePolicyGroupDto[];
    productStoneDtos: ProductStoneDto[];
    productImageDtos: { imagePath: string }[];
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
        isMainStone: boolean;
        isIncludeStone: boolean;
        stoneQuantity: number;
        productStoneNote: string;
    }>;
}

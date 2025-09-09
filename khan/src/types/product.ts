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

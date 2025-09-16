// 가격 관련 타입 정의
export interface GradePolicyDto {
    workGradePolicyId: string;
    grade: string;
    laborCost: number;
    note: string;
    groupId: number;
}

export interface ProductWorkGradePolicyGroupDto {
    productGroupId: string;
    productPurchasePrice: number;
    colorId: string;
    colorName: string;
    gradePolicyDtos: GradePolicyDto[];
    note: string;
}

export interface PriceTableProps {
    priceGroups: ProductWorkGradePolicyGroupDto[];
    showTitle?: boolean;
    editable?: boolean;
    onPriceGroupChange?: (updatedGroups: ProductWorkGradePolicyGroupDto[]) => void;
    validationErrors?: Record<string, string>;
}
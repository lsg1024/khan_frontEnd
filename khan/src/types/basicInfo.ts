// 기본 정보 관련 타입 정의
export interface SetTypeDto {
    setTypeId: string;
    setTypeName: string;
    setTypeNote: string;
}

export interface ClassificationDto {
    classificationId: string;
    classificationName: string;
    classificationNote: string;
}

export interface MaterialDto {
    materialId: string;
    materialName: string;
    materialGoldPurityPercent: string;
}

export interface BasicInfoProps {
    productId: string;
    factoryId: number;
    factoryName: string;
    productName: string;
    productFactoryName: string;
    standardWeight: string;
    productNote: string;
    setTypeDto: SetTypeDto;
    classificationDto: ClassificationDto;
    materialDto: MaterialDto;
    showTitle?: boolean;
    editable?: boolean;
    editedNote?: string;
    onNoteChange?: (value: string) => void;

    // 편집 모드를 위한 새로운 props
    editedProductName?: string;
    editedProductFactoryName?: string;
    editedStandardWeight?: string;
    editedMaterialId?: string;
    editedClassificationId?: string;
    editedSetTypeId?: string;
    editedFactoryId?: number;
    editedFactoryName?: string;
    onProductNameChange?: (value: string) => void;
    onProductFactoryNameChange?: (value: string) => void;
    onStandardWeightChange?: (value: string) => void;
    onMaterialChange?: (value: string) => void;
    onClassificationChange?: (value: string) => void;
    onSetTypeChange?: (value: string) => void;
    onFactoryChange?: (value: string) => void;
    onFactorySelect?: (factoryId: number, factoryName: string) => void;
}

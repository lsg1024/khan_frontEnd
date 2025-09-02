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
  colorName: string;
  gradePolicyDtos: GradePolicyDto[];
  note: string;
}

export interface PriceTableProps {
  priceGroups: ProductWorkGradePolicyGroupDto[];
  showTitle?: boolean;
  editable?: boolean;
  editedPurchasePrices?: { [key: string]: string };
  editedLaborCosts?: { [key: string]: string };
  editedColors?: { [key: string]: string };
  editedNotes?: { [key: string]: string };
  onColorChange?: (groupId: string, newColor: string) => void;
  onPurchasePriceChange?: (groupId: string, value: string) => void;
  onLaborCostChange?: (workGradePolicyId: string, value: string) => void;
  onNoteChange?: (groupId: string, value: string) => void;
}

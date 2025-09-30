export interface StoneWorkGradePolicyCreateDto {
	grade: string;
	laborCost: number;
}

export interface StoneCreateRequest {
	stoneName: string;
	stoneNote?: string | null;
	stoneWeight?: string | null;
	stonePurchasePrice?: number | null;
	stoneWorkGradePolicyDto: StoneWorkGradePolicyCreateDto[];
}

// 스톤 관련 타입 정의
export interface StoneWorkGradePolicyDto {
	workGradePolicyId: string;
	grade: string;
	laborCost: number;
}

// 스톤 검색 API 응답 타입
export interface StoneSearchDto {
	stoneId: string;
	stoneName: string;
	stoneNote: string;
	stoneWeight: string;
	stonePurchasePrice: number;
	stoneWorkGradePolicyDto: StoneWorkGradePolicyDto[];
}

// 페이지네이션 정보
export interface PageInfo {
	size: number;
	number: number;
	totalElements: number;
	totalPages: number;
}

// 스톤 검색 API 응답
export interface StoneSearchResponse {
	content: StoneSearchDto[];
	page: PageInfo;
}

export interface ProductStoneDto {
	productStoneId: string;
	stoneId: string;
	stoneName: string;
	stoneWeight: string;
	mainStone: boolean;
	includeStone: boolean;
	stonePurchase: number;
	stoneQuantity: number;
	productStoneNote: string;
	stoneWorkGradePolicyDtos: StoneWorkGradePolicyDto[];
}

// 필드별 편집 권한 타입
export interface StoneFieldPermissions {
	stoneName?: boolean;
	stoneWeight?: boolean;
	stonePurchase?: boolean;
	grades?: boolean;
	mainStone?: boolean;
	includeStone?: boolean;
	stoneQuantity?: boolean;
	note?: boolean;
}

// 스톤 테이블 컴포넌트의 Props 타입
export interface StoneTableProps {
	stones: ProductStoneDto[];
	showTitle?: boolean;
	showTotalRow?: boolean;
	showManualTotalRow?: boolean;
	editable?: boolean;
	showAddButton?: boolean; // 추가 버튼 표시 여부
	fieldPermissions?: StoneFieldPermissions; // 필드별 편집 권한
	onStoneChange?: (
		stoneId: string,
		field: string,
		value: string | number | boolean
	) => void;
	onSearchStone?: (stoneId: string) => void;
	onAddStone?: () => void; // 스톤 추가 콜백
	onDeleteStone?: (stoneId: string) => void; // 스톤 삭제 콜백
}

// 스톤 테이블 편집 상태 타입
export interface StoneEditState {
	[stoneId: string]: {
		mainStone?: boolean;
		includeStone?: boolean;
		stoneQuantity?: number;
		stoneWeight?: string;
		stonePurchase?: number;
		grades?: {
			[gradeId: string]: number;
		};
		note?: string;
	};
}

export interface StoneInfo {
	stoneId: string;
	stoneName: string;
	stoneWeight: string;
	purchaseCost: string;
	laborCost: number;
	quantity: number;
	mainStone: boolean;
	includeStone: boolean;
	grade?: string; // 스톤 등급
}
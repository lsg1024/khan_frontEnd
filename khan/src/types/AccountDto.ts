export interface AccountSingleResponse {
	accountId: string;
	accountName: string;
	accountOwnerName: string;
	accountPhoneNumber: string;
	accountContactNumber1: string;
	accountContactNumber2: string;
	accountFaxNumber: string;
	accountNote: string;
	addressId: string;
	addressZipCode: string;
	addressBasic: string;
	addressAdd: string;
	commonOptionId: string;
	tradeType: string;
	level: string;
	goldHarryId: string;
	goldHarryLoss: string;
	// 거래처 전용 추가 필드 (제조사는 null/undefined)
	additionalOptionId?: string;
	additionalApplyPastSales?: boolean;
	additionalMaterialId?: string;
	additionalMaterialName?: string;
}

// 기본 정보 인터페이스 (Store/Factory 공통)
export interface AccountInfo {
	accountName: string;
	accountOwnerName: string;
	accountPhoneNumber?: string;
	accountContactNumber1?: string;
	accountContactNumber2?: string;
	accountFaxNumber?: string;
	accountNote?: string;
}

// 공통 옵션 정보
export interface CommonOptionInfo {
	tradeType?: string;
	level?: string;
	goldHarryId?: string;
}

// 추가 옵션 정보 (Store 전용)
export interface AdditionalOptionInfo {
	additionalApplyPastSales?: boolean;
	additionalMaterialId?: string;
	additionalMaterialName?: string;
}

// 주소 정보
export interface AddressInfo {
	addressZipCode?: string;
	addressBasic?: string;
	addressAdd?: string;
}

// Store 생성 요청
export interface StoreCreateRequest {
	accountInfo: AccountInfo;
	commonOptionInfo: CommonOptionInfo;
	additionalOptionInfo?: AdditionalOptionInfo;
	addressInfo?: AddressInfo;
}

// Store 수정 요청
export interface StoreUpdateRequest {
	accountInfo: Partial<AccountInfo>;
	commonOptionInfo: CommonOptionInfo;
	additionalOptionInfo?: AdditionalOptionInfo;
	addressInfo?: AddressInfo;
}

// Factory 생성 요청
export interface FactoryCreateRequest {
	accountInfo: AccountInfo;
	commonOptionInfo: CommonOptionInfo;
	addressInfo?: AddressInfo;
}

// Factory 수정 요청
export interface FactoryUpdateRequest {
	accountInfo: Partial<AccountInfo>;
	commonOptionInfo: CommonOptionInfo;
	addressInfo?: AddressInfo;
}

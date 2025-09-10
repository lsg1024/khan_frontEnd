import type { PageInfo } from "./page";

export interface StoreSearchDto {
    storeId?: number;
    storeName: string;
    storeOwnerName: string;
    storePhoneNumber: string;
    storeContactNumber1: string;
    storeContactNumber2: string;
    storeFaxNumber: string;
    storeNote: string;
    address: string;
    tradeType: "WEIGHT" | "PIECE";
    level: "ONE" | "TWO" | "THREE" | "FOUR";
    goldHarryLoss: string;
}


// 공장 검색 API 응답
export interface StoreSearchResponse {
    content: StoreSearchDto[];
    page: PageInfo;
}
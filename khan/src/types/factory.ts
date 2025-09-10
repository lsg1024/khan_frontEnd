import type { PageInfo } from "./page";

export interface FactorySearchDto {
    factoryId?: number;
    factoryName: string;
    factoryOwnerName: string;
    factoryPhoneNumber: string;
    factoryContactNumber1: string;
    factoryContactNumber2: string;
    factoryFaxNumber: string;
    factoryNote: string;
    address: string;
    tradeType: "WEIGHT" | "PIECE";
    level: "ONE" | "TWO" | "THREE" | "FOUR";
    goldHarryLoss: string;
}

// 공장 검색 API 응답
export interface FactorySearchResponse {
    content: FactorySearchDto[];
    page: PageInfo;
}
import type { PageInfo } from "./page";

export interface OrderSearchResponse {
    content: OrderDto[];
    page: PageInfo;
}

export interface OrderDto {
    orderDate: string;
    orderExpectDate: string;
    flowCode: string;
    storeName: string;
    productName: string;
    materialName: string;
    colorName: string;
    setType: string;
    productSize: string;
    productWeight: string;
    stockQuantity: number;
    orderMainStoneNote: string;
    orderAssistanceStoneNote: string;
    stockFlowCodes: string[];
    orderNote: string;
    factoryName: string;
    priority: string;
    productStatus: string;
    orderStatus: string;
}

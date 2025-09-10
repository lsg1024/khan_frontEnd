// libs/api/product.ts
import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { ProductSearchResponse } from "../../src/types/catalog";

import type { Product, CreateProductRequest } from "../../src/types/product";

export const productApi = {
    // 상품 카테고리 목록 조회 (페이징 및 검색 옵션 지원)
    getProductCategories: async (
        name?: string, 
        factory?: string,
        classification?: string,
        setType?: string,
        page: number = 1
    ): Promise<ApiResponse<ProductSearchResponse>> => {
        const params: Record<string, string> = { page: page.toString() };
        
        if (name) params.name = name;
        if (factory) params.factory = factory;
        if (classification) params.classification = classification;
        if (setType) params.setType = setType;

        return apiRequest.get<ProductSearchResponse>("product/products", { params });
    },

    // 상품 목록 조회 (페이징 및 검색 옵션 지원)
    getProducts: async (
        name?: string, 
        factory?: string,
        classification?: string,
        setType?: string,
        page: number = 1
    ): Promise<ApiResponse<ProductSearchResponse>> => {
        const params: Record<string, string> = { page: page.toString() };
        
        if (name) params.name = name;
        if (factory) params.factory = factory;
        if (classification) params.classification = classification;
        if (setType) params.setType = setType;

        return apiRequest.get<ProductSearchResponse>("product/products", { params });
    },

    // 상품 상세 조회
    getProduct: async (productId: string): Promise<ApiResponse<Product>> => {
        return apiRequest.get<Product>(`product/products/${productId}`);
    },

    // 상품 생성
    createProduct: async (data: CreateProductRequest): Promise<ApiResponse<CreateProductRequest>> => {
        return apiRequest.post<CreateProductRequest>("product/products", data);
    },

    // 상품 수정
    updateProduct: async (productId: string, data: CreateProductRequest): Promise<ApiResponse<CreateProductRequest>> => {
        return apiRequest.patch<CreateProductRequest>(`product/products/${productId}`, data);
    },

    // 상품 삭제
    deleteProduct: async (productId: string): Promise<ApiResponse<void>> => {
        return apiRequest.delete(`product/products/${productId}`);
    }
};

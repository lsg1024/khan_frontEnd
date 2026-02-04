import { apiRequest, api } from "./config";
import type { ApiResponse } from "./config";
import type { AxiosResponse } from "axios";
import type {
	StoreCatalogSearchResponse,
	StoreCatalogProductDetailDto,
	StoreCatalogRelatedProductDto,
} from "../../src/types/storeCatalogDto";

export const catalogApi = {
	getProducts: async (
		name?: string,
		factory?: string,
		classification?: string,
		setType?: string,
		relatedNumber?: string,
		material?: string,
		page: number = 1,
		size: number = 12,
		sortField?: string,
		sort?: string
	): Promise<ApiResponse<StoreCatalogSearchResponse>> => {
		const params: Record<string, string | number> = {
			page: page,
			size: size,
		};

		if (name) params.name = name;
		if (factory) params.factory = factory;
		if (classification) params.classification = classification;
		if (setType) params.setType = setType;
		if (relatedNumber) params.relatedNumber = relatedNumber;
		if (material) params.material = material;
		if (sortField) params.sortField = sortField;
		if (sort) params.sort = sort;

		return apiRequest.get<StoreCatalogSearchResponse>("catalog/products", {
			params,
		});
	},

	// 카탈로그 상품 상세 조회
	getProduct: async (
		productId: string
	): Promise<ApiResponse<StoreCatalogProductDetailDto>> => {
		return apiRequest.get<StoreCatalogProductDetailDto>(
			`catalog/products/${productId}`
		);
	},

	// 관련 상품 조회
	getRelatedProducts: async (
		productId: string,
		relatedNumber?: string
	): Promise<ApiResponse<StoreCatalogRelatedProductDto[]>> => {
		const params: Record<string, string> = {};
		if (relatedNumber) params.relatedNumber = relatedNumber;

		return apiRequest.get<StoreCatalogRelatedProductDto[]>(
			`catalog/products/${productId}/related`,
			{ params }
		);
	},

	// 상품 이미지 로드 (Blob 반환)
	getProductImageByPath: async (imagePath: string): Promise<Blob> => {
		const response = await api.get(`catalog/products/images${imagePath}`, {
			responseType: "blob",
		});
		return response.data as Blob;
	},

	downloadExcel: async (
		name?: string,
		classification?: string,
		setType?: string
	): Promise<AxiosResponse<Blob>> => {
		const params: Record<string, string> = {};
		if (name) params.name = name;
		if (classification) params.classification = classification;
		if (setType) params.setType = setType;

		return api.get("catalog/products/excel", {
			params,
			responseType: "blob",
		});
	},
};

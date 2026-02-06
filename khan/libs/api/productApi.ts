// libs/api/product.ts
import { apiRequest, api } from "./config";
import type { ApiResponse } from "./config";
import type { ProductSearchResponse } from "../../src/types/productDto";
import type {
	Product,
	CreateProductRequest,
	UpdateProductRequest,
	ProductImageDto,
} from "../../src/types/productDto";

export interface ProductSearchParams {
	search?: string; // 검색 값 (텍스트/ID 검색 시 사용)
	searchField?: string; // 검색 필드
	searchMin?: string; // 범위 검색 최소값
	searchMax?: string; // 범위 검색 최대값
	sortField?: string; // 정렬 필드 (factory, setType, classification, productName)
	sortOrder?: string; // 정렬 방향 (ASC, DESC)
	grade?: string; // 등급 (1~4)
	page?: number; // 페이지 번호
	size?: number; // 페이지 크기
	setType?: string; // 세트타입 필터
	classification?: string; // 분류 필터
	factory?: string; // 제조사 필터
}

export const productApi = {
	getProducts: async (
		params: ProductSearchParams = {},
	): Promise<ApiResponse<ProductSearchResponse>> => {
		const queryParams: Record<string, string | number> = {
			page: params.page || 1,
		};

		if (params.search) queryParams.search = params.search;
		if (params.searchField) queryParams.searchField = params.searchField;
		if (params.searchMin) queryParams.searchMin = params.searchMin;
		if (params.searchMax) queryParams.searchMax = params.searchMax;
		if (params.sortField) queryParams.sortField = params.sortField;
		if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
		if (params.grade) queryParams.grade = params.grade;
		if (params.size) queryParams.size = params.size;

		return apiRequest.get<ProductSearchResponse>("product/products", {
			params: queryParams,
		});
	},

	// 상품 상세 조회
	getProduct: async (productId: string): Promise<ApiResponse<Product>> => {
		return apiRequest.get<Product>(`product/products/${productId}`);
	},

	// 상품 생성
	createProduct: async (
		data: CreateProductRequest,
	): Promise<ApiResponse<CreateProductRequest>> => {
		return apiRequest.post<CreateProductRequest>("product/products", data);
	},

	// 상품 수정
	updateProduct: async (
		productId: string,
		data: UpdateProductRequest,
	): Promise<ApiResponse<UpdateProductRequest>> => {
		return apiRequest.patch<UpdateProductRequest>(
			`product/products/${productId}`,
			data,
		);
	},

	// 상품 삭제
	deleteProduct: async (productId: string): Promise<ApiResponse<void>> => {
		return apiRequest.delete(`product/products/${productId}`);
	},

	// 상품 이미지 업로드 (상품당 1개, 기존 이미지 자동 대체) - 단일 이미지 (레거시)
	uploadProductImage: async (
		productId: string,
		imageFile: File,
	): Promise<ApiResponse<string>> => {
		const formData = new FormData();
		formData.append("image", imageFile);

		return apiRequest.post<string>(
			`product/products/${productId}/image`,
			formData,
		);
	},

	// 상품 다중 이미지 업로드 (기존 이미지 유지하면서 추가)
	uploadProductImages: async (
		productId: string,
		imageFiles: File[],
	): Promise<ApiResponse<ProductImageDto[]>> => {
		const formData = new FormData();
		imageFiles.forEach((file) => {
			formData.append("images", file);
		});

		return apiRequest.post<ProductImageDto[]>(
			`product/products/${productId}/images`,
			formData,
		);
	},

	// 특정 상품의 모든 이미지 조회
	getProductImagesByProductId: async (
		productId: string,
	): Promise<ApiResponse<ProductImageDto[]>> => {
		return apiRequest.get<ProductImageDto[]>(
			`product/products/${productId}/images`,
		);
	},

	// 상품 이미지 조회 (여러 상품 ID로 조회)
	getProductImages: async (
		productIds: number[],
	): Promise<
		ApiResponse<
			Record<number, { images: Array<{ imageId: number; imageUrl: string }> }>
		>
	> => {
		return apiRequest.get(`product/api/products/images`, {
			params: { ids: productIds.join(",") },
		});
	},

	getProductImageByPath: async (imagePath: string): Promise<Blob> => {
		const response = await api.get(`product/products/images${imagePath}`, {
			responseType: "blob",
		});
		return response.data as Blob;
	},

	// 이미지 삭제
	deleteProductImage: async (imageId: string): Promise<ApiResponse<string>> => {
		return apiRequest.delete<string>(`product/products/images/${imageId}`);
	},

	// 관련번호로 묶인 상품 목록 조회
	getRelatedProducts: async (
		productId: string,
	): Promise<
		ApiResponse<
			Array<{
				productId: number;
				productName: string;
				imagePath: string | null;
			}>
		>
	> => {
		return apiRequest.get(`product/products/${productId}/related`);
	},
};

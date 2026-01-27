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

export const productApi = {
	// 상품 목록 조회 (페이징 및 검색 옵션 지원)
	getProducts: async (
		name?: string,
		factory?: string,
		classification?: string,
		setType?: string,
		page: number = 1,
		size?: number,
		sortField?: string,
		sort?: string,
		grade?: string
	): Promise<ApiResponse<ProductSearchResponse>> => {
		const params: Record<string, string | number> = { page: page.toString() };

		if (name) params.name = name;
		if (factory) params.factory = factory;
		if (classification) params.classification = classification;
		if (setType) params.setType = setType;
		if (size) params.size = size;
		if (sortField) params.sortField = sortField;
		if (sort) params.sort = sort;
		if (grade) params.grade = grade;

		return apiRequest.get<ProductSearchResponse>("product/products", {
			params,
		});
	},

	// 상품 상세 조회
	getProduct: async (productId: string): Promise<ApiResponse<Product>> => {
		return apiRequest.get<Product>(`product/products/${productId}`);
	},

	// 상품 생성
	createProduct: async (
		data: CreateProductRequest
	): Promise<ApiResponse<CreateProductRequest>> => {
		return apiRequest.post<CreateProductRequest>("product/products", data);
	},

	// 상품 수정
	updateProduct: async (
		productId: string,
		data: UpdateProductRequest
	): Promise<ApiResponse<UpdateProductRequest>> => {
		return apiRequest.patch<UpdateProductRequest>(
			`product/products/${productId}`,
			data
		);
	},

	// 상품 삭제
	deleteProduct: async (productId: string): Promise<ApiResponse<void>> => {
		return apiRequest.delete(`product/products/${productId}`);
	},

	// 상품 이미지 업로드 (상품당 1개, 기존 이미지 자동 대체) - 단일 이미지 (레거시)
	uploadProductImage: async (
		productId: string,
		imageFile: File
	): Promise<ApiResponse<string>> => {
		const formData = new FormData();
		formData.append("image", imageFile);

		return apiRequest.post<string>(
			`product/products/${productId}/image`,
			formData
		);
	},

	// 상품 다중 이미지 업로드 (기존 이미지 유지하면서 추가)
	uploadProductImages: async (
		productId: string,
		imageFiles: File[]
	): Promise<ApiResponse<ProductImageDto[]>> => {
		const formData = new FormData();
		imageFiles.forEach((file) => {
			formData.append("images", file);
		});

		return apiRequest.post<ProductImageDto[]>(
			`product/products/${productId}/images`,
			formData
		);
	},

	// 특정 상품의 모든 이미지 조회
	getProductImagesByProductId: async (
		productId: string
	): Promise<ApiResponse<ProductImageDto[]>> => {
		return apiRequest.get<ProductImageDto[]>(
			`product/products/${productId}/images`
		);
	},

	// 상품 이미지 조회 (여러 상품 ID로 조회)
	getProductImages: async (
		productIds: number[]
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
		productId: string
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

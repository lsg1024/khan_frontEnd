import { useState } from "react";
import { productApi } from "../../libs/api/productApi";
import { isApiSuccess } from "../../libs/api/config";

interface UseProductImageUploadProps {
	onSuccess?: () => void;
	onError?: (error: string) => void;
}

export const useProductImageUpload = ({
	onSuccess,
	onError,
}: UseProductImageUploadProps = {}) => {
	const [uploading, setUploading] = useState(false);

	// 단일 이미지 업로드 (레거시)
	const uploadImage = async (
		productId: string,
		imageFile: File
	): Promise<boolean> => {
		if (!imageFile || !productId) {
			onError?.("상품 ID 또는 이미지 파일이 없습니다.");
			return false;
		}

		setUploading(true);
		try {
			const uploadRes = await productApi.uploadProductImage(
				productId,
				imageFile
			);

			if (isApiSuccess(uploadRes)) {
				onSuccess?.();
				return true;
			} else {
				const errorMsg = uploadRes.message || "이미지 업로드에 실패했습니다.";
				console.error("이미지 업로드 실패:", errorMsg);
				onError?.(errorMsg);
				return false;
			}
		} catch (error) {
			console.error("이미지 업로드 에러:", error);
			const errorMsg = "이미지 업로드 중 오류가 발생했습니다.";
			onError?.(errorMsg);
			return false;
		} finally {
			setUploading(false);
		}
	};

	// 다중 이미지 업로드
	const uploadImages = async (
		productId: string,
		imageFiles: File[]
	): Promise<boolean> => {
		if (!imageFiles || imageFiles.length === 0 || !productId) {
			onError?.("상품 ID 또는 이미지 파일이 없습니다.");
			return false;
		}

		setUploading(true);
		try {
			const uploadRes = await productApi.uploadProductImages(
				productId,
				imageFiles
			);

			if (isApiSuccess(uploadRes)) {
				onSuccess?.();
				return true;
			} else {
				const errorMsg = uploadRes.message || "이미지 업로드에 실패했습니다.";
				console.error("이미지 업로드 실패:", errorMsg);
				onError?.(errorMsg);
				return false;
			}
		} catch (error) {
			console.error("이미지 업로드 에러:", error);
			const errorMsg = "이미지 업로드 중 오류가 발생했습니다.";
			onError?.(errorMsg);
			return false;
		} finally {
			setUploading(false);
		}
	};

	// 이미지 삭제
	const deleteImage = async (imageId: string): Promise<boolean> => {
		if (!imageId) {
			onError?.("이미지 ID가 없습니다.");
			return false;
		}

		try {
			const deleteRes = await productApi.deleteProductImage(imageId);

			if (isApiSuccess(deleteRes)) {
				onSuccess?.();
				return true;
			} else {
				const errorMsg = deleteRes.message || "이미지 삭제에 실패했습니다.";
				console.error("이미지 삭제 실패:", errorMsg);
				onError?.(errorMsg);
				return false;
			}
		} catch (error) {
			console.error("이미지 삭제 에러:", error);
			const errorMsg = "이미지 삭제 중 오류가 발생했습니다.";
			onError?.(errorMsg);
			return false;
		}
	};

	return {
		uploadImage,
		uploadImages,
		deleteImage,
		uploading,
	};
};

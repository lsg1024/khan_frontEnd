import { useState } from "react";
import { productApi } from "../../libs/api/product";
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

	return {
		uploadImage,
		uploading,
	};
};

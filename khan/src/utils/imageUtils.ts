/**
 * 이미지 관련 유틸리티 함수들
 */

import { tokenUtils } from "./tokenUtils";
import { productApi } from "../../libs/api/productApi";
import { useState, useEffect } from "react";

/**
 * 상품 이미지 경로를 전체 URL로 변환
 * @param imagePath - 서버에서 받은 이미지 경로 (예: "/products/1/image.jpg")
 * @returns 전체 이미지 URL (로컬 개발용)
 */
export const getImageUrl = (imagePath: string | null | undefined): string => {
	if (!imagePath) {
		return "/images/not_ready.png";
	}

	// 이미 전체 URL인 경우 (http:// 또는 https://로 시작)
	if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
		return imagePath;
	}

	// 로컬 개발 환경: 개발 서버를 통해 정적 파일 제공
	// imagePath가 /로 시작하면 그대로, 아니면 /를 붙임
	const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

	// 로컬 개발 서버에서 정적 파일로 제공 (/@fs/ 프리픽스 사용)
	const localBasePath =
		"C:/Users/zks14/Desktop/multi_module/product-service/src/main/resources";
	console.log("Local image path:", `${localBasePath}${path}`);
	return `${localBasePath}${path}`;
};

/**
 * accessToken을 포함하여 이미지를 fetch하고 blob URL을 반환하는 함수
 * productApi를 통해 이미지를 가져옴 (CataLogPage와 동일한 방식)
 * @param imagePath - 이미지 경로
 * @returns Promise<string> - 이미지 blob URL
 */
export const fetchImageWithAuth = async (
	imagePath: string | null | undefined
): Promise<string> => {
	if (!imagePath) {
		return "/images/not_ready.png";
	}

	try {
		// productApi를 통해 이미지 로드 (CataLogPage와 동일)
		const blob = await productApi.getProductImageByPath(imagePath);
		const blobUrl = URL.createObjectURL(blob);
		return blobUrl;
	} catch (error) {
		console.error("Failed to fetch image:", error);
		return "/images/not_ready.png";
	}
};

/**
 * accessToken을 포함하여 이미지를 가져오는 커스텀 훅
 * @param imagePath - 이미지 경로
 * @returns {src: string, loading: boolean, error: boolean}
 */
export const useAuthImage = (imagePath: string | null | undefined) => {
	const [src, setSrc] = useState<string>("/images/not_ready.png");
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<boolean>(false);

	useEffect(() => {
		let mounted = true;

		const loadImage = async () => {
			if (!imagePath) {
				setSrc("/images/not_ready.png");
				setLoading(false);
				setError(false);
				return;
			}

			setLoading(true);
			setError(false);

			try {
				const blobUrl = await fetchImageWithAuth(imagePath);
				if (mounted) {
					setSrc(blobUrl);
					setError(blobUrl === "/images/not_ready.png");
				}
			} catch (err) {
				console.error("Image loading error:", err);
				if (mounted) {
					setSrc("/images/not_ready.png");
					setError(true);
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		loadImage();

		return () => {
			mounted = false;
		};
	}, [imagePath]);

	// 컴포넌트 언마운트 시 blob URL 정리
	useEffect(() => {
		return () => {
			if (src.startsWith("blob:")) {
				URL.revokeObjectURL(src);
			}
		};
	}, [src]);

	return { src, loading, error };
};

/**
 * 이미지 로드 실패 시 기본 이미지로 대체하는 핸들러
 * @param event - 이미지 에러 이벤트
 */
export const handleImageError = (
	event: React.SyntheticEvent<HTMLImageElement, Event>
) => {
	event.currentTarget.src = "/images/not_ready.png";
};

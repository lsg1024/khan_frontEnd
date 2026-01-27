import React, { useState, useEffect, useCallback } from "react";
import type { ProductInfo, ProductData } from "../../../types/productDto";
import type { ClassificationDto } from "../../../types/classificationDto";
import type { MaterialDto } from "../../../types/materialDto";
import type { SetTypeDto } from "../../../types/setTypeDto";
import { classificationApi } from "../../../../libs/api/classificationApi";
import { materialApi } from "../../../../libs/api/materialApi";
import { setTypeApi } from "../../../../libs/api/setTypeApi";
import { productApi } from "../../../../libs/api/productApi";
import FactorySearch from "../factory/FactorySearch";
import ImageZoomModal from "../ImageZoomModal";
import "../../../styles/components/common/BasicInfo.css";
import { useErrorHandler } from "../../../utils/errorHandler";

// 이미지 미리보기 타입 정의
interface ImagePreviewItem {
	id: string;
	url: string;
	isLocal: boolean;
	localIndex?: number;
	serverId?: string;
}

// 기본값 상수 (참조 안정성 보장)
const EMPTY_IMAGE_FILES: File[] = [];
const EMPTY_VALIDATION_ERRORS: Record<string, string> = {};

const BasicInfo: React.FC<ProductInfo> = ({
	product,
	showTitle = true,
	editable = true,
	imageFiles = EMPTY_IMAGE_FILES,
	onProductChange,
	onFactorySelect,
	onImageAdd,
	onImageRemove,
	onServerImageRemove,
	validationErrors = EMPTY_VALIDATION_ERRORS,
	maxImages = 5,
}) => {
	const [classifications, setClassifications] = useState<ClassificationDto[]>(
		[],
	);
	const [materials, setMaterials] = useState<MaterialDto[]>([]);
	const [setTypes, setSetTypes] = useState<SetTypeDto[]>([]);
	const [loading, setLoading] = useState(false);

	const [materialsLoaded, setMaterialsLoaded] = useState(false);
	const [classificationsLoaded, setClassificationsLoaded] = useState(false);
	const [setTypesLoaded, setSetTypesLoaded] = useState(false);

	const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);

	const [imagePreviews, setImagePreviews] = useState<ImagePreviewItem[]>([]);
	const [imageLoading, setImageLoading] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
	const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

	const { handleError } = useErrorHandler();

	const handleFactorySelectInternal = (factory: {
		factoryId?: number;
		factoryName: string;
	}) => {
		const factoryId = factory.factoryId || 0;

		if (onProductChange) {
			onProductChange({
				factoryId,
				factoryName: factory.factoryName,
			});
		}

		if (onFactorySelect) {
			onFactorySelect(factoryId, factory.factoryName);
		}

		setIsFactoryModalOpen(false);
	};

	const handleFactorySearchClick = () => {
		setIsFactoryModalOpen(true);
	};

	// 이미지 로드 및 미리보기 처리
	useEffect(() => {
		let isMounted = true;
		const blobUrls: string[] = [];

		const loadImages = async () => {
			setImageLoading(true);
			setCurrentImageIndex(0); // 인덱스 초기화
			const previews: ImagePreviewItem[] = [];

			// 1. 로컬 파일들 미리보기 생성
			imageFiles.forEach((file, index) => {
				const objectUrl = URL.createObjectURL(file);
				blobUrls.push(objectUrl);
				previews.push({
					id: `local-${index}`,
					url: objectUrl,
					isLocal: true,
					localIndex: index,
				});
			});

			// 2. 서버 이미지 로드
			if (product.productImageDtos && product.productImageDtos.length > 0) {
				for (const serverImage of product.productImageDtos) {
					if (serverImage.imageId && serverImage.imagePath) {
						try {
							const blob = await productApi.getProductImageByPath(
								serverImage.imagePath,
							);
							const blobUrl = URL.createObjectURL(blob);
							blobUrls.push(blobUrl);
							previews.push({
								id: `server-${serverImage.imageId}`,
								url: blobUrl,
								isLocal: false,
								serverId: serverImage.imageId,
							});
						} catch {
							console.error("서버 이미지 로드 실패:", serverImage.imageId);
							// 이미지 로드 실패해도 계속 진행
						}
					}
				}
			}

			if (isMounted) {
				setImagePreviews(previews);
				setImageLoading(false);
			}
		};

		loadImages();

		return () => {
			isMounted = false;
			blobUrls.forEach((url) => URL.revokeObjectURL(url));
		};
	}, [imageFiles, product.productImageDtos]);

	// 이미지 파일 선택 핸들러
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const currentTotal =
			imageFiles.length + (product.productImageDtos?.length || 0);
		const remainingSlots = maxImages - currentTotal;

		if (remainingSlots <= 0) {
			alert(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
			return;
		}

		const filesToAdd = Array.from(files).slice(0, remainingSlots);

		for (const file of filesToAdd) {
			if (!file.type.startsWith("image/")) {
				alert("이미지 파일만 업로드 가능합니다.");
				continue;
			}

			if (file.size > 5 * 1024 * 1024) {
				alert(`${file.name}: 이미지 크기는 5MB를 초과할 수 없습니다.`);
				continue;
			}

			if (onImageAdd) {
				onImageAdd(file);
			}
		}

		e.target.value = "";
	};

	// 로컬 이미지 삭제
	const handleLocalImageRemove = (localIndex: number) => {
		if (onImageRemove) {
			onImageRemove(localIndex);
		}
	};

	// 서버 이미지 삭제
	const handleServerImageRemove = async (imageId: string) => {
		if (!confirm("이미지를 삭제하시겠습니까?")) return;

		setImageLoading(true);
		try {
			const response = await productApi.deleteProductImage(imageId);

			if (response.success) {
				alert("이미지가 삭제되었습니다.");

				if (onServerImageRemove) {
					onServerImageRemove(imageId);
				}

				setImagePreviews((prev) =>
					prev.filter((p) => p.serverId !== imageId),
				);
			} else {
				alert(response.message || "이미지 삭제에 실패했습니다.");
			}
		} catch {
			alert("이미지 삭제에 실패했습니다.");
		} finally {
			setImageLoading(false);
		}
	};

	// 이미지 클릭 시 확대 모달 열기
	const handleImageClick = (imageUrl: string) => {
		setZoomImageUrl(imageUrl);
		setIsImageZoomOpen(true);
	};

	// 캐러셀 네비게이션
	const goToPrevImage = () => {
		setCurrentImageIndex((prev) =>
			prev === 0 ? imagePreviews.length - 1 : prev - 1
		);
	};

	const goToNextImage = () => {
		setCurrentImageIndex((prev) =>
			prev === imagePreviews.length - 1 ? 0 : prev + 1
		);
	};

	const goToImage = (index: number) => {
		setCurrentImageIndex(index);
	};

	// 이미지 삭제 시 인덱스 조정
	useEffect(() => {
		if (currentImageIndex >= imagePreviews.length && imagePreviews.length > 0) {
			setCurrentImageIndex(imagePreviews.length - 1);
		}
	}, [imagePreviews.length, currentImageIndex]);

	// 필드 변경 핸들러
	const handleFieldChange = (
		field: keyof ProductData | "materialId" | "classificationId" | "setTypeId",
		value: string,
	) => {
		if (!onProductChange) return;

		let updatedProduct: Partial<ProductData> = {};

		if (field === "materialId") {
			const selectedMaterial = materials.find((m) => m.materialId === value);
			if (selectedMaterial) {
				updatedProduct = { materialDto: selectedMaterial };
			}
		} else if (field === "classificationId") {
			const selectedClassification = classifications.find(
				(c) => c.classificationId === value,
			);
			if (selectedClassification) {
				updatedProduct = { classificationDto: selectedClassification };
			}
		} else if (field === "setTypeId") {
			const selectedSetType = setTypes.find((s) => s.setTypeId === value);
			if (selectedSetType) {
				updatedProduct = { setTypeDto: selectedSetType };
			}
		} else {
			updatedProduct = { [field]: value };
		}

		onProductChange(updatedProduct);
	};

	const loadMaterials = useCallback(async () => {
		if (materialsLoaded) return;
		setLoading(true);
		try {
			const response = await materialApi.getMaterials();
			if (response.success && response.data) {
				setMaterials(response.data);
				setMaterialsLoaded(true);
			} else {
				setMaterials([]);
			}
		} catch {
			setMaterials([]);
		} finally {
			setLoading(false);
		}
	}, [materialsLoaded]);

	const loadClassifications = useCallback(async () => {
		if (classificationsLoaded) return;
		setLoading(true);
		try {
			const response = await classificationApi.getClassifications();
			if (response.success && response.data) {
				setClassifications(response.data);
				setClassificationsLoaded(true);
			} else {
				setClassifications([]);
			}
		} catch {
			setClassifications([]);
		} finally {
			setLoading(false);
		}
	}, [classificationsLoaded]);

	const loadSetTypes = useCallback(async () => {
		if (setTypesLoaded) return;
		setLoading(true);
		try {
			const response = await setTypeApi.getSetTypes();
			if (response.success && response.data) {
				setSetTypes(response.data);
				setSetTypesLoaded(true);
			} else {
				setSetTypes([]);
			}
		} catch {
			setSetTypes([]);
		} finally {
			setLoading(false);
		}
	}, [setTypesLoaded]);

	useEffect(() => {
		const loadAllDropdownData = async () => {
			await Promise.all([
				loadMaterials(),
				loadClassifications(),
				loadSetTypes(),
			]);
		};

		if (editable) {
			loadAllDropdownData();
		}
	}, [editable, loadMaterials, loadClassifications, loadSetTypes]);

	const totalImageCount =
		imageFiles.length + (product.productImageDtos?.length || 0);
	const canAddMore = totalImageCount < maxImages;

	return (
		<div className="top-section">
			<div className="image-section">
				{imageLoading ? (
					<div className="image-loading">로딩 중...</div>
				) : (
					<div className="image-carousel-container">
						{imagePreviews.length > 0 ? (
							<>
								{/* 메인 이미지 영역 */}
								<div className="carousel-main">
									{/* 이전 버튼 */}
									{imagePreviews.length > 1 && (
										<button
											type="button"
											className="carousel-nav-btn prev"
											onClick={goToPrevImage}
											title="이전 이미지"
										>
											‹
										</button>
									)}

									{/* 현재 이미지 */}
									<div className="carousel-image-wrapper">
										<img
											src={imagePreviews[currentImageIndex]?.url}
											alt="상품 이미지"
											className="carousel-image"
											onClick={() =>
												handleImageClick(imagePreviews[currentImageIndex]?.url)
											}
											title="클릭하여 이미지 확대"
										/>
										{editable && (
											<button
												type="button"
												className="carousel-remove-btn"
												onClick={() => {
													const preview = imagePreviews[currentImageIndex];
													if (preview.isLocal) {
														handleLocalImageRemove(preview.localIndex!);
													} else {
														handleServerImageRemove(preview.serverId!);
													}
												}}
												title="이미지 삭제"
											>
												×
											</button>
										)}
										{imagePreviews[currentImageIndex]?.isLocal && (
											<span className="carousel-badge new">NEW</span>
										)}
									</div>

									{/* 다음 버튼 */}
									{imagePreviews.length > 1 && (
										<button
											type="button"
											className="carousel-nav-btn next"
											onClick={goToNextImage}
											title="다음 이미지"
										>
											›
										</button>
									)}
								</div>

								{/* 하단 영역: 인디케이터 + 추가 버튼 */}
								<div className="carousel-bottom">
									{/* 인디케이터 (점) */}
									<div className="carousel-indicators">
										{imagePreviews.map((_, index) => (
											<button
												key={index}
												type="button"
												className={`carousel-dot ${
													index === currentImageIndex ? "active" : ""
												}`}
												onClick={() => goToImage(index)}
												title={`이미지 ${index + 1}`}
											/>
										))}
									</div>

									{/* 이미지 추가 버튼 */}
									{editable && canAddMore && (
										<label className="carousel-add-button" title="이미지 추가">
											<span className="add-icon">+</span>
											<span className="add-text">추가</span>
											<input
												type="file"
												accept="image/*"
												multiple
												onChange={handleImageChange}
												style={{ display: "none" }}
											/>
										</label>
									)}
								</div>

								{/* 이미지 카운트 */}
								<div className="carousel-count">
									{currentImageIndex + 1} / {imagePreviews.length}
									{editable && ` (최대 ${maxImages})`}
								</div>
							</>
						) : (
							<div className="carousel-empty">
								<img src="/images/not_ready.png" alt="이미지 없음" />
								{editable && canAddMore && (
									<label className="carousel-add-btn" title="이미지 추가">
										<span className="add-icon">+</span>
										<span className="add-text">이미지 추가</span>
										<input
											type="file"
											accept="image/*"
											multiple
											onChange={handleImageChange}
											style={{ display: "none" }}
										/>
									</label>
								)}
							</div>
						)}
					</div>
				)}
			</div>
			<div className="basic-info-section">
				{showTitle && <h2>기본 정보</h2>}
				<div className="info-grid">
					<div className="info-row">
						<div className="info-item half-width">
							<span className="required-field-basic">*</span>
							<span className="label">모델번호:</span>
							{editable ? (
								<input
									type="text"
									className={`editable-input ${
										validationErrors.productName ? "error" : ""
									}`}
									value={product.productName}
									onChange={(e) =>
										handleFieldChange("productName", e.target.value)
									}
									placeholder={
										validationErrors.productName || "모델번호를 입력"
									}
								/>
							) : (
								<span className="value">{product.productName}</span>
							)}
						</div>
						<div className="info-item half-width">
							<span className="required-field-basic">*</span>
							<span className="label">제조번호:</span>
							{editable ? (
								<input
									type="text"
									className="editable-input"
									value={product.productFactoryName}
									onChange={(e) =>
										handleFieldChange("productFactoryName", e.target.value)
									}
									placeholder="제조번호를 입력"
								/>
							) : (
								<span className="value">{product.productFactoryName}</span>
							)}
						</div>
						<div className="info-item-v2 half-width">
							<span className="required-field-basic">*</span>
							<span className="label">제조사:</span>
							{editable ? (
								<div
									className={`basicinfo-factory-search-container ${
										validationErrors.factoryId ? "error" : ""
									}`}
								>
									<span className="factory-display-value">
										{validationErrors.factoryId || product.factoryName}
									</span>
									<button
										type="button"
										className="factory-search-btn"
										onClick={handleFactorySearchClick}
									>
										검색
									</button>
								</div>
							) : (
								<span className="value">{product.factoryName}</span>
							)}
						</div>

						<div className="info-item half-width">
							<span
								className="info-icon"
								title="동일한 관련번호를 가진 상품들을 그룹화하여 목록으로 조회할 수 있습니다."
								style={{ marginRight: "5px" }}
							>
								ⓘ
							</span>
							<span className="label">
								관련번호:
								<span className="label"></span>
							</span>
							{editable ? (
								<input
									type="text"
									className="editable-input"
									value={product.productRelatedNumber}
									onChange={(e) =>
										handleFieldChange("productRelatedNumber", e.target.value)
									}
									placeholder="관련번호 입력"
								/>
							) : (
								<span className="value">{product.productRelatedNumber}</span>
							)}
						</div>
					</div>

					<div className="info-row">
						<div className="info-item quarter-width">
							<span className="label">무게:</span>
							{editable ? (
								<div className="input-with-unit">
									<input
										type="text"
										className="editable-input weight-input"
										value={product.standardWeight}
										onChange={(e) =>
											handleFieldChange("standardWeight", e.target.value)
										}
										placeholder="무게"
									/>
									<span className="unit"></span>
								</div>
							) : (
								<span className="value">{product.standardWeight}</span>
							)}
						</div>
						<div className="info-item quarter-width">
							<span className="label">재질:</span>
							{editable ? (
								<select
									className="editable-select"
									value={product.materialDto?.materialId || ""}
									onChange={(e) =>
										handleFieldChange("materialId", e.target.value)
									}
									disabled={loading}
								>
									<option value={product.materialDto?.materialId}>
										{product.materialDto?.materialName}
									</option>
									{materials.map((material) => (
										<option
											key={material.materialId}
											value={material.materialId}
										>
											{material.materialName}
										</option>
									))}
								</select>
							) : (
								<span className="value">
									{product.materialDto?.materialName}
								</span>
							)}
						</div>
						<div className="info-item quarter-width">
							<span className="label">분류:</span>
							{editable ? (
								<select
									className="editable-select"
									value={product.classificationDto?.classificationId || ""}
									onChange={(e) =>
										handleFieldChange("classificationId", e.target.value)
									}
									disabled={loading}
								>
									<option value={product.classificationDto?.classificationId}>
										{product.classificationDto?.classificationName}
									</option>
									{classifications.map((classification) => (
										<option
											key={classification.classificationId}
											value={classification.classificationId}
										>
											{classification.classificationName}
										</option>
									))}
								</select>
							) : (
								<span className="value">
									{product.classificationDto?.classificationName}
								</span>
							)}
						</div>
						<div className="info-item quarter-width">
							<span className="label">세트:</span>
							{editable ? (
								<select
									className="editable-select"
									value={product.setTypeDto?.setTypeId || ""}
									onChange={(e) =>
										handleFieldChange("setTypeId", e.target.value)
									}
									disabled={loading}
								>
									<option value={product.setTypeDto?.setTypeId}>
										{product.setTypeDto?.setTypeName}
									</option>
									{setTypes.map((setType) => (
										<option key={setType.setTypeId} value={setType.setTypeId}>
											{setType.setTypeName}
										</option>
									))}
								</select>
							) : (
								<span className="value">{product.setTypeDto?.setTypeName}</span>
							)}
						</div>
					</div>

					{product.productNote !== undefined && (
						<div className="full-width">
							{editable ? (
								<textarea
									className="editable-textarea"
									value={product.productNote || ""}
									onChange={(e) =>
										handleFieldChange("productNote", e.target.value)
									}
									placeholder="메모를 입력하세요..."
								/>
							) : (
								<span className="value">{product.productNote}</span>
							)}
						</div>
					)}
				</div>

				{isFactoryModalOpen && (
					<FactorySearch
						onClose={() => setIsFactoryModalOpen(false)}
						onSelectFactory={handleFactorySelectInternal}
					/>
				)}

				{isImageZoomOpen && zoomImageUrl && (
					<ImageZoomModal
						imageUrl={zoomImageUrl}
						altText="상품 이미지"
						onClose={() => setIsImageZoomOpen(false)}
					/>
				)}
			</div>
		</div>
	);
};

export default BasicInfo;

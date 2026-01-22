import React, { useState, useEffect, useCallback } from "react";
import type { ProductInfo, ProductData } from "../../../types/product";
import type { ClassificationDto } from "../../../types/classification";
import type { MaterialDto } from "../../../types/material";
import type { SetTypeDto } from "../../../types/setType";
import { classificationApi } from "../../../../libs/api/classification";
import { materialApi } from "../../../../libs/api/material";
import { setTypeApi } from "../../../../libs/api/setType";
import { productApi } from "../../../../libs/api/product";
import FactorySearch from "../factory/FactorySearch";
import ImageZoomModal from "../ImageZoomModal";
import "../../../styles/components/BasicInfo.css";
import { useErrorHandler } from "../../../utils/errorHandler";

const BasicInfo: React.FC<ProductInfo> = ({
	product,
	showTitle = true,
	editable = true,
	imageFile, // 부모로부터 받은 Props 사용 (로컬 State 선언 제거)
	onProductChange,
	onFactorySelect,
	onImageChange,
	validationErrors = {},
}) => {
	const [classifications, setClassifications] = useState<ClassificationDto[]>(
		[],
	);
	const [materials, setMaterials] = useState<MaterialDto[]>([]);
	const [setTypes, setSetTypes] = useState<SetTypeDto[]>([]);
	const [loading, setLoading] = useState(false);

	// 각 드롭다운의 로딩 상태
	const [materialsLoaded, setMaterialsLoaded] = useState(false);
	const [classificationsLoaded, setClassificationsLoaded] = useState(false);
	const [setTypesLoaded, setSetTypesLoaded] = useState(false);

	// 제조사 검색 모달 상태
	const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);

	// 이미지 관련 State (imageFile은 Props 사용하므로 제거됨)
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [currentImageId, setCurrentImageId] = useState<number | null>(null);
	const [imageLoading, setImageLoading] = useState(false);

	// 이미지 확대 모달 상태
	const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);

	const { handleError } = useErrorHandler();

	// 제조사 선택 핸들러
	const handleFactorySelect = (factory: {
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

	// 이미지 로드 및 미리보기 처리 (통합)
	useEffect(() => {
		// 1. 로컬 파일(imageFile Prop)이 있으면 최우선으로 미리보기 표시
		if (imageFile) {
			const objectUrl = URL.createObjectURL(imageFile);
			setImagePreview(objectUrl);
			setCurrentImageId(null); // 로컬 파일이므로 서버 ID는 없음

			return () => URL.revokeObjectURL(objectUrl);
		}

		// 2. 로컬 파일이 없고 서버 데이터가 있는 경우 서버 이미지 로드
		let blobUrl: string | null = null;
		const loadServerImage = async () => {
			if (product.productImageDtos && product.productImageDtos.length > 0) {
				const firstImage = product.productImageDtos[0];
				if (firstImage.imageId && firstImage.imagePath) {
					try {
						const blob = await productApi.getProductImageByPath(
							firstImage.imagePath,
						);
						blobUrl = URL.createObjectURL(blob);
						setImagePreview(blobUrl);
						setCurrentImageId(parseInt(firstImage.imageId));
					} catch {
						setImagePreview(null);
					}
				}
			} else {
				// 이미지 없음
				setImagePreview(null);
				setCurrentImageId(null);
			}
		};

		loadServerImage();

		return () => {
			if (blobUrl) URL.revokeObjectURL(blobUrl);
		};
	}, [imageFile, product.productImageDtos]);

	// 이미지 파일 선택 핸들러
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			alert("이미지 파일만 업로드 가능합니다.");
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			alert("이미지 크기는 5MB를 초과할 수 없습니다.");
			return;
		}

		// 부모 컴포넌트에 파일 전달 (로컬 상태 업데이트 안 함)
		if (onImageChange) {
			onImageChange(file);
		}
	};

	// 이미지 업로드/수정 (수정 페이지용)
	const handleImageUpload = async () => {
		// Props인 imageFile 사용
		if (!imageFile || !product.productId) return;

		setImageLoading(true);
		try {
			const response = await productApi.uploadProductImage(
				product.productId.toString(),
				imageFile,
			);
			if (response.success) {
				alert("이미지가 수정되었습니다.");
				// 성공 시 파일 선택 해제 (부모 상태 초기화)
				if (onImageChange) {
					onImageChange(null);
				}
				// 페이지 새로고침 로직이 필요하다면 여기에 추가 (혹은 상태 업데이트)
				window.location.reload();
			}
		} catch (error) {
			handleError(error);
		} finally {
			setImageLoading(false);
		}
	};

	// 이미지 클릭 시 확대 모달 열기
	const handleImageClick = () => {
		if (imagePreview) {
			setIsImageZoomOpen(true);
		}
	};

	// 이미지 삭제 (로컬 취소 또는 서버 삭제)
	const handleImageDelete = async () => {
		// 1. 방금 선택한 로컬 파일이 있는 경우 -> 선택 취소
		if (imageFile) {
			if (onImageChange) {
				onImageChange(null);
			}
			return;
		}

		// 2. 서버에 저장된 이미지가 있는 경우 -> API 호출
		if (!currentImageId) return;
		if (!confirm("이미지를 삭제하시겠습니까?")) return;

		setImageLoading(true);
		try {
			const response = await productApi.deleteProductImage(
				currentImageId.toString(),
			);

			if (response.success) {
				alert("이미지가 삭제되었습니다.");
				setImagePreview(null);
				setCurrentImageId(null);

				if (onImageChange) {
					onImageChange(null);
				}

				if (window.opener && !window.opener.closed) {
					window.opener.location.reload();
				}
			} else {
				alert(response.message || "이미지 삭제에 실패했습니다.");
			}
		} catch {
			alert("이미지 삭제에 실패했습니다.");
		} finally {
			setImageLoading(false);
		}
	};

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

	// 데이터 로드 함수들
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

	return (
		<div className="top-section">
			<div className="image-section">
				{imageLoading ? (
					<div className="image-loading">로딩 중...</div>
				) : (
					<div className="image-container">
						{editable && (
							<div className="image-button-group">
								{/* 이미지가 없을 때만 추가 버튼 노출 */}
								{!imagePreview && (
									<label className="image-icon-btn add" title="이미지 업로드">
										➕
										<input
											type="file"
											accept="image/*"
											onChange={handleImageChange}
											style={{ display: "none" }}
										/>
									</label>
								)}
								{/* 이미지가 있을 때(미리보기 포함) 삭제 버튼 노출 */}
								{imagePreview && (
									<button
										type="button"
										className="image-icon-btn delete"
										onClick={handleImageDelete}
										title="이미지 삭제"
									>
										🗑️
									</button>
								)}
							</div>
						)}
						{imagePreview ? (
							<>
								<img
									src={imagePreview}
									alt="상품 이미지"
									className="product-image"
									onClick={handleImageClick}
									style={{ cursor: "zoom-in" }}
									title="클릭하여 이미지 확대"
								/>
								{/* 수정 모드이면서 + 로컬 파일이 선택되었을 때만 '저장' 버튼 표시 */}
								{editable && imageFile && product.productId && (
									<button
										type="button"
										className="image-save-btn"
										onClick={handleImageUpload}
										style={{ marginTop: "10px" }}
									>
										저장
									</button>
								)}
							</>
						) : (
							<img src="/images/not_ready.png" alt="이미지 없음" />
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
						onSelectFactory={handleFactorySelect}
					/>
				)}

				{isImageZoomOpen && imagePreview && (
					<ImageZoomModal
						imageUrl={imagePreview}
						altText="상품 이미지"
						onClose={() => setIsImageZoomOpen(false)}
					/>
				)}
			</div>
		</div>
	);
};

export default BasicInfo;

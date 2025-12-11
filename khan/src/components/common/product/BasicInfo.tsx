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
import "../../../styles/components/BasicInfo.css";

const BasicInfo: React.FC<ProductInfo> = ({
	product,
	showTitle = true,
	editable = true,
	onProductChange,
	onFactorySelect,
	onImageChange,
	validationErrors = {},
}) => {
	const [classifications, setClassifications] = useState<ClassificationDto[]>(
		[]
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

	// 이미지 관련 state
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [currentImageId, setCurrentImageId] = useState<number | null>(null);
	const [imageLoading, setImageLoading] = useState(false);

	// 제조사 선택 핸들러
	const handleFactorySelect = (factory: {
		factoryId?: number;
		factoryName: string;
	}) => {
		const factoryId = factory.factoryId || 0;

		// 상품 정보 업데이트
		if (onProductChange) {
			onProductChange({
				factoryId,
				factoryName: factory.factoryName,
			});
		}

		// 외부 핸들러 호출
		if (onFactorySelect) {
			onFactorySelect(factoryId, factory.factoryName);
		}

		// 모달 닫기
		setIsFactoryModalOpen(false);
	};

	// 제조사 검색 버튼 클릭 핸들러
	const handleFactorySearchClick = () => {
		setIsFactoryModalOpen(true);
	};

	// 상품 데이터에서 이미지 로드
	useEffect(() => {
		let blobUrl: string | null = null;

		const loadImage = async () => {
			if (product.productImageDtos && product.productImageDtos.length > 0) {
				const firstImage = product.productImageDtos[0];
				if (firstImage.imageId && firstImage.imagePath) {
					try {
						const blob = await productApi.getProductImageByPath(
							firstImage.imagePath
						);
						blobUrl = URL.createObjectURL(blob);
						setImagePreview(blobUrl);
						setCurrentImageId(parseInt(firstImage.imageId));
					} catch {
						setImagePreview(null);
					}
				}
			} else {
				setImagePreview(null);
				setCurrentImageId(null);
			}
		};

		loadImage();

		// cleanup: blob URL은 세션 스토리지에 저장되므로 해제하지 않음
	}, [product.productImageDtos]);

	// 이미지 파일 선택 핸들러
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// 이미지 파일 타입 검증
		if (!file.type.startsWith("image/")) {
			alert("이미지 파일만 업로드 가능합니다.");
			return;
		}

		// 파일 크기 검증 (5MB)
		if (file.size > 5 * 1024 * 1024) {
			alert("이미지 크기는 5MB를 초과할 수 없습니다.");
			return;
		}

		setImageFile(file);

		// 미리보기 생성
		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreview(reader.result as string);
		};
		reader.readAsDataURL(file);

		// 부모 컴포넌트에 파일 전달
		if (onImageChange) {
			onImageChange(file);
		}
	};

	// 이미지 업로드/수정 (productId가 있을 때만)
	const handleImageUpload = async () => {
		if (!imageFile || !product.productId) return;

		setImageLoading(true);
		try {
			const response = await productApi.uploadProductImage(
				product.productId.toString(),
				imageFile
			);
			if (response.success) {
				alert("이미지가 수정되었습니다.");
				// 부모 컴포넌트에서 상품 데이터를 다시 불러와야 함
				window.location.reload();
			}
			setImageFile(null);
			if (onImageChange) {
				onImageChange(null);
			}
		} catch (error) {
			console.error("이미지 업로드 실패:", error);
			alert("이미지 업로드에 실패했습니다.");
		} finally {
			setImageLoading(false);
		}
	};

	// 이미지 삭제
	const handleImageDelete = async () => {
		if (!currentImageId) return;

		if (!confirm("이미지를 삭제하시겠습니까?")) return;

		setImageLoading(true);
		try {
			// 세션 스토리지에서 캐시 제거
			if (product.productImageDtos && product.productImageDtos.length > 0) {
				const firstImage = product.productImageDtos[0];
				if (firstImage.imageId && firstImage.imagePath) {
					const cacheKey = `product_image_${firstImage.imageId}_${firstImage.imagePath}`;
					try {
						const cachedUrl = sessionStorage.getItem(cacheKey);
						if (cachedUrl) {
							URL.revokeObjectURL(cachedUrl);
							sessionStorage.removeItem(cacheKey);
						}
					} catch (error) {
						console.error("세션 스토리지 제거 실패:", error);
					}
				}
			}

			// API를 통해 이미지 삭제
			const response = await productApi.deleteProductImage(
				currentImageId.toString()
			);

			if (response.success) {
				alert("이미지가 삭제되었습니다.");
				setImagePreview(null);
				setCurrentImageId(null);
				setImageFile(null);
				if (onImageChange) {
					onImageChange(null);
				}
				// 부모 컴포넌트에서 상품 데이터를 다시 불러와야 함
				window.location.reload();
			}
		} catch (error) {
			console.error("이미지 삭제 실패:", error);
			alert("이미지 삭제에 실패했습니다.");
		} finally {
			setImageLoading(false);
		}
	};

	// 필드 변경 핸들러
	const handleFieldChange = (
		field: keyof ProductData | "materialId" | "classificationId" | "setTypeId",
		value: string
	) => {
		if (!onProductChange) return;

		let updatedProduct: Partial<ProductData> = {};

		// 중첩된 객체 처리
		if (field === "materialId") {
			const selectedMaterial = materials.find((m) => m.materialId === value);
			if (selectedMaterial) {
				updatedProduct = { materialDto: selectedMaterial };
			}
		} else if (field === "classificationId") {
			const selectedClassification = classifications.find(
				(c) => c.classificationId === value
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
			// 직접 필드
			updatedProduct = { [field]: value };
		}

		onProductChange(updatedProduct);
	};

	// 재질 데이터 로드 함수
	const loadMaterials = useCallback(async () => {
		if (materialsLoaded) return;

		setLoading(true);
		try {
			const response = await materialApi.getMaterials();
			if (!response.success) {
				alert(`${response.message || "재질 데이터를 불러오지 못했습니다."}`);
				setMaterials([]);
				return;
			}

			if (response.success && response.data) {
				setMaterials(response.data);
				setMaterialsLoaded(true);
			}
		} catch {
			setMaterials([]);
		} finally {
			setLoading(false);
		}
	}, [materialsLoaded]);

	// 분류 데이터 로드 함수
	const loadClassifications = useCallback(async () => {
		if (classificationsLoaded) return;

		setLoading(true);
		try {
			const response = await classificationApi.getClassifications();

			if (!response.success) {
				alert(`${response.message || "분류 데이터를 불러오지 못했습니다."}`);
				setClassifications([]);
				return;
			}

			if (response.success && response.data) {
				setClassifications(response.data);
				setClassificationsLoaded(true);
			}
		} catch {
			setClassifications([]);
		} finally {
			setLoading(false);
		}
	}, [classificationsLoaded]);

	// 세트 타입 데이터 로드 함수
	const loadSetTypes = useCallback(async () => {
		if (setTypesLoaded) return;

		setLoading(true);
		try {
			const setTypesRes = await setTypeApi.getSetTypes();

			if (!setTypesRes.success) {
				alert(
					`${setTypesRes.message || "세트 타입 데이터를 불러오지 못했습니다."}`
				);
				setSetTypes([]);
				return;
			}

			if (setTypesRes.success && setTypesRes.data) {
				setSetTypes(setTypesRes.data);
				setSetTypesLoaded(true);
			}
		} catch {
			setSetTypes([]);
		} finally {
			setLoading(false);
		}
	}, [setTypesLoaded]);

	// 컴포넌트 마운트시 모든 드롭다운 데이터 로드
	useEffect(() => {
		const loadAllDropdownData = async () => {
			// 모든 API 호출을 병렬로 실행
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
								/>
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
					{/* 상품명과 공장명을 같은 줄에 */}
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
										validationErrors.productName || "모델번호를 입력하세요"
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
									placeholder="제조번호를 입력하세요"
								/>
							) : (
								<span className="value">{product.productFactoryName}</span>
							)}
						</div>
						<div className="info-item half-width">
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
					</div>

					{/* 기준 무게, 재질, 분류, 세트 타입을 같은 줄에 */}
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

					{/* 메모는 전체 너비 */}
					{product.productNote !== undefined && (
						<div className="full-width">
							{editable ? (
								<textarea
									className="product-editable-textarea"
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

				{/* 제조사 검색 모달 */}
				{isFactoryModalOpen && (
					<FactorySearch
						onClose={() => setIsFactoryModalOpen(false)}
						onSelectFactory={handleFactorySelect}
					/>
				)}
			</div>
		</div>
	);
};

export default BasicInfo;

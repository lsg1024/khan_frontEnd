import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isApiSuccess } from "../../../libs/api/config";
import { catalogApi } from "../../../libs/api/catalogApi";
import { productApi } from "../../../libs/api/productApi";
import type {
	StoreCatalogProductDetailDto,
	StoreCatalogRelatedProductDto,
} from "../../types/storeCatalogDto";
import "../../styles/pages/store/StoreCatalogDetailPage.css";

function StoreCatalogDetailPage() {
	const { productId } = useParams<{ productId: string }>();
	const navigate = useNavigate();
	const [product, setProduct] = useState<StoreCatalogProductDetailDto | null>(
		null
	);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [relatedProducts, setRelatedProducts] = useState<
		StoreCatalogRelatedProductDto[]
	>([]);
	const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);

	// 이미지 상태
	const [mainImageIndex, setMainImageIndex] = useState(0);
	const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});

	// 관련 상품 이미지
	const [relatedImageUrls, setRelatedImageUrls] = useState<{
		[key: number]: string;
	}>({});

	// 관련 상품 클릭 핸들러
	const handleRelatedProductClick = (targetProductId: number) => {
		navigate(`/store/catalog/${targetProductId}`);
	};

	// 이미지 로드
	const loadImage = useCallback(async (imagePath: string, imageId: string) => {
		try {
			const blob = await productApi.getProductImageByPath(imagePath);
			const blobUrl = URL.createObjectURL(blob);
			setImageUrls((prev) => ({ ...prev, [imageId]: blobUrl }));
		} catch (err) {
			console.error("이미지 로드 실패:", err);
		}
	}, []);

	// 관련 상품 이미지 로드
	const loadRelatedImage = useCallback(
		async (imagePath: string, productId: number) => {
			try {
				const blob = await productApi.getProductImageByPath(imagePath);
				const blobUrl = URL.createObjectURL(blob);
				setRelatedImageUrls((prev) => ({ ...prev, [productId]: blobUrl }));
			} catch (err) {
				console.error("관련 상품 이미지 로드 실패:", err);
			}
		},
		[]
	);

	// 상품 상세 정보 로드
	const loadProductDetail = async (id: string) => {
		if (!id) {
			setError("상품 ID가 없습니다.");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError("");

			const response = await catalogApi.getProduct(id);

			if (isApiSuccess(response) && response.data) {
				setProduct(response.data);

				// 이미지 로드
				if (response.data.productImageDtos?.length > 0) {
					response.data.productImageDtos.forEach((img) => {
						loadImage(img.imagePath, img.imageId);
					});
				}
			} else {
				setError("상품 정보를 불러올 수 없습니다.");
			}
		} catch (err: unknown) {
			console.error("상품 상세 로드 실패:", err);
			setError("상품 정보를 불러오는 중 오류가 발생했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 관련 상품 로드
	const loadRelatedProducts = async (
		currentProductId: string,
		relatedNumber?: string
	) => {
		if (!currentProductId) {
			setRelatedProducts([]);
			return;
		}

		setRelatedProductsLoading(true);
		try {
			const response = await catalogApi.getRelatedProducts(
				currentProductId,
				relatedNumber
			);
			if (isApiSuccess(response) && response.data) {
				setRelatedProducts(response.data);

				// 관련 상품 이미지 로드
				response.data.forEach((item) => {
					if (item.imagePath) {
						loadRelatedImage(item.imagePath, item.productId);
					}
				});
			} else {
				setRelatedProducts([]);
			}
		} catch (err) {
			console.error("관련 상품 로드 실패:", err);
			setRelatedProducts([]);
		} finally {
			setRelatedProductsLoading(false);
		}
	};

	useEffect(() => {
		if (!productId) return;
		// productId 변경 시 상태 초기화 후 다시 로드
		setProduct(null);
		setLoading(true);
		setRelatedProducts([]);
		setImageUrls({});
		setRelatedImageUrls({});
		setMainImageIndex(0);
		loadProductDetail(productId);
	}, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

	// 상품이 로드되면 관련 상품 조회
	useEffect(() => {
		if (product?.productId && product?.productRelatedNumber) {
			loadRelatedProducts(product.productId, product.productRelatedNumber);
		} else {
			setRelatedProducts([]);
		}
	}, [product?.productId, product?.productRelatedNumber]); // eslint-disable-line react-hooks/exhaustive-deps

	// 컴포넌트 언마운트 시 blob URL 정리
	useEffect(() => {
		return () => {
			Object.values(imageUrls).forEach((url) => URL.revokeObjectURL(url));
			Object.values(relatedImageUrls).forEach((url) => URL.revokeObjectURL(url));
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// 이미지 네비게이션
	const handlePrevImage = () => {
		if (product?.productImageDtos && product.productImageDtos.length > 1) {
			setMainImageIndex((prev) =>
				prev === 0 ? product.productImageDtos.length - 1 : prev - 1
			);
		}
	};

	const handleNextImage = () => {
		if (product?.productImageDtos && product.productImageDtos.length > 1) {
			setMainImageIndex((prev) =>
				prev === product.productImageDtos.length - 1 ? 0 : prev + 1
			);
		}
	};

	// 목록으로 돌아가기
	const handleBack = () => {
		navigate("/store/catalog");
	};

	// 로딩 상태
	if (loading) {
		return (
			<div className="store-catalog-detail-page">
				<div className="loading-container">
					<div className="spinner"></div>
					<p>상품 정보를 불러오는 중...</p>
				</div>
			</div>
		);
	}

	// 에러 상태
	if (error || !product) {
		return (
			<div className="store-catalog-detail-page">
				<div className="error-container">
					<span className="error-icon">⚠️</span>
					<h3>오류가 발생했습니다</h3>
					<p>{error || "상품 정보를 찾을 수 없습니다."}</p>
					<button onClick={handleBack} className="back-button">
						목록으로
					</button>
				</div>
			</div>
		);
	}

	const currentImage = product.productImageDtos?.[mainImageIndex];

	return (
		<div className="store-catalog-detail-page">
			<div className="detail-content">
				{/* 상단 섹션: 이미지와 기본 정보 */}
				<div className="top-section">
					{/* 이미지 섹션 */}
					<div className="image-section">
						<div className="image-slider">
							<div className="main-image-container">
								{product.productImageDtos &&
								product.productImageDtos.length > 1 ? (
									<button
										className="image-nav prev"
										onClick={handlePrevImage}
									>
										&lt;
									</button>
								) : null}
								{currentImage && imageUrls[currentImage.imageId] ? (
									<img
										src={imageUrls[currentImage.imageId]}
										alt={product.productName}
									/>
								) : (
									<div className="no-image">
										<span>이미지 없음</span>
									</div>
								)}
								{product.productImageDtos &&
								product.productImageDtos.length > 1 ? (
									<button
										className="image-nav next"
										onClick={handleNextImage}
									>
										&gt;
									</button>
								) : null}
							</div>
							{product.productImageDtos &&
								product.productImageDtos.length > 1 && (
									<div className="image-indicators">
										{product.productImageDtos.map((img, idx) => (
											<button
												key={img.imageId}
												className={`indicator ${
													idx === mainImageIndex ? "active" : ""
												}`}
												onClick={() => setMainImageIndex(idx)}
											>
												{idx + 1}
											</button>
										))}
									</div>
								)}
						</div>
					</div>

					{/* 기본 정보 섹션 */}
					<div className="info-section">
						<h2 className="product-name">{product.productName}</h2>
						<div className="info-grid">
							<div className="info-row">
								<span className="label">분류</span>
								<span className="value">
									{product.classificationDto?.classificationName || "-"}
								</span>
							</div>
							<div className="info-row">
								<span className="label">세트타입</span>
								<span className="value">
									{product.setTypeDto?.setTypeName || "-"}
								</span>
							</div>
							<div className="info-row">
								<span className="label">재질</span>
								<span className="value">
									{product.materialDto?.materialName || "-"}
									{product.materialDto?.materialGoldPurityPercent &&
										` (${product.materialDto.materialGoldPurityPercent}%)`}
								</span>
							</div>
							<div className="info-row">
								<span className="label">기준중량</span>
								<span className="value gold-weight">
									{product.standardWeight
										? `${product.standardWeight}돈`
										: "-"}
								</span>
							</div>
							<div className="info-row">
								<span className="label">관련번호</span>
								<span className="value">
									{product.productRelatedNumber || "-"}
								</span>
							</div>
							{product.productNote && (
								<div className="info-row note-row">
									<span className="label">메모</span>
									<span className="value">{product.productNote}</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* 관련 상품 섹션 */}
				{product.productRelatedNumber && (
					<div className="related-section">
						<h3 className="section-title">
							관련 상품
							{relatedProductsLoading && (
								<span className="loading-text"> (로딩 중...)</span>
							)}
						</h3>
						{relatedProducts.length > 0 ? (
							<div className="related-products-grid">
								{relatedProducts.map((item) => (
									<div
										key={item.productId}
										className={`related-product-card ${
											String(item.productId) === product.productId
												? "current"
												: ""
										}`}
										onClick={() =>
											String(item.productId) !== product.productId &&
											handleRelatedProductClick(item.productId)
										}
									>
										<div className="related-product-image">
											{relatedImageUrls[item.productId] ? (
												<img
													src={relatedImageUrls[item.productId]}
													alt={item.productName}
												/>
											) : (
												<div className="no-image-small">
													<span>No Image</span>
												</div>
											)}
										</div>
										<div className="related-product-name">
											{item.productName}
										</div>
									</div>
								))}
							</div>
						) : (
							!relatedProductsLoading && (
								<div className="no-related">관련 상품이 없습니다.</div>
							)
						)}
					</div>
				)}

				{/* 스톤 정보 섹션 */}
				{product.productStoneDtos && product.productStoneDtos.length > 0 && (
					<div className="stones-section">
						<h3 className="section-title">스톤 정보</h3>
						<div className="stones-table">
							<div className="table-header">
								<span className="col-name">스톤명</span>
								<span className="col-weight">중량</span>
								<span className="col-quantity">수량</span>
								<span className="col-main">메인</span>
								<span className="col-include">포함</span>
								<span className="col-note">메모</span>
							</div>
							{product.productStoneDtos.map((stone) => (
								<div key={stone.productStoneId} className="table-row">
									<span className="col-name">{stone.stoneName}</span>
									<span className="col-weight">
										{stone.stoneWeight || "-"}
									</span>
									<span className="col-quantity">{stone.stoneQuantity}</span>
									<span className="col-main">
										{stone.mainStone ? "O" : "-"}
									</span>
									<span className="col-include">
										{stone.includeStone ? "O" : "-"}
									</span>
									<span className="col-note">
										{stone.productStoneNote || "-"}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* 버튼 섹션 */}
				<div className="action-buttons">
					<button onClick={handleBack} className="back-button">
						목록으로
					</button>
				</div>
			</div>
		</div>
	);
}

export default StoreCatalogDetailPage;

import React, { useState, useEffect, useCallback } from "react";
import { productApi } from "../../../libs/api/product";
import { isApiSuccess } from "../../../libs/api/config";
import { getGoldTransferWeight } from "../../utils/goldUtils";
import type { ProductDto } from "../../types/product";
import Pagination from "../../components/common/Pagination";
import "../../styles/pages/ProductSearchPage.css";

const ProductSearchPage: React.FC = () => {
	const [products, setProducts] = useState<ProductDto[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
	const [searchParams] = useState(
		() => new URLSearchParams(window.location.search)
	);
	const grade = searchParams.get("grade") || "1";

	const size = 12;

	// 상품 검색
	const performSearch = useCallback(async (name: string, page: number) => {
		setLoading(true);
		setError("");

		try {
			const response = await productApi.getProducts(
				name || undefined,
				undefined,
				undefined,
				undefined,
				page,
				size,
				undefined,
				undefined,
				grade
			);

			if (!isApiSuccess(response)) {
				setError(response.message || "상품 데이터를 불러오지 못했습니다.");
				setProducts([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
				return;
			}

			const data = response.data;
			const content = data?.content ?? [];
			const pageInfo = data?.page;

			setProducts(content);
			const uiPage = (pageInfo?.number ?? page - 1) + 1;
			setCurrentPage(uiPage);
			setTotalPages(pageInfo?.totalPages ?? 1);
			setTotalElements(pageInfo?.totalElements ?? content.length);

			// 각 상품의 이미지 로드
			const newImageUrls: Record<string, string> = {};
			for (const product of content) {
				if (product.image?.imageId && product.image?.imagePath) {
					try {
						const blob = await productApi.getProductImageByPath(
							product.image.imagePath
						);
						const blobUrl = URL.createObjectURL(blob);
						newImageUrls[product.productId] = blobUrl;
					} catch {
						// 이미지 로드 실패 시 기본 이미지 사용
						newImageUrls[product.productId] = "/images/not_ready.png";
					}
				} else {
					newImageUrls[product.productId] = "/images/not_ready.png";
				}
			}
			setImageUrls(newImageUrls);
		} catch {
			setError("상품 데이터를 불러오지 못했습니다.");
			setProducts([]);
			setCurrentPage(1);
			setTotalPages(0);
			setTotalElements(0);
		} finally {
			setLoading(false);
		}
	}, []);

	// 초기 데이터 로드
	useEffect(() => {
		performSearch("", 1);
	}, [performSearch]);

	// 검색 실행
	const handleSearch = () => {
		setCurrentPage(1);
		performSearch(searchTerm, 1);
	};

	// 상품 선택 처리
	const handleProductSelect = (product: ProductDto) => {
		// 부모 창에 선택된 상품 정보 전달
		if (window.opener) {
			window.opener.postMessage(
				{
					type: "PRODUCT_SELECTED",
					data: product,
				},
				"*"
			);
			window.close();
		}
	};

	// 창 닫기
	const handleClose = () => {
		window.close();
	};

	// 총 매입가 계산
	const calculateTotalPurchaseCost = (product: ProductDto): number => {
		const productCost = parseInt(product.productPurchaseCost) || 0;
		const stoneCost = product.productStones.reduce((sum, stone) => {
			return sum + stone.purchasePrice * stone.stoneQuantity;
		}, 0);
		return productCost + stoneCost;
	};

	// 총 판매가 계산
	const calculateTotalLaborCost = (product: ProductDto): number => {
		const productCost = parseInt(product.productLaborCost) || 0;
		const stoneCost = product.productStones.reduce((sum, stone) => {
			return sum + stone.laborCost * stone.stoneQuantity;
		}, 0);
		return productCost + stoneCost;
	};

	return (
		<div className="account-search-page">
			<div className="account-search-container">
				{/* 헤더 */}
				<div className="account-search-header">
					<h2>상품 검색</h2>
					<button className="close-button" onClick={handleClose}>
						×
					</button>
				</div>

				{/* 검색 섹션 */}
				<div className="search-section">
					<div className="search-input-group">
						<input
							className="search-input"
							type="text"
							placeholder="상품명을 입력하세요"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						/>
						<button
							className="search-btn"
							onClick={handleSearch}
							disabled={loading}
						>
							{loading ? "검색 중..." : "검색"}
						</button>
					</div>
				</div>

				{/* 결과 섹션 */}
				<div className="search-results">
					{error && (
						<div className="error-state">
							<p>{error}</p>
						</div>
					)}

					{/* 상품 그리드 */}
					<div className="search-products-grid">
						{loading ? (
							<div className="loading-container">
								<div className="spinner"></div>
								<p>상품을 불러오는 중...</p>
							</div>
						) : products.length === 0 ? (
							<div className="empty-state">
								<span className="empty-icon">📦</span>
								<h3>상품이 없습니다</h3>
								<p>검색 조건에 맞는 상품이 없습니다.</p>
							</div>
						) : (
							products.map((product) => (
								<div
									key={product.productId}
									className="search-product-card selectable"
									onClick={() => handleProductSelect(product)}
								>
									{/* 상품 이미지 */}
									<div className="search-product-image">
										<img
											src={
												imageUrls[product.productId] || "/images/not_ready.png"
											}
											alt={product.productName}
											onError={(e) => {
												e.currentTarget.src = "/images/not_ready.png";
											}}
										/>
									</div>

									{/* 상품 정보 */}
									<div className="search-product-info">
										<h3 className="search-product-name">
											{product.productName}
										</h3>
										<div className="search-product-details">
											{/* 무게, 재질 */}
											<div className="search-detail-row combined">
												<div className="search-detail-item">
													<div className="value">{product.productWeight}g</div>
												</div>
												<div className="detail-item">
													<div className="gold-content">
														{getGoldTransferWeight(product.productWeight)}돈
													</div>
												</div>
												<div className="detail-item">
													<span className="value">
														{product.productMaterial}
													</span>
												</div>
											</div>

											{/* 스톤 정보 */}
											{product.productStones &&
												product.productStones.length > 0 && (
													<div className="stones-section">
														{product.productStones.map((stone) => (
															<div
																key={stone.productStoneId}
																className="stone-row"
															>
																<span className="stone-info">
																	{stone.mainStone ? "M " : ""}
																	{stone.stoneName} × {stone.stoneQuantity}
																</span>
															</div>
														))}
													</div>
												)}

											{/* 가격 정보 */}
											<div className="search-detail-row combined price-row-combined">
												<div className="search-detail-item">
													<span className="search-price-label">매입:</span>
													<span className="search-labor-cost">
														{calculateTotalPurchaseCost(
															product
														).toLocaleString()}
														원
													</span>
												</div>
												<div className="search-detail-item">
													<span className="search-price-label">판매:</span>
													<span className="search-selling-price">
														{calculateTotalLaborCost(product).toLocaleString()}
														원
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							))
						)}
					</div>

					{/* 페이지네이션 */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={(page) => {
							performSearch(searchTerm, page);
						}}
						className="product"
					/>
				</div>
			</div>
		</div>
	);
};

export default ProductSearchPage;

import React, { useState, useEffect, useCallback } from "react";
import { productApi } from "../../../libs/api/productApi";
import { isApiSuccess } from "../../../libs/api/config";
import { useErrorHandler } from "../../utils/errorHandler";
import { calculatePureGoldWeight } from "../../utils/goldUtils";
import type { ProductDto } from "../../types/productDto";
import Pagination from "../../components/common/Pagination";
import "../../styles/pages/product/ProductSearchPage.css";

const ProductSearchPage: React.FC = () => {
	const [searchParams] = useState(
		() => new URLSearchParams(window.location.search),
	);
	const grade = searchParams.get("grade") || "1";
	const initialSearch = searchParams.get("search") || ""; // 초기 검색어

	const [products, setProducts] = useState<ProductDto[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState(initialSearch);
	const { handleError } = useErrorHandler();
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

	// 필터 상태
	const [searchField, setSearchField] = useState("");
	const [sortField, setSortField] = useState("");
	const [sortOrder, setSortOrder] = useState("DESC");

	const size = 12;

	// 상품 검색
	const performSearch = useCallback(
		async (
			search: string,
			page: number,
			sSearchField?: string,
			sField?: string,
			sOrder?: string,
		) => {
			setLoading(true);

			try {
				const response = await productApi.getProducts({
					search: search || undefined,
					searchField: sSearchField || undefined,
					sortField: sField || undefined,
					sortOrder: sOrder || undefined,
					grade: grade,
					page: page,
					size: size,
				});

				if (!isApiSuccess(response)) {
					handleError(new Error(response.message || "상품 데이터를 불러오지 못했습니다."), "ProductSearch");
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
								product.image.imagePath,
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
			} catch (err) {
				handleError(err, "ProductSearch");
				setProducts([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[handleError],
	);

	// 초기 데이터 로드 (초기 검색어가 있으면 해당 검색어로 검색)
	useEffect(() => {
		performSearch(initialSearch, 1, "", "", "DESC");
	}, [performSearch, initialSearch]);

	// 검색 실행
	const handleSearch = () => {
		setCurrentPage(1);
		performSearch(searchTerm, 1, searchField, sortField, sortOrder);
	};

	// 초기화 처리
	const handleReset = () => {
		setSearchTerm("");
		setSearchField("");
		setSortField("");
		setSortOrder("DESC");
		setCurrentPage(1);
		performSearch("", 1, "", "", "DESC");
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
				"*",
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

	// 총 판매가 계산 (상품 판매가 + 스톤 판매가)
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
				<div className="search-section-common">
					<div className="search-filters-common">
						{/* 1행: 필터 드롭다운 */}
						<div className="filter-row-common">
							<select
								className="filter-group-common select"
								value={searchField}
								onChange={(e) => setSearchField(e.target.value)}
							>
								<option value="">검색 필터</option>
								<option value="modelNumber">모델번호</option>
								<option value="factory">제조사</option>
								<option value="note">비고</option>
								<option value="setType">세트타입</option>
								<option value="classification">분류</option>
								<option value="material">재질</option>
							</select>

							<select
								className="filter-group-common select"
								value={sortField}
								onChange={(e) => setSortField(e.target.value)}
							>
								<option value="">정렬 기준</option>
								<option value="productName">상품명</option>
								<option value="factory">제조사</option>
								<option value="classification">분류</option>
								<option value="setType">세트타입</option>
							</select>

							<select
								className="filter-group-common select"
								value={sortOrder}
								onChange={(e) => setSortOrder(e.target.value)}
							>
								<option value="DESC">내림차순</option>
								<option value="ASC">오름차순</option>
							</select>

							<input
								className="search-input-common"
								type="text"
								placeholder="검색어"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							/>
							<div className="search-buttons-common">
								<button
									className="search-btn-common"
									onClick={handleSearch}
									disabled={loading}
								>
									{loading ? "검색 중..." : "검색"}
								</button>
								<button
									className="reset-btn-common"
									onClick={handleReset}
									disabled={loading}
								>
									초기화
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* 결과 섹션 */}
				<div className="search-results">
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
														{calculatePureGoldWeight(
															product.productWeight,
															product.productMaterial,
														).toFixed(3)}
														돈
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
															product,
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
							performSearch(searchTerm, page, searchField, sortField, sortOrder);
						}}
						className="product"
					/>
				</div>
			</div>
		</div>
	);
};

export default ProductSearchPage;

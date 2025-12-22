import { useState, useEffect, useCallback } from "react";
import { classificationApi } from "../../../libs/api/classification";
import { productApi } from "../../../libs/api/product";
import { setTypeApi } from "../../../libs/api/setType";
import { factoryApi } from "../../../libs/api/factory";
import { useErrorHandler } from "../../utils/errorHandler";
import { calculatePureGoldWeightWithHarry, getGoldDonFromWeight } from "../../utils/goldUtils";
import Pagination from "../../components/common/Pagination";
import type { ProductDto } from "../../types/product";
import type { SetTypeDto } from "../../types/setType";
import type { ClassificationDto } from "../../types/classification";
import type { FactorySearchDto } from "../../types/factory";
import "../../styles/pages/product/CataLogPage.css";

function CataLogPage() {
	const [products, setProducts] = useState<ProductDto[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
	const [selectedProductId, setSelectedProductId] = useState<string | null>(
		null
	);
	const { handleError } = useErrorHandler();

	// 검색 관련 상태
	const [searchFilters, setSearchFilters] = useState({
		name: "",
		factory: "",
		classification: "",
		setType: "",
	});

	// 정렬 관련 상태
	const [sortOptions, setSortOptions] = useState({
		sortField: "",
		sort: "",
	});

	// 드롭다운 데이터
	const [factories, setFactories] = useState<FactorySearchDto[]>([]);
	const [classifications, setClassifications] = useState<ClassificationDto[]>(
		[]
	);
	const [setTypes, setSetTypes] = useState<SetTypeDto[]>([]);
	const [dropdownLoading, setDropdownLoading] = useState(false);

	// 총 판매가 계산 (상품 판매가 + 스톤 판매가)
	const calculateTotalLaborCost = (product: ProductDto): number => {
		const productCost = parseInt(product.productLaborCost) || 0;
		const stoneCost = product.productStones.reduce((sum, stone) => {
			return sum + stone.laborCost * stone.stoneQuantity;
		}, 0);
		return productCost + stoneCost;
	};

	// 총 시세가 계산 (순금 무게 * 금 시세)
	const calculateTotalGoldPrice = (product: ProductDto): number => {
		const pureGoldWeight = calculatePureGoldWeightWithHarry(
			product.productWeight,
			product.productMaterial
		);

		const goldCost = Math.ceil(pureGoldWeight * (product.productGoldPrice || 0));
		return goldCost;
	};

	// 상품 상세보기 팝업 열기
	const handleProductDetailOpen = (productId: string) => {
		const url = `/catalog/detail/${productId}`;
		const features = "width=1400,height=900,resizable=yes,scrollbars=yes";
		window.open(url, "product_detail", features);
	};

	// 상품 생성 팝업 열기
	const handleProductCreateOpen = () => {
		const url = `/catalog/create`;
		const features = "width=1400,height=900,resizable=yes,scrollbars=yes";
		window.open(url, "product_create", features);
	};

	// 체크박스 클릭 핸들러
	const handleCheckboxChange = (productId: string) => {
		setSelectedProductId((prev) => (prev === productId ? null : productId));
	};

	// 주문 등록 버튼
	const handleOrderRegister = () => {
		if (!selectedProductId) {
			alert("주문 등록할 상품을 선택해주세요.");
			return;
		}
		const url = `/orders/create/order?productId=${selectedProductId}`;
		const features = "width=1400,height=900,resizable=yes,scrollbars=yes";
		window.open(url, "order_create", features);
	};

	// 재고 등록 버튼
	const handleStockRegister = () => {
		if (!selectedProductId) {
			alert("재고 등록할 상품을 선택해주세요.");
			return;
		}
		const url = `/stocks/create/normal?productId=${selectedProductId}`;
		const features = "width=1400,height=900,resizable=yes,scrollbars=yes";
		window.open(url, "stock_create", features);
	};

	// 상품 수정 버튼
	const handleProductEdit = () => {
		if (!selectedProductId) {
			alert("수정할 상품을 선택해주세요.");
			return;
		}
		const url = `/catalog/edit/${selectedProductId}`;
		const features = "width=1400,height=900,resizable=yes,scrollbars=yes";
		window.open(url, "product_edit", features);
	};

	// 이미지 로드 함수
	const loadProductImages = useCallback(async (productList: ProductDto[]) => {
		const newImageUrls: Record<string, string> = {};

		for (const product of productList) {
			if (product.image?.imageId && product.image?.imagePath) {
				const { imagePath } = product.image;

				// 항상 API를 통해 이미지 로드
				try {
					const blob = await productApi.getProductImageByPath(imagePath);
					const blobUrl = URL.createObjectURL(blob);
					newImageUrls[product.productId] = blobUrl;
				} catch (error) {
					console.error(
						`이미지 로드 실패 (productId: ${product.productId}):`,
						error
					);
					// 로드 실패 시 기본 이미지 사용
					newImageUrls[product.productId] = "/images/not_ready.png";
				}
			}
		}

		setImageUrls(newImageUrls);
	}, []);

	// 상품 데이터 로드 (검색 파라미터 포함)
	const loadProducts = useCallback(
		async (
			filters: typeof searchFilters,
			page: number = 1,
			sortOpts: typeof sortOptions = sortOptions
		) => {
			setLoading(true);

			try {
				const response = await productApi.getProducts(
					filters.name || undefined,
					filters.factory || undefined,
					filters.classification || undefined,
					filters.setType || undefined,
					page,
					undefined,
					sortOpts.sortField || undefined,
					sortOpts.sort || undefined,
					undefined
				);

				if (response.success && response.data) {
					const pageData = response.data.page;
					const content = response.data.content || [];

					setProducts(content || []);
					setCurrentPage(page);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);

					// 이미지 로드
					if (content.length > 0) {
						loadProductImages(content);
					}
				}
			} catch (err: unknown) {
				handleError(err);
				setProducts([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[loadProductImages]
	);

	// 검색 필터 변경 핸들러
	const handleFilterChange = (
		field: keyof typeof searchFilters,
		value: string
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));
	};

	// 검색 실행
	const handleSearch = () => {
		setCurrentPage(1);
		loadProducts(searchFilters, 1, sortOptions);
	};

	// 검색 초기화
	const handleResetSearch = () => {
		const resetFilters = {
			name: "",
			factory: "",
			classification: "",
			setType: "",
		};
		const resetSort = {
			sortField: "",
			sort: "",
		};
		setSearchFilters(resetFilters);
		setSortOptions(resetSort);
		setCurrentPage(1);
		loadProducts(resetFilters, 1, resetSort);
	};

	const handleCreate = () => {
		handleProductCreateOpen();
	};

	const handleExcel = () => {
		alert("엑셀 다운로드 기능은 아직 구현되지 않았습니다.");
	};

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			if (event.data?.type === "PRODUCT_CREATED") {
				loadProducts(searchFilters, currentPage, sortOptions);
			}
		};

		window.addEventListener("message", handleMessage);
		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [loadProducts, searchFilters, currentPage, sortOptions]);

	// 컴포넌트 마운트시 초기 데이터 로드
	useEffect(() => {
		setCurrentPage(1);

		// 드롭다운 데이터 로드
		const loadDropdowns = async () => {
			setDropdownLoading(true);
			try {
				const [factoriesRes, classificationsRes, setTypesRes] =
					await Promise.all([
						factoryApi.getFactories("", 1, true),
						classificationApi.getClassifications(),
						setTypeApi.getSetTypes(),
					]);

				if (factoriesRes.success && factoriesRes.data?.content) {
					setFactories(factoriesRes.data.content);
				}

				if (classificationsRes.success && classificationsRes.data) {
					setClassifications(classificationsRes.data);
				}

				if (setTypesRes.success && setTypesRes.data) {
					setSetTypes(setTypesRes.data);
				}
			} catch (error) {
				console.error("드롭다운 데이터 로드 실패:", error);
			} finally {
				setDropdownLoading(false);
			}
		};

		// 초기 로드 - 빈 필터로 전체 상품 로드
		const initialLoad = async () => {
			setLoading(true);

			try {
				const response = await productApi.getProducts(
					undefined,
					undefined,
					undefined,
					undefined,
					1
				);

				if (response.success && response.data) {
					const pageData = response.data.page;
					const content = response.data.content || [];

					setProducts(content || []);
					setCurrentPage(1);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);

					// 이미지 로드
					if (content.length > 0) {
						loadProductImages(content);
					}
				}
			} catch (err: unknown) {
				console.error("초기 상품 로드 실패:", err);
				handleError(err);
				setProducts([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		};

		loadDropdowns();
		initialLoad();
	}, [loadProductImages]); // 빈 의존성 배열로 마운트 시 한 번만 실행

	// 로딩 상태 렌더링
	if (loading) {
		return (
			<div className="catalog-page">
				<div className="loading-container">
					<div className="spinner"></div>
					<p>상품을 불러오는 중...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="page catalog-page">
			{/* 검색 영역 */}
			<div className="search-section-common">
				<div className="search-filters-common">
					<div className="filter-row-common">
						<div className="filter-group-common">
							<select
								id="factory"
								value={searchFilters.factory}
								onChange={(e) => handleFilterChange("factory", e.target.value)}
								disabled={dropdownLoading}
							>
								<option value="">제조사</option>
								{factories.map((factory) => (
									<option key={factory.factoryId} value={factory.factoryName}>
										{factory.factoryName}
									</option>
								))}
							</select>
						</div>
						<div className="filter-group-common">
							<select
								id="classification"
								value={searchFilters.classification}
								onChange={(e) =>
									handleFilterChange("classification", e.target.value)
								}
								disabled={dropdownLoading}
							>
								<option value="">분류</option>
								{classifications.map((classification) => (
									<option
										key={classification.classificationId}
										value={classification.classificationId}
									>
										{classification.classificationName}
									</option>
								))}
							</select>
						</div>
						<div className="filter-group-common">
							<select
								id="setType"
								value={searchFilters.setType}
								onChange={(e) => handleFilterChange("setType", e.target.value)}
								disabled={dropdownLoading}
							>
								<option value="">세트</option>
								{setTypes.map((setType) => (
									<option key={setType.setTypeId} value={setType.setTypeId}>
										{setType.setTypeName}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className="search-controls-common">
						<div className="filter-group-common">
							<select
								id="sortField"
								value={sortOptions.sortField}
								onChange={(e) =>
									setSortOptions((prev) => ({
										...prev,
										sortField: e.target.value,
									}))
								}
								disabled={dropdownLoading}
							>
								<option value="">정렬 필드</option>
								<option value="productName">상품명</option>
								<option value="factory">제조사</option>
								<option value="setType">세트</option>
								<option value="classification">분류</option>
							</select>
						</div>
						<div className="filter-group-common">
							<select
								id="sort"
								value={sortOptions.sort}
								onChange={(e) =>
									setSortOptions((prev) => ({ ...prev, sort: e.target.value }))
								}
								disabled={dropdownLoading}
							>
								<option value="">정렬 방향</option>
								<option value="asc">오름차순</option>
								<option value="desc">내림차순</option>
							</select>
						</div>

						<input
							className="search-input-common"
							id="productName"
							type="text"
							placeholder="상품명을 입력하세요"
							value={searchFilters.name}
							onChange={(e) => handleFilterChange("name", e.target.value)}
						/>

						<div className="search-buttons-common">
							<button
								className="search-btn-common"
								onClick={handleSearch}
								disabled={loading}
							>
								검색
							</button>
							<button
								className="reset-btn-common"
								onClick={handleResetSearch}
								disabled={loading}
							>
								초기화
							</button>
							<button
								className="common-btn-common"
								onClick={handleCreate}
								disabled={loading}
							>
								생성
							</button>
							<button
								className="common-btn-common"
								onClick={handleExcel}
								disabled={loading}
							>
								엑셀 다운로드
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="list">
				{/* 상품 그리드 */}
				<div className="products-grid">
					{products.map((product) => (
						<div
							key={product.productId}
							className={`product-card ${
								selectedProductId === product.productId ? "selected" : ""
							}`}
						>
							{/* 상품 이미지 */}
							<div
								className="catalog-product-image"
								onClick={() => handleProductDetailOpen(product.productId)}
								style={{ cursor: "pointer" }}
							>
								<img
									src={imageUrls[product.productId] || "/images/not_ready.png"}
									alt={product.productName}
									onError={(e) => {
										e.currentTarget.src = "/images/not_ready.png";
									}}
								/>
							</div>
							{/* 상품 정보 */}
							<div className="product-info" data-product-id={product.productId}>
								<div className="product-name-row">
									<input
										type="checkbox"
										className="product-checkbox"
										checked={selectedProductId === product.productId}
										onChange={() => handleCheckboxChange(product.productId)}
										onClick={(e) => e.stopPropagation()}
									/>
									<h3
										className="product-name"
										onClick={() => handleProductDetailOpen(product.productId)}
										style={{ cursor: "pointer" }}
									>
										{product.productName}
									</h3>
								</div>
								<div className="product-details">
									{/* 무게, 재질, 색상을 한 줄로 */}
									<div className="detail-row">
										<div className="catalog-detail-item">
											<div>무게:</div>
											<div className="value">{product.productWeight}g</div>
										</div>
										<div className="catalog-detail-item">
											<div className="gold-content">
												{getGoldDonFromWeight(
													product.productWeight
												)}
												돈
											</div>
										</div>
										<div className="catalog-detail-item">
											<div>재질:</div>
											<span className="value">{product.productMaterial}</span>
										</div>
									</div>

									{/* 스톤 정보 표시 */}
									{product.productStones &&
										product.productStones.length > 0 && (
											<div className="stones-section">
												{product.productStones.map((stone) => {
													return (
														<div
															key={stone.productStoneId}
															className="stone-row"
														>
															<span className="stone-info">
																{stone.mainStone ? "M " : ""}
																{stone.stoneName} × {stone.stoneQuantity}
															</span>
														</div>
													);
												})}
											</div>
										)}
									{/* 시세가와 판매가를 한 줄로 */}
									<div className="detail-row combined price-row-combined">
										<div>
											<span className="price-label">시세가:</span>
											<span className="labor-cost">
												{(calculateTotalGoldPrice(product) + calculateTotalLaborCost(product)).toLocaleString()}
												원
											</span>
										</div>
									</div>

									<div className="detail-row combined price-row-combined">
										<div>
											<span className="price-label">판매가:</span>
											<span className="selling-price">
												{calculateTotalLaborCost(product).toLocaleString()}원
											</span>
										</div>
										{/* 스톤 총 개수 */}
										{product.productStones &&
											product.productStones.length > 0 && (
												<div className="stone-total-inline">
													<span className="total-label">스톤개수:</span>
													<span className="total-value">
														{product.productStones.reduce(
															(sum, s) => sum + s.stoneQuantity,
															0
														)}
													</span>
												</div>
											)}
									</div>
									{/* 메모 */}
									{product.productNote && (
										<div className="detail-row note">
											<span className="value">{product.productNote}</span>
										</div>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
				{/* 빈 상태 */}
				{products.length === 0 && !loading && (
					<div className="empty-state">
						<span className="empty-icon">📦</span>
						<h3>상품이 없습니다</h3>
						<p>등록된 상품이 없습니다.</p>
					</div>
				)}
				{/* BulkAction 영역 */}
				<div
					className="bulk-action-bar"
					style={{ borderTop: "1px solid #efefef" }}
				>
					<div className="bulk-action-buttons">
						<button
							className={`bulk-action-btn sales-register ${
								!selectedProductId ? "disabled" : ""
							}`}
							onClick={handleOrderRegister}
							disabled={!selectedProductId}
						>
							주문등록
						</button>
						<button
							className={`bulk-action-btn stock-register ${
								!selectedProductId ? "disabled" : ""
							}`}
							onClick={handleStockRegister}
							disabled={!selectedProductId}
						>
							재고등록
						</button>
						<button
							className={`bulk-action-btn return-register ${
								!selectedProductId ? "disabled" : ""
							}`}
							onClick={handleProductEdit}
							disabled={!selectedProductId}
						>
							수정
						</button>
					</div>
				</div>
				{/* 페이지네이션 */}
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					totalElements={totalElements}
					loading={loading}
					onPageChange={(page) => {
						setCurrentPage(page);
						loadProducts(searchFilters, page, sortOptions);
					}}
					className="catalog"
				/>
			</div>
		</div>
	);
}

export default CataLogPage;

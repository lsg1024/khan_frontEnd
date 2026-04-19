import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { catalogApi } from "../../../libs/api/catalogApi";
import { productApi } from "../../../libs/api/productApi";
import { factoryApi } from "../../../libs/api/factoryApi";
import { setTypeApi } from "../../../libs/api/setTypeApi";
import { classificationApi } from "../../../libs/api/classificationApi";
import { useErrorHandler } from "../../utils/errorHandler";
import { useToast } from "../../components/common/toast/Toast";
import {
	calculatePureGoldWeightWithHarry,
	getGoldDonFromWeight,
} from "../../utils/goldUtils";
import Pagination from "../../components/common/Pagination";
import type { ProductDto } from "../../types/productDto";
import type { SetTypeDto } from "../../types/setTypeDto";
import type { ClassificationDto } from "../../types/classificationDto";
import type { FactorySearchDto } from "../../types/factoryDto";
import {
	openProductDetailPopup,
	openProductCreatePopup,
	openProductEditPopup,
} from "../../utils/popupUtils";
import "../../styles/pages/product/CataLogPage.css";

function CataLogPage() {
	const location = useLocation();
	const [products, setProducts] = useState<ProductDto[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
	const [selectedProductId, setSelectedProductId] = useState<string | null>(
		null,
	);
	const { handleError } = useErrorHandler();
	const { showToast } = useToast();

	// 검색 관련 상태
	const [searchFilters, setSearchFilters] = useState({
		search: "",
		searchField: "",
		searchMin: "",
		searchMax: "",
	});

	// 정렬 관련 상태
	const [sortOptions, setSortOptions] = useState({
		sortField: "",
		sortOrder: "",
	});

	// 독립 필터 상태 (AND 조합)
	const [filterSetType, setFilterSetType] = useState("");
	const [filterClassification, setFilterClassification] = useState("");
	const [filterFactory, setFilterFactory] = useState("");

	// 드롭다운 데이터
	const [setTypes, setSetTypes] = useState<SetTypeDto[]>([]);
	const [classifications, setClassifications] = useState<ClassificationDto[]>([]);
	const [factories, setFactories] = useState<FactorySearchDto[]>([]);

	// 드롭다운 로딩 상태
	const [dropdownLoading, setDropdownLoading] = useState(false);

	// 가격 표시 토글 상태
	const [showMarketPrice, setShowMarketPrice] = useState(true);
	const [showSellingPrice, setShowSellingPrice] = useState(true);

	// 총 판매가 계산 (상품 판매가 + 스톤 판매가)
	const calculateTotalLaborCost = (product: ProductDto): number => {
		const productCost = parseInt(product.productLaborCost) || 0;
		const stoneCost = product.productStones
			.filter((stone) => stone.includeStone && stone.includePrice !== false)
			.reduce((sum, stone) => {
				return sum + stone.laborCost * stone.stoneQuantity;
			}, 0);
		return productCost + stoneCost;
	};

	// 총 시세가 계산 (순금 무게 * 금 시세)
	const calculateTotalGoldPrice = (product: ProductDto): number => {
		const pureGoldWeight = calculatePureGoldWeightWithHarry(
			product.productWeight,
			product.productMaterial,
		);

		const goldCost = Math.ceil(
			pureGoldWeight * (product.productGoldPrice || 0),
		);
		return goldCost;
	};

	// 상품 상세보기 팝업 열기
	const handleProductDetailOpen = (productId: string) => {
		openProductDetailPopup(productId);
	};

	// 상품 생성 팝업 열기
	const handleProductCreateOpen = () => {
		openProductCreatePopup();
	};

	// 체크박스 클릭 핸들러
	const handleCheckboxChange = (productId: string) => {
		setSelectedProductId((prev) => (prev === productId ? null : productId));
	};

	// 주문 등록 버튼
	const handleOrderRegister = () => {
		if (!selectedProductId) {
			showToast("주문 등록할 상품을 선택해주세요.", "warning", 3000);
			return;
		}
		const selectedProduct = products.find(
			(p) => p.productId === selectedProductId,
		);
		const productName = selectedProduct
			? encodeURIComponent(selectedProduct.productName)
			: "";
		const url = `/orders/create/order?productId=${selectedProductId}&productName=${productName}`;
		const features = "width=1400,height=900,resizable=yes,scrollbars=yes";
		window.open(url, "order_create", features);
	};

	// 재고 등록 버튼
	const handleStockRegister = () => {
		if (!selectedProductId) {
			showToast("재고 등록할 상품을 선택해주세요.", "warning", 3000);
			return;
		}
		const selectedProduct = products.find(
			(p) => p.productId === selectedProductId,
		);
		const productName = selectedProduct
			? encodeURIComponent(selectedProduct.productName)
			: "";
		const url = `/stocks/create/normal?productId=${selectedProductId}&productName=${productName}`;
		const features = "width=1400,height=900,resizable=yes,scrollbars=yes";
		window.open(url, "stock_create", features);
	};

	// 상품 수정 버튼
	const handleProductEdit = () => {
		if (!selectedProductId) {
			showToast("수정할 상품을 선택해주세요.", "warning", 3000);
			return;
		}
		openProductEditPopup(selectedProductId);
	};

	// 재고보기 버튼 - 선택된 상품의 재고 목록을 팝업으로 표시
	const handleStockView = () => {
		if (!selectedProductId) {
			showToast("재고를 확인할 상품을 선택해주세요.", "warning", 3000);
			return;
		}
		const selectedProduct = products.find(
			(p) => p.productId === selectedProductId,
		);
		const productName = selectedProduct
			? encodeURIComponent(selectedProduct.productName)
			: "";
		const url = `/stocks?search=${productName}&searchField=productName`;
		const features = "width=1400,height=800,resizable=yes,scrollbars=yes";
		window.open(url, "stock_view", features);
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
						error,
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
			sortOpts: typeof sortOptions = sortOptions,
			fSetType?: string,
			fClassification?: string,
			fFactory?: string,
		) => {
			setLoading(true);

			try {
				const response = await productApi.getProducts({
					search: filters.search || undefined,
					searchField: filters.searchField || undefined,
					searchMin: filters.searchMin || undefined,
					searchMax: filters.searchMax || undefined,
					sortField: sortOpts.sortField || undefined,
					sortOrder: sortOpts.sortOrder || undefined,
					page: page,
					// 독립 필터 (AND 조합)
					setType: fSetType || undefined,
					classification: fClassification || undefined,
					factory: fFactory || undefined,
				});

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
		[loadProductImages],
	);

	// 검색 필터 변경 핸들러
	const handleFilterChange = (
		field: keyof typeof searchFilters,
		value: string,
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));
	};

	// 검색 실행
	const handleSearch = () => {
		setCurrentPage(1);
		loadProducts(searchFilters, 1, sortOptions, filterSetType, filterClassification, filterFactory);
	};

	// 검색 초기화
	const handleResetSearch = () => {
		const resetFilters = {
			search: "",
			searchField: "",
			searchMin: "",
			searchMax: "",
		};
		const resetSort = {
			sortField: "",
			sortOrder: "",
		};
		setSearchFilters(resetFilters);
		setSortOptions(resetSort);
		setFilterSetType("");
		setFilterClassification("");
		setFilterFactory("");
		setCurrentPage(1);
		loadProducts(resetFilters, 1, resetSort, "", "", "");
	};

	const handleCreate = () => {
		handleProductCreateOpen();
	};

	const handleExcel = async () => {
		try {
			setLoading(true);
			const response = await catalogApi.downloadExcel(
				searchFilters.search,
				searchFilters.searchField === "classification"
					? searchFilters.search
					: undefined,
				searchFilters.searchField === "setType"
					? searchFilters.search
					: undefined,
			);

			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
			link.setAttribute("download", `상품카탈로그_${today}.xlsx`);
			document.body.appendChild(link);
			link.click();
			link.parentNode?.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	};

	// 사이드바 카탈로그 클릭 시 검색 초기화
	useEffect(() => {
		const state = location.state as { reset?: number } | null;
		if (state?.reset) {
			handleResetSearch();
			// state 소비 후 초기화 (뒤로가기 시 재트리거 방지)
			window.history.replaceState({}, document.title);
		}
	}, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

	// 드롭다운 데이터 로드
	useEffect(() => {
		const loadDropdowns = async () => {
			setDropdownLoading(true);
			try {
				const [setTypesRes, classificationsRes, factoriesRes] = await Promise.all([
					setTypeApi.getSetTypes(),
					classificationApi.getClassifications(),
					factoryApi.getFactories(undefined, 1, true), // un_page=true로 전체 데이터
				]);

				if (setTypesRes.success && setTypesRes.data) {
					setSetTypes(setTypesRes.data);
				}
				if (classificationsRes.success && classificationsRes.data) {
					setClassifications(classificationsRes.data);
				}
				if (factoriesRes.success && factoriesRes.data) {
					setFactories(factoriesRes.data.content || []);
				}
			} catch (error) {
				console.error("드롭다운 데이터 로드 실패:", error);
			} finally {
				setDropdownLoading(false);
			}
		};

		loadDropdowns();
	}, []);

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			// 서버 트랜잭션 커밋 완료 대기 후 목록 새로고침
			if (event.data?.type === "PRODUCT_CREATED") {
				setTimeout(() => {
					loadProducts(searchFilters, currentPage, sortOptions, filterSetType, filterClassification, filterFactory);
				}, 500);
			}
		};

		window.addEventListener("message", handleMessage);
		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [loadProducts, searchFilters, currentPage, sortOptions, filterSetType, filterClassification, filterFactory]);

	// 컴포넌트 마운트시 초기 데이터 로드
	useEffect(() => {
		setCurrentPage(1);
		setDropdownLoading(false);

		// 초기 로드 - 빈 필터로 전체 상품 로드
		const initialLoad = async () => {
			setLoading(true);

			try {
				const response = await productApi.getProducts({
					page: 1,
				});

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
					{/* 1행: 독립 필터 (AND 조합) */}
					<div className="filter-row-common">
						<select
							className="filter-group-common select"
							value={filterSetType}
							onChange={(e) => setFilterSetType(e.target.value)}
							disabled={dropdownLoading}
						>
							<option value="">세트타입 전체</option>
							{setTypes.map((st) => (
								<option key={st.setTypeId} value={st.setTypeId}>
									{st.setTypeName}
								</option>
							))}
						</select>

						<select
							className="filter-group-common select"
							value={filterClassification}
							onChange={(e) => setFilterClassification(e.target.value)}
							disabled={dropdownLoading}
						>
							<option value="">분류 전체</option>
							{classifications.map((cls) => (
								<option key={cls.classificationId} value={cls.classificationId}>
									{cls.classificationName}
								</option>
							))}
						</select>

						<select
							className="filter-group-common select"
							value={filterFactory}
							onChange={(e) => setFilterFactory(e.target.value)}
							disabled={dropdownLoading}
						>
							<option value="">제조사 전체</option>
							{factories.map((f) => (
								<option key={f.factoryId} value={f.factoryId}>
									{f.factoryName}
								</option>
							))}
						</select>
					</div>

					{/* 2행: 가격 토글 + 검색 필터 및 정렬 */}
					<div className="filter-row-common">
						<label className="price-toggle-label">
							<input
								type="checkbox"
								checked={showSellingPrice}
								onChange={(e) => setShowSellingPrice(e.target.checked)}
							/>
							판매가
						</label>
						<label className="price-toggle-label">
							<input
								type="checkbox"
								checked={showMarketPrice}
								onChange={(e) => setShowMarketPrice(e.target.checked)}
							/>
							시세가
						</label>

						<select
							className="filter-group-common select"
							value={searchFilters.searchField}
							onChange={(e) =>
								handleFilterChange("searchField", e.target.value)
							}
							disabled={dropdownLoading}
						>
							<option value="">검색 필터</option>
							<option value="modelNumber">모델번호</option>
							<option value="factory">제조사</option>
							<option value="note">비고</option>
							<option value="setType">세트타입</option>
							<option value="classification">분류</option>
							<option value="material">재질</option>
							<option value="standardWeight">표준중량</option>
							<option value="createDate">등록일</option>
							<option value="hasImage">사진여부</option>
						</select>

						<select
							className="filter-group-common select"
							value={sortOptions.sortField}
							onChange={(e) =>
								setSortOptions((prev) => ({
									...prev,
									sortField: e.target.value,
								}))
							}
							disabled={dropdownLoading}
						>
							<option value="">정렬 기준</option>
							<option value="productName">상품명</option>
							<option value="factory">제조사</option>
							<option value="setType">세트</option>
							<option value="classification">분류</option>
						</select>

						<select
							className="filter-group-common select"
							value={sortOptions.sortOrder}
							onChange={(e) =>
								setSortOptions((prev) => ({
									...prev,
									sortOrder: e.target.value,
								}))
							}
							disabled={dropdownLoading}
						>
							<option value="">정렬 방향</option>
							<option value="ASC">오름차순</option>
							<option value="DESC">내림차순</option>
						</select>

						{/* 범위 검색 필드 (standardWeight, createDate) */}
						{searchFilters.searchField === "standardWeight" ||
						searchFilters.searchField === "createDate" ? (
							<>
								<input
									className="search-input-common"
									type={
										searchFilters.searchField === "createDate" ? "date" : "text"
									}
									placeholder="최소값"
									value={searchFilters.searchMin}
									onChange={(e) =>
										handleFilterChange("searchMin", e.target.value)
									}
								/>
								<input
									className="search-input-common"
									type={
										searchFilters.searchField === "createDate" ? "date" : "text"
									}
									placeholder="최대값"
									value={searchFilters.searchMax}
									onChange={(e) =>
										handleFilterChange("searchMax", e.target.value)
									}
									onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								/>
							</>
						) : searchFilters.searchField === "hasImage" ? (
							<select
								className="filter-group-common select"
								value={searchFilters.search}
								onChange={(e) => handleFilterChange("search", e.target.value)}
							>
								<option value="">전체</option>
								<option value="true">있음</option>
								<option value="false">없음</option>
							</select>
						) : (
							<input
								className="search-input-common"
								type="text"
								placeholder="검색어"
								value={searchFilters.search}
								onChange={(e) => handleFilterChange("search", e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							/>
						)}

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
										{product.stockCount > 0 && (
											<span className="stock-count-badge">{product.stockCount}</span>
										)}
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
												{getGoldDonFromWeight(product.productWeight)}돈
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
									{/* 판매가와 시세가 */}
									{showSellingPrice && (
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
															{product.productStones
															.filter((s) => s.includeStone && s.includeQuantity !== false)
															.reduce(
																(sum, s) => sum + s.stoneQuantity,
																0,
															)}
														</span>
													</div>
												)}
										</div>
									)}

									{showMarketPrice && (
										<div className="detail-row combined price-row-combined">
											<div>
												<span className="price-label">시세가:</span>
												<span className="labor-cost">
													{(
														calculateTotalGoldPrice(product) +
														calculateTotalLaborCost(product)
													).toLocaleString()}
													원
												</span>
											</div>
										</div>
									)}
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
							className={`bulk-action-btn change-delivery-date ${
								!selectedProductId ? "disabled" : ""
							}`}
							onClick={handleStockView}
							disabled={!selectedProductId}
						>
							재고보기
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
						loadProducts(searchFilters, page, sortOptions, filterSetType, filterClassification, filterFactory);
					}}
					className="catalog"
				/>
			</div>
		</div>
	);
}

export default CataLogPage;

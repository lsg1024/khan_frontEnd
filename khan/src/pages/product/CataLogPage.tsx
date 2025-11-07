import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { classificationApi } from "../../../libs/api/classification";
import { productApi } from "../../../libs/api/product";
import { setTypeApi } from "../../../libs/api/setType";
import { factoryApi } from "../../../libs/api/factory";
import { useErrorHandler } from "../../utils/errorHandler";
import { getGoldTransferWeight } from "../../utils/goldUtils";
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
	const [error, setError] = useState<string>("");
	const { handleError } = useErrorHandler();
	const navigate = useNavigate();

	// 검색 관련 상태
	const [searchFilters, setSearchFilters] = useState({
		name: "",
		factory: "",
		classification: "",
		setType: "",
	});

	// 드롭다운 데이터
	const [factories, setFactories] = useState<FactorySearchDto[]>([]);
	const [classifications, setClassifications] = useState<ClassificationDto[]>(
		[]
	);
	const [setTypes, setSetTypes] = useState<SetTypeDto[]>([]);
	const [dropdownLoading, setDropdownLoading] = useState(false);

	// 총 판매가 계산 (상품 판매가 + 스톤 판매가 총합)
	const calculateTotalLaborCost = (product: ProductDto): number => {
		const productCost = parseInt(product.productLaborCost) || 0;
		const stoneCost = product.productStones.reduce((sum, stone) => {
			return sum + stone.laborCost * stone.stoneQuantity;
		}, 0);
		return productCost + stoneCost;
	};

	// 상품 상세 페이지로 이동
	const handleProductClick = (productId: string) => {
		navigate(`/catalog/${productId}`);
	};

	// 상품 데이터 로드 (검색 파라미터 포함)
	const loadProducts = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);
			setError("");

			try {
				const response = await productApi.getProducts(
					filters.name || undefined,
					filters.factory || undefined,
					filters.classification || undefined,
					filters.setType || undefined,
					page
				);

				if (response.success && response.data) {
					const pageData = response.data.page;
					const content = response.data.content || [];

					setProducts(content || []);
					setCurrentPage(page);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);
				}
			} catch (err: unknown) {
				handleError(err, setError);
				setProducts([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[handleError]
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
		loadProducts(searchFilters, 1);
	};

	// 검색 초기화
	const handleResetSearch = () => {
		const resetFilters = {
			name: "",
			factory: "",
			classification: "",
			setType: "",
		};
		setSearchFilters(resetFilters);
		setCurrentPage(1);
		loadProducts(resetFilters, 1);
	};

	const handleCreate = () => {
		navigate("/catalog/create");
	};

	const handleExcel = () => {
		alert("엑셀 다운로드 기능은 아직 구현되지 않았습니다.");
	};

	// 컴포넌트 마운트시 초기 데이터 로드
	useEffect(() => {
		setCurrentPage(1);

		// 드롭다운 데이터 로드
		const loadDropdowns = async () => {
			setDropdownLoading(true);
			try {
				const [factoriesRes, classificationsRes, setTypesRes] =
					await Promise.all([
						factoryApi.getFactories("", 1),
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
			setError("");

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
				}
			} catch (err: unknown) {
				console.error("초기 상품 로드 실패:", err);
				setError("상품 목록을 불러오는데 실패했습니다.");
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
	}, []); // 빈 의존성 배열로 한 번만 실행

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
		<div className="page">
			{/* 에러 메시지 */}
			{error && (
				<div className="error-message">
					<span>⚠️</span>
					<p>{error}</p>
				</div>
			)}

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
										value={classification.classificationName}
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
									<option key={setType.setTypeId} value={setType.setTypeName}>
										{setType.setTypeName}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className="search-controls-common">
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
							className="product-card"
							onClick={() => handleProductClick(product.productId)}
							style={{ cursor: "pointer" }}
						>
							{/* 상품 이미지 */}
							<div>
								<img
									src={
										product.productImagePath
											? `/@fs/C:/Users/zks14/Desktop/multi_module/product-service/src/main/resources${product.productImagePath}`
											: "/images/not_ready.png"
									}
									alt={product.productName}
									onError={(e) => {
										e.currentTarget.src = "/images/not_ready.png";
									}}
								/>
							</div>

							{/* 상품 정보 */}
							<div className="product-info" data-product-id={product.productId}>
								<h3 className="product-name">{product.productName}</h3>
								<div className="product-details">
									{/* 무게, 재질, 색상을 한 줄로 */}
									<div className="detail-row combined">
										<div className="detail-item">
											<div className="value">{product.productWeight}g</div>
										</div>
										<div className="detail-item">
											<div className="gold-content">
												{getGoldTransferWeight(product.productWeight)}돈
											</div>
										</div>
										<div className="detail-item">
											<span className="value">{product.productMaterial}</span>
										</div>
									</div>

									{/* 스톤 정보 표시 */}
									{product.productStones &&
										product.productStones.length > 0 && (
											<div className="stones-section">
												{product.productStones.map((stone, idx) => {
													const isLast =
														idx === product.productStones.length - 1;
													const totalCount = product.productStones.reduce(
														(sum, s) => sum + s.stoneQuantity,
														0
													);
													return (
														<div
															key={stone.productStoneId}
															className="stone-row"
														>
															<span className="stone-info">
																{stone.mainStone ? "M " : ""}
																{stone.stoneName} × {stone.stoneQuantity}
															</span>

															{/* 마지막 행에만 총계 표시 */}
															{isLast && (
																<span className="stone-total-inline">
																	<span className="total-label">
																		총 개수:&nbsp;
																	</span>
																	<span className="total-value">
																		{totalCount}
																	</span>
																</span>
															)}
														</div>
													);
												})}
											</div>
										)}
									{/* 매입가와 판매가를 한 줄로 */}
									<div className="detail-row combined price-row-combined">
										<div>
											<span className="price-label">판매가:</span>
											<span className="selling-price">
												{calculateTotalLaborCost(product).toLocaleString()}원
											</span>
										</div>
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

				{/* 페이지네이션 */}
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					totalElements={totalElements}
					loading={loading}
					onPageChange={(page) => {
						setCurrentPage(page);
						loadProducts(searchFilters, page);
					}}
					className="catalog"
				/>
			</div>
		</div>
	);
}

export default CataLogPage;

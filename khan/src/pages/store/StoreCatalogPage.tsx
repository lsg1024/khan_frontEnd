// 판매처(STORE) 전용 카탈로그 페이지
// 쇼핑몰 스타일 UI

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { catalogApi } from "../../../libs/api/catalogApi";
import { productApi } from "../../../libs/api/productApi";
import { classificationApi } from "../../../libs/api/classificationApi";
import { setTypeApi } from "../../../libs/api/setTypeApi";
import { useErrorHandler } from "../../utils/errorHandler";
import { getGoldDonFromWeight } from "../../utils/goldUtils";
import Pagination from "../../components/common/Pagination";
import type { StoreCatalogProductDto } from "../../types/storeCatalogDto";
import type { SetTypeDto } from "../../types/setTypeDto";
import type { ClassificationDto } from "../../types/classificationDto";
import "../../styles/pages/store/StoreCatalogPage.css";

function StoreCatalogPage() {
	const navigate = useNavigate();
	const [products, setProducts] = useState<StoreCatalogProductDto[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
	const { handleError } = useErrorHandler();

	// 검색 필터 상태
	const [searchFilters, setSearchFilters] = useState({
		name: "",
		classification: "",
		setType: "",
	});

	// 정렬 상태
	const [sortOptions, setSortOptions] = useState({
		sortField: "",
		sort: "",
	});

	// 활성 탭
	const [activeTab, setActiveTab] = useState("all");

	// 드롭다운 데이터
	const [classifications, setClassifications] = useState<ClassificationDto[]>([]);
	const [setTypes, setSetTypes] = useState<SetTypeDto[]>([]);
	const [dropdownLoading, setDropdownLoading] = useState(false);

	// 이미지 로드 함수
	const loadProductImages = useCallback(
		async (productList: StoreCatalogProductDto[]) => {
			const newImageUrls: Record<string, string> = {};

			for (const product of productList) {
				if (product.image?.imageId && product.image?.imagePath) {
					try {
						const blob = await productApi.getProductImageByPath(
							product.image.imagePath
						);
						const blobUrl = URL.createObjectURL(blob);
						newImageUrls[product.productId] = blobUrl;
					} catch (error) {
						console.error(
							`이미지 로드 실패 (productId: ${product.productId}):`,
							error
						);
					}
				}
			}

			setImageUrls(newImageUrls);
		},
		[]
	);

	// 상품 데이터 로드
	const loadProducts = useCallback(
		async (
			filters: typeof searchFilters,
			page: number = 1,
			sortOpts: typeof sortOptions = sortOptions
		) => {
			setLoading(true);

			try {
				const response = await catalogApi.getProducts(
					filters.name || undefined,
					undefined,
					filters.classification || undefined,
					filters.setType || undefined,
					page,
					20,
					sortOpts.sortField || undefined,
					sortOpts.sort || undefined
				);

				if (response.success && response.data) {
					const pageData = response.data.page;
					const content = response.data.content || [];

					setProducts(content);
					setCurrentPage(page);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);

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
		[loadProductImages, handleError]
	);

	// 탭 변경
	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
		if (tab === "all") {
			setSearchFilters({ name: "", classification: "", setType: "" });
			loadProducts({ name: "", classification: "", setType: "" }, 1, sortOptions);
		} else {
			// 분류 ID로 필터
			const newFilters = { ...searchFilters, classification: tab };
			setSearchFilters(newFilters);
			loadProducts(newFilters, 1, sortOptions);
		}
	};

	// 검색 필터 변경
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

	// 상품 클릭
	const handleProductClick = (productId: string) => {
		navigate(`/store/catalog/${productId}`);
	};

	// 정렬 변경
	const handleSortChange = (field: string, direction: string) => {
		const newSort = { sortField: field, sort: direction };
		setSortOptions(newSort);
		loadProducts(searchFilters, 1, newSort);
	};

	// 드롭다운 데이터 로드
	useEffect(() => {
		const loadDropdowns = async () => {
			setDropdownLoading(true);
			try {
				const [classificationsRes, setTypesRes] = await Promise.all([
					classificationApi.getClassifications(),
					setTypeApi.getSetTypes(),
				]);

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

		loadDropdowns();
	}, []);

	// 초기 데이터 로드
	useEffect(() => {
		loadProducts(searchFilters, 1, sortOptions);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="shop-catalog">
			{/* 헤더 영역 */}
			<div className="shop-header">
				<h1 className="shop-title">Product Catalog</h1>
				<p className="shop-subtitle">
					총 <strong>{totalElements.toLocaleString()}</strong>개의 상품
				</p>
			</div>

			{/* 카테고리 탭 */}
			<div className="shop-tabs">
				<button
					className={`shop-tab ${activeTab === "all" ? "active" : ""}`}
					onClick={() => handleTabChange("all")}
				>
					전체
				</button>
				{!dropdownLoading &&
					classifications.slice(0, 8).map((cls) => (
						<button
							key={cls.classificationId}
							className={`shop-tab ${activeTab === cls.classificationId ? "active" : ""}`}
							onClick={() => handleTabChange(cls.classificationId)}
						>
							{cls.classificationName}
						</button>
					))}
			</div>

			{/* 필터 & 정렬 바 */}
			<div className="shop-filter-bar">
				<div className="shop-search-box">
					<svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.35-4.35" />
					</svg>
					<input
						type="text"
						placeholder="상품명 검색"
						value={searchFilters.name}
						onChange={(e) => handleFilterChange("name", e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
					/>
				</div>

				<div className="shop-filter-options">
					<select
						value={searchFilters.setType}
						onChange={(e) => {
							handleFilterChange("setType", e.target.value);
							setTimeout(() => handleSearch(), 0);
						}}
						disabled={dropdownLoading}
					>
						<option value="">세트 타입</option>
						{setTypes.map((setType) => (
							<option key={setType.setTypeId} value={setType.setTypeId}>
								{setType.setTypeName}
							</option>
						))}
					</select>

					<select
						value={`${sortOptions.sortField}-${sortOptions.sort}`}
						onChange={(e) => {
							const [field, dir] = e.target.value.split("-");
							handleSortChange(field || "", dir || "");
						}}
					>
						<option value="-">정렬 기준</option>
						<option value="productName-asc">이름순</option>
						<option value="productName-desc">이름역순</option>
					</select>
				</div>
			</div>

			{/* 로딩 */}
			{loading && products.length === 0 && (
				<div className="shop-loading">
					<div className="shop-spinner"></div>
					<p>상품을 불러오는 중...</p>
				</div>
			)}

			{/* 상품 그리드 */}
			{!loading || products.length > 0 ? (
				<div className="shop-grid">
					{products.map((product, index) => (
						<div
							key={product.productId}
							className="shop-card"
							onClick={() => handleProductClick(product.productId)}
						>
							{/* 순위 배지 */}
							{currentPage === 1 && index < 10 && (
								<span className="shop-rank">{index + 1}</span>
							)}

							{/* 이미지 */}
							<div className="shop-card-image">
								{imageUrls[product.productId] ? (
									<img
										src={imageUrls[product.productId]}
										alt={product.productName}
									/>
								) : (
									<div className="shop-no-image">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
											<rect x="3" y="3" width="18" height="18" rx="2" />
											<circle cx="8.5" cy="8.5" r="1.5" />
											<path d="m21 15-5-5L5 21" />
										</svg>
									</div>
								)}

								{/* 재질 뱃지 */}
								{product.productMaterial && (
									<span className="shop-material-tag">
										{product.productMaterial}
									</span>
								)}
							</div>

							{/* 상품 정보 */}
							<div className="shop-card-info">
								<h3 className="shop-card-name">{product.productName}</h3>

								{/* 무게 */}
								<div className="shop-card-weight">
									<span className="weight-value">
										{getGoldDonFromWeight(product.productWeight)}돈
									</span>
									<span className="weight-gram">
										({product.productWeight}g)
									</span>
								</div>

								{/* 스톤 */}
								{product.productStones && product.productStones.length > 0 && (
									<div className="shop-card-stones">
										{product.productStones.slice(0, 2).map((stone) => (
											<span
												key={stone.productStoneId}
												className={`stone-chip ${stone.mainStone ? "main" : ""}`}
											>
												{stone.stoneName}
											</span>
										))}
										{product.productStones.length > 2 && (
											<span className="stone-more">
												+{product.productStones.length - 2}
											</span>
										)}
									</div>
								)}

								{/* 메모 */}
								{product.productNote && (
									<p className="shop-card-note">{product.productNote}</p>
								)}
							</div>
						</div>
					))}
				</div>
			) : null}

			{/* 빈 상태 */}
			{products.length === 0 && !loading && (
				<div className="shop-empty">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
						<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
					</svg>
					<h3>상품이 없습니다</h3>
					<p>검색 조건을 변경해 보세요</p>
				</div>
			)}

			{/* 페이지네이션 */}
			{totalPages > 1 && (
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					totalElements={totalElements}
					loading={loading}
					onPageChange={(page) => {
						setCurrentPage(page);
						loadProducts(searchFilters, page, sortOptions);
						window.scrollTo({ top: 0, behavior: "smooth" });
					}}
					className="shop-pagination"
				/>
			)}
		</div>
	);
}

export default StoreCatalogPage;

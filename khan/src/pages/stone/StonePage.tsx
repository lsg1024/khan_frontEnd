import { useState, useEffect, useCallback } from "react";
import { stoneApi } from "../../../libs/api/stoneApi";
import { stoneShapeApi } from "../../../libs/api/stoneShapeApi";
import { stoneTypeApi } from "../../../libs/api/stoneTypeApi";
import type { StoneShapeDto } from "../../types/stoneShapeDto";
import type { StoneTypeDto } from "../../types/stoneTypeDto";
import { isApiSuccess } from "../../../libs/api/config";
import type {
	StoneSearchDto,
	ProductStoneDto,
	ProductInfo,
} from "../../types/stoneDto";
import type { PageInfo } from "../../types/pageDto";
import StoneListTable from "../../components/common/stone/StoneListTable";
import StoneSearchBar, {
	type StoneSearchFilters,
} from "../../components/common/stone/StoneSearchBar";
import Pagination from "../../components/common/Pagination";
import { AuthImage } from "../../components/common/AuthImage";
import { useErrorHandler } from "../../utils/errorHandler";
import {
	openStoneCreatePopup,
	openProductDetailPopup,
} from "../../utils/popupUtils";
import "../../styles/pages/stone/StonePage.css";

const convertToProductStone = (stone: StoneSearchDto): ProductStoneDto => {
	return {
		productStoneId: stone.stoneId, // stoneId를 productStoneId로 사용
		stoneId: stone.stoneId,
		stoneName: stone.stoneName,
		stoneWeight: stone.stoneWeight,
		mainStone: false, // 기본값
		includeStone: true, // 기본값
		stonePurchase: stone.stonePurchasePrice,
		stoneQuantity: 1, // 기본값
		productStoneNote: stone.stoneNote || "",
		stoneWorkGradePolicyDtos: stone.stoneWorkGradePolicyDto || [],
		productCount: stone.productCount,
		productInfos: stone.productInfos,
	};
};

export const StonePage = () => {
	const [stones, setStones] = useState<ProductStoneDto[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [dropdownLoading, setDropdownLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [pageInfo, setPageInfo] = useState<PageInfo>({
		size: 10,
		number: 1,
		totalElements: 0,
		totalPages: 0,
	});
	const [showProductModal, setShowProductModal] = useState<boolean>(false);
	const [selectedProducts, setSelectedProducts] = useState<ProductInfo[]>([]);
	const [stoneShapes, setStoneShapes] = useState<StoneShapeDto[]>([]);
	const [stoneTypes, setStoneTypes] = useState<StoneTypeDto[]>([]);

	const { handleError } = useErrorHandler();

	// 검색 필터 상태
	const [searchFilters, setSearchFilters] = useState<StoneSearchFilters>({
		search: "",
		stoneType: "",
		stoneShape: "",
		sortField: "",
		sortOrder: "",
	});

	// 검색 필터 변경 핸들러
	const handleFilterChange = <K extends keyof StoneSearchFilters>(
		field: K,
		value: StoneSearchFilters[K]
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));
	};

	// 스톤 목록 로드
	const loadStones = useCallback(
		async (filters: StoneSearchFilters, page: number = 1) => {
			setDropdownLoading(true);
			try {
				setLoading(true);

				const response = await stoneApi.getStones(
					filters.search,
					page,
					20,
					filters.stoneShape,
					filters.stoneType,
					filters.sortField,
					filters.sortOrder
				);

				if (isApiSuccess(response) && response.data) {
					const convertedStones = response.data.content.map((stone) =>
						convertToProductStone(stone)
					);
					setStones(convertedStones);
					setPageInfo(response.data.page);
					setCurrentPage(page);
				} else {
					handleError(new Error("스톤 목록을 불러올 수 없습니다."));
				}
			} catch (err: unknown) {
				handleError(err);
			} finally {
				setLoading(false);
				setDropdownLoading(false);
			}
		},
		[]
	); // eslint-disable-line react-hooks/exhaustive-deps

	// 스톤 모양, 스톤 종류 로드
	const fetchDropdownData = useCallback(async () => {
		setDropdownLoading(true);
		try {
			const [shapesRes, typesRes] = await Promise.all([
				stoneShapeApi.getStoneShapes(),
				stoneTypeApi.getStoneTypes(),
			]);
			if (isApiSuccess(shapesRes) && shapesRes.data) {
				setStoneShapes(shapesRes.data);
			}
			if (isApiSuccess(typesRes) && typesRes.data) {
				setStoneTypes(typesRes.data);
			}
		} catch (err: unknown) {
			handleError(err);
		} finally {
			setDropdownLoading(false);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSearch = () => {
		setCurrentPage(1);
		loadStones(searchFilters, 1);
	};

	// 검색어 초기화
	const handleClearSearch = () => {
		const clearedFilters: StoneSearchFilters = {
			search: "",
			stoneType: "",
			stoneShape: "",
			sortField: "",
			sortOrder: "",
		};
		setSearchFilters(clearedFilters);
		setCurrentPage(1);
		loadStones(clearedFilters, 1);
	};

	// 스톤 생성 핸들러
	const handleCreateStone = () => {
		openStoneCreatePopup();
	};

	// 엑셀 다운로드 핸들러 (임시로 alert 사용)
	const handleDownExcel = () => {
		alert("엑셀 다운로드 기능은 아직 구현되지 않았습니다.");
	};

	// 상품 목록 팝업 열기
	const handleProductListClick = (
		stoneId: string,
		productInfos: ProductInfo[]
	) => {
		const url = `/stone/${stoneId}/products`;
		const NAME = `stone_products_${stoneId}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=800,height=600";

		const popup = window.open(url, NAME, FEATURES);
		if (popup) {
			// 팝업에 데이터 전달
			setTimeout(() => {
				popup.postMessage(
					{ type: "STONE_PRODUCTS_DATA", productInfos },
					window.location.origin
				);
			}, 500);
		} else {
			alert("팝업 차단을 해제해주세요.");
		}
	};

	// 모달 닫기
	const handleCloseModal = () => {
		setShowProductModal(false);
		setSelectedProducts([]);
	};

	// 상품 상세 페이지 열기
	const handleProductClick = (productId: number) => {
		openProductDetailPopup(String(productId));
	};

	// 페이지 변경 핸들러
	const handlePageChange = (page: number) => {
		loadStones(searchFilters, page);
	};

	useEffect(() => {
		const initialFilters: StoneSearchFilters = {
			search: "",
			stoneType: "",
			stoneShape: "",
			sortField: "",
			sortOrder: "",
		};
		loadStones(initialFilters, 1);
		fetchDropdownData();
	}, [loadStones, fetchDropdownData]);

	useEffect(() => {
		const onMessage = (e: MessageEvent) => {
			if (e.origin !== window.location.origin) return;
			// 서버 트랜잭션 커밋 완료 대기 후 목록 새로고침
			if (e.data && e.data.type === "STONE_CREATED") {
				setTimeout(() => loadStones(searchFilters, currentPage), 500);
			}
			if (e.data && e.data.type === "STONE_UPDATED") {
				setTimeout(() => loadStones(searchFilters, currentPage), 500);
			}
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [loadStones, searchFilters, currentPage]);

	return (
		<div className="page">
			{/* 검색 섹션 */}
			<StoneSearchBar
				filters={searchFilters}
				stoneShapes={stoneShapes}
				stoneTypes={stoneTypes}
				loading={loading}
				dropdownLoading={dropdownLoading}
				onFilterChange={handleFilterChange}
				onSearch={handleSearch}
				onClear={handleClearSearch}
				onCreate={handleCreateStone}
				onDownloadExcel={handleDownExcel}
			/>

			{/* 로딩 상태 */}
			{loading && (
				<div className="loading-container">
					<div className="spinner"></div>
					<p>스톤 정보를 불러오는 중...</p>
				</div>
			)}

			{/* 스톤 목록 */}
			<div className="list">
				{!loading && (
					<>
						<StoneListTable
							stones={stones}
							showTitle={false}
							showTotalRow={true}
							currentPage={currentPage}
							pageSize={pageInfo.size}
							onProductListClick={handleProductListClick}
						/>

						{/* 페이지네이션 */}
						{pageInfo.totalPages > 0 && (
							<Pagination
								currentPage={currentPage}
								totalPages={pageInfo.totalPages}
								totalElements={pageInfo.totalElements}
								onPageChange={handlePageChange}
							/>
						)}
					</>
				)}
			</div>

			{/* 데이터가 없는 경우 */}
			{!loading && stones.length === 0 && (
				<div className="no-data-container">
					<p>검색 결과가 없습니다.</p>
					{searchFilters.search && (
						<button onClick={handleClearSearch} className="clear-search-button">
							전체 목록 보기
						</button>
					)}
				</div>
			)}

			{/* 상품 목록 모달 */}
			{showProductModal && (
				<div className="modal-overlay" onClick={handleCloseModal}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h2>스톤 사용 상품 목록</h2>
							<button className="modal-close-btn" onClick={handleCloseModal}>
								✕
							</button>
						</div>
						<div className="modal-body">
							{selectedProducts.length === 0 ? (
								<div className="no-products">
									<p>이 스톤을 사용하는 상품이 없습니다.</p>
								</div>
							) : (
								<div className="products-grid">
									{selectedProducts.map((product) => (
										<div
											key={product.productId}
											className="product-card"
											onClick={() => handleProductClick(product.productId)}
										>
											<div className="product-image-wrapper">
												<AuthImage
													imagePath={product.imagePath}
													alt={product.productName}
													className="product-image"
												/>
											</div>
											<div className="product-info">
												<h3
													className="product-name"
													title={product.productName}
												>
													{product.productName}
												</h3>
												<p className="product-id">ID: {product.productId}</p>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
						<div className="modal-footer">
							<button
								className="modal-close-footer-btn"
								onClick={handleCloseModal}
							>
								닫기
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default StonePage;

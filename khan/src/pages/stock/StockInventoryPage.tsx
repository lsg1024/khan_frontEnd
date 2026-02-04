// 재고 조사 페이지
import { useState, useEffect, useCallback } from "react";
import { stockApi } from "../../../libs/api/stockApi";
import { useErrorHandler } from "../../utils/errorHandler";
import { useToast } from "../../components/common/toast/Toast";
import Pagination from "../../components/common/Pagination";
import BulkActionBar from "../../components/common/BulkActionBar";
import InventoryStockDetailModal from "../../components/stock/InventoryStockDetailModal";
import type {
	InventoryItem,
	InventoryStatisticsResponse,
} from "../../types/stockDto";
import "../../styles/pages/stock/StockInventoryPage.css";
import "../../styles/components/search/SearchModal.css";

type StockCheckedFilter = "all" | "checked" | "unchecked";
type OrderStatusFilter = "" | "STOCK" | "RENTAL" | "RETURN" | "NORMAL";
type SortField =
	| ""
	| "stockCheckedAt"
	| "createAt"
	| "productName"
	| "colorName"
	| "materialName"
	| "goldWeight"
	| "productPurchaseCost"
	| "productLaborCost";
type SortOrder = "ASC" | "DESC";
type SearchField = "" | "productName" | "materialName" | "colorName";

function StockInventoryPage() {
	const { handleError } = useErrorHandler();
	const { showToast } = useToast();

	// 목록 상태
	const [items, setItems] = useState<InventoryItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);

	// 선택 상태
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
	const [selectAll, setSelectAll] = useState(false);

	// 필터 상태
	const [stockChecked, setStockChecked] = useState<StockCheckedFilter>("all");
	const [orderStatus, setOrderStatus] = useState<OrderStatusFilter>("");
	const [materialName, setMaterialName] = useState("");
	const [sortField, setSortField] = useState<SortField>("");
	const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");
	const [searchField, setSearchField] = useState<SearchField>("");
	const [searchValue, setSearchValue] = useState("");

	// 드롭다운 데이터
	const [materials, setMaterials] = useState<string[]>([]);

	// 통계 상태
	const [statistics, setStatistics] =
		useState<InventoryStatisticsResponse | null>(null);

	// 상세 모달 상태
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [selectedFlowCode, setSelectedFlowCode] = useState<string | null>(null);

	// No 클릭 핸들러 - 상세 모달 열기
	const handleNoClick = (flowCode: string) => {
		setSelectedFlowCode(flowCode);
		setIsDetailModalOpen(true);
	};

	// 상세 모달 닫기
	const handleCloseDetailModal = () => {
		setIsDetailModalOpen(false);
		setSelectedFlowCode(null);
	};

	// 합계 계산
	const totals = items.reduce(
		(acc, item) => ({
			goldWeight: acc.goldWeight + parseFloat(item.goldWeight || "0"),
			purchaseCost: acc.purchaseCost + (item.productPurchaseCost || 0),
			laborCost: acc.laborCost + (item.productLaborCost || 0),
		}),
		{ goldWeight: 0, purchaseCost: 0, laborCost: 0 },
	);

	// 반납 버튼 활성화 조건: 정확히 1개 선택 + 대여 상태
	const isReturnEnabled = (() => {
		if (selectedItems.size !== 1) return false;
		const selectedFlowCode = Array.from(selectedItems)[0];
		const selectedItem = items.find((item) => item.flowCode === selectedFlowCode);
		return selectedItem?.orderStatus?.includes("대여") ?? false;
	})();

	// 재고 조사 목록 로드
	const loadInventory = useCallback(
		async (page: number = 0) => {
			setLoading(true);
			try {
				const response = await stockApi.getInventory(
					searchField || undefined,
					searchValue || undefined,
					sortField || undefined,
					sortOrder,
					stockChecked,
					orderStatus || undefined,
					materialName || undefined,
					page,
					40,
				);

				if (response.success && response.data) {
					setItems(response.data.content || []);
					setCurrentPage(response.data.number);
					setTotalPages(response.data.totalPages || 1);
					setTotalElements(response.data.totalElements || 0);
					setSelectedItems(new Set());
					setSelectAll(false);
				}
			} catch (err) {
				handleError(err);
				setItems([]);
			} finally {
				setLoading(false);
			}
		},
		[
			handleError,
			stockChecked,
			orderStatus,
			materialName,
			sortField,
			sortOrder,
			searchField,
			searchValue,
		],
	);

	// 재질 필터 로드
	const loadMaterialFilters = useCallback(async () => {
		try {
			const response = await stockApi.getInventoryMaterialFilters();
			if (response.success && response.data) {
				setMaterials(response.data);
			}
		} catch (err) {
			console.error("재질 필터 로드 실패:", err);
		}
	}, []);

	// 통계 로드
	const loadStatistics = useCallback(async () => {
		try {
			const response = await stockApi.getInventoryStatistics();
			if (response.success && response.data) {
				setStatistics(response.data);
			}
		} catch (err) {
			console.error("통계 로드 실패:", err);
		}
	}, []);

	// 재고 조사 준비 (초기화)
	const handlePrepareInventory = async () => {
		if (
			!window.confirm(
				"모든 재고의 조사 상태를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
			)
		) {
			return;
		}

		try {
			const response = await stockApi.prepareInventory();
			if (response.success && response.data) {
				showToast(
					`${response.data.resetCount}개 항목이 초기화되었습니다.`,
					"success",
				);
				loadInventory(0);
				loadStatistics();
			}
		} catch (err) {
			handleError(err);
		}
	};

	// 바코드 스캔 팝업 열기
	const handleOpenBarcodePopup = () => {
		const width = 600;
		const height = 700;
		const left = (window.screen.width - width) / 2;
		const top = (window.screen.height - height) / 2;

		window.open(
			"/stocks/inventory/barcode",
			"inventory-barcode",
			`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
		);
	};

	// 선택 항목 재고 조사 처리
	const handleBulkCheck = async () => {
		if (selectedItems.size === 0) {
			showToast("선택된 항목이 없습니다.", "warning");
			return;
		}

		const flowCodes = Array.from(selectedItems);
		let successCount = 0;
		let errorCount = 0;

		for (const flowCode of flowCodes) {
			try {
				const response = await stockApi.checkInventory(flowCode);
				if (response.success && response.data?.status === "SUCCESS") {
					successCount++;
				} else {
					errorCount++;
				}
			} catch {
				errorCount++;
			}
		}

		showToast(
			`재고 조사 완료: 성공 ${successCount}건, 실패/중복 ${errorCount}건`,
			successCount > 0 ? "success" : "warning",
		);

		loadInventory(currentPage);
		loadStatistics();
	};

	// 선택 항목 반납 처리
	const handleBulkReturn = async () => {
		if (selectedItems.size === 0) {
			showToast("선택된 항목이 없습니다.", "warning");
			return;
		}

		if (
			!window.confirm(
				`선택한 ${selectedItems.size}개 항목을 반납 처리하시겠습니까?`,
			)
		) {
			return;
		}

		const flowCodes = Array.from(selectedItems);
		let successCount = 0;

		for (const flowCode of flowCodes) {
			try {
				const response = await stockApi.updateRentalToReturn(
					flowCode,
					"return",
				);
				if (response.success) {
					successCount++;
				}
			} catch {
				// ignore
			}
		}

		showToast(`${successCount}개 항목이 반납 처리되었습니다.`, "success");
		loadInventory(currentPage);
		loadStatistics();
	};

	// 선택 항목 삭제 처리
	const handleBulkDelete = async () => {
		if (selectedItems.size === 0) {
			showToast("선택된 항목이 없습니다.", "warning");
			return;
		}

		if (
			!window.confirm(
				`선택한 ${selectedItems.size}개 항목을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
			)
		) {
			return;
		}

		const flowCodes = Array.from(selectedItems);
		let successCount = 0;

		for (const flowCode of flowCodes) {
			try {
				const response = await stockApi.deleteStock(flowCode);
				if (response.success) {
					successCount++;
				}
			} catch {
				// ignore
			}
		}

		showToast(`${successCount}개 항목이 삭제되었습니다.`, "success");
		loadInventory(currentPage);
		loadStatistics();
	};

	// 전체 선택/해제
	const handleSelectAll = () => {
		if (selectAll) {
			setSelectedItems(new Set());
		} else {
			const allCodes = items.map((item) => item.flowCode);
			setSelectedItems(new Set(allCodes));
		}
		setSelectAll(!selectAll);
	};

	// 개별 선택
	const handleSelectItem = (flowCode: string) => {
		const newSelected = new Set(selectedItems);
		if (newSelected.has(flowCode)) {
			newSelected.delete(flowCode);
		} else {
			newSelected.add(flowCode);
		}
		setSelectedItems(newSelected);
		setSelectAll(newSelected.size === items.length);
	};

	// 검색 실행
	const handleSearch = () => {
		loadInventory(0);
	};

	// 새로고침
	const handleRefresh = () => {
		loadInventory(currentPage);
		loadStatistics();
	};

	// 페이지 변경
	const handlePageChange = (page: number) => {
		loadInventory(page - 1); // Pagination은 1부터 시작, API는 0부터
	};

	// 초기 로드
	useEffect(() => {
		loadInventory(0);
		loadMaterialFilters();
		loadStatistics();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// 필터 변경 시 재로드
	useEffect(() => {
		loadInventory(0);
	}, [stockChecked, orderStatus, materialName, sortField, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

	// 날짜 포맷
	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return "-";
		const date = new Date(dateStr);
		return date.toLocaleString("ko-KR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="inventory-page">
			{/* 필터 영역 */}
			<div className="search-section-common">
				<div className="search-filters-common">
					{/* 1행: 드롭다운 필터들 */}
					<div className="filter-row-common">
						<div className="filter-group-common">
							<select
								value={stockChecked}
								onChange={(e) =>
									setStockChecked(e.target.value as StockCheckedFilter)
								}
							>
								<option value="all">조사여부</option>
								<option value="unchecked">미조사</option>
								<option value="checked">조사완료</option>
							</select>
						</div>

						<div className="filter-group-common">
							<select
								value={orderStatus}
								onChange={(e) =>
									setOrderStatus(e.target.value as OrderStatusFilter)
								}
							>
								<option value="">재고구분</option>
								<option value="NORMAL">일반</option>
								<option value="STOCK">재고</option>
								<option value="RENTAL">대여</option>
								<option value="RETURN">반납</option>
							</select>
						</div>

						<div className="filter-group-common">
							<select
								value={materialName}
								onChange={(e) => setMaterialName(e.target.value)}
							>
								<option value="">재질</option>
								{materials.map((mat) => (
									<option key={mat} value={mat}>
										{mat}
									</option>
								))}
							</select>
						</div>

						<div className="filter-group-common">
							<select
								value={sortField}
								onChange={(e) => setSortField(e.target.value as SortField)}
							>
								<option value="">정렬 기준</option>
								<option value="createAt">등록일</option>
								<option value="stockCheckedAt">조사일</option>
								<option value="productName">상품명</option>
								<option value="materialName">재질</option>
								<option value="colorName">색상</option>
								<option value="goldWeight">중량</option>
								<option value="productPurchaseCost">매입가</option>
								<option value="productLaborCost">공임</option>
							</select>
						</div>

						<div className="filter-group-common">
							<select
								value={sortOrder}
								onChange={(e) => setSortOrder(e.target.value as SortOrder)}
							>
								<option value="DESC">내림차순</option>
								<option value="ASC">오름차순</option>
							</select>
						</div>
					</div>

					{/* 2행: 검색, 버튼들 */}
					<div className="search-controls-common">
						<div className="filter-group-common">
							<select
								value={searchField}
								onChange={(e) => setSearchField(e.target.value as SearchField)}
							>
								<option value="">검색 필드</option>
								<option value="productName">상품명</option>
								<option value="materialName">재질</option>
								<option value="colorName">색상</option>
							</select>
						</div>

						<input
							type="text"
							placeholder="검색..."
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							className="search-input-common"
						/>

						<div className="search-buttons-common">
							<button className="search-btn-common" onClick={handleSearch}>
								검색
							</button>
							<button className="reset-btn-common" onClick={handleRefresh}>
								초기화
							</button>
							<button className="common-btn-common" onClick={handleOpenBarcodePopup}>
								재고조사
							</button>
							<button className="delete-btn-common" onClick={handlePrepareInventory}>
								조사 초기화
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* 테이블 */}
			<div className="inventory-table-wrapper">
				{loading ? (
					<div className="inventory-loading">
						<div className="spinner"></div>
						<p>로딩 중...</p>
					</div>
				) : items.length === 0 ? (
					<div className="inventory-empty">
						<p>재고 데이터가 없습니다</p>
					</div>
				) : (
					<table className="inventory-table">
						<thead>
							<tr>
								<th className="col-checkbox">
									<input
										type="checkbox"
										checked={selectAll}
										onChange={handleSelectAll}
									/>
								</th>
								<th className="col-no">No</th>
								<th className="col-status">조사</th>
								<th className="col-code">고유 번호</th>
								<th className="col-product">상품명</th>
								<th className="col-material">재질</th>
								<th className="col-color">색상</th>
								<th className="col-weight">중량</th>
								<th className="col-cost">매입가</th>
								<th className="col-labor">공임</th>
								<th className="col-type">구분</th>
								<th className="col-date">등록일</th>
								<th className="col-date">조사일</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item, index) => (
								<tr
									key={item.flowCode}
									className={selectedItems.has(item.flowCode) ? "selected" : ""}
								>
									<td className="col-checkbox">
										<input
											type="checkbox"
											checked={selectedItems.has(item.flowCode)}
											onChange={() => handleSelectItem(item.flowCode)}
										/>
									</td>
									<td className="col-no">
										<button
											className="no-btn"
											onClick={() => handleNoClick(item.flowCode)}
										>
											{index + 1}
										</button>
									</td>
									<td className="col-status">
										<span
											className={`status-badge ${item.stockChecked ? "checked" : "unchecked"}`}
										>
											{item.stockChecked ? "완료" : "미조사"}
										</span>
									</td>
									<td className="col-code">{item.flowCode}</td>
									<td className="col-product">{item.productName}</td>
									<td className="col-material">{item.materialName}</td>
									<td className="col-color">{item.colorName || "-"}</td>
									<td className="col-weight">{item.goldWeight}g</td>
									<td className="col-cost">
										{item.productPurchaseCost?.toLocaleString()}원
									</td>
									<td className="col-labor">
										{item.productLaborCost?.toLocaleString()}원
									</td>
									<td className="col-type">{item.orderStatus}</td>
									<td className="col-date">{formatDate(item.createAt)}</td>
									<td className="col-date">
										{formatDate(item.stockCheckedAt)}
									</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr className="totals-row">
								<td colSpan={7} className="totals-label"></td>
								<td className="col-weight totals-value">{totals.goldWeight.toFixed(3)}g</td>
								<td className="col-cost totals-value">{totals.purchaseCost.toLocaleString()}원</td>
								<td className="col-labor totals-value">{totals.laborCost.toLocaleString()}원</td>
								<td colSpan={3}></td>
							</tr>
						</tfoot>
					</table>
				)}

				{/* Bulk Action Bar */}
				<BulkActionBar
					selectedCount={selectedItems.size}
					actions={[
						{
							label: "재고조사",
							onClick: handleBulkCheck,
							className: "inventory-check",
						},
						{
							label: "반납",
							onClick: handleBulkReturn,
							className: "return-register",
							disabled: !isReturnEnabled,
						},
						{ label: "삭제", onClick: handleBulkDelete, className: "delete" },
					]}
				/>
			</div>


			{/* 페이지네이션 */}
			{totalPages > 1 && (
				<Pagination
					currentPage={currentPage + 1}
					totalPages={totalPages}
					totalElements={totalElements}
					loading={loading}
					onPageChange={handlePageChange}
				/>
			)}

			{/* 통계 영역 */}
			{statistics && (
				<div className="inventory-statistics">
					<div className="statistics-table-wrapper">
						<h3 className="statistics-title unchecked-title">
							검사하지 않은 재질별 통계
						</h3>
						<table className="statistics-table">
							<thead>
								<tr>
									<th>No</th>
									<th>재질</th>
									<th>중량</th>
									<th>수량</th>
									<th>매입가</th>
								</tr>
							</thead>
							<tbody>
								{statistics.uncheckedStatistics.map((stat, idx) => (
									<tr key={idx}>
										<td>{idx + 1}</td>
										<td>{stat.materialName}</td>
										<td>{stat.totalGoldWeight}</td>
										<td>{stat.quantity}</td>
										<td>{stat.totalPurchaseCost.toLocaleString()}</td>
									</tr>
								))}
								<tr className="summary-row">
									<td colSpan={2}>합계</td>
									<td>{statistics.uncheckedSummary.totalGoldWeight}</td>
									<td>{statistics.uncheckedSummary.totalQuantity}</td>
									<td>
										{statistics.uncheckedSummary.totalPurchaseCost.toLocaleString()}
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div className="statistics-table-wrapper">
						<h3 className="statistics-title checked-title">
							검사한 재질별 통계
						</h3>
						<table className="statistics-table">
							<thead>
								<tr>
									<th>No</th>
									<th>재질</th>
									<th>중량</th>
									<th>수량</th>
									<th>매입가</th>
								</tr>
							</thead>
							<tbody>
								{statistics.checkedStatistics.map((stat, idx) => (
									<tr key={idx}>
										<td>{idx + 1}</td>
										<td>{stat.materialName}</td>
										<td>{stat.totalGoldWeight}</td>
										<td>{stat.quantity}</td>
										<td>{stat.totalPurchaseCost.toLocaleString()}</td>
									</tr>
								))}
								<tr className="summary-row">
									<td colSpan={2}>합계</td>
									<td>{statistics.checkedSummary.totalGoldWeight}</td>
									<td>{statistics.checkedSummary.totalQuantity}</td>
									<td>
										{statistics.checkedSummary.totalPurchaseCost.toLocaleString()}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* 재고 상세 모달 */}
			<InventoryStockDetailModal
				isOpen={isDetailModalOpen}
				flowCode={selectedFlowCode}
				onClose={handleCloseDetailModal}
			/>
		</div>
	);
}

export default StockInventoryPage;

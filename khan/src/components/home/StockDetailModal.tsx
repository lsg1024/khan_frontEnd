import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns/format";
import {
	getStockDetails,
	getStockFilterOptions,
} from "../../../libs/api/dashboardApi";
import type {
	StockDetail,
	StockDetailPage,
	StockFilterOption,
	StockDetailSearchParams,
} from "../../types/dashboardDto";
import Pagination from "../common/Pagination";

interface StockDetailModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const StockDetailModal = ({ isOpen, onClose }: StockDetailModalProps) => {
	const [stockDetails, setStockDetails] = useState<StockDetail[]>([]);
	const [loading, setLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const PAGE_SIZE = 20;

	const [searchProductName, setSearchProductName] = useState("");
	const [selectedMaterial, setSelectedMaterial] = useState("");
	const [selectedColor, setSelectedColor] = useState("");
	const [selectedStore, setSelectedStore] = useState("");

	const [filterOptions, setFilterOptions] = useState<StockFilterOption>({
		materials: [],
		colors: [],
		stores: [],
	});

	const fetchFilterOptions = useCallback(async () => {
		try {
			const response = await getStockFilterOptions();
			if (response.success && response.data) {
				setFilterOptions(response.data);
			}
		} catch (error) {
			console.error("필터 옵션 조회 실패:", error);
		}
	}, []);

	const fetchStockDetails = useCallback(
		async (page: number) => {
			setLoading(true);
			try {
				const params: StockDetailSearchParams = {
					page: page - 1,
					size: PAGE_SIZE,
				};

				if (searchProductName.trim()) {
					params.productName = searchProductName.trim();
				}
				if (selectedMaterial) {
					params.materialName = selectedMaterial;
				}
				if (selectedColor) {
					params.colorName = selectedColor;
				}
				if (selectedStore) {
					params.storeName = selectedStore;
				}

				const response = await getStockDetails(params);
				if (response.success && response.data) {
					const pageData = response.data as StockDetailPage;
					setStockDetails(pageData.content || []);
					setTotalPages(pageData.totalPages || 0);
					setTotalElements(pageData.totalElements || 0);
					setCurrentPage((pageData.number || 0) + 1);
				}
			} catch (error) {
				console.error("재고 상세 조회 실패:", error);
				setStockDetails([]);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[searchProductName, selectedMaterial, selectedColor, selectedStore]
	);

	useEffect(() => {
		if (isOpen) {
			setSearchProductName("");
			setSelectedMaterial("");
			setSelectedColor("");
			setSelectedStore("");
			setCurrentPage(1);
			fetchFilterOptions();
			fetchStockDetails(1);
		}
	}, [isOpen, fetchFilterOptions]);

	useEffect(() => {
		if (isOpen) {
			fetchStockDetails(1);
		}
	}, [selectedMaterial, selectedColor, selectedStore]);

	const handlePageChange = (page: number) => {
		fetchStockDetails(page);
	};

	const handleSearch = () => {
		fetchStockDetails(1);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	if (!isOpen) return null;

	const formatDate = (dateStr: string) => {
		if (!dateStr) return "-";
		try {
			const date = new Date(dateStr);
			return format(date, "yy-MM-dd");
		} catch {
			return "-";
		}
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="modal-content modal-content-lg"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-header">
					<h2>재고 상세보기</h2>
					<button className="modal-close-button" onClick={onClose}>
						×
					</button>
				</div>
				<div className="modal-body">
					<div className="stock-detail-filters">
						<div className="filter-row">
							<div className="search-input-group">
								<input
									type="text"
									placeholder="모델번호 검색"
									value={searchProductName}
									onChange={(e) => setSearchProductName(e.target.value)}
									onKeyDown={handleKeyDown}
									className="search-input"
								/>
								<button onClick={handleSearch} className="search-btn">
									검색
								</button>
							</div>
							<div className="filter-select-group">
								<select
									value={selectedMaterial}
									onChange={(e) => setSelectedMaterial(e.target.value)}
									className="filter-select"
								>
									<option value="">재질 전체</option>
									{filterOptions.materials.map((material) => (
										<option key={material} value={material}>
											{material}
										</option>
									))}
								</select>
								<select
									value={selectedColor}
									onChange={(e) => setSelectedColor(e.target.value)}
									className="filter-select"
								>
									<option value="">색상 전체</option>
									{filterOptions.colors.map((color) => (
										<option key={color} value={color}>
											{color}
										</option>
									))}
								</select>
								<select
									value={selectedStore}
									onChange={(e) => setSelectedStore(e.target.value)}
									className="filter-select"
								>
									<option value="">판매처 전체</option>
									{filterOptions.stores.map((store) => (
										<option key={store} value={store}>
											{store}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>

					{loading ? (
						<div className="loading-message">로딩 중...</div>
					) : (
						<>
							<div className="stock-detail-table-container">
								<table className="table stock-detail-table">
									<thead>
										<tr>
											<th>No</th>
											<th>시리얼</th>
											<th>입고일</th>
											<th>모델번호</th>
											<th>재질</th>
											<th>색상</th>
											<th>사이즈</th>
											<th>금중량</th>
											<th>알중량</th>
											<th>공장</th>
											<th>판매처</th>
											<th>상태</th>
										</tr>
									</thead>
									<tbody>
										{stockDetails.length > 0 ? (
											stockDetails.map((stock, index) => (
												<tr key={stock.flowCode || index}>
													<td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
													<td>{stock.flowCode || "-"}</td>
													<td>{formatDate(stock.createAt)}</td>
													<td>{stock.productName || "-"}</td>
													<td>{stock.materialName || "-"}</td>
													<td>{stock.colorName || "-"}</td>
													<td>{stock.size || "-"}</td>
													<td>{stock.goldWeight || "-"}</td>
													<td>{stock.stoneWeight || "-"}</td>
													<td>{stock.factoryName || "-"}</td>
													<td>{stock.storeName || "-"}</td>
													<td>{stock.orderStatus || "-"}</td>
												</tr>
											))
										) : (
											<tr>
												<td colSpan={12} className="no-data">
													데이터가 없습니다
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								totalElements={totalElements}
								loading={loading}
								onPageChange={handlePageChange}
								className="stock-detail"
							/>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default StockDetailModal;

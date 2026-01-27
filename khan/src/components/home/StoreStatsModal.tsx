import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns/format";
import {
	getStoreTradeStatistics,
	getStoreStatisticsFilterOptions,
} from "../../../libs/api/dashboardApi";
import type {
	StoreTradeStatistics,
	StoreStatisticsSearchParams,
	StoreStatisticsFilterOption,
} from "../../types/dashboardDto";

interface StoreStatsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const StoreStatsModal = ({ isOpen, onClose }: StoreStatsModalProps) => {
	const [storeStatistics, setStoreStatistics] = useState<StoreTradeStatistics[]>([]);
	const [loading, setLoading] = useState(false);

	const [startDate, setStartDate] = useState(() => {
		const now = new Date();
		return format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
	});
	const [endDate, setEndDate] = useState(() => {
		const now = new Date();
		return format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd");
	});
	const [storeName, setStoreName] = useState("");
	const [materialName, setMaterialName] = useState("");
	const [classificationName, setClassificationName] = useState("");
	const [factoryName, setFactoryName] = useState("");
	const [createdBy, setCreatedBy] = useState("");

	const [filterOptions, setFilterOptions] = useState<StoreStatisticsFilterOption>({
		storeGrades: [],
		tradeTypes: [],
		materials: [],
		classifications: [],
		factories: [],
		managers: [],
		statisticsTypes: [],
	});

	const fetchFilterOptions = useCallback(async () => {
		try {
			const response = await getStoreStatisticsFilterOptions();
			if (response.success && response.data) {
				setFilterOptions(response.data);
			}
		} catch (error) {
			console.error("필터 옵션 조회 실패:", error);
		}
	}, []);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const params: StoreStatisticsSearchParams = {};
			if (startDate) params.start = startDate;
			if (endDate) params.end = endDate;
			if (storeName.trim()) params.storeName = storeName.trim();
			if (materialName) params.materialName = materialName;
			if (classificationName) params.classificationName = classificationName;
			if (factoryName) params.factoryName = factoryName;
			if (createdBy) params.createdBy = createdBy;

			const response = await getStoreTradeStatistics(params);
			if (response.success && response.data) {
				setStoreStatistics(response.data);
			}
		} catch (error) {
			console.error("거래 통계 조회 실패:", error);
			setStoreStatistics([]);
		} finally {
			setLoading(false);
		}
	}, [startDate, endDate, storeName, materialName, classificationName, factoryName, createdBy]);

	useEffect(() => {
		if (isOpen) {
			const now = new Date();
			const startOfMonth = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
			const endOfMonth = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd");
			setStartDate(startOfMonth);
			setEndDate(endOfMonth);
			setStoreName("");
			setMaterialName("");
			setClassificationName("");
			setFactoryName("");
			setCreatedBy("");
			fetchFilterOptions();

			const loadInitialData = async () => {
				setLoading(true);
				try {
					const response = await getStoreTradeStatistics({
						start: startOfMonth,
						end: endOfMonth,
					});
					if (response.success && response.data) {
						setStoreStatistics(response.data);
					}
				} catch (error) {
					console.error("거래 통계 조회 실패:", error);
					setStoreStatistics([]);
				} finally {
					setLoading(false);
				}
			};
			loadInitialData();
		}
	}, [isOpen, fetchFilterOptions]);

	const handleSearch = () => {
		fetchData();
	};

	const handleReset = () => {
		const now = new Date();
		setStartDate(format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"));
		setEndDate(format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd"));
		setStoreName("");
		setMaterialName("");
		setClassificationName("");
		setFactoryName("");
		setCreatedBy("");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	const totals = storeStatistics.reduce(
		(acc, item) => ({
			saleLaborCost: acc.saleLaborCost + (item.saleLaborCost || 0),
			salePureGold: acc.salePureGold + parseFloat(item.salePureGold || "0"),
			saleCount: acc.saleCount + (item.saleCount || 0),
			saleMainStoneCount: acc.saleMainStoneCount + (item.saleMainStoneCount || 0),
			saleAssistStoneCount: acc.saleAssistStoneCount + (item.saleAssistStoneCount || 0),
			returnLaborCost: acc.returnLaborCost + (item.returnLaborCost || 0),
			returnPureGold: acc.returnPureGold + parseFloat(item.returnPureGold || "0"),
			returnCount: acc.returnCount + (item.returnCount || 0),
			dcLaborCost: acc.dcLaborCost + (item.dcLaborCost || 0),
			dcPureGold: acc.dcPureGold + parseFloat(item.dcPureGold || "0"),
			dcCount: acc.dcCount + (item.dcCount || 0),
			totalSaleLaborCost: acc.totalSaleLaborCost + (item.totalSaleLaborCost || 0),
			totalSalePureGold: acc.totalSalePureGold + parseFloat(item.totalSalePureGold || "0"),
			totalSaleCount: acc.totalSaleCount + (item.totalSaleCount || 0),
			paymentAmount: acc.paymentAmount + (item.paymentAmount || 0),
			paymentPureGold: acc.paymentPureGold + parseFloat(item.paymentPureGold || "0"),
			purchaseCost: acc.purchaseCost + (item.purchaseCost || 0),
			marginLaborCost: acc.marginLaborCost + (item.marginLaborCost || 0),
			marginPureGold: acc.marginPureGold + parseFloat(item.marginPureGold || "0"),
		}),
		{
			saleLaborCost: 0,
			salePureGold: 0,
			saleCount: 0,
			saleMainStoneCount: 0,
			saleAssistStoneCount: 0,
			returnLaborCost: 0,
			returnPureGold: 0,
			returnCount: 0,
			dcLaborCost: 0,
			dcPureGold: 0,
			dcCount: 0,
			totalSaleLaborCost: 0,
			totalSalePureGold: 0,
			totalSaleCount: 0,
			paymentAmount: 0,
			paymentPureGold: 0,
			purchaseCost: 0,
			marginLaborCost: 0,
			marginPureGold: 0,
		}
	);

	if (!isOpen) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="modal-content modal-content-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-header">
					<h2>거래처별 거래 통계</h2>
					<button className="modal-close-button" onClick={onClose}>
						×
					</button>
				</div>
				<div className="modal-body">
					<div className="store-stats-filters">
						<div className="filter-row filter-row-center">
							<div className="filter-group">
								<select
									value={materialName}
									onChange={(e) => setMaterialName(e.target.value)}
									className="filter-select"
								>
									<option value="">재질구분</option>
									{filterOptions.materials.map((material) => (
										<option key={material} value={material}>
											{material}
										</option>
									))}
								</select>
							</div>
							<div className="filter-group">
								<select
									value={classificationName}
									onChange={(e) => setClassificationName(e.target.value)}
									className="filter-select"
								>
									<option value="">분류구분</option>
									{filterOptions.classifications.map((cls) => (
										<option key={cls} value={cls}>
											{cls}
										</option>
									))}
								</select>
							</div>
							<div className="filter-group">
								<select
									value={factoryName}
									onChange={(e) => setFactoryName(e.target.value)}
									className="filter-select"
								>
									<option value="">매입처구분</option>
									{filterOptions.factories.map((factory) => (
										<option key={factory} value={factory}>
											{factory}
										</option>
									))}
								</select>
							</div>
							<div className="filter-group">
								<select
									value={createdBy}
									onChange={(e) => setCreatedBy(e.target.value)}
									className="filter-select"
								>
									<option value="">관리자구분</option>
									{filterOptions.managers.map((manager) => (
										<option key={manager} value={manager}>
											{manager}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="filter-row filter-row-center">
							<div className="filter-group">
								<div className="date-range">
									<input
										type="date"
										value={startDate}
										onChange={(e) => setStartDate(e.target.value)}
										className="filter-input"
									/>
									<span>~</span>
									<input
										type="date"
										value={endDate}
										onChange={(e) => setEndDate(e.target.value)}
										className="filter-input"
									/>
								</div>
							</div>
							<div className="filter-group">
								<input
									type="text"
									value={storeName}
									onChange={(e) => setStoreName(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="거래처명"
									className="filter-input"
								/>
							</div>
							<div className="filter-buttons">
								<button className="search-btn-common" onClick={handleSearch}>
									검색
								</button>
								<button className="reset-btn-common" onClick={handleReset}>
									초기화
								</button>
								<button className="common-btn-common" onClick={() => window.print()}>
									인쇄
								</button>
							</div>
						</div>
					</div>

					{loading ? (
						<div className="loading-message">로딩 중...</div>
					) : (
						<div className="stock-detail-table-container">
							<table className="table stock-detail-table store-stats-table">
								<thead>
									<tr className="header-group-row">
										<th rowSpan={2}>거래처</th>
										<th colSpan={5} className="header-group">판매</th>
										<th colSpan={3} className="header-group">반품</th>
										<th colSpan={3} className="header-group">DC</th>
										<th colSpan={3} className="header-group">매출</th>
										<th colSpan={2} className="header-group">실입금</th>
										<th rowSpan={2}>매입원가</th>
										<th colSpan={2} className="header-group">마진</th>
									</tr>
									<tr className="header-sub-row">
										<th>공임</th>
										<th>순금</th>
										<th>수량</th>
										<th>M알</th>
										<th>S알</th>
										<th>공임</th>
										<th>순금</th>
										<th>수량</th>
										<th>공임</th>
										<th>순금</th>
										<th>수량</th>
										<th>공임</th>
										<th>순금</th>
										<th>수량</th>
										<th>금액</th>
										<th>순금</th>
										<th>공임</th>
										<th>순금</th>
									</tr>
								</thead>
								<tbody>
									{storeStatistics.length > 0 ? (
										<>
											{storeStatistics.map((item, index) => (
												<tr key={index}>
													<td className="store-name-cell">{item.storeName}</td>
													<td>{item.saleLaborCost.toLocaleString()}</td>
													<td>{item.salePureGold}</td>
													<td>{item.saleCount}</td>
													<td>{item.saleMainStoneCount}</td>
													<td>{item.saleAssistStoneCount}</td>
													<td>{item.returnLaborCost.toLocaleString()}</td>
													<td>{item.returnPureGold}</td>
													<td>{item.returnCount}</td>
													<td>{item.dcLaborCost.toLocaleString()}</td>
													<td>{item.dcPureGold}</td>
													<td>{item.dcCount}</td>
													<td>{item.totalSaleLaborCost.toLocaleString()}</td>
													<td>{item.totalSalePureGold}</td>
													<td>{item.totalSaleCount}</td>
													<td>{item.paymentAmount.toLocaleString()}</td>
													<td>{item.paymentPureGold}</td>
													<td>{item.purchaseCost.toLocaleString()}</td>
													<td className="highlight">{item.marginLaborCost.toLocaleString()}</td>
													<td className="highlight">{item.marginPureGold}</td>
												</tr>
											))}
											<tr className="totals-row">
												<td className="totals-label">합계</td>
												<td>{totals.saleLaborCost.toLocaleString()}</td>
												<td>{totals.salePureGold.toFixed(3)}</td>
												<td>{totals.saleCount.toLocaleString()}</td>
												<td>{totals.saleMainStoneCount.toLocaleString()}</td>
												<td>{totals.saleAssistStoneCount.toLocaleString()}</td>
												<td>{totals.returnLaborCost.toLocaleString()}</td>
												<td>{totals.returnPureGold.toFixed(3)}</td>
												<td>{totals.returnCount.toLocaleString()}</td>
												<td>{totals.dcLaborCost.toLocaleString()}</td>
												<td>{totals.dcPureGold.toFixed(3)}</td>
												<td>{totals.dcCount.toLocaleString()}</td>
												<td>{totals.totalSaleLaborCost.toLocaleString()}</td>
												<td>{totals.totalSalePureGold.toFixed(3)}</td>
												<td>{totals.totalSaleCount.toLocaleString()}</td>
												<td>{totals.paymentAmount.toLocaleString()}</td>
												<td>{totals.paymentPureGold.toFixed(3)}</td>
												<td>{totals.purchaseCost.toLocaleString()}</td>
												<td className="highlight">{totals.marginLaborCost.toLocaleString()}</td>
												<td className="highlight">{totals.marginPureGold.toFixed(3)}</td>
											</tr>
										</>
									) : (
										<tr>
											<td colSpan={20} className="no-data">
												거래 데이터가 없습니다
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default StoreStatsModal;

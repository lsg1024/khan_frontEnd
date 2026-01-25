import { useState, useEffect, useRef } from "react";
import { factoryApi } from "../../../libs/api/factoryApi";
import { isApiSuccess } from "../../../libs/api/config";
import type {
	TransactionPage,
	TransactionPageResponse,
} from "../../types/storeDto";
import { getLocalDate } from "../../utils/dateUtils";
import Pagination from "../../components/common/Pagination";
import PurchaseList from "../../components/common/purchase/PurchaseList";
import "../../styles/pages/sale/AccountsReceivablePage.css";

export const PurchasePage = () => {
	const [transactions, setTransactions] = useState<TransactionPage[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const startDateInputRef = useRef<HTMLInputElement>(null);
	const endDateInputRef = useRef<HTMLInputElement>(null);

	// 검색 필터 상태
	const [searchFilters, setSearchFilters] = useState({
		accountName: "",
		accountType: "",
		startDate: getLocalDate(),
		endDate: getLocalDate(),
	});

	const size = 20;

	// 검색 필터 변경 핸들러
	const handleFilterChange = (field: string, value: string) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));
	};

	const handleInputStartClick = () => {
		startDateInputRef.current?.showPicker();
	};

	const handleInputEndClick = () => {
		endDateInputRef.current?.showPicker();
	};

	// 미수금 데이터 로드
	const loadFactoryPurchase = async (
		filters: typeof searchFilters,
		page: number
	) => {
		setLoading(true);
		setError("");

		try {
			const res = await factoryApi.getFactoryPurchase(
				filters.startDate,
				filters.endDate,
				filters.accountType || undefined,
				filters.accountName || undefined,
				page,
				size
			);

			if (!isApiSuccess(res)) {
				setError(res.message || "매입 미수금 데이터를 불러오지 못했습니다.");
				setTransactions([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
				return;
			}

			const data = res.data as TransactionPageResponse;
			const content = data?.content ?? [];
			const pageInfo = data?.page;

			setTransactions(content);
			const uiPage = (pageInfo?.number ?? page - 1) + 1;
			setCurrentPage(uiPage);
			setTotalPages(pageInfo?.totalPages ?? 1);
			setTotalElements(pageInfo?.totalElements ?? content.length);
		} catch (err) {
			console.error("매입 미수금 데이터 로드 실패:", err);
			setError("매입 미수금 데이터를 불러오지 못했습니다.");
			setTransactions([]);
			setCurrentPage(1);
			setTotalPages(0);
			setTotalElements(0);
		} finally {
			setLoading(false);
		}
	};

	// 초기 데이터 로드
	useEffect(() => {
		const today = getLocalDate();
		const initialFilters = {
			...searchFilters,
			startDate: today,
			endDate: today,
		};
		setSearchFilters(initialFilters);
		loadFactoryPurchase(initialFilters, 1);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// 검색 처리
	const handleSearch = () => {
		setCurrentPage(1);
		loadFactoryPurchase(searchFilters, 1);
	};

	// 검색 초기화
	const handleReset = () => {
		const today = getLocalDate();
		const resetFilters = {
			accountName: "",
			accountType: "",
			startDate: today,
			endDate: today,
		};
		setSearchFilters(resetFilters);
		setCurrentPage(1);
		loadFactoryPurchase(resetFilters, 1);
	};

	// 매입 생성
	const handleCreate = async () => {
		try {
			setLoading(true);
			setError("");
			alert("생성 기능은 준비 중입니다.");
		} catch {
			alert("생성에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 엑셀 다운로드 처리
	const handleExcelDownload = async () => {
		try {
			setLoading(true);
			setError("");
			alert("엑셀 다운로드 기능은 준비 중입니다.");
		} catch {
			alert("엑셀 다운로드에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 페이지 변경 처리
	const handlePageChange = (page: number) => {
		loadFactoryPurchase(searchFilters, page);
	};

	return (
		<div className="page">
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
						<div className="date-range-common">
							<div className="filter-group-common">
								<input
									type="date"
									value={searchFilters.startDate}
									onChange={(e) =>
										handleFilterChange("startDate", e.target.value)
									}
									ref={startDateInputRef}
									onClick={handleInputStartClick}
								/>
							</div>
							<div>~</div>
							<div className="filter-group-common">
								<input
									type="date"
									value={searchFilters.endDate}
									onChange={(e) =>
										handleFilterChange("endDate", e.target.value)
									}
									ref={endDateInputRef}
									onClick={handleInputEndClick}
								/>
							</div>
						</div>
						<div className="filter-group-common">
							<select
								value={searchFilters.accountType}
								onChange={(e) =>
									handleFilterChange("accountType", e.target.value)
								}
							>
								<option value="">거래 구분</option>
								<option value="판매">판매</option>
								<option value="반품">반품</option>
								<option value="결제">결제</option>
								<option value="DC">DC</option>
								<option value="통장">통장</option>
								<option value="WG">WG</option>
							</select>
						</div>
					</div>

					<div className="search-controls-common">
						<input
							type="text"
							placeholder=""
							value={searchFilters.accountName}
							onChange={(e) =>
								handleFilterChange("accountName", e.target.value)
							}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							className="search-input-common"
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
								onClick={handleReset}
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
								onClick={handleExcelDownload}
								disabled={loading}
							>
								엑셀 다운로드
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* 결과 섹션 */}
			<div className="purchase-list">
				<PurchaseList
					transactions={transactions}
					currentPage={currentPage}
					size={size}
					loading={loading}
				/>

				{/* 페이지네이션 */}
				{!loading && transactions.length > 0 && (
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={handlePageChange}
					/>
				)}
			</div>
		</div>
	);
};

export default PurchasePage;

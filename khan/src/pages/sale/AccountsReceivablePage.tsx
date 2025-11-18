import { useState, useEffect } from "react";
import { storeApi } from "../../../libs/api/store";
import { isApiSuccess } from "../../../libs/api/config";
import type { AccountInfoDto, StoreAttemptResponse } from "../../types/store";
import Pagination from "../../components/common/Pagination";
import AccountsReceivableSearch from "../../components/common/sale/AccountsReceivableSearch";
import AccountsReceivableList from "../../components/common/sale/AccountsReceivableList";
import type { AccountsReceivableSearchFilters } from "../../components/common/sale/AccountsReceivableSearch";
import "../../styles/pages/AccountsReceivablePage.css";

export const AccountReceivablePage = () => {
	const [stores, setStores] = useState<AccountInfoDto[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);

	// 검색 필터 상태
	const [searchFilters, setSearchFilters] =
		useState<AccountsReceivableSearchFilters>({
			search: "",
			accountType: "",
		});

	const size = 20;

	// 검색 필터 변경 핸들러
	const handleFilterChange = <K extends keyof AccountsReceivableSearchFilters>(
		field: K,
		value: AccountsReceivableSearchFilters[K]
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));
	};

	// 미수금 데이터 로드
	const loadStoreAttempts = async (
		filters: AccountsReceivableSearchFilters,
		page: number
	) => {
		setLoading(true);
		setError("");

		try {
			const res = await storeApi.getStoreAttempt(filters.search, page, size);

			if (!isApiSuccess(res)) {
				setError(res.message || "미수금 데이터를 불러오지 못했습니다.");
				setStores([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
				return;
			}

			const data = res.data as StoreAttemptResponse;
			let content = data?.content ?? [];

			// accountType 필터 적용 (클라이언트 사이드 필터링)
			if (filters.accountType) {
				content = content.filter(
					(store) => store.tradeType === filters.accountType
				);
			}

			const pageInfo = data?.page;

			setStores(content);
			const uiPage = (pageInfo?.number ?? page - 1) + 1;
			setCurrentPage(uiPage);
			setTotalPages(pageInfo?.totalPages ?? 1);
			setTotalElements(content.length);
		} catch (err) {
			console.error("미수금 데이터 로드 실패:", err);
			setError("미수금 데이터를 불러오지 못했습니다.");
			setStores([]);
			setCurrentPage(1);
			setTotalPages(0);
			setTotalElements(0);
		} finally {
			setLoading(false);
		}
	};

	// 초기 데이터 로드
	useEffect(() => {
		loadStoreAttempts(searchFilters, 1);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// 검색 처리
	const handleSearch = () => {
		setCurrentPage(1);
		loadStoreAttempts(searchFilters, 1);
	};

	// 검색 초기화
	const handleReset = () => {
		const resetFilters: AccountsReceivableSearchFilters = {
			search: "",
			accountType: "",
		};
		setSearchFilters(resetFilters);
		setCurrentPage(1);
		loadStoreAttempts(resetFilters, 1);
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
		loadStoreAttempts(searchFilters, page);
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
			<AccountsReceivableSearch
				searchFilters={searchFilters}
				onFilterChange={handleFilterChange}
				onSearch={handleSearch}
				onReset={handleReset}
				onExcel={handleExcelDownload}
				loading={loading}
			/>

			{/* 결과 섹션 */}
            <div className="list">
                <AccountsReceivableList 
                stores={stores} 
                loading={loading} 
            />

			{/* 페이지네이션 */}
			{!error && stores.length > 0 && (
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

export default AccountReceivablePage;

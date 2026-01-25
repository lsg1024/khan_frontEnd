import { useState, useEffect } from "react";
import { storeApi } from "../../../libs/api/storeApi";
import { isApiSuccess } from "../../../libs/api/config";
import { useErrorHandler } from "../../utils/errorHandler";
import type {
	AccountInfoDto,
	StoreReceivableResponse,
} from "../../types/storeDto";
import Pagination from "../../components/common/Pagination";
import AccountsReceivableSearch from "../../components/account/AccountsReceivableSearch";
import AccountsReceivableList from "../../components/account/AccountsReceivableList";
import type { AccountsReceivableSearchFilters } from "../../components/account/AccountsReceivableSearch";
import "../../styles/pages/sale/AccountsReceivablePage.css";

export const AccountReceivablePage = () => {
	const [stores, setStores] = useState<AccountInfoDto[]>([]);
	const [loading, setLoading] = useState(false);
	const { handleError } = useErrorHandler();

	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);

	// 검색 필터 상태
	const [searchFilters, setSearchFilters] =
		useState<AccountsReceivableSearchFilters>({
			search: "",
			sortField: "",
			sortOrder: "" as const,
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

		try {
			const res = await storeApi.getStoreReceivable(
				filters.search,
				page,
				size,
				filters.sortField || undefined,
				filters.sortOrder || undefined
			);

			if (!isApiSuccess(res)) {
				handleError(res.message || "미수금 데이터를 불러오지 못했습니다.");
				setStores([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
				return;
			}

			const data = res.data as StoreReceivableResponse;

			const pageInfo = data?.page;

			setStores(data.content || []);
			const uiPage = (pageInfo?.number ?? page - 1) + 1;
			setCurrentPage(uiPage);
			setTotalPages(pageInfo?.totalPages ?? 1);
			setTotalElements(data.content.length);
		} catch (err) {
			handleError(err);
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
			sortField: "",
			sortOrder: "" as const,
		};
		setSearchFilters(resetFilters);
		setCurrentPage(1);
		loadStoreAttempts(resetFilters, 1);
	};

	// 엑셀 다운로드 처리
	const handleExcelDownload = async () => {
		try {
			setLoading(true);
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
					currentPage={currentPage}
					size={size}
				/>

				{/* 페이지네이션 */}
				{stores.length > 0 && (
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

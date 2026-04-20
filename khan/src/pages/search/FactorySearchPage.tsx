import React, { useState, useEffect, useCallback } from "react";
import { isApiSuccess } from "../../../libs/api/config";
import { factoryApi } from "../../../libs/api/factoryApi";
import { useErrorHandler } from "../../utils/errorHandler";
import type { FactorySearchDto } from "../../types/factoryDto";
import FactoryList from "../../components/common/factory/FactoryList";
import Pagination from "../../components/common/Pagination";
import "../../styles/pages/account/FactorySearchPage.css";

const FactorySearchPage: React.FC = () => {
	// URL 파라미터에서 초기 검색어 읽기
	const [searchParams] = useState(
		() => new URLSearchParams(window.location.search)
	);
	const initialSearch = searchParams.get("search") || "";

	// 검색 관련 상태 (카타로그 패턴과 동일)
	const [searchFilters, setSearchFilters] = useState({
		search: initialSearch,
		searchField: "",
	});

	// 정렬 관련 상태
	const [sortOptions, setSortOptions] = useState({
		sortField: "",
		sortOrder: "",
	});

	const [factories, setFactories] = useState<FactorySearchDto[]>([]);
	const [loading, setLoading] = useState(false);

	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const { handleError } = useErrorHandler();

	const size = 5;

	// 검색 API 호출
	const performSearch = useCallback(
		async (
			filters: typeof searchFilters,
			page: number,
			sortOpts: typeof sortOptions
		) => {
			setLoading(true);

			try {
				const res = await factoryApi.getFactories(
					filters.search,
					page,
					false,
					size,
					filters.searchField || undefined,
					sortOpts.sortField || undefined,
					sortOpts.sortOrder || undefined
				);

				// success=false 응답 처리
				if (!isApiSuccess(res)) {
					handleError(
						new Error(res.message || "제조사 데이터를 불러오지 못했습니다."),
						"FactorySearch"
					);
					setFactories([]);
					setCurrentPage(1);
					setTotalPages(0);
					setTotalElements(0);
					return;
				}

				// success=true + data 파싱
				const data = res.data;
				const content = data?.content ?? [];
				const pageInfo = data?.page;

				setFactories(content);
				const uiPage = (pageInfo?.number ?? page - 1) + 1;
				setCurrentPage(uiPage);
				setTotalPages(pageInfo?.totalPages ?? 1);
				setTotalElements(pageInfo?.totalElements ?? content.length);
			} catch (err) {
				handleError(err, "FactorySearch");
				setFactories([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[handleError]
	);

	// 초기 데이터 로드 (초기 검색어가 있으면 해당 검색어로 검색)
	useEffect(() => {
		performSearch(
			{ search: initialSearch, searchField: "" },
			1,
			{ sortField: "", sortOrder: "" }
		);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const handleFilterChange = (
		field: keyof typeof searchFilters,
		value: string
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));
	};

	// 검색 처리
	const handleSearch = () => {
		setCurrentPage(1);
		performSearch(searchFilters, 1, sortOptions);
	};

	// 초기화 처리
	const handleReset = () => {
		const resetFilters = { search: "", searchField: "" };
		const resetSort = { sortField: "", sortOrder: "" };
		setSearchFilters(resetFilters);
		setSortOptions(resetSort);
		setCurrentPage(1);
		performSearch(resetFilters, 1, resetSort);
	};

	// 제조사 선택 처리
	const handleFactorySelect = (factory: FactorySearchDto) => {
		// 부모 창에 선택된 제조사 정보 전달
		if (window.opener) {
			window.opener.postMessage(
				{
					type: "FACTORY_SELECTED",
					data: factory,
				},
				"*"
			);
			window.close();
		}
	};

	// 창 닫기
	const handleClose = () => {
		window.close();
	};

	return (
		<div className="account-search-page">
			<div className="account-search-container">
				{/* 헤더 */}
				<div className="account-search-header">
					<h2>제조사 검색</h2>
					<button className="close-button" onClick={handleClose}>
						×
					</button>
				</div>

				{/* 검색 섹션 (기본 FactoryPage 와 동일한 rich UI) */}
				<div className="search-section-common">
					<div className="search-filters-common">
						<div className="filter-row-common">
							<select
								className="filter-group-common select"
								value={searchFilters.searchField}
								onChange={(e) =>
									handleFilterChange("searchField", e.target.value)
								}
								disabled={loading}
							>
								<option value="">검색 필터</option>
								<option value="accountName">제조사명</option>
								<option value="accountOwnerName">대표자</option>
								<option value="phoneNumber">전화번호</option>
								<option value="faxNumber">팩스</option>
								<option value="businessNumber1">연락처1</option>
								<option value="businessNumber2">연락처2</option>
								<option value="grade">등급</option>
								<option value="note">비고</option>
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
								disabled={loading}
							>
								<option value="">정렬 기준</option>
								<option value="accountName">제조사명</option>
								<option value="accountOwnerName">대표자</option>
								<option value="grade">등급</option>
								<option value="gold">금잔량</option>
								<option value="money">현금잔량</option>
								<option value="createDate">등록일</option>
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
								disabled={loading}
							>
								<option value="">정렬 방향</option>
								<option value="ASC">오름차순</option>
								<option value="DESC">내림차순</option>
							</select>

							<input
								className="search-input-common"
								type="text"
								placeholder="제조사명을 입력해 주세요"
								value={searchFilters.search}
								onChange={(e) => handleFilterChange("search", e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							/>

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
						</div>
					</div>
				</div>

				{/* 결과 섹션 */}
				<div className="search-results">
					{loading && (
						<div className="loading-state">
							<div className="spinner"></div>
							<p>검색 중...</p>
						</div>
					)}

					{!loading && factories.length === 0 && (
						<div className="empty-state">
							<p>검색된 제조사가 없습니다.</p>
						</div>
					)}

					<FactoryList
						factories={factories}
						onSelectFactory={handleFactorySelect}
					/>

					{/* 페이지네이션 */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={(page) => {
							performSearch(searchFilters, page, sortOptions);
						}}
						className="factory"
					/>
				</div>
			</div>
		</div>
	);
};

export default FactorySearchPage;

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { stoneApi } from "../../../libs/api/stoneApi";
import type { StoneSearchDto } from "../../types/stoneDto";
import { useErrorHandler } from "../../utils/errorHandler";
import Pagination from "../../components/common/Pagination";
import "../../styles/pages/stone/StoneSearchPage.css";

const StoneSearchPage: React.FC = () => {
	const [searchParams] = useSearchParams();
	const parentOrigin = searchParams.get("parentOrigin") || "*";
	const stoneIndex = parseInt(searchParams.get("stoneIndex") || "0");

	const [searchTerm, setSearchTerm] = useState("");
	const [stones, setStones] = useState<StoneSearchDto[]>([]);
	const [loading, setLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [error, setError] = useState<string>("");
	const { handleError } = useErrorHandler();

	// 필터 상태
	const [searchField, setSearchField] = useState("");
	const [sortField, setSortField] = useState("");
	const [sortOrder, setSortOrder] = useState("DESC");

	// 검색 API 호출
	const performSearch = useCallback(
		async (
			term?: string,
			page: number = 1,
			sField?: string,
			sSearchField?: string,
			sOrder?: string,
		) => {
			setLoading(true);
			setError("");

			try {
				const response = await stoneApi.getStones({
					search: term || undefined,
					searchField: sSearchField || undefined,
					page: page,
					pageSize: 12,
					sortField: sField || undefined,
					sortOrder: sOrder || undefined,
				});

				if (response.success && response.data) {
					const pageData = response.data.page;
					const content = response.data.content || [];

					setStones(content);
					setCurrentPage(page);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);
				}
			} catch (err: unknown) {
				handleError(err);
				setStones([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[], // eslint-disable-line react-hooks/exhaustive-deps
	);

	// 초기 데이터 로드
	useEffect(() => {
		performSearch("", 1, "", "", "DESC");
	}, [performSearch]);

	// 검색 처리
	const handleSearch = () => {
		setCurrentPage(1);
		performSearch(searchTerm, 1, sortField, searchField, sortOrder);
	};

	// 초기화 처리
	const handleReset = () => {
		setSearchTerm("");
		setSearchField("");
		setSortField("");
		setSortOrder("DESC");
		setCurrentPage(1);
		performSearch("", 1, "", "", "DESC");
	};

	// 엔터 키 처리
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	// 스톤 선택 처리
	const handleStoneSelect = (stone: StoneSearchDto) => {
		if (window.opener) {
			window.opener.postMessage(
				{
					type: "STONE_SELECTED",
					stone: stone,
					stoneIndex: stoneIndex,
				},
				parentOrigin,
			);
		}
		window.close();
	};

	// 페이지 변경 처리
	const handlePageChange = (page: number) => {
		performSearch(searchTerm, page, sortField, searchField, sortOrder);
	};

	return (
		<div className="stone-search-page">
			<div className="stone-search-container">
				{/* 헤더 */}
				<div className="stone-search-header">
					<h2>스톤 검색</h2>
					<button className="close-button" onClick={() => window.close()}>
						×
					</button>
				</div>

				{/* 검색 섹션 */}
				<div className="search-section-common">
					<div className="search-filters-common">
						<div className="filter-row-common">
							<select
								className="filter-group-common select"
								value={sortField}
								onChange={(e) => setSortField(e.target.value)}
							>
								<option value="">정렬 기준</option>
								<option value="name">스톤명</option>
								<option value="weight">무게</option>
								<option value="count">상품 수</option>
								<option value="purchase">매입가</option>
							</select>

							<select
								className="filter-group-common select"
								value={sortOrder}
								onChange={(e) => setSortOrder(e.target.value)}
							>
								<option value="DESC">내림차순</option>
								<option value="ASC">오름차순</option>
							</select>

							<select
								className="filter-group-common select"
								value={searchField}
								onChange={(e) => setSearchField(e.target.value)}
							>
								<option value="">검색 필터</option>
								<option value="stoneName">스톤명</option>
								<option value="stoneType">스톤 종류</option>
								<option value="stoneShape">스톤 모양</option>
								<option value="stoneSize">스톤 사이즈</option>
							</select>

							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								onKeyDown={handleKeyPress}
								placeholder="검색어"
								className="search-input-common"
							/>
							<div className="search-buttons-common">
								<button
									onClick={handleSearch}
									className="search-btn-common"
									disabled={loading}
								>
									{loading ? "검색 중..." : "검색"}
								</button>
								<button
									onClick={handleReset}
									className="reset-btn-common"
									disabled={loading}
								>
									초기화
								</button>
							</div>
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

					{error && (
						<div className="error-state">
							<p>{error}</p>
						</div>
					)}

					{!loading && !error && stones.length === 0 && (
						<div className="empty-state">
							<p>검색된 스톤이 없습니다.</p>
						</div>
					)}

					{!loading && !error && stones.length > 0 && (
						<div className="stones-list">
							<div className="stones-table">
								{/* 테이블 헤더 */}
								<div className="table-header">
									<span className="col-name">스톤명</span>
									<span className="col-weight">무게</span>
									<span className="col-price">구매단가</span>
									<span className="col-grade1">1등급</span>
									<span className="col-grade2">2등급</span>
									<span className="col-grade3">3등급</span>
									<span className="col-grade4">4등급</span>
									<span className="col-action">선택</span>
								</div>

								{/* 스톤 목록 */}
								{stones.map((stone) => {
									const grade1 = stone.stoneWorkGradePolicyDto?.find(
										(p) => p.grade === "GRADE_1",
									);
									const grade2 = stone.stoneWorkGradePolicyDto?.find(
										(p) => p.grade === "GRADE_2",
									);
									const grade3 = stone.stoneWorkGradePolicyDto?.find(
										(p) => p.grade === "GRADE_3",
									);
									const grade4 = stone.stoneWorkGradePolicyDto?.find(
										(p) => p.grade === "GRADE_4",
									);

									return (
										<div key={stone.stoneId} className="table-row">
											<span className="col-name" title={stone.stoneName}>
												{stone.stoneName}
											</span>
											<span className="col-weight">
												{stone.stoneWeight || "0"}
											</span>
											<span className="col-price">
												₩{stone.stonePurchasePrice?.toLocaleString() || "0"}
											</span>
											<span className="col-grade1">
												{grade1?.laborCost?.toLocaleString() || "0"}
											</span>
											<span className="col-grade2">
												{grade2?.laborCost?.toLocaleString() || "0"}
											</span>
											<span className="col-grade3">
												{grade3?.laborCost?.toLocaleString() || "0"}
											</span>
											<span className="col-grade4">
												{grade4?.laborCost?.toLocaleString() || "0"}
											</span>
											<span className="col-action">
												<button
													className="select-button"
													onClick={() => handleStoneSelect(stone)}
												>
													선택
												</button>
											</span>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* 페이지네이션 */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={handlePageChange}
						className="stone-search"
					/>
				</div>
			</div>
		</div>
	);
};

export default StoneSearchPage;

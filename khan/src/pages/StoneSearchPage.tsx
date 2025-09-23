import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { stoneApi } from "../../libs/api/stone";
import type { StoneSearchDto } from "../types/stone";
import { useErrorHandler } from "../utils/errorHandler";
import Pagination from "../components/common/Pagination";
import "../styles/pages/StoneSearchPage.css";

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

	// 검색 API 호출
	const performSearch = useCallback(async (term?: string, page: number = 1) => {
		setLoading(true);
		setError("");

		try {
			const response = await stoneApi.getStones(term, page);

			if (response.success && response.data) {
				const pageData = response.data.page;
				const content = response.data.content || [];

				setStones(content);
				setCurrentPage(page);
				setTotalPages(pageData.totalPages || 1);
				setTotalElements(pageData.totalElements || 0);
			}
		} catch (err: unknown) {
			handleError(err, setError);
			setStones([]);
			setCurrentPage(1);
			setTotalPages(0);
			setTotalElements(0);
		} finally {
			setLoading(false);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// 초기 데이터 로드
	useEffect(() => {
		performSearch("", 1);
	}, [performSearch]);

	// 검색 처리
	const handleSearch = () => {
		setCurrentPage(1);
		performSearch(searchTerm, 1);
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
				parentOrigin
			);
		}
		window.close();
	};

	// 페이지 변경 처리
	const handlePageChange = (page: number) => {
		performSearch(searchTerm, page);
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
				<div className="search-section">
					<div className="search-input-group">
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyDown={handleKeyPress}
							placeholder="스톤명을 입력해 주세요"
							className="search-input"
						/>
						<button
							onClick={handleSearch}
							className="search-btn"
							disabled={loading}
						>
							{loading ? "검색 중..." : "검색"}
						</button>
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
										(p) => p.grade === "GRADE_1"
									);
									const grade2 = stone.stoneWorkGradePolicyDto?.find(
										(p) => p.grade === "GRADE_2"
									);
									const grade3 = stone.stoneWorkGradePolicyDto?.find(
										(p) => p.grade === "GRADE_3"
									);
									const grade4 = stone.stoneWorkGradePolicyDto?.find(
										(p) => p.grade === "GRADE_4"
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

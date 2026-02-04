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

	const [searchName, setSearchName] = useState(initialSearch);
	const [factories, setFactories] = useState<FactorySearchDto[]>([]);
	const [loading, setLoading] = useState(false);

	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const { handleError } = useErrorHandler();

	const size = 5;

	// 검색 API 호출
	const performSearch = useCallback(async (name: string, page: number) => {
		setLoading(true);

		try {
			const res = await factoryApi.getFactories(name, page, false, size);

			// success=false 응답 처리
			if (!isApiSuccess(res)) {
				handleError(new Error(res.message || "제조사 데이터를 불러오지 못했습니다."), "FactorySearch");
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
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// 초기 데이터 로드 (초기 검색어가 있으면 해당 검색어로 검색)
	useEffect(() => {
		performSearch(initialSearch, 1);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// 검색 처리
	const handleSearch = () => {
		setCurrentPage(1);
		performSearch(searchName, 1);
	};

	// 초기화 처리
	const handleReset = () => {
		setSearchName("");
		setCurrentPage(1);
		performSearch("", 1);
	};

	// 엔터 키 처리
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
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

				{/* 검색 섹션 */}
				<div className="search-section-common">
					<div className="search-filters-common">
						<div className="search-controls-common">
							<input
								type="text"
								value={searchName}
								onChange={(e) => setSearchName(e.target.value)}
								onKeyDown={handleKeyPress}
								placeholder="제조사명을 입력해 주세요"
								className="search-input"
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
							performSearch(searchName, page);
						}}
						className="factory"
					/>
				</div>
			</div>
		</div>
	);
};

export default FactorySearchPage;

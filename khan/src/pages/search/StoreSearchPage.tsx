import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { isApiSuccess } from "../../../libs/api/config";
import { storeApi } from "../../../libs/api/store";
import type {
	StoreSearchDto,
	StoreAttemptDto,
	StoreSearchResponse,
	StoreAttemptResponse,
} from "../../types/store";
import StoreList from "../../components/common/store/StoreList";
import Pagination from "../../components/common/Pagination";
import "../../styles/pages/StoreSearchPage.css";

const StoreSearchPage: React.FC = () => {
	const [searchParams] = useSearchParams();
	const useAttempt = searchParams.get("useAttempt") === "true"; // URL 파라미터 확인

	const [searchName, setSearchName] = useState("");
	const [stores, setStores] = useState<(StoreSearchDto | StoreAttemptDto)[]>(
		[]
	);
	const [loading, setLoading] = useState(false);

	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);

	const [error, setError] = useState<string>("");

	const size = 5;

	// 검색 API 호출
	const performSearch = useCallback(
		async (name: string, page: number) => {
			setLoading(true);
			setError("");

			try {
				if (useAttempt) {
					// 미수 정보 API 호출
					const res = await storeApi.getStoreAttempt(name, page, size);

					if (!isApiSuccess(res)) {
						setError(res.message || "거래처 데이터를 불러오지 못했습니다.");
						setStores([]);
						setCurrentPage(1);
						setTotalPages(0);
						setTotalElements(0);
						return;
					}

					const data = res.data as StoreAttemptResponse;
					const content = data?.content ?? [];
					const pageInfo = data?.page;

					setStores(content);
					const uiPage = (pageInfo?.number ?? page - 1) + 1;
					setCurrentPage(uiPage);
					setTotalPages(pageInfo?.totalPages ?? 1);
					setTotalElements(pageInfo?.totalElements ?? content.length);
				} else {
					// 일반 검색 API 호출
					const res = await storeApi.getStores(name, page, size);

					if (!isApiSuccess(res)) {
						setError(res.message || "거래처 데이터를 불러오지 못했습니다.");
						setStores([]);
						setCurrentPage(1);
						setTotalPages(0);
						setTotalElements(0);
						return;
					}

					const data = res.data as StoreSearchResponse;
					const content = data?.content ?? [];
					const pageInfo = data?.page;

					setStores(content);
					const uiPage = (pageInfo?.number ?? page - 1) + 1;
					setCurrentPage(uiPage);
					setTotalPages(pageInfo?.totalPages ?? 1);
					setTotalElements(pageInfo?.totalElements ?? content.length);
				}
			} catch {
				setError("거래처 데이터를 불러오지 못했습니다.");
				setStores([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[useAttempt]
	);

	// 초기 데이터 로드
	useEffect(() => {
		performSearch("", 1);
	}, [performSearch]);

	// 검색 처리
	const handleSearch = () => {
		setCurrentPage(1);
		performSearch(searchName, 1);
	};

	// 엔터 키 처리
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	// 거래처 선택 처리
	const handleStoreSelect = (store: StoreSearchDto | StoreAttemptDto) => {
		// 부모 창에 선택된 거래처 정보 전달
		if (window.opener) {
			window.opener.postMessage(
				{
					type: "STORE_SELECTED",
					data: store,
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
		<div className="store-search-page">
			<div className="store-search-container">
				{/* 헤더 */}
				<div className="store-search-header">
					<h2>거래처 검색</h2>
					<button className="close-button" onClick={handleClose}>
						×
					</button>
				</div>

				{/* 검색 섹션 */}
				<div className="search-section">
					<div className="search-input-group">
						<input
							type="text"
							value={searchName}
							onChange={(e) => setSearchName(e.target.value)}
							onKeyDown={handleKeyPress}
							placeholder="거래처명을 입력해 주세요"
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

					{!loading && !error && stores.length === 0 && (
						<div className="empty-state">
							<p>검색된 거래처가 없습니다.</p>
						</div>
					)}

					{!loading && !error && stores.length > 0 && (
						<div className="stores-list">
							<StoreList stores={stores} onSelectStore={handleStoreSelect} />
						</div>
					)}

					{/* 페이지네이션 */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={(page) => {
							performSearch(searchName, page);
						}}
						className="store"
					/>
				</div>
			</div>
		</div>
	);
};

export default StoreSearchPage;

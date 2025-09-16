import React, { useState, useEffect, useCallback } from "react";
import { isApiSuccess } from "../../../../libs/api/config";
import { storeApi } from "../../../../libs/api/store";
import type { StoreSearchDto, StoreSearchResponse } from "../../../types/store";
import StoreList from "../product/StoreList";
import Pagination from "../Pagination";
import "../../../styles/components/accountSearch.css";

interface StoreSearchProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectStore: (store: StoreSearchDto) => void;
}

const StoreSearch: React.FC<StoreSearchProps> = ({
	isOpen,
	onClose,
	onSelectStore,
}) => {
	const [searchName, setSearchName] = useState("");
	const [stores, setStores] = useState<StoreSearchDto[]>([]);
	const [loading, setLoading] = useState(false);

	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);

	const [error, setError] = useState<string>("");

	// 검색 API 호출
	const performSearch = useCallback(async (name: string, page: number) => {
		setLoading(true);
		setError("");

		try {
			const res = await storeApi.getStores(name, page);

			// success=false 응답 처리
			if (!isApiSuccess(res)) {
				setError(res.message || "거래처 데이터를 불러오지 못했습니다.");
				setStores([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
				return;
			}

			// success=true + data 파싱
			const data = res.data as StoreSearchResponse;
			const content = data?.content ?? [];
			const pageInfo = data?.page;

			setStores(content);
			const uiPage = (pageInfo?.number ?? page - 1) + 1;
			setCurrentPage(uiPage);
			setTotalPages(pageInfo?.totalPages ?? 1);
			setTotalElements(pageInfo?.totalElements ?? content.length);
		} catch {
			setError("거래처 데이터를 불러오지 못했습니다.");
			setStores([]);
			setCurrentPage(1);
			setTotalPages(0);
			setTotalElements(0);
		} finally {
			setLoading(false);
		}
	}, []);

	// 모달이 열릴 때 초기 데이터 로드
	useEffect(() => {
		if (isOpen) {
			setSearchName("");
			setCurrentPage(1);
			performSearch("", 1);
		}
	}, [isOpen, performSearch]);

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

	// 모달 닫기
	const handleClose = () => {
		setSearchName("");
		setStores([]);
		setCurrentPage(1);
		setTotalPages(0);
		setTotalElements(0);
		setError("");
		onClose();
	};

	// 오버레이 클릭 처리
	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div
			className="search-modal-overlay store-search-modal-overlay"
			onClick={handleOverlayClick}
		>
			<div className="search-modal-content store-search-modal-content">
				{/* 모달 헤더 */}
				<div className="search-modal-header store-search-modal-header">
					<h3>거래처 검색</h3>
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
					<div className="results-content">
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
							<StoreList stores={stores} onSelectStore={onSelectStore} />
						)}
					</div>

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

export default StoreSearch;

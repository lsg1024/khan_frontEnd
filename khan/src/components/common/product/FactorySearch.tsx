import React, { useState, useEffect, useCallback } from "react";
import { isApiSuccess } from "../../../../libs/api";
import { factoryApi } from "../../../../libs/api/factory";
import type { FactorySearchDto } from "../../../types/factory";
import FactoryList from "./FactoryList";
import Pagination from "../Pagination";

interface FactorySearchProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectFactory: (factory: FactorySearchDto) => void;
}

const FactorySearc: React.FC<FactorySearchProps> = ({
	isOpen,
	onClose,
	onSelectFactory,
}) => {
	const [searchName, setSearchName] = useState("");
	const [factories, setFactories] = useState<FactorySearchDto[]>([]);
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
			const res = await factoryApi.getFactories(name, page);

			// success=false 응답 처리
			if (!isApiSuccess(res)) {
				setError(res.message || "제조사 데이터를 불러오지 못했습니다.");
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
		} catch {
			setError("제조사 데이터를 불러오지 못했습니다.");
			setFactories([]);
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
		setFactories([]);
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
			className="search-modal-overlay factory-search-modal-overlay"
			onClick={handleOverlayClick}
		>
			<div className="search-modal-content factory-search-modal-content">
				{/* 모달 헤더 */}
				<div className="search-modal-header factory-search-modal-header">
					<h3>제조사 검색</h3>
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
							placeholder="제조사명을 입력해 주세요"
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
				<div className="search-results factory-search-results">
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

						{!loading && !error && factories.length === 0 && (
							<div className="empty-state">
								<p>검색된 제조사가 없습니다.</p>
							</div>
						)}

						{!loading && !error && factories.length > 0 && (
							<FactoryList
								factories={factories}
								onSelectFactory={onSelectFactory}
							/>
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
						className="factory"
					/>
				</div>
			</div>
		</div>
	);
};

export default FactorySearc;

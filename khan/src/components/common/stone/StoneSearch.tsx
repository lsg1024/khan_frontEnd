import React, { useState, useEffect, useCallback } from "react";
import type { StoneSearchDto } from "../../../types/stoneDto";
import type { StoneShapeDto } from "../../../types/stoneShapeDto";
import type { StoneTypeDto } from "../../../types/stoneTypeDto";
import { stoneApi } from "../../../../libs/api/stoneApi";
import { stoneShapeApi } from "../../../../libs/api/stoneShapeApi";
import { stoneTypeApi } from "../../../../libs/api/stoneTypeApi";
import { useErrorHandler } from "../../../utils/errorHandler";
import StonesList from "./StonesList";
import Pagination from "../Pagination";

interface StoneSearchProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectStone: (stone: StoneSearchDto) => void;
	currentStoneId?: string;
}

const StoneSearch: React.FC<StoneSearchProps> = ({
	isOpen,
	onClose,
	onSelectStone,
	currentStoneId,
}) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [stones, setStones] = useState<StoneSearchDto[]>([]);
	const [loading, setLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const { handleError } = useErrorHandler();

	// 필터 상태
	const [shapeFilter, setShapeFilter] = useState("");
	const [typeFilter, setTypeFilter] = useState("");
	const [sortField, setSortField] = useState("");
	const [sortOrder, setSortOrder] = useState("DESC");

	// 필터 옵션
	const [shapes, setShapes] = useState<StoneShapeDto[]>([]);
	const [types, setTypes] = useState<StoneTypeDto[]>([]);

	// 필터 옵션 로드
	useEffect(() => {
		const loadFilterOptions = async () => {
			try {
				const [shapesRes, typesRes] = await Promise.all([
					stoneShapeApi.getStoneShapes(),
					stoneTypeApi.getStoneTypes(),
				]);
				if (shapesRes.success && shapesRes.data) {
					setShapes(shapesRes.data);
				}
				if (typesRes.success && typesRes.data) {
					setTypes(typesRes.data);
				}
			} catch (err) {
				console.error("필터 옵션 로드 실패:", err);
			}
		};
		loadFilterOptions();
	}, []);

	// 검색 API 호출
	const performSearch = useCallback(
		async (
			term?: string,
			page: number = 1,
			shape?: string,
			type?: string,
			sField?: string,
			sOrder?: string,
		) => {
			setLoading(true);

			try {
				// 모양 또는 타입 필터가 있으면 해당 필드로 검색
				let searchValue = term;
				let searchField: string | undefined = undefined;
				if (shape) {
					searchValue = shape;
					searchField = "stoneShape";
				} else if (type) {
					searchValue = type;
					searchField = "stoneType";
				}

				const response = await stoneApi.getStones({
					search: searchValue || undefined,
					searchField: searchField,
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

	// 모달이 열릴 때 초기 데이터 로드
	useEffect(() => {
		if (isOpen) {
			setSearchTerm("");
			setShapeFilter("");
			setTypeFilter("");
			setSortField("");
			setSortOrder("DESC");
			setCurrentPage(1);
			performSearch("", 1, "", "", "", "DESC");
		}
	}, [isOpen, performSearch]);

	// 검색 처리
	const handleSearch = () => {
		setCurrentPage(1);
		performSearch(searchTerm, 1, shapeFilter, typeFilter, sortField, sortOrder);
	};

	// 초기화 처리
	const handleReset = () => {
		setSearchTerm("");
		setShapeFilter("");
		setTypeFilter("");
		setSortField("");
		setSortOrder("DESC");
		setCurrentPage(1);
		performSearch("", 1, "", "", "", "DESC");
	};

	// 엔터 키 처리
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	// 모달 닫기
	const handleClose = () => {
		setSearchTerm("");
		setShapeFilter("");
		setTypeFilter("");
		setSortField("");
		setSortOrder("DESC");
		setStones([]);
		setCurrentPage(1);
		setTotalPages(0);
		setTotalElements(0);
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
			className="search-modal-overlay stone-search-modal-overlay"
			onClick={handleOverlayClick}
		>
			<div className="search-modal-content stone-search-modal-content">
				{/* 모달 헤더 */}
				<div className="search-modal-header stone-search-modal-header">
					<h3>스톤 검색</h3>
					<button className="close-button" onClick={handleClose}>
						×
					</button>
				</div>

				{/* 검색 섹션 */}
				<div className="search-section-common">
					<div className="search-filters-common">
						<div className="filter-row-common">
							<select
								className="filter-group-common select"
								value={shapeFilter}
								onChange={(e) => setShapeFilter(e.target.value)}
							>
								<option value="">전체 모양</option>
								{shapes.map((shape) => (
									<option key={shape.stoneShapeId} value={shape.stoneShapeName}>
										{shape.stoneShapeName}
									</option>
								))}
							</select>

							<select
								className="filter-group-common select"
								value={typeFilter}
								onChange={(e) => setTypeFilter(e.target.value)}
							>
								<option value="">전체 타입</option>
								{types.map((type) => (
									<option key={type.stoneTypeId} value={type.stoneTypeName}>
										{type.stoneTypeName}
									</option>
								))}
							</select>

							<select
								className="filter-group-common select"
								value={sortField}
								onChange={(e) => setSortField(e.target.value)}
							>
								<option value="">정렬 기준</option>
								<option value="stoneName">스톤명</option>
								<option value="stoneWeight">무게</option>
								<option value="stonePurchasePrice">구매단가</option>
							</select>

							<select
								className="filter-group-common select"
								value={sortOrder}
								onChange={(e) => setSortOrder(e.target.value)}
							>
								<option value="DESC">내림차순</option>
								<option value="ASC">오름차순</option>
							</select>

							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								onKeyDown={handleKeyPress}
								placeholder="스톤명을 입력해 주세요"
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
				<div className="search-results stone-search-results">
					<div className="results-content">
						{loading && (
							<div className="loading-state">
								<div className="spinner"></div>
								<p>검색 중...</p>
							</div>
						)}

						{!loading && stones.length === 0 && (
							<div className="empty-state">
								<p>검색된 스톤이 없습니다.</p>
							</div>
						)}

						{!loading && stones.length > 0 && (
							<StonesList
								stones={stones}
								onSelectStone={onSelectStone}
								currentStoneId={currentStoneId}
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
							performSearch(
								searchTerm,
								page,
								shapeFilter,
								typeFilter,
								sortField,
								sortOrder,
							);
						}}
						className="stone"
					/>
				</div>
			</div>
		</div>
	);
};

export default StoneSearch;

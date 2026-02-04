import "../../../styles/components/stone/StoneSearchBar.css";

// searchField 옵션:
// - stoneName: 스톤명 검색 (기본값)
// - stoneType: 스톤 종류 검색
// - stoneShape: 스톤 형태 검색
// - stoneSize: 스톤 사이즈 검색
export interface StoneSearchFilters {
	search: string;
	searchField: string;
	sortField: string;
	sortOrder: "ASC" | "DESC" | "";
}

interface StoneSearchBarProps {
	filters: StoneSearchFilters;
	loading: boolean;
	dropdownLoading: boolean;
	onFilterChange: <K extends keyof StoneSearchFilters>(
		field: K,
		value: StoneSearchFilters[K]
	) => void;
	onSearch: () => void;
	onClear: () => void;
	onCreate: () => void;
	onDownloadExcel: () => void;
}

export const StoneSearchBar = ({
	filters,
	loading,
	dropdownLoading,
	onFilterChange,
	onSearch,
	onClear,
	onCreate,
	onDownloadExcel,
}: StoneSearchBarProps) => {
	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			onSearch();
		}
	};

	return (
		<div className="search-section-common">
			<div className="search-filters-common">
				{/* 1행: 검색 필드 및 정렬 드롭다운 */}
				<div className="filter-row-common">
					<select
						className="filter-group-common select"
						value={filters.searchField}
						onChange={(e) => onFilterChange("searchField", e.target.value)}
						disabled={dropdownLoading}
					>
						<option value="">검색 필터</option>
						<option value="stoneName">스톤명</option>
						<option value="stoneType">스톤 종류</option>
						<option value="stoneShape">스톤 모양</option>
						<option value="stoneSize">스톤 사이즈</option>
					</select>

					<select
						className="filter-group-common select"
						value={filters.sortField}
						onChange={(e) => onFilterChange("sortField", e.target.value)}
						disabled={dropdownLoading}
					>
						<option value="">정렬 기준</option>
						<option value="name">스톤명</option>
						<option value="weight">무게</option>
						<option value="count">상품 수</option>
						<option value="purchase">매입가</option>
					</select>

					<select
						className="filter-group-common select"
						value={filters.sortOrder}
						onChange={(e) =>
							onFilterChange(
								"sortOrder",
								e.target.value as "ASC" | "DESC" | ""
							)
						}
						disabled={dropdownLoading}
					>
						<option value="">정렬 방향</option>
						<option value="ASC">오름차순</option>
						<option value="DESC">내림차순</option>
					</select>
				</div>

				{/* 2행: 검색 입력 및 버튼 */}
				<div className="search-controls-common">
					<input
						type="text"
						className="search-input-common"
						placeholder="검색어"
						value={filters.search}
						onChange={(e) => onFilterChange("search", e.target.value)}
						onKeyDown={handleKeyPress}
					/>

					<div className="search-buttons-common">
						<button
							className="search-btn-common"
							onClick={onSearch}
							disabled={loading}
						>
							검색
						</button>
						<button
							className="reset-btn-common"
							onClick={onClear}
							disabled={loading}
						>
							초기화
						</button>
						<button
							className="common-btn-common"
							onClick={onCreate}
							disabled={loading}
						>
							생성
						</button>
						<button
							className="common-btn-common"
							onClick={onDownloadExcel}
							disabled={loading}
						>
							엑셀 다운로드
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StoneSearchBar;

import type { StoneShapeDto } from "../../../types/stoneShapeDto";
import type { StoneTypeDto } from "../../../types/stoneTypeDto";
import "../../../styles/components/stone/StoneSearchBar.css";

export interface StoneSearchFilters {
	search: string;
	stoneType: string;
	stoneShape: string;
	sortField: string;
	sortOrder: "ASC" | "DESC" | "";
}

interface StoneSearchBarProps {
	filters: StoneSearchFilters;
	stoneShapes: StoneShapeDto[];
	stoneTypes: StoneTypeDto[];
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
	stoneShapes,
	stoneTypes,
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
				<div className="filter-row-common">
					<div className="filter-group-common">
						<select
							id="stoneType"
							value={filters.stoneType}
							onChange={(e) => onFilterChange("stoneType", e.target.value)}
							disabled={dropdownLoading}
						>
							<option value="">스톤 종류</option>
							{stoneTypes.map((type) => (
								<option key={type.stoneTypeName} value={type.stoneTypeName}>
									{type.stoneTypeName}
								</option>
							))}
						</select>
					</div>
					<div className="filter-group-common">
						<select
							id="stoneShape"
							value={filters.stoneShape}
							onChange={(e) => onFilterChange("stoneShape", e.target.value)}
							disabled={dropdownLoading}
						>
							<option value="">스톤 모양</option>
							{stoneShapes.map((shape) => (
								<option key={shape.stoneShapeName} value={shape.stoneShapeName}>
									{shape.stoneShapeName}
								</option>
							))}
						</select>
					</div>
				</div>
				<div className="search-controls-common">
					<div className="filter-group-common">
						<select
							id="sortField"
							value={filters.sortField}
							onChange={(e) => onFilterChange("sortField", e.target.value)}
						>
							<option value="">정렬 필드</option>
							<option value="name">스톤 이름</option>
							<option value="weight">스톤 무게</option>
							<option value="count">사용 스톤</option>
							<option value="purchase">스톤 단가</option>
						</select>
					</div>
					<div className="filter-group-common">
						<select
							id="sortOrder"
							value={filters.sortOrder}
							onChange={(e) =>
								onFilterChange(
									"sortOrder",
									e.target.value as "ASC" | "DESC" | ""
								)
							}
							disabled={dropdownLoading}
						>
							<option value="">정렬 방식</option>
							<option value="ASC">오름차순</option>
							<option value="DESC">내림차순</option>
						</select>
					</div>
					<input
						type="text"
						className="search-input-common"
						placeholder="스톤명으로 검색..."
						value={filters.search}
						onChange={(e) => onFilterChange("search", e.target.value)}
						onKeyDown={handleKeyPress}
					/>
					<div className="search-buttons-common">
						<div className="filter-group-common">
							<button
								className="search-btn-common"
								onClick={onSearch}
								disabled={loading}
							>
								검색
							</button>
						</div>
						<div className="filter-group-common">
							<button
								className="reset-btn-common"
								onClick={onClear}
								disabled={loading}
							>
								초기화
							</button>
						</div>
						<div className="filter-group-common">
							<button
								className="common-btn-common"
								onClick={onCreate}
								disabled={loading}
							>
								생성
							</button>
						</div>
						<div className="filter-group-common">
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
		</div>
	);
};

export default StoneSearchBar;

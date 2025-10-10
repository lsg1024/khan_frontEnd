import React, { useRef } from "react";

export interface SearchFilters {
	search: string;
	start: string;
	end: string;
	factory: string;
	store: string;
	setType: string;
	color: string;
	sortField: string;
	sortOrder: "ASC" | "DESC" | "";
}

interface OrderSearchProps {
	searchFilters: SearchFilters;
	onFilterChange: (
		field: keyof SearchFilters,
		value: string | "ASC" | "DESC" | ""
	) => void;
	onSearch: () => void;
	onReset: () => void;
	onCreate?: () => void;
	onExcel?: () => void;
	onStart: boolean;
	factories: string[];
	stores: string[];
	setTypes: string[];
	colors: string[];
	loading: boolean;
	dropdownLoading: boolean;
}

const OrderSearch: React.FC<OrderSearchProps> = ({
	searchFilters,
	onFilterChange,
	onSearch,
	onReset,
	onCreate,
	onExcel,
	onStart,
	factories,
	stores,
	setTypes,
	colors,
	loading,
	dropdownLoading,
}) => {
	const startDateInputRef = useRef<HTMLInputElement>(null);
	const endDateInputRef = useRef<HTMLInputElement>(null);

	const handleInputStartClick = () => {
		startDateInputRef.current?.showPicker();
	};

	const handleInputEndClick = () => {
		endDateInputRef.current?.showPicker();
	};

	return (
		<>
			<div className="search-section-common">
				<div className="search-filters-common">
					<div className="filter-row-common">
						<div className="filter-group-common">
							<div className="date-range-common">
								{onStart && (
									<input
										ref={startDateInputRef}
										name="start"
										type="date"
										value={searchFilters.start}
										onChange={(e) => onFilterChange("start", e.target.value)}
										onClick={handleInputStartClick}
									/>
								)}
								{onStart && <span>~</span>}
								<input
									ref={endDateInputRef}
									name="end"
									type="date"
									value={searchFilters.end}
									onChange={(e) => onFilterChange("end", e.target.value)}
									onClick={handleInputEndClick}
								/>
							</div>
						</div>

						<div className="filter-group-common">
							<select
								id="factoryId"
								value={searchFilters.factory}
								onChange={(e) => onFilterChange("factory", e.target.value)}
								disabled={dropdownLoading}
							>
								<option value="">제조사</option>
								{factories.map((factory) => (
									<option key={factory} value={factory}>
										{factory}
									</option>
								))}
							</select>
						</div>

						<div className="filter-group-common">
							<select
								id="storeId"
								value={searchFilters.store}
								onChange={(e) => onFilterChange("store", e.target.value)}
								disabled={dropdownLoading}
							>
								<option value="">판매처</option>
								{stores.map((store) => (
									<option key={store} value={store}>
										{store}
									</option>
								))}
							</select>
						</div>

						<div className="filter-group-common">
							<select
								id="setType"
								value={searchFilters.setType}
								onChange={(e) => onFilterChange("setType", e.target.value)}
								disabled={dropdownLoading}
							>
								<option value="">세트</option>
								{setTypes.map((setType) => (
									<option key={setType} value={setType}>
										{setType}
									</option>
								))}
							</select>
						</div>

						<div className="filter-group-common">
							<select
								id="color"
								value={searchFilters.color}
								onChange={(e) => onFilterChange("color", e.target.value)}
								disabled={dropdownLoading}
							>
								<option value="">색상</option>
								{colors.map((color) => (
									<option key={color} value={color}>
										{color}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="search-controls-common">
						<div className="filter-group-common">
							<select
								id="sortField"
								value={searchFilters.sortField}
								onChange={(e) => onFilterChange("sortField", e.target.value)}
								disabled={dropdownLoading}
							>
								<option value="">정렬 기준</option>
								<option value="factory">제조사</option>
								<option value="store">판매처</option>
								<option value="setType">세트</option>
								<option value="color">색상</option>
							</select>
						</div>

						<div className="filter-group-common">
							<select
								id="sortOrder"
								value={searchFilters.sortOrder}
								onChange={(e) =>
									onFilterChange("sortOrder", e.target.value as "ASC" | "DESC")
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
							placeholder="검색..."
							value={searchFilters.search}
							onChange={(e) => onFilterChange("search", e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && onSearch()}
							className="search-input-common"
						/>

						<div className="search-buttons-common">
							<button
								onClick={onSearch}
								className="search-btn-common"
								disabled={loading}
							>
								검색
							</button>
							<button
								onClick={onReset}
								className="reset-btn-common"
								disabled={loading}
							>
								초기화
							</button>
							{onCreate && (
								<button
									onClick={onCreate}
									className="common-btn-common"
									disabled={loading}
								>
									생성
								</button>
							)}
							<button
								onClick={onExcel}
								className="common-btn-common"
								disabled={loading}
							>
								엑셀 다운로드
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default OrderSearch;

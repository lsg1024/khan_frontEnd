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
	onStart: boolean;
	factories: string[];
	stores: string[];
	setTypes: string[];
	loading: boolean;
	dropdownLoading: boolean;
}

const OrderSearch: React.FC<OrderSearchProps> = ({
	searchFilters,
	onFilterChange,
	onSearch,
	onReset,
	onCreate,
	onStart,
	factories,
	stores,
	setTypes,
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
			<div className="search-section-order">
				<div className="search-filters-order">
					<div className="filter-row-order">
						<div className="filter-group-order">
							<div className="date-range-order">
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

						<div className="filter-group-order">
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

						<div className="filter-group-order">
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

						<div className="filter-group-order">
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

						<div className="filter-group-order">
							<select
								id="color"
								value={searchFilters.color}
								onChange={(e) => onFilterChange("color", e.target.value)}
								disabled={dropdownLoading}
							>
								<option value="">색상</option>
								{setTypes.map((setType) => (
									<option key={setType} value={setType}>
										{setType}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="search-controls-order">

						<div className="filter-group-order">
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

						<div className="filter-group-order">
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
							className="search-input-order"
						/>

						<div className="search-buttons-order">
							<button
								onClick={onSearch}
								className="search-btn-order"
								disabled={loading}
							>
								검색
							</button>
							<button
								onClick={onReset}
								className="reset-btn-order"
								disabled={loading}
							>
								초기화
							</button>
							{onCreate && (
								<button
									onClick={onCreate}
									className="order-btn-order"
									disabled={loading}
								>
									생성
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default OrderSearch;

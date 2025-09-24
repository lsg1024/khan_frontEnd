import React, { useRef } from "react";

interface SearchFilters {
	search: string;
	start: string;
	end: string;
	factory: string;
	store: string;
	setType: string;
}

interface OrderSearchProps {
	searchFilters: SearchFilters;
	onFilterChange: (field: keyof SearchFilters, value: string) => void;
	onSearch: () => void;
	onReset: () => void;
	onCreate?: () => void;
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
								{onCreate && (
									<input
										ref={startDateInputRef}
										name="start"
										type="date"
										value={searchFilters.start}
										onChange={(e) => onFilterChange("start", e.target.value)}
										onClick={handleInputStartClick}
									/>
								)}
								{onCreate && <span>~</span>}
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
					</div>

					<div className="search-controls-order">
						<input
							type="text"
							placeholder="상품명으로 검색..."
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

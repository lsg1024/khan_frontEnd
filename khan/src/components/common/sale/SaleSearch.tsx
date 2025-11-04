import React, { useRef } from "react";

export interface SaleSearchFilters {
	search: string;
	start: string;
	end: string;
	type: string;
}

interface SaleSearchProps {
	searchFilters: SaleSearchFilters;
	onFilterChange: (field: keyof SaleSearchFilters, value: string) => void;
	onSearch: () => void;
	onReset: () => void;
	onCreate: () => void;
	onExcel?: () => void;
	loading: boolean;
}

const SaleSearch: React.FC<SaleSearchProps> = ({
	searchFilters,
	onFilterChange,
	onSearch,
	onReset,
	onCreate,
	onExcel,
	loading,
}) => {
	const startDateInputRef = useRef<HTMLInputElement>(null);
	const endDateInputRef = useRef<HTMLInputElement>(null);

	const handleInputStartClick = () => {
		startDateInputRef.current?.showPicker();
	};

	const handleInputEndClick = () => {
		endDateInputRef.current?.showPicker();
	};

	// 고정된 type 옵션
	const typeOptions = ["14K", "18K", "24K"];

	return (
		<>
			<div className="search-section-common">
				<div className="search-filters-common">
					<div className="filter-row-common">
						<div className="filter-group-common">
							<div className="date-range-common">
								<input
									ref={startDateInputRef}
									name="start"
									type="date"
									value={searchFilters.start}
									onChange={(e) => onFilterChange("start", e.target.value)}
									onClick={handleInputStartClick}
								/>
								<span>~</span>
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
								id="type"
								value={searchFilters.type}
								onChange={(e) => onFilterChange("type", e.target.value)}
							>
								<option value="">재질</option>
								{typeOptions.map((type) => (
									<option key={type} value={type}>
										{type}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="search-controls-common">
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
							{onExcel && (
								<button
									onClick={onExcel}
									className="common-btn-common"
									disabled={loading}
								>
									엑셀 다운로드
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default SaleSearch;

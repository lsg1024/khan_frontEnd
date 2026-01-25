import React from "react";

export interface AccountsReceivableSearchFilters {
	search: string;
	sortField: string;
	sortOrder: "ASC" | "DESC" | "";
}

interface AccountsReceivableSearchProps {
	searchFilters: AccountsReceivableSearchFilters;
	onFilterChange: (
		field: keyof AccountsReceivableSearchFilters,
		value: string | "ASC" | "DESC" | ""
	) => void;
	onSearch: () => void;
	onReset: () => void;
	onExcel?: () => void;
	loading: boolean;
}

const AccountsReceivableSearch: React.FC<AccountsReceivableSearchProps> = ({
	searchFilters,
	onFilterChange,
	onSearch,
	onReset,
	onExcel,
	loading,
}) => {
	return (
		<>
			<div className="search-section-common">
				<div className="search-filters-common">
					<div className="search-controls-common">
						<div className="filter-group-common">
							<select
								id="sortField"
								value={searchFilters.sortField}
								onChange={(e) => onFilterChange("sortField", e.target.value)}
							>
								<option value="">정렬 기준</option>
								<option value="accountName">거래처명</option>
								<option value="accountOwnerName">대표자</option>
								<option value="grade">등급</option>
								<option value="gold">미수(금)</option>
								<option value="money">미수(금액)</option>
							</select>
						</div>
						<div className="filter-group-common">
							<select
								id="sortOrder"
								value={searchFilters.sortOrder}
								onChange={(e) =>
									onFilterChange("sortOrder", e.target.value as "ASC" | "DESC")
								}
								disabled={loading}
							>
								<option value="">정렬 방식</option>
								<option value="ASC">오름차순</option>
								<option value="DESC">내림차순</option>
							</select>
						</div>
						<input
							type="text"
							placeholder="거래처명 검색..."
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

export default AccountsReceivableSearch;

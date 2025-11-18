import React from "react";

export interface AccountsReceivableSearchFilters {
	search: string;
	accountType: string; // "판매처" 또는 "매입처"
}

interface AccountsReceivableSearchProps {
	searchFilters: AccountsReceivableSearchFilters;
	onFilterChange: (
		field: keyof AccountsReceivableSearchFilters,
		value: string
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
					<div className="filter-row-common">
						<div className="filter-group-common">
							<select
								id="accountType"
								value={searchFilters.accountType}
								onChange={(e) => onFilterChange("accountType", e.target.value)}
							>
								<option value="">전체</option>
								<option value="판매처">판매처</option>
								<option value="매입처">매입처</option>
							</select>
						</div>
					</div>

					<div className="search-controls-common">
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

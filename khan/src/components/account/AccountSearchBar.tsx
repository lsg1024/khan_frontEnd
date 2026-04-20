interface AccountSearchBarProps {
	searchName: string;
	onSearchNameChange: (value: string) => void;
	onSearch: () => void;
	onReset: () => void;
	onCreate?: () => void;
	onExcelDownload?: () => void;
	loading: boolean;
	placeholder?: string;
	/** 생성 버튼 표시 여부 (기본 true). 팝업 모드 등에서 false 로 감출 수 있음. */
	showCreate?: boolean;
	/** 엑셀 다운로드 버튼 표시 여부 (기본 true). 팝업 모드 등에서 false 로 감출 수 있음. */
	showExcel?: boolean;
}

export const AccountSearchBar = ({
	searchName,
	onSearchNameChange,
	onSearch,
	onReset,
	onCreate,
	onExcelDownload,
	loading,
	placeholder = "검색...",
	showCreate = true,
	showExcel = true,
}: AccountSearchBarProps) => {
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			onSearch();
		}
	};

	return (
		<div className="search-section-common">
			<div className="search-filters-common">
				<div className="search-controls-common">
					<input
						className="search-input-common"
						type="text"
						placeholder={placeholder}
						value={searchName}
						onChange={(e) => onSearchNameChange(e.target.value)}
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
							onClick={onReset}
							disabled={loading}
						>
							초기화
						</button>
						{showCreate && onCreate && (
							<button
								className="common-btn-common"
								onClick={onCreate}
								disabled={loading}
							>
								생성
							</button>
						)}
						{showExcel && onExcelDownload && (
							<button
								className="common-btn-common"
								onClick={onExcelDownload}
								disabled={loading}
							>
								엑셀 다운로드
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default AccountSearchBar;

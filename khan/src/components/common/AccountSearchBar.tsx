interface AccountSearchBarProps {
	searchName: string;
	onSearchNameChange: (value: string) => void;
	onSearch: () => void;
	onReset: () => void;
	onCreate: () => void;
	onExcelDownload: () => void;
	loading: boolean;
	placeholder?: string;
}

export const AccountSearchBar = ({
	searchName,
	onSearchNameChange,
	onSearch,
	onReset,
	onCreate,
	onExcelDownload,
	loading,
	placeholder = "거래처명을 입력하세요",
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
						<button
							className="common-btn-common"
							onClick={onCreate}
							disabled={loading}
						>
							생성
						</button>
						<button
							className="common-btn-common"
							onClick={onExcelDownload}
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

export default AccountSearchBar;

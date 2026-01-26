import { useState } from "react";
import type { SaleOptionData } from "../../../types/saleDto";
import "../../../styles/components/sale/SaleOption.css";

interface SaleOptionProps {
	options: SaleOptionData;
	onOptionChange: <K extends keyof SaleOptionData>(
		field: K,
		value: SaleOptionData[K]
	) => void;
	onCustomerSearchOpen: () => void;
	onDirectStoreSearch?: (searchTerm: string) => Promise<void>;
	disabled?: boolean;
	hasWGStatus: boolean;
	isStoreLoadedFromApi?: boolean;
	isMarketPriceLocked?: boolean;
}

const SaleOption: React.FC<SaleOptionProps> = ({
	options,
	onOptionChange,
	onCustomerSearchOpen,
	onDirectStoreSearch,
	disabled = false,
	hasWGStatus,
	isStoreLoadedFromApi = false,
	isMarketPriceLocked = false,
}) => {
	// 검색어 입력 상태
	const [storeSearchInput, setStoreSearchInput] = useState<string>("");
	const [isSearching, setIsSearching] = useState(false);

	// 검색어 입력 핸들러
	const handleStoreInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setStoreSearchInput(e.target.value);
	};

	// Enter 키 핸들러
	const handleStoreKeyDown = async (
		e: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (e.key === "Enter" && !e.nativeEvent.isComposing && onDirectStoreSearch) {
			const searchTerm = storeSearchInput.trim();
			if (searchTerm) {
				setIsSearching(true);
				try {
					await onDirectStoreSearch(searchTerm);
				} finally {
					setIsSearching(false);
				}
			}
		}
	};

	// 포커스 아웃 시 검색어 초기화
	const handleStoreBlur = () => {
		setTimeout(() => {
			setStoreSearchInput("");
		}, 200);
	};

	return (
		<div className="sale-option-container">
			{/* 첫째 줄 */}
			<div className="sale-option-row">
				{/* 거래일 */}
				<div className="sale-option-field">
					<label className="required-field">거래일</label>
					<input
						type="date"
						value={options.tradeDate}
						readOnly
						disabled
						style={{ backgroundColor: "#f5f5f5" }}
					/>
				</div>

				{/* 시세 */}
				<div className="sale-option-field">
					<label>시세</label>
					<input
						type="number"
						value={options.marketPrice || ""}
						onChange={(e) =>
							onOptionChange("marketPrice", Number(e.target.value))
						}
						placeholder="시세 입력"
						disabled={disabled || !hasWGStatus || isMarketPriceLocked}
						style={{
							backgroundColor: isMarketPriceLocked || !hasWGStatus ? "#f5f5f5" : undefined,
							cursor: isMarketPriceLocked ? "not-allowed" : undefined,
						}}
						title={
							isMarketPriceLocked
								? "기존 판매장의 시세가 자동 설정되었습니다"
								: ""
						}
					/>
				</div>

				{/* 거래번호 */}
				<div className="sale-option-field">
					<label>거래번호</label>
					<input
						type="text"
						value={options.saleCode}
						readOnly
						placeholder="자동 생성"
						disabled
						style={{ backgroundColor: "#f5f5f5" }}
					/>
				</div>

				{/* 거래 형태 */}
				<div className="sale-option-field">
					<label className="required-field">거래 형태</label>
					<select
						value={options.tradeType}
						onChange={(e) =>
							onOptionChange("tradeType", e.target.value as "중량" | "시세")
						}
						disabled={disabled}
						style={{ backgroundColor: "#f5f5f5", color: "#000" }}
					>
						<option value="중량">중량</option>
						<option value="시세">시세</option>
					</select>
				</div>
			</div>

			{/* 둘째 줄 */}
			<div className="sale-option-row">
				{/* 거래처 */}
				<div className="sale-option-field-search">
					<label className="required-field">거래처</label>
					<div className="sale-option-field-search-container">
						<input
							type="text"
							value={storeSearchInput || options.storeName}
							readOnly={isStoreLoadedFromApi || disabled}
							placeholder="거래처 검색 (Enter로 검색)"
							disabled={disabled}
							onChange={handleStoreInputChange}
							onKeyDown={handleStoreKeyDown}
							onBlur={handleStoreBlur}
							onClick={
								isStoreLoadedFromApi || !onDirectStoreSearch
									? onCustomerSearchOpen
									: undefined
							}
							style={{
								backgroundColor: isStoreLoadedFromApi ? "#f5f5f5" : undefined,
								color: "#000",
							}}
							title={`거래처 ID: ${options.storeId || "미설정"}`}
						/>
						<button
							className="btn-search"
							onClick={onCustomerSearchOpen}
							disabled={disabled || isStoreLoadedFromApi || isSearching}
							style={{
								opacity: isStoreLoadedFromApi ? 0.5 : 1,
								cursor: isStoreLoadedFromApi ? "not-allowed" : "pointer",
							}}
						>
							🔍
						</button>
					</div>
				</div>
			</div>
			{/* 셋째 줄 */}
			<div className="sale-option-row">
				{/* 공금 등급 */}
				<div className="sale-option-field">
					<label className="required-field">공금 등급</label>
					<input
						type="text"
						value={options.grade}
						readOnly
						placeholder="거래처 등급"
						disabled
						style={{ backgroundColor: "#f5f5f5" }}
					/>
				</div>

				{/* 적용해리 */}
				<div className="sale-option-field">
					<label className="required-field">적용해리</label>
					<input
						type="text"
						value={options.harry}
						readOnly
						placeholder="거래처 해리"
						disabled
						style={{ backgroundColor: "#f5f5f5" }}
					/>
				</div>
			</div>
		</div>
	);
};

export default SaleOption;

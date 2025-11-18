import type { SaleOptionData } from "../../../types/sale";
import "../../../styles/components/sale/SaleOption.css";

interface SaleOptionProps {
	options: SaleOptionData;
	onOptionChange: <K extends keyof SaleOptionData>(
		field: K,
		value: SaleOptionData[K]
	) => void;
	onCustomerSearchOpen: () => void;
	disabled?: boolean;
	hasWGStatus: boolean;
	isStoreLoadedFromApi?: boolean;
}

const SaleOption: React.FC<SaleOptionProps> = ({
	options,
	onOptionChange,
	onCustomerSearchOpen,
	disabled = false,
	hasWGStatus,
	isStoreLoadedFromApi = false,
}) => {
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
					<label className="required-field">시세</label>
					<input
						type="number"
						value={options.marketPrice || ""}
						onChange={(e) =>
							onOptionChange("marketPrice", Number(e.target.value))
						}
						placeholder="시세 입력"
						disabled={disabled || !hasWGStatus}
						style={{
							backgroundColor: !hasWGStatus ? "#f5f5f5" : "white",
						}}
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
							value={options.storeName}
							readOnly
							placeholder="거래처 검색"
							disabled={disabled}
							onClick={isStoreLoadedFromApi ? undefined : onCustomerSearchOpen}
							style={{ backgroundColor: "#f5f5f5", color: "#000" }}
							title={`거래처 ID: ${options.storeId || "미설정"}`}
						/>
						<button
							className="btn-search"
							onClick={onCustomerSearchOpen}
							disabled={disabled || isStoreLoadedFromApi}
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

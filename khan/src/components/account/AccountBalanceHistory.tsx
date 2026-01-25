import type { GoldHistoryData } from "../../types/saleDto";
import "../../styles/components/account/AccountBalanceHistory.css";

interface GoldHistoryProps {
	history: GoldHistoryData;
	disabled?: boolean;
}

const AccountBalanceHistory: React.FC<GoldHistoryProps> = ({
	history,
	disabled = false,
}) => {
	return (
		<div className="gold-history-container">
			<div className="gold-history-table">
				{/* 헤더 행 */}
				<div className="gold-history-table-header">
					<div className="gold-history-header-cell"></div>
					<div className="gold-history-header-cell">순금(g)</div>
					<div className="gold-history-header-cell">금액(원)</div>
				</div>
				{/* 전 미수 */}
				<div className="gold-history-table-row">
					<div className="gold-history-label-cell">전 미수</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.previousGoldBalance.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#ffffe0" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.previousMoneyBalance.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#ffffe0" }}
						/>
					</div>
				</div>
				{/* 판매 */}
				<div className="gold-history-table-row">
					<div className="gold-history-label-cell">판매</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.salesGoldBalance.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.salesMoneyBalance.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
				</div>
				{/* 반품 */}
				<div className="gold-history-table-row">
					<div className="gold-history-label-cell">반품</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={(history.returnsGoldBalance * -1).toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={(history.returnsMoneyBalance * -1).toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
				</div>
				{/* DC */}
				<div className="gold-history-table-row">
					<div className="gold-history-label-cell">D C</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={(history.dcGoldBalance * -1).toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={(history.dcMoneyBalance * -1).toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
				</div>
				{/* 결제 */}
				<div className="gold-history-table-row">
					<div className="gold-history-label-cell">결제</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={(history.paymentGoldBalance * -1).toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={(history.paymentMoneyBalance * -1).toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
				</div>
				{/* 후미수 */}
				<div className="gold-history-table-row">
					<div className="gold-history-label-cell">후미수</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.afterGoldBalance.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#ffffe0" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.afterMoneyBalance.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#ffffe0" }}
						/>
					</div>
				</div>
				{/* 후미수 */}
				<div className="gold-history-table-row">
					<div className="gold-history-label-cell">순금 환산</div>
					<div className="gold-history-label-cell">시세 환산</div>
					<div className="gold-history-label-cell">WG 환산</div>
				</div>
				<div className="gold-history-table-row">
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.pureGoldConversion.toFixed(3)}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f0f8ff" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={(history.marketPriceConversion * -1).toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f0f8ff" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={(history.wgConversion * -1).toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f0f8ff" }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AccountBalanceHistory;

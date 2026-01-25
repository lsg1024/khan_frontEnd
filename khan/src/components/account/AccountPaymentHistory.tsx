import type { GoldHistoryData } from "../../../types/sale";
import "../../../styles/components/sale/AccountBalanceHistory.css";

interface GoldHistoryProps {
	history: GoldHistoryData;
	disabled?: boolean;
}

const AccountPaymentHistory: React.FC<GoldHistoryProps> = ({
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
							value={history.returnsGoldBalance.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.returnsMoneyBalance.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
				</div>{" "}
				{/* DC */}
				<div className="gold-history-table-row">
					<div className="gold-history-label-cell">D C</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.dcGoldBalance.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.dcMoneyBalance.toLocaleString()}
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
							value={history.paymentGoldBalance.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.paymentMoneyBalance.toLocaleString()}
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
			</div>
		</div>
	);
};

export default AccountPaymentHistory;

import type { GoldHistoryData } from "../../../types/sale";
import "../../../styles/components/sale/GoldHistory.css";

interface GoldHistoryProps {
	history: GoldHistoryData;
	disabled?: boolean;
}

const GoldHistory: React.FC<GoldHistoryProps> = ({
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
					<div className="gold-history-header-cell">금액(공판)</div>
				</div>

				{/* 전 미수 */}
				<div className="gold-history-table-row">
					<div className="gold-history-label-cell">전 미수</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.totalPreviousBalance.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#ffffe0" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.totalPreviousBalance.toLocaleString()}
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
							value={history.sales.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.sales.toLocaleString()}
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
							value={history.returns.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.returns.toLocaleString()}
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
							value={history.dc.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.dc.toLocaleString()}
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
							value={history.payment.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#f5f5f5" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.payment.toLocaleString()}
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
							value={history.afterBalance.toLocaleString()}
							readOnly
							disabled={disabled}
							style={{ backgroundColor: "#ffffe0" }}
						/>
					</div>
					<div className="gold-history-value-cell">
						<input
							type="text"
							value={history.afterBalance.toLocaleString()}
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

export default GoldHistory;

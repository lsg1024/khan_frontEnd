import type { TransactionPage } from "../../../types/store";
import { calculateTotalWeightFromPureGold } from "../../../utils/goldUtils";
import "../../../styles/components/purchase/PurchaseList.css";

interface PurchaseListProps {
	transactions: TransactionPage[];
	currentPage: number;
	size: number;
	loading: boolean;
}

const PurchaseList: React.FC<PurchaseListProps> = ({
	transactions,
	currentPage,
	size,
	loading,
}) => {
	if (loading) {
		return (
			<div className="loading-container">
				<div className="spinner"></div>
				<p>데이터를 불러오는 중...</p>
			</div>
		);
	}

	if (transactions.length === 0) {
		return (
			<div className="empty-state">
				<span className="empty-icon">📋</span>
				<h3>매입 내역이 없습니다</h3>
				<p>조회 기간에 해당하는 데이터가 없습니다.</p>
			</div>
		);
	}

	// 합계 계산
	const purchaseTotal = { weight: 0, pureGold: 0, money: 0 };
	const negativeTotal = { weight: 0, pureGold: 0, money: 0 };

	transactions.forEach((transaction) => {
		const isNegative = ["결제", "반품", "DC"].includes(transaction.tradeType);
		const pureGoldWeight = parseFloat(transaction.goldAmount);
		const totalWeight = calculateTotalWeightFromPureGold(
			pureGoldWeight,
			transaction.material || "",
			transaction.accountHarry || "1.1"
		);
		const money = parseInt(transaction.moneyAmount);

		if (isNegative) {
			negativeTotal.weight += totalWeight;
			negativeTotal.pureGold += pureGoldWeight;
			negativeTotal.money += money;
		} else {
			purchaseTotal.weight += totalWeight;
			purchaseTotal.pureGold += pureGoldWeight;
			purchaseTotal.money += money;
		}
	});

	const finalTotal = {
		weight: purchaseTotal.weight - negativeTotal.weight,
		pureGold: purchaseTotal.pureGold - negativeTotal.pureGold,
		money: purchaseTotal.money - negativeTotal.money,
	};

	return (
		<table className="table purchase-table">
			<thead>
				<tr>
					<th>NO</th>
					<th>거래 날짜</th>
					<th>제조사명</th>
					<th>거래 구분</th>
					<th colSpan={4}>중량(g)</th>
					<th>금액</th>
					<th>비고</th>
				</tr>
				<tr>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th>재질</th>
					<th>중량</th>
					<th>순금</th>
					<th>해리</th>
					<th></th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{transactions.map((transaction, index) => {
					const isNegativeTransaction = ["결제", "반품", "DC"].includes(
						transaction.tradeType
					);

					// 순금 값 (서버에서 받은 goldAmount)
					const pureGoldWeight = parseFloat(transaction.goldAmount);

					// 총 중량 계산 (순금 → 재질에 따른 총 중량)
					const totalWeight = calculateTotalWeightFromPureGold(
						pureGoldWeight,
						transaction.material || "",
						transaction.accountHarry || "1.1"
					);

					return (
						<tr
							key={transaction.accountId}
							className={isNegativeTransaction ? "negative-transaction" : ""}
						>
							<td className="no-cell">
								{(currentPage - 1) * size + index + 1}
							</td>
							<td className="date-cell">{transaction.createDate}</td>
							<td className="serial-cell">{transaction.accountName}</td>
							<td className="material-cell">
								<span
									className={`trade-type-badge ${
										transaction.tradeType === "매입" ? "purchase" : "sale"
									}`}
								>
									{transaction.tradeType}
								</span>
							</td>
							<td className="material-cell">{transaction.material || "-"}</td>
							<td className="gold-amount">{totalWeight.toFixed(3)}g</td>
							<td className="gold-amount">{pureGoldWeight.toFixed(3)}g</td>
							<td className="color-cell">{transaction.accountHarry || "-"}</td>
							<td className="money-amount">
								{parseInt(transaction.moneyAmount).toLocaleString()}원
							</td>
							<td className="note-cell">
								{transaction.transactionNote || ""}
							</td>
						</tr>
					);
				})}
			</tbody>
			<tfoot>
				<tr className="summary-row purchase-summary">
					<td colSpan={5} className="summary-label">
						매입 합계
					</td>
					<td className="gold-amount">{purchaseTotal.weight.toFixed(3)}g</td>
					<td className="gold-amount">{purchaseTotal.pureGold.toFixed(3)}g</td>
					<td></td>
					<td className="money-amount">
						{purchaseTotal.money.toLocaleString()}원
					</td>
					<td className="money-amount"></td>
				</tr>
				<tr className="summary-row negative-summary">
					<td colSpan={5} className="summary-label">
						결제 & 반품 & DC 합계
					</td>
					<td className="gold-amount">{negativeTotal.weight.toFixed(3)}g</td>
					<td className="gold-amount">{negativeTotal.pureGold.toFixed(3)}g</td>
					<td></td>
					<td className="money-amount">
						{negativeTotal.money.toLocaleString()}원
					</td>
					<td className="money-amount"></td>
				</tr>
				<tr className="summary-row final-summary">
					<td colSpan={5} className="summary-label">
						매입-결제 합계
					</td>
					<td className="gold-amount">{finalTotal.weight.toFixed(3)}g</td>
					<td className="gold-amount">{finalTotal.pureGold.toFixed(3)}g</td>
					<td></td>
					<td className="money-amount">
						{finalTotal.money.toLocaleString()}원
					</td>
					<td className="money-amount"></td>
				</tr>
			</tfoot>
		</table>
	);
};

export default PurchaseList;

import type { FactoryPurchaseDto } from "../../../types/factoryDto";
import {
	calculatePureGoldWeightWithHarry,
	getGoldTransferWeight,
} from "../../../utils/goldUtils";
import "../../../styles/components/purchase/PurchaseList.css";

interface PurchaseListProps {
	transactions: FactoryPurchaseDto[];
	currentPage: number;
	size: number;
	loading: boolean;
}

/**
 * 매입 목록(제조사별 잔액).
 * BE /factories/purchase 는 제조사별 현재 잔액(AccountResponse)을 반환하며,
 * goldWeight = factory.currentGoldBalance(= 순금 기준 누적 잔액)이다.
 *
 * 과거 코드는 존재하지 않는 `goldAmount` 필드를 읽어 순금이 NaN 으로 표기됐다.
 * → 서버가 실제로 주는 `goldWeight` 를 goldUtils 의 해리 계산 함수로 환산해 순금을 표기한다.
 *   (제조사 잔액은 순금 기준이므로 재질을 24K 로 보고 환산 → goldWeight 와 동일, NaN 제거)
 */
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

	// goldWeight(순금 잔액)를 goldUtils 로 환산해 합계 계산
	const totals = transactions.reduce(
		(acc, t) => {
			const harry = t.goldHarryLoss || "1.00";
			const pureGoldGram = calculatePureGoldWeightWithHarry(
				t.goldWeight,
				"24K",
				harry
			);
			const pureGoldDon = Number(getGoldTransferWeight(t.goldWeight, "24K"));
			acc.pureGoldGram += pureGoldGram;
			acc.pureGoldDon += pureGoldDon;
			acc.money += Number(t.moneyAmount) || 0;
			return acc;
		},
		{ pureGoldGram: 0, pureGoldDon: 0, money: 0 }
	);

	return (
		<table className="table purchase-table">
			<thead>
				<tr>
					<th>NO</th>
					<th>제조사명</th>
					<th>거래 구분</th>
					<th>해리</th>
					<th>순금 중량(g)</th>
					<th>순금(돈)</th>
					<th>미수금(원)</th>
					<th>최근 거래일</th>
					<th>비고</th>
				</tr>
			</thead>
			<tbody>
				{transactions.map((t, index) => {
					const harry = t.goldHarryLoss || "1.00";
					// 순금 중량(g): 서버가 주는 goldWeight 를 해리 계산(goldUtils)으로 환산
					const pureGoldGram = calculatePureGoldWeightWithHarry(
						t.goldWeight,
						"24K",
						harry
					);
					// 순금(돈): goldUtils 환산 (g → 돈)
					const pureGoldDon = getGoldTransferWeight(t.goldWeight, "24K");

					return (
						<tr key={t.accountId}>
							<td className="no-cell">
								{(currentPage - 1) * size + index + 1}
							</td>
							<td className="serial-cell">{t.accountName}</td>
							<td className="material-cell">
								<span
									className={`trade-type-badge ${
										t.tradeType === "매입" ? "purchase" : "sale"
									}`}
								>
									{t.tradeType || "매입"}
								</span>
							</td>
							<td className="color-cell">{harry}</td>
							<td className="gold-amount">{pureGoldGram.toFixed(3)}g</td>
							<td className="gold-amount">{pureGoldDon.toFixed(3)}돈</td>
							<td className="money-amount">
								{(Number(t.moneyAmount) || 0).toLocaleString()}원
							</td>
							<td className="date-cell">{t.lastSaleDate || "-"}</td>
							<td className="note-cell">{t.note || ""}</td>
						</tr>
					);
				})}
			</tbody>
			<tfoot>
				<tr className="summary-row final-summary">
					<td colSpan={4} className="summary-label">
						합계
					</td>
					<td className="gold-amount">{totals.pureGoldGram.toFixed(3)}g</td>
					<td className="gold-amount">{totals.pureGoldDon.toFixed(3)}돈</td>
					<td className="money-amount">{totals.money.toLocaleString()}원</td>
					<td></td>
					<td></td>
				</tr>
			</tfoot>
		</table>
	);
};

export default PurchaseList;

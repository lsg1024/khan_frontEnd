import type { PastOrderDto } from "../../types/order";
import "../../styles/components/PastOrderHistory.css";

interface PastOrderHistoryProps {
	pastOrders: PastOrderDto[];
	title?: string;
	maxRows?: number;
}

const PastOrderHistory: React.FC<PastOrderHistoryProps> = ({
	pastOrders,
	title = "과거 거래내역",
	maxRows = 4,
}) => {
	return (
		<div className="order-history-section">
			<h2>{title}</h2>
			<div className="order-history-table-container">
				<table className="order-history-table">
					<thead>
						<tr>
							<th className="col-no">No</th>
							<th className="col-date">거래일</th>
							<th className="col-model">모델번호</th>
							<th className="col-material">재질</th>
							<th className="col-color">색상</th>
							<th colSpan={2}>알 메모</th>
							<th className="col-size">사이즈</th>
							<th className="col-etc">기타</th>
							<th className="col-gold-weight">금중량</th>
							<th className="col-stone-weight">알중량</th>
							<th colSpan={2}>상품 단가</th>
							<th colSpan={3}>알 단가</th>
							<th colSpan={2}>알 수량</th>
							<th colSpan={3}>보조석</th>
							<th className="col-total-fee">공임합</th>
						</tr>
						<tr>
							<th className="col-no"></th>
							<th className="col-date"></th>
							<th className="col-model"></th>
							<th className="col-material"></th>
							<th className="col-color"></th>
							<th className="col-stone-memo-main">메인</th>
							<th className="col-stone-memo-sub">보조</th>
							<th className="col-size"></th>
							<th className="col-etc"></th>
							<th className="col-gold-weight"></th>
							<th className="col-stone-weight"></th>
							<th className="col-price-base">기본</th>
							<th className="col-price-add">추가</th>
							<th className="col-stone-price-main">메인</th>
							<th className="col-stone-price-sub">보조</th>
							<th className="col-stone-price-add">추가</th>
							<th className="col-stone-qty-main">메인</th>
							<th className="col-stone-qty-sub">보조</th>
							<th className="col-side-stone-type">유형</th>
							<th className="col-side-stone-status">입고여부</th>
							<th className="col-side-stone-date">입고날짜</th>
							<th className="col-total-fee"></th>
						</tr>
					</thead>
					<tbody>
						{/* 지정된 최대 행 수만큼 표시 */}
						{[...Array(maxRows)].map((_, index) => {
							const pastOrder = pastOrders[index];
							const totalFee = pastOrder
								? pastOrder.productLaborCost +
								  pastOrder.productAddLaborCost +
								  pastOrder.mainStoneLaborCost * pastOrder.mainStoneQuantity +
								  pastOrder.assistanceStoneLaborCost *
										pastOrder.assistanceStoneQuantity +
								  pastOrder.addStoneLaborCost
								: 0;

							return (
								<tr key={index}>
									<td>{index + 1}</td>
									<td>
										{pastOrder
											? new Date(pastOrder.saleCreateAt)
													.toLocaleDateString("ko-KR")
													.slice(0, 11)
											: ""}
									</td>
									<td>{pastOrder?.productName || ""}</td>
									<td>{pastOrder?.productMaterial || ""}</td>
									<td>{pastOrder?.productColor || ""}</td>
									<td>{pastOrder?.stockMainStoneNote || ""}</td>
									<td>{pastOrder?.stockAssistanceStoneNote || ""}</td>
									<td>{pastOrder?.productSize || ""}</td>
									<td>{pastOrder?.stockNote || ""}</td>
									<td>{pastOrder ? pastOrder.goldWeight.toFixed(3) : ""}</td>
									<td>{pastOrder ? pastOrder.stoneWeight.toFixed(3) : ""}</td>
									<td>
										{pastOrder
											? pastOrder.productLaborCost.toLocaleString()
											: ""}
									</td>
									<td>
										{pastOrder
											? pastOrder.productAddLaborCost.toLocaleString()
											: ""}
									</td>
									<td>
										{pastOrder
											? pastOrder.mainStoneLaborCost.toLocaleString()
											: ""}
									</td>
									<td>
										{pastOrder
											? pastOrder.assistanceStoneLaborCost.toLocaleString()
											: ""}
									</td>
									<td>
										{pastOrder
											? pastOrder.addStoneLaborCost.toLocaleString()
											: ""}
									</td>
									<td>{pastOrder?.mainStoneQuantity || ""}</td>
									<td>{pastOrder?.assistanceStoneQuantity || ""}</td>
									<td>
										{pastOrder?.assistantStone
											? pastOrder.assistantStoneName
											: ""}
									</td>
									<td>
										{pastOrder?.assistantStone ? "Y" : pastOrder ? "N" : ""}
									</td>
									<td>
										{pastOrder?.assistantStoneCreateAt
											? new Date(pastOrder.assistantStoneCreateAt)
													.toLocaleDateString("ko-KR")
													.slice(0, 11)
											: ""}
									</td>
									<td>{pastOrder ? totalFee.toLocaleString() : ""}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default PastOrderHistory;

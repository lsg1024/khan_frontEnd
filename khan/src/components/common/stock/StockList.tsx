import type { StockResponse } from "../../../types/stock";
import "../../../styles/components/StockList.css";

interface StockListProps {
	stocks: StockResponse[];
	currentPage: number;
	loading: boolean;
	onStockClick: (flowCode: string) => void;
}

export const StockList = ({
	stocks,
	currentPage,
	loading,
	onStockClick,
}: StockListProps) => {
	const PAGE_SIZE = 20;

	const handleRowClick = (flowCode: string) => {
		onStockClick(flowCode);
	};

	if (loading) {
		return (
			<div className="stock-list">
				<div className="loading-message">재고 목록을 불러오는 중...</div>
			</div>
		);
	}

	if (stocks.length === 0) {
		return (
			<div className="stock-list">
				<div className="no-data-message">재고 데이터가 없습니다.</div>
			</div>
		);
	}

	return (
		<table className="stock-table">
			<thead>
				<tr>
					<th>No</th>
					<th>시리얼</th>
					<th>상태</th>
					<th>등록일</th>
					<th className="stock-table-twin">사이즈/비고</th>
					<th>재질</th>
					<th>색상</th>
					<th className="stock-table-twin">알 메모</th>
					<th colSpan={2}>알 개수</th>
					<th colSpan={2}>중량</th>
					<th colSpan={2}>상품 단가</th>
					<th colSpan={2}>보조석</th>
					<th colSpan={3}>알단가</th>
					<th colSpan={2}>매입가</th>
				</tr>
				<tr>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th>메인/보조</th>
					<th>메인</th>
					<th>보조</th>
					<th>금</th>
					<th>스톤</th>
					<th>메인</th>
					<th>추가</th>
					<th>입</th>
					<th>이름</th>
					<th>메인</th>
					<th>보조</th>
					<th>추가</th>
					<th>상품</th>
					<th>스톤</th>
				</tr>
			</thead>
			<tbody>
				{stocks.map((stock, index) => {
					const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

					return (
						<tr
							key={stock.flowCode}
							onClick={() => handleRowClick(stock.flowCode)}
							className="stock-row"
						>
							<td className="no-cell">{rowNumber}</td>
							<td className="serial-cell">{stock.flowCode}</td>
							<td className="order-cell">{stock.originStatus}</td>
							<td className="date-cell">
								{stock.createAt
									? new Date(stock.createAt).toLocaleDateString("ko-KR")
									: "-"}
							</td>
							<td className="size-note-content">
								<div className="info-row-order">
									<span>{stock.productSize || "-"}</span>
								</div>
								<div className="info-row-order">
									<span>{stock.stockNote || "-"}</span>
								</div>
							</td>

							<td className="material-cell">{stock.materialName || "-"}</td>
							<td className="color-cell">{stock.colorName || "-"}</td>

							<td className="stone-note-content">
								<div className="main-note">{stock.mainStoneNote || "-"}</div>
								<div className="assistance-note">
									{stock.assistanceStoneNote || "-"}
								</div>
							</td>

							<td className="main-quantity-cell">
								{stock.mainStoneQuantity || "-"}
							</td>
							<td className="assistance-quantity-cell">
								{stock.assistanceStoneQuantity || "-"}
							</td>
							<td className="gold-weight-cell">{stock.goldWeight || "-"}</td>
							<td className="stone-weight-cell">{stock.stoneWeight || "-"}</td>
							<td className="product-labor-cost-cell">
								{stock.productLaborCost
									? stock.productLaborCost.toLocaleString()
									: "-"}
							</td>
							<td className="add-labor-cost-cell">
								{stock.productAddLaborCost
									? stock.productAddLaborCost.toLocaleString()
									: "-"}
							</td>
							<td className="assistant-stone-cell">
								<span
									className={`status ${
										stock.assistantStone ? "active" : "inactive"
									}`}
								>
									{stock.assistantStone ? "Y" : "N"}
								</span>
							</td>
							<td className="assistant-stone-name-cell">
								{stock.assistantStoneName || "-"}
							</td>
							<td className="main-stone-labor-cost-cell">
								{stock.mainStoneLaborCost
									? stock.mainStoneLaborCost.toLocaleString()
									: "-"}
							</td>
							<td className="assistance-stone-labor-cost-cell">
								{stock.assistanceStoneLaborCost
									? stock.assistanceStoneLaborCost.toLocaleString()
									: "-"}
							</td>
							<td className="stone-add-labor-cost-cell">
								{stock.stoneAddLaborCost
									? stock.stoneAddLaborCost.toLocaleString()
									: "-"}
							</td>
							<td className="product-purchase-cost-cell">
								{stock.productPurchaseCost
									? stock.productPurchaseCost.toLocaleString()
									: "-"}
							</td>
							<td className="stone-purchase-cost-cell">
								{stock.stonePurchaseCost
									? stock.stonePurchaseCost.toLocaleString()
									: "-"}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export default StockList;

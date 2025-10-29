import type { StockResponse } from "../../../types/stock";
import "../../../styles/components/StockList.css";

interface StockListProps {
	stocks: StockResponse[];
	currentPage: number;
	loading: boolean;
	selected: string[];
	onSelect: (flowCode: string, checked: boolean) => void;
	onNoClick?: (flowCode: string) => void;
	showShippingAt?: boolean; // 변경일 표시 여부
	disableRentalCheckbox?: boolean; // 대여 상태 체크박스 비활성화 여부
}

export const StockList = ({
	stocks,
	currentPage,
	loading,
	selected,
	onSelect,
	onNoClick,
	showShippingAt = false,
	disableRentalCheckbox = true, // 기본값: 대여 상태 체크박스 비활성화
}: StockListProps) => {
	const PAGE_SIZE = 20;

	if (loading) {
		return (
			<div className="stock-list">
				<div className="loading-message">목록을 불러오는 중...</div>
			</div>
		);
	}

	if (stocks.length === 0) {
		return (
			<div className="stock-list">
				<div className="no-data-message">데이터가 없습니다.</div>
			</div>
		);
	}

	return (
		<table className="stock-table">
			<thead>
				<tr>
					<th>선택</th>
					<th>No</th>
					<th>시리얼</th>
					<th>주문</th>
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
					<th>상태</th>
					<th>{showShippingAt ? "변경일" : ""}</th>
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
					<th>이름</th>
					<th>상태</th>
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

					// originStatus와 currentStatus 조합으로 CSS 클래스 결정
					const getRowClass = (originStatus: string, currentStatus: string) => {
						const origin = originStatus || "";
						const current = currentStatus || "";

						// 일반 + 재고 = 회색
						if (origin === "일반" && current === "재고") {
							return "stock-row-general-stock";
						}
						// 일반 + 대여 = 주황색
						if (origin === "일반" && current === "대여") {
							return "stock-row-general-rental";
						}
						// 주문 + 재고 = 초록색
						if (origin === "주문" && current === "재고") {
							return "stock-row-order-stock";
						}
						// 주문 + 대여 = 주황색
						if (origin === "주문" && current === "대여") {
							return "stock-row-order-rental";
						}
						// 수리 + 재고 = 노란색
						if (origin === "수리" && current === "재고") {
							return "stock-row-repair-stock";
						}

						return "stock-row";
					};

					return (
						<tr
							key={stock.flowCode}
							className={getRowClass(stock.originStatus, stock.currentStatus)}
						>
							<td className="no-cell">
								<input
									type="checkbox"
									checked={selected.includes(stock.flowCode)}
									disabled={
										disableRentalCheckbox && stock.currentStatus === "대여"
									} // prop에 따라 대여 상태 체크박스 비활성화
									onChange={(e) => {
										e.stopPropagation();
										onSelect(stock.flowCode, e.target.checked);
									}}
								/>
							</td>
							<td className="no-cell">
								<button
									className="stock-no-btn"
									onClick={(e) => {
										e.stopPropagation();
										onNoClick?.(stock.flowCode);
									}}
								>
									{rowNumber}
								</button>
							</td>
							<td className="serial-cell">{stock.flowCode}</td>
							<td className="order-cell">
								<div className="info-row-order">
									<span>{stock.originStatus}</span>
								</div>
								<div className="info-row-order">
									<span style={{ color: "red" }}>
										{stock.currentStatus || "-"}
									</span>
								</div>
							</td>
							<td className="date-cell">
								<div className="info-row-order">
									<span>
										{stock.createAt
											? (() => {
													const date = new Date(stock.createAt);
													const year = date.getFullYear();
													const month = String(date.getMonth() + 1).padStart(
														2,
														"0"
													);
													const day = String(date.getDate()).padStart(2, "0");
													return `${year}-${month}-${day}`;
											  })()
											: "-"}
									</span>
								</div>
								{showShippingAt && (
									<div className="info-row-order">
										<span style={{ color: "red" }}>
											{stock.shippingAt
												? (() => {
														const date = new Date(stock.shippingAt);
														const year = date.getFullYear();
														const month = String(date.getMonth() + 1).padStart(
															2,
															"0"
														);
														const day = String(date.getDate()).padStart(2, "0");
														return `${year}-${month}-${day}`;
												  })()
												: "-"}
										</span>
									</div>
								)}
							</td>
							<td className="size-note-content">
								<div className="info-row-order">
									<span>{stock.productSize || "-"}</span>
								</div>
								<div className="info-row-order">
									<span>{stock.stockNote || "-"}</span>
								</div>
							</td>

							<td
								className={`material-cell ${
									stock.materialName === "18K"
										? "material-name-18k"
										: stock.materialName === "24K"
										? "material-name-24k"
										: ""
								}`}
							>
								{stock.materialName || "-"}
							</td>
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
							<td className="assistant-stone-name-cell">
								{stock.assistantStoneName || "-"}
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

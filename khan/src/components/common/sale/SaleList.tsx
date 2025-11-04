import type { SaleRow } from "../../../types/sale";
import "../../../styles/components/sale/SaleList.css";

interface SaleListProps {
	sales: SaleRow[];
	currentPage: number;
	loading: boolean;
	selected: number[];
	onSelect: (saleCode: number, checked: boolean) => void;
	onNoClick?: (flowCode: number) => void;
}

export const SaleList = ({
	sales,
	currentPage,
	loading,
	selected,
	onSelect,
	onNoClick,
}: SaleListProps) => {
	const PAGE_SIZE = 20;

	if (loading) {
		return (
			<div className="sale-list">
				<div className="loading-message">목록을 불러오는 중...</div>
			</div>
		);
	}

	if (sales.length === 0) {
		return (
			<div className="sale-list">
				<div className="no-data-message">데이터가 없습니다.</div>
			</div>
		);
	}

	return (
		<table className="sale-table">
			<thead>
				<tr>
					<th>선택</th>
					<th>No</th>
					<th>일자</th>
					<th>구분</th>
					<th>거래처</th>
					<th>거래번호</th>
					<th>시리얼</th>
					<th>모델</th>
					<th>재질</th>
					<th>색상</th>
					<th>비고</th>
					<th colSpan={2}>보조석</th>
					<th colSpan={2}>총중량</th>
					<th>상품 단가</th>
					<th colSpan={3}>알 단가</th>
					<th colSpan={2}>알 수</th>
				</tr>
				<tr>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th>입</th>
					<th>이름</th>
					<th>금</th>
					<th>순금</th>
					<th></th>
					<th>메인</th>
					<th>보조</th>
					<th>추가</th>
					<th>메인</th>
					<th>보조</th>
				</tr>
			</thead>
			<tbody>
				{sales.map((sale, index) => {
					const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

					return (
						<tr key={sale.saleCode} className="sale-row">
							<td className="no-cell">
								<input
									type="checkbox"
									checked={selected.includes(sale.saleCode)}
									onChange={(e) => {
										e.stopPropagation();
										onSelect(sale.saleCode, e.target.checked);
									}}
								/>
							</td>
							<td className="no-cell">
								<button
									className="sale-no-btn"
									onClick={(e) => {
										e.stopPropagation();
										onNoClick?.(sale.flowCode);
									}}
								>
									{rowNumber}
								</button>
							</td>
							<td className="date-cell" title={sale.createAt}>
								{sale.createAt
									? (() => {
											const date = new Date(sale.createAt);
											const year = date.getFullYear();
											const month = String(date.getMonth() + 1).padStart(
												2,
												"0"
											);
											const day = String(date.getDate()).padStart(2, "0");
											return `${year}-${month}-${day}`;
									  })()
									: "-"}
							</td>
							<td className="sale-type-cell" title={sale.saleType}>
								{sale.saleType}
							</td>
							<td className="store-cell" title={sale.storeName}>
								{sale.storeName}
							</td>
							<td className="sale-code-cell" title={sale.saleCode.toString()}>
								<a
									href="#"
									className="sale-code-link"
									onClick={(e) => {
										e.preventDefault();
										// TODO: 거래번호 링크 기능 구현
									}}
								>
									{sale.saleCode}
								</a>
							</td>
							<td className="flow-code-cell" title={sale.flowCode.toString()}>
								<a
									href="#"
									className="flow-code-link"
									onClick={(e) => {
										e.preventDefault();
										// TODO: 시리얼 링크 기능 구현
									}}
								>
									{sale.flowCode}
								</a>
							</td>
							<td className="product-cell" title={sale.productName}>
								{sale.productName}
							</td>
							<td
								className={`material-cell ${
									sale.materialName === "18K"
										? "material-name-18k"
										: sale.materialName === "24K"
										? "material-name-24k"
										: ""
								}`}
								title={sale.materialName || "-"}
							>
								{sale.materialName || "-"}
							</td>
							<td className="color-cell" title={sale.colorName || "-"}>
								{sale.colorName || "-"}
							</td>
							<td className="note-cell" title={sale.note || "-"}>
								{sale.note || "-"}
							</td>
							<td
								className="assistant-stone-cell"
								title={sale.assistantStone ? "Y" : "N"}
							>
								<span
									className={`status ${
										sale.assistantStone ? "active" : "inactive"
									}`}
								>
									{sale.assistantStone ? "Y" : "N"}
								</span>
							</td>
							<td
								className="assistant-stone-name-cell"
								title={sale.assistantName || "-"}
							>
								{sale.assistantName || "-"}
							</td>
							<td
								className="total-weight-cell"
								title={sale.totalWeight?.toString() || "-"}
							>
								{sale.totalWeight || "-"}
							</td>
							<td
								className="gold-weight-cell"
								title={sale.goldWeight?.toString() || "-"}
							>
								{sale.goldWeight || "-"}
							</td>
							<td
								className="total-product-labor-cost-cell"
								title={
									sale.totalProductLaborCost
										? sale.totalProductLaborCost.toLocaleString()
										: "-"
								}
							>
								{sale.totalProductLaborCost
									? sale.totalProductLaborCost.toLocaleString()
									: "-"}
							</td>
							<td
								className="main-stone-labor-cost-cell"
								title={
									sale.mainStoneLaborCost
										? sale.mainStoneLaborCost.toLocaleString()
										: "-"
								}
							>
								{sale.mainStoneLaborCost
									? sale.mainStoneLaborCost.toLocaleString()
									: "-"}
							</td>
							<td
								className="assistance-stone-labor-cost-cell"
								title={
									sale.assistanceStoneLaborCost
										? sale.assistanceStoneLaborCost.toLocaleString()
										: "-"
								}
							>
								{sale.assistanceStoneLaborCost
									? sale.assistanceStoneLaborCost.toLocaleString()
									: "-"}
							</td>
							<td
								className="stone-add-labor-cost-cell"
								title={
									sale.stoneAddLaborCost
										? sale.stoneAddLaborCost.toLocaleString()
										: "-"
								}
							>
								{sale.stoneAddLaborCost
									? sale.stoneAddLaborCost.toLocaleString()
									: "-"}
							</td>
							<td
								className="main-stone-quantity-cell"
								title={sale.mainStoneQuantity?.toString() || "-"}
							>
								{sale.mainStoneQuantity || "-"}
							</td>
							<td
								className="assistance-stone-quantity-cell"
								title={sale.assistanceStoneQuantity?.toString() || "-"}
							>
								{sale.assistanceStoneQuantity || "-"}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export default SaleList;

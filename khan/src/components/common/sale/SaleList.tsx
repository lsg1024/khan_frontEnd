import type { SaleRow } from "../../../types/saleDto";
import StatusHistoryTooltip from "../StatusHistoryTooltip";
import "../../../styles/components/sale/SaleList.css";

interface SaleListProps {
	sales: SaleRow[];
	currentPage: number;
	loading: boolean;
	selected: string[];
	onSelect: (flowCode: string, checked: boolean) => void;
	onNoClick?: (flowCode: string, orderStatus: string) => void;
	onSerialClick?: (flowCode: string) => void; // 시리얼 번호 클릭 핸들러
}

export const SaleList = ({
	sales,
	currentPage,
	loading,
	selected,
	onSelect,
	onNoClick,
	onSerialClick,
}: SaleListProps) => {
	const PAGE_SIZE = 20;

	// 판매 타입 한글 매핑
	const saleTypeMap: Record<string, string> = {
		SALE: "판매",
		RETURN: "반품",
		PAYMENT: "결제",
		DISCOUNT: "DC",
		PAYMENT_TO_BANK: "통장",
		WG: "WG",
	};

	if (loading) {
		return <div className="loading-message">목록을 불러오는 중...</div>;
	}

	if (sales.length === 0) {
		return <div className="no-data-message">데이터가 없습니다.</div>;
	}

	return (
		<table className="table">
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
					const uniqueKey = `${sale.saleCode}-${index}`;

					// saleType에 따른 클래스 결정
					let rowClass = "sale-row";
					if (sale.saleType === "DISCOUNT") {
						rowClass += " sale-row-discount"; // 하늘색
					} else if (sale.saleType === "WG") {
						rowClass += " sale-row-wg"; // 노란색
					} else if (sale.saleType === "PAYMENT") {
						rowClass += " sale-row-payment"; // 연노란색
					} else if (sale.saleType === "PAYMENT_TO_BANK") {
						rowClass += " sale-row-payment-bank"; // 더연노란색
					} else if (sale.saleType === "RETURN") {
						rowClass += " sale-row-return"; // 연붉은색
					}
					// SALE인 경우 기본 흰색 (추가 클래스 없음)

					return (
						<tr key={uniqueKey} className={rowClass}>
							<td className="no-cell">
								<input
									type="checkbox"
									checked={selected.includes(sale.flowCode.toString())}
									onChange={(e) => {
										e.stopPropagation();
										onSelect(sale.flowCode.toString(), e.target.checked);
									}}
								/>
							</td>
							<td className="no-cell">
								<button
									className="no-btn"
									onClick={(e) => {
										e.stopPropagation();
										onNoClick?.(sale.flowCode, sale.saleType);
									}}
								>
									{rowNumber}
								</button>
							</td>
							<td className="date-cell" title={sale.createAt}>
								<StatusHistoryTooltip statusHistory={sale.statusHistory}>
									{sale.createAt
										? (() => {
												const date = new Date(sale.createAt);
												const year = String(date.getFullYear()).slice(-2); // 연도 2자리
												const month = String(date.getMonth() + 1).padStart(
													2,
													"0"
												);
												const day = String(date.getDate()).padStart(2, "0");
												return `${year}-${month}-${day}`;
										  })()
										: "-"}
								</StatusHistoryTooltip>
							</td>
							<td className="sale-type-cell" title={sale.saleType}>
								{saleTypeMap[sale.saleType] || sale.saleType}
							</td>
							<td className="store-cell" title={sale.storeName}>
								{sale.storeName}
							</td>
							<td className="sale-code-cell" title={sale.saleCode.toString()}>
								<button
									className="serial-btn sale-code-cell"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										// 거래명세서 인쇄 팝업 열기
										const url = `/sales/print/${sale.saleCode}`;
										const NAME = `sale_print_${sale.saleCode}`;
										const FEATURES =
											"resizable=yes,scrollbars=yes,width=1400,height=900";
										window.open(url, NAME, FEATURES);
									}}
								>
									{sale.saleCode}
								</button>
							</td>
							<td className="sale-code-cell" title={sale.flowCode.toString()}>
								<button
									className="serial-btn sale-code-cell "
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										onSerialClick?.(sale.flowCode);
									}}
								>
									{sale.flowCode}
								</button>
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
								title={sale.goldWeight?.toString() || "-"}
							>
								{sale.goldWeight || "-"}
							</td>
							<td
								className="gold-weight-cell"
								title={sale.pureGoldWeight?.toString() || "-"}
							>
								{sale.pureGoldWeight || "-"}
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

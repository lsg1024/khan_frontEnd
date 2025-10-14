import type { OrderDto } from "../../../types/order";
import { formatToLocalDate } from "../../../utils/dateUtils";

interface MainListProps {
	dtos: OrderDto[];
	selected: string[];
	currentPage: number;
	loading: boolean;
	onSelect: (flowCode: string, checked: boolean) => void;
	onClick?: (flowCode: string) => void;
	onStatusChange: (flowCode: string, newStatus: string) => void;
	onFactoryClick: (flowCode: string) => void;
}

const MainList = ({
	dtos,
	selected,
	currentPage,
	loading,
	onSelect,
	onClick,
	onStatusChange,
	onFactoryClick,
}: MainListProps) => {
	if (dtos.length === 0) {
		return (
			<div className="no-data-order">
				<p>조회된 데이터가 없습니다.</p>
			</div>
		);
	}

	return (
		<table className="order-table">
			<thead>
				<tr>
					<th>선택</th>
					<th>No</th>
					<th>상품명</th>
					<th>주문/출고</th>
					<th>상태</th>
					<th>판매처</th>
					<th>이미지</th>
					<th>재질/색상</th>
					<th>메인/보조</th>
					<th>사이즈</th>
					<th>세트타입</th>
					<th>재고</th>
					<th>급</th>
					<th>비고</th>
					<th>상품상태</th>
					<th>제조사</th>
				</tr>
			</thead>
			<tbody>
				{dtos.map((dto, index) => (
					<tr
						key={dto.flowCode}
						className={`
							${selected.includes(dto.flowCode) ? "selected-row" : ""}
							${dto.orderStatus === "DELETED" ? "disabled-row" : ""}
							${dto.orderStatus === "재고" ? "stock-row" : ""} 
							`}
					>
						<td>
							<input
								type="checkbox"
								checked={selected.includes(dto.flowCode)}
								onChange={(e) => onSelect(dto.flowCode, e.target.checked)}
								disabled={dto.orderStatus === "DELETED" || dto.orderStatus === "STOCK"}
							/>
						</td>
						<td>
							<button
								className="order-no-btn"
								onClick={() => onClick?.(dto.flowCode)}
							>
								{(currentPage - 1) * 16 + index + 1}
							</button>
						</td>
						<td className="product-name-order">{dto.productName}</td>
						<td className="info-cell">
							<div className="info-row-order">
								<span className="info-value">
									{formatToLocalDate(dto.createAt)}
								</span>
							</div>
							<div className="info-row-order">
								<span className="info-value-expect">
									{formatToLocalDate(dto.shippingAt)}
								</span>
							</div>
						</td>
						<td className="order-status-cell">{dto.orderStatus}</td>
						<td>{dto.storeName}</td>
						<td className="info-cell">
							<img
								className="order-image"
								src={
									dto.imagePath
										? `/@fs/C:/Users/zks14/Desktop/multi_module/product-service/src/main/resources${dto.imagePath}`
										: "/images/not_ready.png"
								}
								alt={dto.productName}
								onError={(e) => {
									e.currentTarget.src = "/images/not_ready.png";
								}}
							/>
						</td>
						<td className="info-cell">
							<div className="info-row-order">
								<span
									className={`info-value ${
										dto.materialName === "18K" ? "highlight-18k" : ""
									}`}
								>
									{dto.materialName}
								</span>
							</div>
							<div className="info-row-order">
								<span className="info-value">{dto.colorName}</span>
							</div>
						</td>
						<td className="info-cell">
							<div className="info-row-order">
								<span className="info-value-stone-note">
									{dto.orderMainStoneNote}
								</span>
							</div>
							<div className="info-row-order">
								<span className="info-value-stone-note">
									{dto.orderAssistanceStoneNote}
								</span>
							</div>
						</td>
						<td>{dto.productSize}</td>
						<td>{dto.setType}</td>
						<td>{dto.stockQuantity}</td>
						<td>
							<span className={`priority-badge-order ${dto.priority}`}>
								{dto.priority}
							</span>
						</td>
						<td className="note-cell-order">{dto.orderNote}</td>
						<td>
							<select
								className="status-dropdown-order"
								value={dto.productStatus}
								onChange={(e) => onStatusChange(dto.flowCode, e.target.value)}
								disabled={loading}
							>
								<option value="접수">접수</option>
								<option value="대기">대기</option>
							</select>
						</td>
						<td>
							<button
								className="factory-name-btn"
								onClick={() => onFactoryClick(dto.flowCode)}
								disabled={loading}
							>
								<ul>{dto.factoryName}</ul>
							</button>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};

export default MainList;

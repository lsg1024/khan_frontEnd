import type { OrderDto } from "../../../types/orderDto";
import { formatToLocalDate } from "../../../utils/dateUtils";
import { AuthImage } from "../AuthImage";
import StatusHistoryTooltip from "../StatusHistoryTooltip";

interface MainListProps {
	dtos: OrderDto[];
	selected: string[];
	currentPage: number;
	loading: boolean;
	onSelect: (flowCode: string, checked: boolean) => void;
	onClick?: (flowCode: string) => void;
	onStatusChange: (flowCode: string, newStatus: string) => void;
	onFactoryClick: (flowCode: string) => void;
	onImageClick?: (productId: string) => void;
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
	onImageClick,
}: MainListProps) => {
	if (dtos.length === 0) {
		return (
			<div className="no-data-order">
				<p>조회된 데이터가 없습니다.</p>
			</div>
		);
	}

	return (
		<table className="table">
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
					<th colSpan={3}>보조석</th>
					<th>메인/보조</th>
					<th>사이즈</th>
					<th>세트타입</th>
					<th>재고</th>
					<th>급</th>
					<th>비고</th>
					<th>상품상태</th>
					<th>제조사</th>
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
					<th>입</th>
					<th>유형</th>
					<th>입고날짜</th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
					<th></th>
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
							${dto.productStatus === "대기" ? "waiting-row" : ""}
							`}
					>
						<td>
							<input
								type="checkbox"
								checked={selected.includes(dto.flowCode)}
								onChange={(e) => onSelect(dto.flowCode, e.target.checked)}
								disabled={
									dto.orderStatus === "DELETED" || dto.orderStatus === "재고"
								}
							/>
						</td>
						<td>
							<button
								className="no-btn"
								onClick={() => onClick?.(dto.flowCode)}
							>
								{(currentPage - 1) * 16 + index + 1}
							</button>
						</td>
						<td className="product-name-order">{dto.productName}</td>
						<td className={`info-cell ${dto.statusHistory && dto.statusHistory.length > 0 ? 'has-history' : ''}`}>
							<StatusHistoryTooltip statusHistory={dto.statusHistory}>
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
							</StatusHistoryTooltip>
						</td>
						<td className="order-status-cell">{dto.orderStatus}</td>
						<td>{dto.storeName}</td>
						<td className="info-cell">
							<AuthImage
								imagePath={dto.imagePath}
								alt={dto.productName}
								className="order-image"
								onClick={() => onImageClick?.(dto.productId)}
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
								<span className="info-value">
								{dto.assistantStone ? "Y" : "N"}
								</span>
							</div>
						</td>
						<td className="info-cell">
							<div className="info-row-order">
								<span className="info-value">
									{dto.assistantStoneName}
								</span>
							</div>
						</td>
						<td className="info-cell">
							<div className="info-row-order">
								<span className="info-value">
									{formatToLocalDate(dto.assistantStoneCreateAt)}
								</span>
							</div>
						</td>
						<td className="info-cell">
							<div className="info-row-order">
								<span className="info-value-stone-note">
									{dto.mainStoneNote}
								</span>
							</div>
							<div className="info-row-order">
								<span className="info-value-stone-note">
								{dto.assistanceStoneNote}
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
								disabled={loading || dto.orderStatus === "재고"}
							>
								<option value="접수">접수</option>
								<option value="대기">대기</option>
							</select>
						</td>
						<td>
							<button
								className="factory-name-btn"
								onClick={() => onFactoryClick(dto.flowCode)}
								disabled={loading || dto.orderStatus === "재고"}
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

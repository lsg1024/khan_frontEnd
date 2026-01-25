import type { SaleCreateRow } from "../../../types/saleDto";
import { isSaleStatus } from "../../../types/saleDto";
import type { AssistantStoneDto } from "../../../types/AssistantStoneDto";
import "../../../styles/components/sale/SaleTable.css";

interface SaleTableProps {
	rows: SaleCreateRow[];
	loading: boolean;
	assistantStones: AssistantStoneDto[];
	materials: { materialId: string; materialName: string }[];
	onRowUpdate: (id: string, field: keyof SaleCreateRow, value: unknown) => void;
	onRowDelete: (id: string) => void;
	onFlowCodeSearch: (rowId: string) => void;
	onRowFocus?: (rowId: string) => void;
	onStoneSearch?: (rowId: string) => void;
	onAssistanceStoneArrivalChange: (id: string, value: string) => void;
	onStoneInfoOpen?: (rowId: string) => void;
	disabled?: boolean;
	storeId?: string;
	storeName?: string;
	isBulkReturnMode?: boolean;
}

const SaleTable: React.FC<SaleTableProps> = (props) => {
	const {
		rows,
		loading,
		assistantStones,
		materials,
		onRowUpdate,
		onRowDelete,
		onFlowCodeSearch,
		onRowFocus,
		disabled = false,
		storeId = "",
		isBulkReturnMode = false,
	} = props;

	// 거래처가 선택되지 않았는지 확인
	const isStoreNotSelected = !storeId;

	const safeOnAssistanceStoneArrivalChange = (_id: string, _value: string) => {
		if (
			"onAssistanceStoneArrivalChange" in props &&
			props.onAssistanceStoneArrivalChange
		) {
			props.onAssistanceStoneArrivalChange(_id, _value);
		}
	};

	const canEditSerial = (row: SaleCreateRow): boolean => {
		// 벌크 반품 모드에서는 편집 불가
		if (isBulkReturnMode) {
			return false;
		}
		// 판매가 아닌 경우 시리얼 잠금
		if (!isSaleStatus(row.status)) {
			return false;
		}
		// 판매인 경우 항상 편집 가능 (재선택 허용)
		return true;
	};

	// 구분이 "판매"인 경우에만 편집 가능
	const canEditForSaleOnly = (row: SaleCreateRow): boolean => {
		// 벌크 반품 모드에서는 편집 불가
		if (isBulkReturnMode) {
			return false;
		}
		return isSaleStatus(row.status);
	};

	// 보조석 관련 필드 편집 가능 여부 (판매만 가능)
	const canEditAssistantStone = (row: SaleCreateRow): boolean => {
		// 벌크 반품 모드에서는 편집 불가
		if (isBulkReturnMode) {
			return false;
		}
		return isSaleStatus(row.status);
	};

	// 사이즈 편집 가능 여부 (판매만 가능)
	const canEditSize = (row: SaleCreateRow): boolean => {
		// 벌크 반품 모드에서는 편집 불가
		if (isBulkReturnMode) {
			return false;
		}
		return isSaleStatus(row.status);
	};

	// 알 단가 관련 필드 편집 가능 여부 (판매만 가능)
	const canEditStonePrice = (row: SaleCreateRow): boolean => {
		// 벌크 반품 모드에서는 편집 불가
		if (isBulkReturnMode) {
			return false;
		}
		return isSaleStatus(row.status);
	};

	// productPrice 편집 가능 여부
	const canEditProductPrice = (row: SaleCreateRow): boolean => {
		// 벌크 반품 모드에서는 편집 불가
		if (isBulkReturnMode) {
			return false;
		}
		// 결제, DC, WG, 결통은 열림
		if (
			row.status === "결제" ||
			row.status === "DC" ||
			row.status === "WG" ||
			row.status === "결통"
		) {
			return true;
		}
		// 판매는 잠김
		return false;
	};

	// additionalProductPrice 편집 가능 여부
	const canEditAdditionalProductPrice = (row: SaleCreateRow): boolean => {
		// 벌크 반품 모드에서는 편집 불가
		if (isBulkReturnMode) {
			return false;
		}
		// 판매만 열림
		return isSaleStatus(row.status);
	};

	// totalWeight 편집 가능 여부
	const canEditTotalWeight = (row: SaleCreateRow): boolean => {
		// 벌크 반품 모드에서는 편집 불가
		if (isBulkReturnMode) {
			return false;
		}
		// 결제, DC는 열림
		if (row.status === "판매" || row.status === "결제" || row.status === "DC") {
			return true;
		}
		// WG, 결통은 잠김
		return false;
	};

	const safeOnStoneInfoOpen = (rowId: string) => {
		if (props.onStoneInfoOpen) {
			props.onStoneInfoOpen(rowId);
		}
	};

	// [추가] 금액 표시용 헬퍼 함수: "-" 입력 시 NaN 방지 및 포맷팅
	const formatPriceValue = (value: number | string | undefined): string => {
		if (value === "-") return "-";
		if (!value) return "0";
		const strVal = String(value);
		const num = parseFloat(strVal.replace(/,/g, ""));
		return isNaN(num) ? "0" : num.toLocaleString();
	};

	return (
		<div className="sale-table-container">
			<table className="sale-table">
				<thead>
					{/* 첫번째 행 */}
					<tr>
						<th>No</th>
						<th>삭제</th>
						<th>
							<span className="required-field">*</span>구분
						</th>
						<th>
							<span className="required-field">*</span>시리얼
						</th>
						<th>모델번호</th>
						<th>재질</th>
						<th>색상</th>
						<th colSpan={3}>보조석</th>
						<th colSpan={2}>스톤 비고</th>
						<th>사이즈</th>
						<th>비고</th>
						<th>알중량</th>
						<th colSpan={4}>중량</th>
						<th colSpan={2}>상품 단가</th>
						<th colSpan={3}>알 단가</th>
						<th colSpan={2}>개당 알수</th>
					</tr>
					{/* 두번째 행 */}
					<tr>
						<th></th>
						<th></th>
						<th></th>
						<th></th>
						<th></th>
						<th></th>
						<th></th>
						<th>유형</th>
						<th>입고여부</th>
						<th>입고날짜</th>
						<th>메인</th>
						<th>보조</th>
						<th></th>
						<th></th>
						<th></th>
						<th>전체</th>
						<th>알</th>
						<th>금</th>
						<th>순금</th>
						<th>기본</th>
						<th>추가</th>
						<th>중심</th>
						<th>보조</th>
						<th>추가</th>
						<th>메인</th>
						<th>보조</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, index) => {
						// 금중량 계산 (총중량 - 알중량)
						const goldWeight =
							Number(row.totalWeight || 0) - Number(row.stoneWeightTotal || 0);

						return (
							<tr key={row.id} onFocus={() => onRowFocus?.(row.id)}>
								{/* No */}
								<td className="no-cell">{index + 1}</td>
								{/* 삭제 */}
								<td className="no-cell">
									<button
										className="btn-delete-row"
										onClick={() => onRowDelete(row.id)}
										disabled={loading || disabled}
									>
										🗑️
									</button>
								</td>
								{/* 구분 */}
								<td className="type-cell">
									<select
										value={row.status}
										onChange={(e) =>
											onRowUpdate(row.id, "status", e.target.value)
										}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											isBulkReturnMode
										}
										style={{
											backgroundColor:
												isStoreNotSelected || isBulkReturnMode
													? "#f5f5f5"
													: "white",
										}}
									>
										<option value="판매">판매</option>
										<option value="결제">결제</option>
										<option value="DC">DC</option>
										<option value="WG">WG</option>
										<option value="결통">결통</option>
										<option value="반품">반품</option>
									</select>
								</td>
								{/* 시리얼 */}
								<td className="search-type-cell">
									<div className="search-field-container">
										<input
											type="text"
											value={row.flowCode}
											readOnly
											placeholder="시리얼 검색"
											disabled={
												loading ||
												disabled ||
												isStoreNotSelected ||
												!canEditSerial(row)
											}
											onClick={() => {
												if (!isStoreNotSelected && canEditSerial(row)) {
													onFlowCodeSearch(row.id);
												}
											}}
											style={{
												backgroundColor:
													isStoreNotSelected || !canEditSerial(row)
														? "#f5f5f5"
														: "white",
												cursor:
													loading ||
													disabled ||
													isStoreNotSelected ||
													!canEditSerial(row)
														? "not-allowed"
														: "pointer",
											}}
										/>
										<span
											className="search-icon"
											onClick={() => {
												if (!isStoreNotSelected && canEditSerial(row)) {
													onFlowCodeSearch(row.id);
												}
											}}
											style={{
												cursor:
													loading ||
													disabled ||
													isStoreNotSelected ||
													!canEditSerial(row)
														? "not-allowed"
														: "pointer",
												opacity:
													loading ||
													disabled ||
													isStoreNotSelected ||
													!canEditSerial(row)
														? 0.5
														: 1,
											}}
										>
											🔍
										</span>
									</div>
								</td>
								{/* 모델번호 */}
								<td className="search-type-cell">
									<input
										type="text"
										value={
											isSaleStatus(row.status) ? row.productName : row.status
										}
										readOnly
										disabled
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								{/* 재질 */}
								<td className="drop-down-cell3">
									<select
										value={row.materialId}
										onChange={(e) => {
											if (disabled || isStoreNotSelected) return;
											const selectedMaterial = materials.find(
												(m) => m.materialId === e.target.value
											);
											onRowUpdate(row.id, "materialId", e.target.value);
											onRowUpdate(
												row.id,
												"materialName",
												selectedMaterial?.materialName || ""
											);
										}}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											isBulkReturnMode ||
											row.status === "DC"
										}
										style={{
											backgroundColor:
												isStoreNotSelected ||
												isBulkReturnMode ||
												row.status === "DC"
													? "#f5f5f5"
													: "white",
										}}
									>
										<option value="">선택</option>
										{(row.status === "DC"
											? materials.filter((m) => m.materialName === "24K")
											: materials
										).map((material) => (
											<option
												key={material.materialId}
												value={material.materialId}
											>
												{material.materialName}
											</option>
										))}
									</select>
								</td>
								{/* 색상 */}
								<td className="drop-down-cell-small">
									<input
										type="text"
										value={row.colorName}
										readOnly
										disabled
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								{/* 보조석 - 유형 */}
								<td className="drop-down-cell2">
									<select
										value={
											row.assistantStoneId === "1" && !row.assistantStoneName
												? ""
												: row.assistantStoneId
										}
										onChange={(e) => {
											if (disabled || isStoreNotSelected) return;
											const selectedStone = assistantStones.find(
												(s) => s.assistantStoneId === Number(e.target.value)
											);
											onRowUpdate(row.id, "assistantStoneId", e.target.value);
											onRowUpdate(
												row.id,
												"assistantStoneName",
												selectedStone?.assistantStoneName || ""
											);
										}}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											!canEditAssistantStone(row)
										}
										style={{
											backgroundColor:
												isStoreNotSelected || !canEditAssistantStone(row)
													? "#f5f5f5"
													: "white",
										}}
									>
										<option value="">선택</option>
										{assistantStones.map((stone) => (
											<option
												key={stone.assistantStoneId}
												value={stone.assistantStoneId}
											>
												{stone.assistantStoneName}
											</option>
										))}
									</select>
								</td>
								{/* 보조석 - 입고여부 */}
								<td className="drop-down-cell-small">
									<select
										value={row.assistantStone ? "Y" : "N"}
										onChange={(e) => {
											if (disabled || isStoreNotSelected) return;
											safeOnAssistanceStoneArrivalChange(
												row.id,
												e.target.value
											);
										}}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											!canEditAssistantStone(row)
										}
										style={{
											backgroundColor:
												isStoreNotSelected || !canEditAssistantStone(row)
													? "#f5f5f5"
													: "white",
										}}
									>
										<option value="N">N</option>
										<option value="Y">Y</option>
									</select>
								</td>
								{/* 보조석 - 입고날짜 */}
								<td className="date-cell">
									<input
										type="date"
										value={row.assistantStoneCreateAt || ""}
										onChange={(e) => {
											if (disabled || isStoreNotSelected) return;
											onRowUpdate(
												row.id,
												"assistantStoneCreateAt",
												e.target.value
											);
										}}
										disabled={
											loading ||
											row.assistantStone === false ||
											disabled ||
											isStoreNotSelected ||
											!canEditAssistantStone(row)
										}
										readOnly
										style={{
											backgroundColor:
												row.assistantStone === false ||
												disabled ||
												isStoreNotSelected ||
												!canEditAssistantStone(row)
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								{/* 스톤 비고 - 메인 */}
								<td className="stock-note-cell">
									<input
										type="text"
										value={row.mainStoneNote || ""}
										onChange={(e) =>
											onRowUpdate(row.id, "mainStoneNote", e.target.value)
										}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											!canEditForSaleOnly(row)
										}
										placeholder="메인"
										style={{
											backgroundColor:
												isStoreNotSelected || !canEditForSaleOnly(row)
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								{/* 스톤 비고 - 보조 */}
								<td className="stock-note-cell">
									<input
										type="text"
										value={row.assistanceStoneNote || ""}
										onChange={(e) =>
											onRowUpdate(row.id, "assistanceStoneNote", e.target.value)
										}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											!canEditForSaleOnly(row)
										}
										placeholder="보조"
										style={{
											backgroundColor:
												isStoreNotSelected || !canEditForSaleOnly(row)
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								{/* 사이즈 */}
								<td className="stock-size-cell">
									<input
										type="text"
										value={row.productSize}
										onChange={(e) =>
											onRowUpdate(row.id, "productSize", e.target.value)
										}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											!canEditSize(row)
										}
										placeholder="사이즈"
										style={{
											backgroundColor:
												isStoreNotSelected || !canEditSize(row)
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								{/* 비고 */}
								<td className="stock-note-cell-large">
									<input
										type="text"
										value={row.note}
										onChange={(e) =>
											onRowUpdate(row.id, "note", e.target.value)
										}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											isBulkReturnMode
										}
										placeholder="비고"
										style={{
											backgroundColor:
												isStoreNotSelected || isBulkReturnMode
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								{/* 알중량 */}
								<td className="stone-weight-cell">
									<input
										type="text"
										value={row.stoneWeightTotal?.toFixed(3) || "0.000"}
										onChange={(e) =>
											onRowUpdate(row.id, "stoneWeightTotal", e.target.value)
										}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											!canEditForSaleOnly(row)
										}
										placeholder="0.000"
										style={{
											backgroundColor:
												isStoreNotSelected || !canEditForSaleOnly(row)
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								{/* 총 중량 - 총 중량 (음수/소수점 입력 허용) */}
								<td className="stone-weight-cell">
									<input
										type="text"
										value={row.totalWeight}
										onChange={(e) => {
											const val = e.target.value;
											// 숫자, 마이너스(-), 소수점(.) 만 허용하는 정규식
											if (/^-?\d*\.?\d*$/.test(val)) {
												onRowUpdate(row.id, "totalWeight", val);
											}
										}}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											!canEditTotalWeight(row)
										}
										placeholder="0.000"
										style={{
											backgroundColor:
												isStoreNotSelected || !canEditTotalWeight(row)
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								{/* 총 중량 - 알중량 */}
								<td className="stone-weight-cell">
									<input
										type="text"
										value={Number(row.stoneWeightTotal || 0).toFixed(3)}
										readOnly
										disabled
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								{/* 총 중량 - 금중량 */}
								<td className="stone-weight-cell">
									<input
										type="text"
										value={goldWeight > 0 ? goldWeight.toFixed(3) : "0.000"}
										readOnly
										disabled
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								{/* 총 중량 - 순금중량 */}
								<td className="stone-weight-cell">
									<input
										type="text"
										value={row.pureGoldWeight}
										readOnly
										disabled
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								{/* 상품 단가 - 기본 */}
								<td className="money-cell">
									<input
										type="text"
										value={formatPriceValue(row.productPrice)}
										onChange={(e) => {
											const value = e.target.value.replace(/,/g, "");
											// 숫자, 마이너스만 허용
											if (/^-?\d*$/.test(value)) {
												onRowUpdate(row.id, "productPrice", value);
											}
										}}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											!canEditProductPrice(row)
										}
										placeholder="0"
										style={{
											backgroundColor:
												isStoreNotSelected || !canEditProductPrice(row)
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								{/* 상품 단가 - 추가 */}
								<td className="money-cell">
									<input
										type="text"
										value={formatPriceValue(row.additionalProductPrice)}
										onChange={(e) => {
											const value = e.target.value.replace(/,/g, "");
											if (/^-?\d*$/.test(value)) {
												onRowUpdate(row.id, "additionalProductPrice", value);
											}
										}}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											!canEditAdditionalProductPrice(row)
										}
										placeholder="0"
										style={{
											backgroundColor:
												isStoreNotSelected ||
												!canEditAdditionalProductPrice(row)
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								{/* 알 단가 - 중심 */}
								<td className="money-cell">
									<input
										type="text"
										value={formatPriceValue(row.mainStonePrice)}
										onChange={(e) => {
											const value = e.target.value.replace(/,/g, "");
											if (/^-?\d*$/.test(value)) {
												onRowUpdate(row.id, "mainStonePrice", value);
											}
										}}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											!canEditStonePrice(row)
										}
										placeholder="0"
										style={{
											backgroundColor:
												isStoreNotSelected || !canEditStonePrice(row)
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								{/* 알 단가 - 보조 */}
								<td className="money-cell-large">
									<div className="search-field-container">
										<input
											type="text"
											value={formatPriceValue(row.assistanceStonePrice)}
											onChange={(e) => {
												const value = e.target.value.replace(/,/g, "");
												if (/^-?\d*$/.test(value)) {
													onRowUpdate(row.id, "assistanceStonePrice", value);
												}
											}}
											readOnly
											disabled={
												loading ||
												disabled ||
												isStoreNotSelected ||
												!canEditStonePrice(row)
											}
											style={{
												backgroundColor:
													isStoreNotSelected || !canEditStonePrice(row)
														? "#f5f5f5"
														: "white",
											}}
										/>
										<span
											className="search-icon"
											onClick={() => {
												if (
													!isStoreNotSelected &&
													canEditStonePrice(row) &&
													row.flowCode
												) {
													safeOnStoneInfoOpen?.(row.id);
												}
											}}
											style={{
												opacity:
													loading ||
													disabled ||
													isStoreNotSelected ||
													!canEditStonePrice(row) ||
													!row.flowCode
														? 0.5
														: 1,
												cursor:
													loading ||
													disabled ||
													isStoreNotSelected ||
													!canEditStonePrice(row) ||
													!row.flowCode
														? "not-allowed"
														: "pointer",
											}}
										>
											🔍
										</span>
									</div>
								</td>
								{/* 알 단가 - 추가 */}
								<td className="money-cell">
									<input
										type="text"
										value={formatPriceValue(row.stoneAddLaborCost)}
										onChange={(e) => {
											const value = e.target.value.replace(/,/g, "");
											if (/^-?\d*$/.test(value)) {
												onRowUpdate(row.id, "stoneAddLaborCost", value);
											}
										}}
										disabled={
											loading ||
											disabled ||
											isStoreNotSelected ||
											!canEditStonePrice(row)
										}
										placeholder="0"
										style={{
											backgroundColor:
												isStoreNotSelected || !canEditStonePrice(row)
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								{/* 개당 알수 - 메인 */}
								<td className="stone-count-cell">
									<input
										type="text"
										value={row.mainStoneCount?.toLocaleString() || "0"}
										readOnly
										disabled
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								{/* 개당 알수 - 보조 */}
								<td className="stone-count-cell">
									<input
										type="text"
										value={row.assistanceStoneCount?.toLocaleString() || "0"}
										readOnly
										disabled
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};

export default SaleTable;

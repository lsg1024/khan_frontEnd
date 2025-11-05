import type { SaleCreateRow } from "../../../types/sale";
import { isSaleStatus } from "../../../types/sale";
import "../../../styles/components/sale/SaleTable.css";

interface SaleTableProps {
	rows: SaleCreateRow[];
	loading: boolean;
	assistantStones: { assistantStoneId: string; assistantStoneName: string }[];
	materials: { materialId: string; materialName: string }[];
	onRowUpdate: (id: string, field: keyof SaleCreateRow, value: unknown) => void;
	onRowDelete: (id: string) => void;
	onFlowCodeSearch: (rowId: string) => void;
	onRowFocus?: (rowId: string) => void;
	onStoneSearch?: (rowId: string) => void;
	onAssistanceStoneArrivalChange: (id: string, value: string) => void;
	disabled?: boolean;
}

const SaleTable: React.FC<SaleTableProps> = ({
	rows,
	loading,
	assistantStones,
	materials,
	onRowUpdate,
	onRowDelete,
	onFlowCodeSearch,
	onRowFocus,
	onAssistanceStoneArrivalChange,
	disabled = false,
}) => {
	// 구분에 따른 편집 가능 여부 확인 헬퍼 함수
	const canEditSerial = (row: SaleCreateRow): boolean => {
		// 구분이 판매이고 시리얼에 값이 있는 경우 변경 불가능
		if (isSaleStatus(row.status) && row.flowCode) {
			return false;
		}
		return true;
	};

	// 구분이 "판매"인 경우에만 편집 가능
	const canEditForSaleOnly = (row: SaleCreateRow): boolean => {
		return isSaleStatus(row.status);
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
					{rows.map((row, index) => (
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
										onRowUpdate(
											row.id,
											"status",
											e.target.value as SaleCreateRow["status"]
										)
									}
									disabled={loading || disabled}
								>
									<option value="판매">판매</option>
									<option value="결제">결제</option>
									<option value="DC">DC</option>
									<option value="WG">WG</option>
									<option value="결통">결통</option>
									<option value="반품">반품</option>
								</select>
							</td>{" "}
							{/* 시리얼 */}
							<td className="search-type-cell">
								<div className="search-field-container">
									<input
										type="text"
										value={row.flowCode}
										readOnly
										placeholder="시리얼 검색"
										disabled={loading || disabled || !canEditSerial(row)}
										onClick={() => {
											if (canEditSerial(row)) {
												onFlowCodeSearch(row.id);
											}
										}}
										style={{
											backgroundColor: !canEditSerial(row)
												? "#f5f5f5"
												: "white",
											cursor:
												loading || disabled || !canEditSerial(row)
													? "not-allowed"
													: "pointer",
										}}
									/>
									<span
										className="search-icon"
										onClick={() => {
											if (canEditSerial(row)) {
												onFlowCodeSearch(row.id);
											}
										}}
										style={{
											cursor:
												loading || disabled || !canEditSerial(row)
													? "not-allowed"
													: "pointer",
											opacity:
												loading || disabled || !canEditSerial(row) ? 0.5 : 1,
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
									value={row.productName}
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
										if (disabled) return;
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
									disabled={loading || disabled || !!row.materialId}
									style={{
										backgroundColor: row.materialId ? "#f5f5f5" : "white",
									}}
								>
									<option value="">선택</option>
									{materials.map((material) => (
										<option
											key={material.materialId}
											value={material.materialId}
										>
											{material.materialName}
										</option>
									))}
								</select>
							</td>{" "}
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
										if (disabled) return;
										const selectedStone = assistantStones.find(
											(s) => s.assistantStoneId === e.target.value
										);
										onRowUpdate(row.id, "assistantStoneId", e.target.value);
										onRowUpdate(
											row.id,
											"assistantStoneName",
											selectedStone?.assistantStoneName || ""
										);
									}}
									disabled={loading || disabled || !canEditForSaleOnly(row)}
									style={{
										backgroundColor: !canEditForSaleOnly(row)
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
									value={row.hasAssistantStone ? "Y" : "N"}
									onChange={(e) => {
										if (disabled) return;
										onAssistanceStoneArrivalChange(row.id, e.target.value);
									}}
									disabled={loading || disabled || !canEditForSaleOnly(row)}
									style={{
										backgroundColor: !canEditForSaleOnly(row)
											? "#f5f5f5"
											: "white",
									}}
								>
									<option value="N">N</option>
									<option value="Y">Y</option>
								</select>
							</td>
							{/* 보조석 - 입고날짜 */}
							<td className="stock-date">
								<input
									type="date"
									value={row.assistantStoneArrivalDate || ""}
									onChange={(e) => {
										if (disabled) return;
										onRowUpdate(
											row.id,
											"assistantStoneArrivalDate",
											e.target.value
										);
									}}
									disabled={
										loading ||
										row.hasAssistantStone === false ||
										disabled ||
										!canEditForSaleOnly(row)
									}
									readOnly
									style={{
										backgroundColor:
											row.hasAssistantStone === false ||
											disabled ||
											!canEditForSaleOnly(row)
												? "#f5f5f5"
												: "white",
									}}
								/>
							</td>{" "}
							{/* 스톤 비고 - 메인 */}
							<td className="stock-note-cell">
								<input
									type="text"
									value={row.mainStoneNote || ""}
									onChange={(e) =>
										onRowUpdate(row.id, "mainStoneNote", e.target.value)
									}
									disabled={loading || disabled || !canEditForSaleOnly(row)}
									placeholder="메인"
									style={{
										backgroundColor: !canEditForSaleOnly(row)
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
									disabled={loading || disabled || !canEditForSaleOnly(row)}
									placeholder="보조"
									style={{
										backgroundColor: !canEditForSaleOnly(row)
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
									disabled={loading || disabled || !canEditForSaleOnly(row)}
									placeholder="사이즈"
									style={{
										backgroundColor: !canEditForSaleOnly(row)
											? "#f5f5f5"
											: "white",
									}}
								/>
							</td>
							{/* 비고 */}
							<td className="stock-note-cell">
								<input
									type="text"
									value={row.note}
									onChange={(e) => onRowUpdate(row.id, "note", e.target.value)}
									disabled={loading || disabled}
									placeholder="비고"
								/>
							</td>
							{/* 알중량 */}
							<td className="stone-weight-cell">
								<input
									type="text"
									value={row.stoneWeightPerUnit}
									onChange={(e) =>
										onRowUpdate(row.id, "stoneWeightPerUnit", e.target.value)
									}
									disabled={loading || disabled || !canEditForSaleOnly(row)}
									placeholder="0.000"
									style={{
										backgroundColor: !canEditForSaleOnly(row)
											? "#f5f5f5"
											: "white",
									}}
								/>
							</td>
							{/* 총 중량 - 총 중량 */}
							<td className="stone-weight-cell">
								<input
									type="number"
									value={row.totalWeight > 0 ? row.totalWeight : ""}
									onChange={(e) => {
										const newTotalWeight = parseFloat(e.target.value) || 0;
										onRowUpdate(row.id, "totalWeight", newTotalWeight);
									}}
									disabled={loading || disabled}
									placeholder="0.000"
								/>
							</td>
							{/* 총 중량 - 알중량 */}
							<td className="stone-weight-cell">
								<input
									type="text"
									value={row.stoneWeightPerUnit?.toFixed(3) || "0.000"}
									readOnly
									disabled
									style={{ backgroundColor: "#f5f5f5" }}
								/>
							</td>
							{/* 총 중량 - 금중량 */}
							<td className="stone-weight-cell">
								<input
									type="text"
									value="0.000"
									readOnly
									disabled
									style={{ backgroundColor: "#f5f5f5" }}
								/>
							</td>
							{/* 총 중량 - 순금중량 */}
							<td className="stone-weight-cell">
								<input
									type="text"
									value="0.000"
									readOnly
									disabled
									style={{ backgroundColor: "#f5f5f5" }}
								/>
							</td>
							{/* 상품 단가 - 기본 */}
							<td className="money-cell">
								<input
									type="text"
									value={row.productPrice?.toLocaleString() || "0"}
									readOnly
									disabled
									style={{ backgroundColor: "#f5f5f5" }}
								/>
							</td>
							{/* 상품 단가 - 추가 */}
							<td className="money-cell">
								<input
									type="text"
									value={row.additionalProductPrice?.toLocaleString() || "0"}
									onChange={(e) => {
										const value = e.target.value.replace(/,/g, "");
										onRowUpdate(
											row.id,
											"additionalProductPrice",
											Number(value)
										);
									}}
									disabled={loading || disabled || !canEditForSaleOnly(row)}
									placeholder="0"
									style={{
										backgroundColor: !canEditForSaleOnly(row)
											? "#f5f5f5"
											: "white",
									}}
								/>
							</td>
							{/* 알 단가 - 중심 */}
							<td className="money-cell">
								<input
									type="text"
									value={row.unitPrice?.toLocaleString() || "0"}
									readOnly
									disabled
									style={{ backgroundColor: "#f5f5f5" }}
								/>
							</td>
							{/* 알 단가 - 보조 */}
							<td className="money-cell">
								<div className="search-field-container">
									<input
										type="text"
										value={row.assistantStonePrice?.toLocaleString() || "0"}
										readOnly
										disabled
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</div>
							</td>
							{/* 알 단가 - 추가 */}
							<td className="money-cell">
								<input
									type="text"
									value={row.additionalStonePrice?.toLocaleString() || "0"}
									onChange={(e) => {
										const value = e.target.value.replace(/,/g, "");
										onRowUpdate(row.id, "additionalStonePrice", Number(value));
									}}
									disabled={loading || disabled || !canEditForSaleOnly(row)}
									placeholder="0"
									style={{
										backgroundColor: !canEditForSaleOnly(row)
											? "#f5f5f5"
											: "white",
									}}
								/>
							</td>
							{/* 개당 알수 - 메인 */}
							<td className="stone-count-cell">
								<input
									type="text"
									value={row.stoneCountPerUnit?.toLocaleString() || "0"}
									readOnly
									disabled
									style={{ backgroundColor: "#f5f5f5" }}
								/>
							</td>
							{/* 개당 알수 - 보조 */}
							<td className="stone-count-cell">
								<input
									type="text"
									value="0"
									readOnly
									disabled
									style={{ backgroundColor: "#f5f5f5" }}
								/>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default SaleTable;

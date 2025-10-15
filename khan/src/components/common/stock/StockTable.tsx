import React from "react";
import type { StockOrderRowData } from "../../../types/stock";
import "../../../styles/pages/StockRegisterPage.css";

interface BaseStockTableProps {
	orderRows: StockOrderRowData[];
	loading: boolean;
	materials: { materialId: string; materialName: string }[];
	colors: { colorId: string; colorName: string }[];
	assistantStones: { assistantStoneId: string; assistantStoneName: string }[];
	onRowUpdate: (
		id: string,
		field: keyof StockOrderRowData,
		value: unknown
	) => void;
	onAssistanceStoneArrivalChange?: (id: string, value: string) => void;
	onStoneInfoOpen?: (rowId: string) => void;
	onStoreSearch?: (rowId: string) => void;
	onFactorySearch?: (rowId: string) => void;
	onProductSearch?: (rowId: string) => void;
	onAddRow?: () => void;
	onRowFocus?: (rowId: string) => void;
	isRowInputEnabled?: (currentIndex: number) => boolean;
}

interface CreateModeProps extends BaseStockTableProps {
	mode: "create";
	// Create 모드에서 필수
	onRowDelete: (id: string) => void;
	onAddOrderRow: () => void;
	onRowFocus: (rowId: string) => Promise<void>;
	onRequiredFieldClick: (
		currentRowId: string,
		fieldType: "store" | "product" | "material" | "color"
	) => void;
	onAssistanceStoneArrivalChange: (id: string, value: string) => void;
	validateSequence: (
		rowId: string,
		currentStep: "product" | "material" | "color" | "other"
	) => boolean;
	isRowInputEnabled: (currentIndex: number) => boolean;

	// Create 모드에서 선택적
	onStoreSearchOpen?: (rowId: string) => void;
	onProductSearchOpen?: (rowId: string) => void;
	onFactorySearchOpen?: (rowId: string) => void;
}

// Update 모드 전용 Props
interface UpdateModeProps extends BaseStockTableProps {
	mode: "update";
	// Update 모드에서 필수
	onStoreSearchOpen: (rowId: string) => void;
	onProductSearchOpen: (rowId: string) => void;
	onFactorySearchOpen: (rowId: string) => void;

	// Update 모드에서 선택적
	onRowDelete?: (id: string) => void;
	onAddOrderRow?: () => void;
	onRowFocus?: (rowId: string) => Promise<void>;
	onRequiredFieldClick?: (
		currentRowId: string,
		fieldType: "store" | "product" | "material" | "color"
	) => void;
	onAssistanceStoneArrivalChange?: (id: string, value: string) => void;
	validateSequence?: (
		rowId: string,
		currentStep: "product" | "material" | "color" | "other"
	) => boolean;
	isRowInputEnabled?: (currentIndex: number) => boolean;
}

type StockTableProps = CreateModeProps | UpdateModeProps;

const StockTable: React.FC<StockTableProps> = (props) => {
	const {
		mode = "create",
		orderRows,
		loading,
		materials,
		colors,
		assistantStones,
		onRowUpdate,
	} = props;

	const safeOnAssistanceStoneArrivalChange = (id: string, value: string) => {
		if (
			"onAssistanceStoneArrivalChange" in props &&
			props.onAssistanceStoneArrivalChange
		) {
			props.onAssistanceStoneArrivalChange(id, value);
		}
	};

	const safeOnRowDelete = (id: string) => {
		if ("onRowDelete" in props && props.onRowDelete) {
			props.onRowDelete(id);
		}
	};

	const safeOnStoneInfoOpen = (rowId: string) => {
		if (props.onStoneInfoOpen) {
			props.onStoneInfoOpen(rowId);
		}
	};

	const safeOnStoreSearchOpen = (rowId: string) => {
		if ("onStoreSearchOpen" in props && props.onStoreSearchOpen) {
			props.onStoreSearchOpen(rowId);
		}
	};
	const safeOnProductSearchOpen = (rowId: string) => {
		if ("onProductSearchOpen" in props && props.onProductSearchOpen) {
			props.onProductSearchOpen(rowId);
		}
	};

	const safeOnFactorySearchOpen = (rowId: string) => {
		if ("onFactorySearchOpen" in props && props.onFactorySearchOpen) {
			props.onFactorySearchOpen(rowId);
		}
	};

	const safeOnRowFocus = (rowId: string) => {
		if (props.onRowFocus) {
			props.onRowFocus(rowId);
		}
	};

	const safeIsRowInputEnabled = (currentIndex: number): boolean => {
		if ("isRowInputEnabled" in props && props.isRowInputEnabled) {
			return props.isRowInputEnabled(currentIndex);
		}
		return true; // update 모드에서는 기본적으로 true
	};

	const safeOnRequiredFieldClick = (
		currentRowId: string,
		fieldType: "store" | "product" | "material" | "color"
	) => {
		if ("onRequiredFieldClick" in props && props.onRequiredFieldClick) {
			props.onRequiredFieldClick(currentRowId, fieldType);
		}
	};

	return (
		<div className="stock-table-container">
			<table className="stock-update-table">
				<thead>
					{/* 기본 정보 */}
					<tr>
						<th>No</th>
						<th>삭제</th>
						<th>
							<span className="required-field-basic">*</span>거래처
						</th>
						<th>
							<span className="required-field-basic">*</span>모델번호
						</th>
						<th>제조사</th>
						<th>
							<span className="required-field-basic">*</span>재질
						</th>
						<th>
							<span className="required-field-basic">*</span>색상
						</th>
						<th colSpan={3}>보조석</th>
						<th colSpan={2}>상품 단가</th>
						<th colSpan={3}>알 단가</th>
						<th colSpan={2}>알 개수</th>
						<th>알중량</th>
						<th colSpan={2}>알 메모사항</th>
						<th>사이즈</th>
						<th>기타</th>

						{/* 총중량 (3 컬럼) */}
						<th colSpan={3}>총중량</th>

						{/* 매입헤리 */}
						<th>매입헤리</th>

						{/* 매입단가 (2 컬럼) */}
						<th colSpan={2}>매입단가</th>
					</tr>
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
						<th>기본</th>
						<th>추가</th>
						<th>중심</th>
						<th>보조</th>
						<th>추가</th>
						<th>메인</th>
						<th>보조</th>
						<th></th>
						<th>메인</th>
						<th>보조</th>
						<th></th>
						<th></th>
						<th>총</th>
						<th>금</th>
						<th>알</th>
						<th></th>
						<th>상품</th>
						<th>스톤</th>
					</tr>
				</thead>
				<tbody>
					{orderRows.map((row, index) => {
						// 각 행에 대해 스톤 매입가 합계 계산
						const totalStonePurchaseCost = row.stoneInfos.reduce(
							(acc, stone) => acc + Number(stone.purchaseCost || 0),
							0
						);
						const goldWeight =
							Number(row.totalWeight || 0) - Number(row.stoneWeightTotal || 0);

						// 재고 상태 확인 (STOCK = 재고, SHIPPED = 출고됨)
						const isStockStatus = row.currentStatus === "STOCK";
						const isShippedStatus = row.currentStatus === "SHIPPED";

						// 재고 상태일 때 붉은 배경색 스타일
						const rowStyle = isStockStatus
							? { backgroundColor: "#ffebee", cursor: "pointer" }
							: { cursor: "pointer" };

						return (
							<tr
								key={row.id}
								onClick={() => safeOnRowFocus(row.id)}
								style={rowStyle}
								className={isStockStatus ? "stock-status-row" : ""}
							>
								<td className="no-cell">{index + 1}</td>
								<td className="no-cell">
									<button
										className="btn-delete-row"
										onClick={() => safeOnRowDelete(row.id)}
										disabled={loading || isStockStatus}
									>
										🗑️
									</button>
								</td>
								{/* 거래처 */}
								<td className="search-type-cell">
									<div className="search-field-container">
										<input
											type="text"
											value={row.storeName}
											readOnly
											placeholder="거래처"
											disabled={!safeIsRowInputEnabled(index) || isStockStatus}
											onClick={() => {
												if (
													mode === "create" &&
													safeIsRowInputEnabled(index) &&
													!row.storeName &&
													!isStockStatus
												) {
													safeOnRequiredFieldClick(row.id, "store");
												}
											}}
											onFocus={() => {
												if (
													mode === "create" &&
													safeIsRowInputEnabled(index) &&
													!isStockStatus
												) {
													safeOnRowFocus(row.id);
												}
											}}
										/>
										<span
											className="search-icon"
											onClick={() => {
												if (safeIsRowInputEnabled(index) && !isStockStatus) {
													safeOnStoreSearchOpen(row.id);
												} else if (isStockStatus) {
													alert("재고 상태에서는 수정할 수 없습니다.");
												} else {
													alert("이전 주문장을 완성해 주세요.");
												}
											}}
											style={{
												opacity:
													!safeIsRowInputEnabled(index) || isStockStatus
														? 0.5
														: 1,
												cursor:
													!safeIsRowInputEnabled(index) || isStockStatus
														? "not-allowed"
														: "pointer",
											}}
										>
											🔍
										</span>
									</div>
								</td>
								{/* 상품 */}
								<td className="search-type-cell">
									<div className="search-field-container">
										<input
											type="text"
											value={row.productName}
											readOnly
											placeholder="모델번호"
											disabled={!safeIsRowInputEnabled(index) || isStockStatus}
											onClick={() => {
												if (
													mode === "create" &&
													safeIsRowInputEnabled(index) &&
													!row.productName &&
													!isStockStatus
												) {
													safeOnRequiredFieldClick(row.id, "product");
												}
											}}
											onFocus={() => {
												if (
													mode === "create" &&
													safeIsRowInputEnabled(index) &&
													!isStockStatus
												) {
													safeOnRowFocus(row.id);
												}
											}}
										/>
										<span
											className="search-icon"
											onClick={() => {
												if (safeIsRowInputEnabled(index) && !isStockStatus) {
													safeOnProductSearchOpen(row.id);
												} else if (isStockStatus) {
													alert("재고 상태에서는 수정할 수 없습니다.");
												} else {
													alert("이전 주문장을 완성해 주세요.");
												}
											}}
											style={{
												opacity:
													!safeIsRowInputEnabled(index) || isStockStatus
														? 0.5
														: 1,
												cursor:
													!safeIsRowInputEnabled(index) || isStockStatus
														? "not-allowed"
														: "pointer",
											}}
										>
											🔍
										</span>
									</div>
								</td>
								<td className="search-type-cell">
									<div className="search-field-container">
										<input
											type="text"
											value={row.factoryName}
											readOnly
											placeholder="제조사"
											disabled={isStockStatus}
										/>
										<span
											className="search-icon"
											onClick={() => {
												if (safeIsRowInputEnabled(index) && !isStockStatus) {
													safeOnFactorySearchOpen(row.id);
												} else if (isStockStatus) {
													alert("재고 상태에서는 수정할 수 없습니다.");
												} else {
													alert("이전 주문장을 완성해 주세요.");
												}
											}}
											style={{
												opacity:
													!safeIsRowInputEnabled(index) || isStockStatus
														? 0.5
														: 1,
												cursor:
													!safeIsRowInputEnabled(index) || isStockStatus
														? "not-allowed"
														: "pointer",
											}}
										>
											🔍
										</span>
									</div>
								</td>
								<td className="drop-down-cell">
									<select
										value={row.materialId}
										onChange={(e) => {
											if (isStockStatus) return; // 재고 상태일 때 변경 방지
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
										disabled={isStockStatus}
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
								</td>
								<td className="drop-down-cell">
									<select
										value={row.colorId}
										onChange={(e) => {
											if (isStockStatus) return; // 재고 상태일 때 변경 방지
											const selectedColor = colors.find(
												(c) => c.colorId === e.target.value
											);
											onRowUpdate(row.id, "colorId", e.target.value);
											onRowUpdate(
												row.id,
												"colorName",
												selectedColor?.colorName || ""
											);
										}}
										disabled={isStockStatus}
									>
										<option value="">선택</option>
										{colors.map((color) => (
											<option key={color.colorId} value={color.colorId}>
												{color.colorName}
											</option>
										))}
									</select>
								</td>
								{/* 보조석 */}
								<td className="drop-down-cell2">
									<select
										value={row.assistantStoneId}
										onChange={(e) => {
											if (isStockStatus) return; // 재고 상태일 때 변경 방지
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
										disabled={isStockStatus}
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
								<td className="drop-down-cell-small">
									<select
										value={row.assistantStone ? "Y" : "N"}
										onChange={(e) => {
											if (isStockStatus) return; // 재고 상태일 때 변경 방지
											safeOnAssistanceStoneArrivalChange(
												row.id,
												e.target.value
											);
										}}
										disabled={isStockStatus}
									>
										<option value="N">N</option>
										<option value="Y">Y</option>
									</select>
								</td>
								<td>
									<input
										type="date"
										value={row.assistantStoneCreateAt}
										onChange={(e) => {
											if (isStockStatus) return; // 재고 상태일 때 변경 방지
											onRowUpdate(
												row.id,
												"assistantStoneCreateAt",
												e.target.value
											);
										}}
										disabled={
											loading || row.assistantStone === false || isStockStatus
										}
										readOnly
										style={{
											backgroundColor:
												row.assistantStone === false || isStockStatus
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								<td className="money-cell">
									<input
										type="text"
										value={row.productLaborCost.toLocaleString()}
										readOnly
										disabled={loading}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td className="money-cell">
									<input
										type="text"
										value={row.productAddLaborCost.toLocaleString()}
										onChange={(e) => {
											const value = e.target.value.replace(/,/g, "");
											onRowUpdate(row.id, "productAddLaborCost", value);
										}}
										placeholder="0"
									/>
								</td>
								<td className="money-cell">
									<input
										type="text"
										value={row.mainStonePrice.toLocaleString()}
										onChange={(e) => {
											const value = e.target.value.replace(/,/g, "");
											onRowUpdate(row.id, "mainStonePrice", value);
										}}
										disabled={loading}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td className="money-cell">
									<div className="search-field-container">
										<input
											type="text"
											value={row.assistanceStonePrice.toLocaleString()}
											onChange={(e) => {
												const value = e.target.value.replace(/,/g, "");
												onRowUpdate(row.id, "assistanceStonePrice", value);
											}}
											disabled={loading}
											style={{ backgroundColor: "#f5f5f5" }}
										/>
										<span
											className="search-icon"
											onClick={() => safeOnStoneInfoOpen?.(row.id)}
										>
											🔍
										</span>
									</div>
								</td>
								<td className="money-cell">
									<input
										type="text"
										value={row.additionalStonePrice.toLocaleString()}
										onChange={(e) => {
											const value = e.target.value.replace(/,/g, "");
											onRowUpdate(row.id, "additionalStonePrice", value);
										}}
										placeholder="0"
										disabled={loading}
									/>
								</td>
								<td className="stone-count-cell">
									<input
										type="text"
										value={row.mainStoneCount.toLocaleString()}
										readOnly
										disabled={loading}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td className="stone-count-cell">
									<input
										type="text"
										value={row.assistanceStoneCount.toLocaleString()}
										readOnly
										disabled={loading}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td className="stone-weight-cell">
									<input
										type="text"
										value={row.stoneWeightTotal.toLocaleString()}
										onChange={(e) => {
											onRowUpdate(row.id, "stoneWeightTotal", e.target.value);
										}}
										placeholder="0"
										disabled={loading}
									/>
								</td>
								<td>
									<input
										type="text"
										value={row.mainStoneNote}
										onChange={(e) =>
											onRowUpdate(row.id, "mainStoneNote", e.target.value)
										}
										disabled={loading}
										placeholder="메인스톤 메모"
									/>
								</td>
								<td>
									<input
										type="text"
										value={row.assistanceStoneNote}
										onChange={(e) =>
											onRowUpdate(row.id, "assistanceStoneNote", e.target.value)
										}
										disabled={loading}
										placeholder="보조스톤 메모"
									/>
								</td>
								<td>
									<input
										type="text"
										value={row.productSize}
										onChange={(e) =>
											onRowUpdate(row.id, "productSize", e.target.value)
										}
										disabled={loading}
										placeholder={row.productSize ? "" : "사이즈 입력"}
									/>
								</td>
								{/* 기타메모 */}
								<td>
									<input
										type="text"
										value={row.orderNote}
										onChange={(e) =>
											onRowUpdate(row.id, "orderNote", e.target.value)
										}
										disabled={loading}
										placeholder={row.orderNote ? "" : "기타 메모"}
									/>
								</td>
								{/* 총중량 (3 컬럼) */}
								<td>
									<input
										type="number"
										value={row.totalWeight}
										onChange={(e) =>
											onRowUpdate(row.id, "totalWeight", e.target.value)
										}
										disabled={loading}
										placeholder="0.000"
										className="text-right"
									/>
								</td>

								{/* 총중량(금) - 자동 계산 */}
								<td className="read-only-cell text-right">
									{goldWeight > 0 ? goldWeight.toFixed(2) : "0.00"}
								</td>

								{/* 총중량(알) - 자동 계산 */}
								<td className="read-only-cell text-right">
									{Number(row.stoneWeightTotal).toFixed(2)}
								</td>
								{/* 매입헤리 - 입력 가능 */}
								<td>
									<input
										type="text"
										value={row.storeHarry}
										onChange={(e) =>
											onRowUpdate(row.id, "storeHarry", e.target.value)
										}
										disabled={loading}
										className="text-right"
										placeholder={row.storeHarry ? "" : "헤리 입력"}
									/>
								</td>

								{/* 매입단가(기본) - 입력 가능 */}
								<td>
									<input
										type="number"
										value={row.productPurchaseCost || ""}
										onChange={(e) =>
											onRowUpdate(
												row.id,
												"productPurchaseCost",
												parseInt(e.target.value, 10) || 0
											)
										}
										disabled={loading}
										className="text-right"
										placeholder={row.productPurchaseCost ? "" : "0"}
									/>
								</td>
								{/* 매입단가 (2 컬럼) */}
								<td className="read-only-cell text-right">
									{totalStonePurchaseCost.toLocaleString()}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};

export default StockTable;

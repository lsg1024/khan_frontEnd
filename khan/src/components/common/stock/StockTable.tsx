import React from "react";
import type { StockOrderRows } from "../../../types/stock";
import "../../../styles/components/stock/StockTable.css"


interface BaseStockTableProps {
	stockRows: StockOrderRows[];
	loading: boolean;
	materials: { materialId: string; materialName: string }[];
	colors: { colorId: string; colorName: string }[];
	assistantStones: { assistantStoneId: string; assistantStoneName: string }[];
	goldHarries: { goldHarryId: string; goldHarry: string }[];
	onRowUpdate: (
		id: string,
		field: keyof StockOrderRows,
		value: unknown
	) => void;
	onStoneInfoOpen?: (rowId: string) => void;
}

interface CreateModeProps extends BaseStockTableProps {
	mode: "create";
	materials: { materialId: string; materialName: string }[];
	colors: { colorId: string; colorName: string }[];
	// Create 모드에서 필수
	onRowDelete: (id: string) => void;
	onAddStockRow: () => void;
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

interface DetailModeProps extends BaseStockTableProps {
	mode: "detail";
	// Detail 모드에서 선택적
	onRowFocus?: (rowId: string) => Promise<void>;
	onAssistanceStoneArrivalChange?: (id: string, value: string) => void;
	isRowInputEnabled?: (currentIndex: number) => boolean;
}

interface ReadonlyModeProps extends BaseStockTableProps {
	mode: "readonly";
	// Readonly 모드에서 선택적
	onRowFocus?: (rowId: string) => Promise<void>;
	onAssistanceStoneArrivalChange?: (id: string, value: string) => void;
	isRowInputEnabled?: (currentIndex: number) => boolean;
}

interface SalesModeProps extends BaseStockTableProps {
	mode: "sales";
	// Sales 모드에서 선택적
	onRowFocus?: (rowId: string) => Promise<void>;
	onAssistanceStoneArrivalChange?: (id: string, value: string) => void;
	isRowInputEnabled?: (currentIndex: number) => boolean;
}

type StockTableProps =
	| CreateModeProps
	| UpdateModeProps
	| DetailModeProps
	| ReadonlyModeProps
	| SalesModeProps;

const StockTable: React.FC<StockTableProps> = (props) => {
	const {
		mode = "create",
		stockRows: orderRows,
		loading,
		materials,
		colors,
		assistantStones,
		goldHarries,
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
		return true; 
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
						const totalStonePurchaseCost = row.stoneInfos.reduce(
							(acc, stone) => {
								if (stone.includeStone) {
									return (
										acc +
										Number(stone.purchaseCost || 0) *
											Number(stone.quantity || 0)
									);
								}
								return acc;
							},
							0
						);
						const goldWeight =
							Number(row.totalWeight || 0) - Number(row.stoneWeight || 0);

						// create 모드에서
						const isCreateMode = mode === "create";
						// readonly 모드에서만 완전히 수정 불가
						const isReadOnlyMode = mode === "readonly";
						// detail 모드에서는 수정 불가
						const isDetailMode = mode === "detail";
						// sales 모드에서는 수정 불가
						const isSaleMode = mode === "sales";

						return (
							<tr
								key={row.id}
								onClick={() => safeOnRowFocus(row.id)}
							>
								<td className="no-cell">{index + 1}</td>
								<td className="no-cell">
									<button
										className="btn-delete-row"
										onClick={() => safeOnRowDelete(row.id)}
										disabled={
											loading ||
											isReadOnlyMode ||
											isDetailMode ||
											isSaleMode
										}
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
											disabled={
												!safeIsRowInputEnabled(index) ||
												isReadOnlyMode ||
												isDetailMode ||
												isSaleMode
											}
											style={{
												backgroundColor:
													isCreateMode ? "white" : "#f5f5f5",
											}}
											onClick={() => {
												if (
													mode === "create" &&
													safeIsRowInputEnabled(index) &&
													!row.storeName
												) {
													safeOnRequiredFieldClick(row.id, "store");
												}
											}}
											onFocus={() => {
												if (
													mode === "create" &&
													safeIsRowInputEnabled(index)
												) {
													safeOnRowFocus(row.id);
												}
											}}
										/>
										{isCreateMode && (
											<span
												className="search-icon"
												onClick={() => {
													if (
														safeIsRowInputEnabled(index)
													) {
														safeOnStoreSearchOpen(row.id);
													} else {
														alert("이전 주문장을 완성해 주세요.");
													}
												}}
												style={{
													opacity:
														!safeIsRowInputEnabled(index) 
															? 0.5
															: 1,
													cursor:
														!safeIsRowInputEnabled(index)
															? "not-allowed"
															: "pointer",
												}}
											>
												🔍
											</span>
										)}
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
											disabled={
												!safeIsRowInputEnabled(index) ||
												isReadOnlyMode ||
												isDetailMode ||
												isSaleMode
											}
											style={{
												backgroundColor:
													isCreateMode ? "white" : "#f5f5f5",
											}}
											onClick={() => {
												if (
													mode === "create" &&
													safeIsRowInputEnabled(index) &&
													!row.productName
												) {
													safeOnRequiredFieldClick(row.id, "product");
												}
											}}
											onFocus={() => {
												if (
													mode === "create" &&
													safeIsRowInputEnabled(index)
												) {
													safeOnRowFocus(row.id);
												}
											}}
										/>
										{isCreateMode && (
											<span
												className="search-icon"
												onClick={() => {
													if (
														safeIsRowInputEnabled(index)
													) {
														safeOnProductSearchOpen(row.id);
													} else {
														alert("이전 주문장을 완성해 주세요.");
													}
												}}
												style={{
													opacity:
														!safeIsRowInputEnabled(index)
															? 0.5
															: 1,
													cursor:
														!safeIsRowInputEnabled(index)
															? "not-allowed"
															: "pointer",
												}}
											>
												🔍
											</span>
										)}
									</div>
								</td>
								<td className="search-type-cell">
									<div className="search-field-container">
										<input
											type="text"
											value={row.factoryName}
											readOnly
											placeholder="제조사"
											disabled={
												isReadOnlyMode || isDetailMode || isSaleMode
											}
											style={{
												backgroundColor:
													isCreateMode ? "white" : "#f5f5f5",
											}}
										/>
										{isCreateMode && (
											<span
												className="search-icon"
												onClick={() => {
													if (
														safeIsRowInputEnabled(index)
													) {
														safeOnFactorySearchOpen(row.id);
													} else {
														alert("이전 주문장을 완성해 주세요.");
													}
												}}
												style={{
													opacity:
														!safeIsRowInputEnabled(index)															? 0.5
															: 1,
													cursor:
														!safeIsRowInputEnabled(index)
															? "not-allowed"
															: "pointer",
												}}
											>
												🔍
											</span>
										)}
									</div>
								</td>
								<td className="drop-down-cell">
									<select
										value={row.materialId}
										onChange={(e) => {
											if (isReadOnlyMode || isDetailMode || isSaleMode)
												return;
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
										disabled={isReadOnlyMode || isDetailMode || isSaleMode}
										style={{
											opacity: isReadOnlyMode || isDetailMode || isSaleMode ? 0.6 : 1,
											cursor:
												isReadOnlyMode || isDetailMode || isSaleMode
													? "not-allowed"
													: "pointer",
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
								</td>
								<td className="drop-down-cell2">
									<select
										value={row.colorId}
										onChange={(e) => {
											if (isReadOnlyMode || isDetailMode || isSaleMode)
												return; // 재고 상태 또는 상세보기 모드일 때 변경 방지
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
										disabled={isReadOnlyMode || isDetailMode || isSaleMode}
										style={{
											opacity: isReadOnlyMode || isDetailMode || isSaleMode ? 0.6 : 1,
											cursor:
												isReadOnlyMode || isDetailMode || isSaleMode
													? "not-allowed"
													: "pointer",
										}}
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
										value={
											row.assistantStoneId === "1" && !row.assistantStoneName
												? ""
												: row.assistantStoneId
										}
										onChange={(e) => {
											if (isReadOnlyMode) return; // 재고 상태 또는 readonly 모드일 때 변경 방지
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
										disabled={isReadOnlyMode}
										style={{
											backgroundColor:
												isReadOnlyMode ? "#f5f5f5" : "white",
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
								<td className="drop-down-cell-small">
									<select
										value={row.assistantStone ? "Y" : "N"}
										onChange={(e) => {
											if (isReadOnlyMode) return; // 재고 상태 또는 readonly 모드일 때 변경 방지
											safeOnAssistanceStoneArrivalChange(
												row.id,
												e.target.value
											);
										}}
										disabled={isReadOnlyMode}
										style={{
											backgroundColor:
												isReadOnlyMode ? "#f5f5f5" : "white",
										}}
									>
										<option value="N">N</option>
										<option value="Y">Y</option>
									</select>
								</td>
								<td className="stock-date">
									<input
										type="date"
										value={row.assistantStoneCreateAt}
										onChange={(e) => {
											if (isReadOnlyMode) return; // 재고 상태 또는 readonly 모드일 때 변경 방지
											onRowUpdate(
												row.id,
												"assistantStoneCreateAt",
												e.target.value
											);
										}}
										disabled={
											loading ||
											row.assistantStone === false ||
											isReadOnlyMode
										}
										readOnly
										style={{
											backgroundColor:
												row.assistantStone === false || isReadOnlyMode
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
										disabled={loading || mode === "readonly"}
										style={{
											backgroundColor:
												mode === "readonly" ? "#f5f5f5" : "white",
										}}
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
										disabled={loading || isDetailMode || isReadOnlyMode}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td className="money-cell-large">
									<div className="search-field-container">
										<input
											type="text"
											value={row.assistanceStonePrice.toLocaleString()}
											onChange={(e) => {
												const value = e.target.value.replace(/,/g, "");
												onRowUpdate(row.id, "assistanceStonePrice", value);
											}}
											disabled={loading || isDetailMode || isReadOnlyMode}
											style={{ backgroundColor: "#f5f5f5" }}
										/>
										{!isReadOnlyMode && (
											<span
												className="search-icon"
												onClick={() => safeOnStoneInfoOpen?.(row.id)}
												style={{
													cursor: isReadOnlyMode ? "not-allowed" : "pointer",
													opacity: isReadOnlyMode ? 0.5 : 1,
												}}
											>
												🔍
											</span>
										)}
									</div>
								</td>
								<td className="money-cell">
									<input
										type="text"
										value={row.stoneAddLaborCost.toLocaleString()}
										onChange={(e) => {
											const value = e.target.value.replace(/,/g, "");
											onRowUpdate(row.id, "stoneAddLaborCost", value);
										}}
										placeholder="0"
										disabled={loading || mode === "readonly"}
										style={{
											backgroundColor:
												mode === "readonly" ? "#f5f5f5" : "white",
										}}
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
										value={row.stoneWeight.toLocaleString()}
										onChange={(e) => {
											onRowUpdate(row.id, "stoneWeight", e.target.value);
										}}
										placeholder="0"
										disabled={loading || mode === "readonly"}
										style={{
											backgroundColor:
												mode === "readonly" ? "#f5f5f5" : "white",
										}}
									/>
								</td>
								<td className="stock-note-cell">
									<input
										type="text"
										value={row.mainStoneNote}
										onChange={(e) =>
											onRowUpdate(row.id, "mainStoneNote", e.target.value)
										}
										disabled={loading || mode === "readonly"}
										placeholder="메인"
										style={{
											backgroundColor:
												mode === "readonly" ? "#f5f5f5" : "white",
										}}
									/>
								</td>
								<td className="stock-note-cell">
									<input
										type="text"
										value={row.assistanceStoneNote}
										onChange={(e) =>
											onRowUpdate(row.id, "assistanceStoneNote", e.target.value)
										}
										disabled={loading || mode === "readonly"}
										placeholder="보조"
										style={{
											backgroundColor:
												mode === "readonly" ? "#f5f5f5" : "white",
										}}
									/>
								</td>
								<td className="stock-size-cell">
									<input
										type="text"
										value={row.productSize}
										onChange={(e) =>
											onRowUpdate(row.id, "productSize", e.target.value)
										}
										disabled={loading || mode === "readonly"}
										placeholder={row.productSize ? "" : "사이즈"}
										style={{
											backgroundColor:
												mode === "readonly" ? "#f5f5f5" : "white",
										}}
									/>
								</td>
								{/* 기타메모 */}
								<td className="stock-note-cell">
									<input
										type="text"
										value={
											mode === "sales" ? row.saleNote || "" : row.orderNote
										}
										onChange={(e) =>
											onRowUpdate(
												row.id,
												mode === "sales" ? "saleNote" : "orderNote",
												e.target.value
											)
										}
										disabled={loading || mode === "readonly"}
										placeholder={
											mode === "sales"
												? row.saleNote
													? ""
													: "비고"
												: row.orderNote
												? ""
												: "기타"
										}
										style={{
											backgroundColor:
												mode === "readonly" ? "#f5f5f5" : "white",
										}}
									/>
								</td>
								{/* 총중량 (3 컬럼) */}
								<td className="stone-weight-cell">
									<input
										type="number"
										value={row.totalWeight > 0 ? row.totalWeight : ""}
										onChange={(e) => {
											const newTotalWeight = parseFloat(e.target.value) || 0;
											const stoneWeightTotal = Number(row.stoneWeight || 0);

											// goldWeight = 총중량 - 알중량
											const calculatedGoldWeight =
												newTotalWeight - stoneWeightTotal;

											// totalWeight 업데이트
											onRowUpdate(row.id, "totalWeight", newTotalWeight);
											// goldWeight 업데이트 (총중량 - 알중량)
											onRowUpdate(
												row.id,
												"goldWeight",
												calculatedGoldWeight.toFixed(3)
											);
											// stoneWeight 업데이트 (알중량 기준)
											onRowUpdate(
												row.id,
												"stoneWeight",
												stoneWeightTotal.toFixed(3)
											);
										}}
										disabled={loading || mode === "readonly"}
										placeholder="0.000"
										className="text-right"
										style={{
											backgroundColor:
												mode === "readonly" ? "#f5f5f5" : "white",
										}}
									/>
								</td>
								{/* 총중량(금) - 자동 계산 */}
								<td>
									<input
										className="read-only-cell text-right stone-weight-cell"
										type="text"
										value={goldWeight > 0 ? goldWeight.toFixed(3) : "0.000"}
										readOnly
										disabled={loading || mode === "readonly"}
									/>
								</td>
								{/* 총중량(알) - 자동 계산 */}
								<td>
									<input
										className="read-only-cell text-right stone-weight-cell"
										type="text"
										value={Number(row.stoneWeight).toFixed(3)}
										readOnly
										disabled={loading || mode === "readonly"}
									/>
								</td>
								{/* 매입헤리 - 드롭다운 */}
								<td className="drop-down-cell">
									<select
										value={row.storeHarry}
										onChange={(e) => {
											onRowUpdate(row.id, "storeHarry", e.target.value);
										}}
										disabled={loading || isReadOnlyMode}
										style={{
											backgroundColor:
												isReadOnlyMode ? "#f5f5f5" : "white",
											opacity: isReadOnlyMode ? 0.6 : 1,
											cursor:
												isReadOnlyMode
													? "not-allowed"
													: "pointer",
										}}
									>
										<option value="">헤리</option>
										{goldHarries.map((harry) => (
											<option key={harry.goldHarryId} value={harry.goldHarry}>
												{harry.goldHarry}
											</option>
										))}
									</select>
								</td>
								{/* 매입단가(기본) */}
								<td className="read-only-cell text-right money-cell">
									{row.productPurchaseCost
										? row.productPurchaseCost.toLocaleString()
										: "0"}
								</td>
								{/* 매입단가 */}
								<td className="read-only-cell text-right money-cell">
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
import React from "react";
import type { OrderRowData } from "../../../types/order";

// 공통 Props
interface BaseOrderTableProps {
	orderRows: OrderRowData[];
	loading: boolean;
	materials: { materialId: string; materialName: string }[];
	colors: { colorId: string; colorName: string }[];
	priorities: { priorityName: string; priorityDate: number }[];
	assistantStones: { assistantStoneId: number; assistantStoneName: string }[];
	onRowUpdate: (id: string, field: keyof OrderRowData, value: unknown) => void;
}

// Create 모드 전용 Props
interface CreateModeProps extends BaseOrderTableProps {
	mode: "create";
	// Create 모드에서 필수
	onRowDelete: (id: string) => void;
	onAddOrderRow: () => void;
	onRowFocus: (rowId: string) => Promise<void>;
	onRequiredFieldClick: (
		currentRowId: string,
		fieldType: "store" | "product" | "material"
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
interface UpdateModeProps extends BaseOrderTableProps {
	mode: "update";
	// Update 모드에서 필수
	onStoreSearchOpen: (rowId: string) => void;
	onProductSearchOpen: (rowId: string) => void;
	onFactorySearchOpen: (rowId: string) => void;

	// Update 모드에서 선택적 (일반적으로 사용하지 않음)
	onRowDelete?: (id: string) => void;
	onAddOrderRow?: () => void;
	onRowFocus?: (rowId: string) => Promise<void>;
	onRequiredFieldClick?: (
		currentRowId: string,
		fieldType: "store" | "product" | "material"
	) => void;
	onAssistanceStoneArrivalChange?: (id: string, value: string) => void;
	validateSequence?: (
		rowId: string,
		currentStep: "product" | "material" | "color" | "other"
	) => boolean;
	isRowInputEnabled?: (currentIndex: number) => boolean;
}

// 모드에 따른 조건부 타입
type OrderTableProps = CreateModeProps | UpdateModeProps;

const OrderTable: React.FC<OrderTableProps> = (props) => {
	const {
		mode = "create",
		orderRows,
		loading,
		materials,
		colors,
		priorities,
		assistantStones,
		onRowUpdate,
	} = props;

	// mode에 따른 안전한 props 접근을 위한 헬퍼 함수들
	const safeOnRowDelete = (id: string) => {
		if ("onRowDelete" in props && props.onRowDelete) {
			props.onRowDelete(id);
		}
	};

	const safeOnAddOrderRow = () => {
		if ("onAddOrderRow" in props && props.onAddOrderRow) {
			props.onAddOrderRow();
		}
	};

	const safeOnRowFocus = async (rowId: string) => {
		if ("onRowFocus" in props && props.onRowFocus) {
			await props.onRowFocus(rowId);
		}
	};

	const safeOnRequiredFieldClick = (
		currentRowId: string,
		fieldType: "store" | "product" | "material"
	) => {
		if ("onRequiredFieldClick" in props && props.onRequiredFieldClick) {
			props.onRequiredFieldClick(currentRowId, fieldType);
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

	const safeOnAssistanceStoneArrivalChange = (id: string, value: string) => {
		if (
			"onAssistanceStoneArrivalChange" in props &&
			props.onAssistanceStoneArrivalChange
		) {
			props.onAssistanceStoneArrivalChange(id, value);
		}
	};

	const safeValidateSequence = (
		rowId: string,
		currentStep: "product" | "material" | "color" | "other"
	): boolean => {
		if ("validateSequence" in props && props.validateSequence) {
			return props.validateSequence(rowId, currentStep);
		}
		return true; // update 모드에서는 기본적으로 true
	};

	const safeIsRowInputEnabled = (currentIndex: number): boolean => {
		if ("isRowInputEnabled" in props && props.isRowInputEnabled) {
			return props.isRowInputEnabled(currentIndex);
		}
		return true; // update 모드에서는 기본적으로 true
	};
	return (
		<div className="order-table-container">
			<table className="order-create-table">
				<thead>
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
						<th>급</th>
						<th>기타</th>
						<th>출고일</th>
					</tr>
					<tr>
						<th></th>
						<th></th>
						<th></th>
						<th></th>
						<th></th>
						<th></th>
						<th></th>
						<th>입고여부</th>
						<th>유형</th>
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
						<th></th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{orderRows.map((row, index) => (
						<tr key={row.id}>
							<td>{index + 1}</td>
							<td>
								<button
									className="btn-delete-row"
									onClick={() => safeOnRowDelete(row.id)}
									disabled={loading}
								>
									🗑️
								</button>
							</td>
							<td>
								<div className="search-field-container">
									<input
										type="text"
										value={row.storeName}
										readOnly
										placeholder="거래처"
										disabled={!safeIsRowInputEnabled(index)}
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
											if (mode === "create" && safeIsRowInputEnabled(index)) {
												safeOnRowFocus(row.id);
											}
										}}
									/>
									<span
										className="search-icon"
										onClick={() => {
											if (safeIsRowInputEnabled(index)) {
												safeOnStoreSearchOpen(row.id);
											} else {
												alert("이전 주문장을 완성해 주세요.");
											}
										}}
										style={{
											opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
											cursor: !safeIsRowInputEnabled(index)
												? "not-allowed"
												: "pointer",
										}}
									>
										🔍
									</span>
								</div>
							</td>
							<td>
								<div className="search-field-container">
									<input
										type="text"
										value={row.productName}
										readOnly
										placeholder="모델번호"
										disabled={!safeIsRowInputEnabled(index)}
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
											if (mode === "create" && safeIsRowInputEnabled(index)) {
												safeOnRowFocus(row.id);
											}
										}}
									/>
									<span
										className="search-icon"
										onClick={() => {
											if (safeIsRowInputEnabled(index)) {
												safeOnProductSearchOpen(row.id);
											} else {
												alert("이전 주문장을 완성해 주세요.");
											}
										}}
										style={{
											opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
											cursor: !safeIsRowInputEnabled(index)
												? "not-allowed"
												: "pointer",
										}}
									>
										🔍
									</span>
								</div>
							</td>
							<td>
								<div className="search-field-container">
									<input
										type="text"
										value={row.factoryName}
										readOnly
										placeholder="제조사"
									/>
									<span
										className="search-icon"
										onClick={() => {
											if (safeIsRowInputEnabled(index)) {
												safeOnFactorySearchOpen(row.id);
											} else {
												alert("이전 주문장을 완성해 주세요.");
											}
										}}
										style={{
											opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
											cursor: !safeIsRowInputEnabled(index)
												? "not-allowed"
												: "pointer",
										}}
									>
										🔍
									</span>
								</div>
							</td>
							<td>
								<select
									value={row.materialId}
									onChange={(e) => {
										if (!safeValidateSequence(row.id, "material")) return;
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
									disabled={loading || !safeIsRowInputEnabled(index)}
									onClick={() => {
										if (
											mode === "create" &&
											safeIsRowInputEnabled(index) &&
											!row.materialId
										) {
											safeOnRequiredFieldClick(row.id, "material");
										}
									}}
									onFocus={() => {
										if (mode === "create" && safeIsRowInputEnabled(index)) {
											safeOnRowFocus(row.id);
										}
									}}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
										cursor: !safeIsRowInputEnabled(index)
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
							<td>
								<select
									value={row.colorId}
									onChange={(e) => {
										if (!safeValidateSequence(row.id, "color")) {
											return;
										}
										let selectedValue = e.target.value;

										if (selectedValue === "") {
											selectedValue = "1";
										}

										const selectedColor = colors.find(
											(c) => c.colorId === selectedValue
										);

										onRowUpdate(row.id, "colorId", selectedValue);
										onRowUpdate(
											row.id,
											"colorName",
											selectedColor?.colorName || ""
										);
									}}
									disabled={loading || !safeIsRowInputEnabled(index)}
									onFocus={() => {
										if (mode === "create" && safeIsRowInputEnabled(index)) {
											safeOnRowFocus(row.id);
										}
									}}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
										cursor: !safeIsRowInputEnabled(index)
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
							{/* 보조석 필드들 */}
							<td>
								<select
									value={row.assistantStone ? "Y" : "N"}
									onChange={(e) =>
										safeOnAssistanceStoneArrivalChange(row.id, e.target.value)
									}
									disabled={loading || !safeIsRowInputEnabled(index)}
									className={`arrival-status ${
										row.assistantStone === true ? "arrived" : ""
									}`}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
									}}
								>
									<option value="N">N</option>
									<option value="Y">Y</option>
								</select>
							</td>
							<td>
								<select
									value={row.assistantStoneId}
									onChange={(e) => {
										if (!safeValidateSequence(row.id, "other")) {
											return;
										}
										const selectedAssistantStone = assistantStones.find(
											(a) => a.assistantStoneId === parseInt(e.target.value)
										);
										onRowUpdate(
											row.id,
											"assistantStoneId",
											parseInt(e.target.value)
										);
										onRowUpdate(
											row.id,
											"assistantStoneName",
											selectedAssistantStone?.assistantStoneName || ""
										);
									}}
									disabled={loading || !safeIsRowInputEnabled(index)}
									onFocus={() => {
										if (mode === "create" && safeIsRowInputEnabled(index)) {
											safeOnRowFocus(row.id);
										}
									}}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
										cursor: !safeIsRowInputEnabled(index)
											? "not-allowed"
											: "pointer",
									}}
								>
									<option value={0}>선택</option>
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
							<td>
								<input
									type="date"
									value={row.assistantStoneCreateAt}
									onChange={(e) =>
										onRowUpdate(
											row.id,
											"assistantStoneCreateAt",
											e.target.value
										)
									}
									disabled={loading || row.assistantStone === false}
									style={{
										backgroundColor:
											row.assistantStone === false ? "#f5f5f5" : "white",
									}}
								/>
							</td>
							<td>
								<input
									type="text"
									value={row.mainPrice.toLocaleString()}
									readOnly
									disabled={loading}
									style={{ backgroundColor: "#f5f5f5" }}
								/>
							</td>
							<td>
								<input
									type="text"
									value={row.additionalPrice.toLocaleString()}
									onChange={(e) => {
										const value = e.target.value.replace(/,/g, "");
										onRowUpdate(row.id, "additionalPrice", value);
									}}
									placeholder="0"
									disabled={loading || !safeIsRowInputEnabled(index)}
									onFocus={() => {
										if (mode === "create" && safeIsRowInputEnabled(index)) {
											safeOnRowFocus(row.id);
										}
									}}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
									}}
								/>
							</td>
							<td>
								<input
									type="text"
									value={row.mainStonePrice.toLocaleString()}
									readOnly
									disabled={loading}
									style={{ backgroundColor: "#f5f5f5" }}
								/>
							</td>
							<td>
								<input
									type="text"
									value={row.assistanceStonePrice.toLocaleString()}
									readOnly
									disabled={loading}
									style={{ backgroundColor: "#f5f5f5" }}
								/>
							</td>
							<td>
								<input
									type="text"
									value={row.additionalStonePrice.toLocaleString()}
									onChange={(e) => {
										const value = e.target.value.replace(/,/g, "");
										onRowUpdate(row.id, "additionalStonePrice", value);
									}}
									placeholder="0"
									disabled={loading || !safeIsRowInputEnabled(index)}
									onFocus={() => {
										if (mode === "create" && safeIsRowInputEnabled(index)) {
											safeOnRowFocus(row.id);
										}
									}}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
									}}
								/>
							</td>
							<td>
								<input
									type="text"
									value={row.mainStoneCount.toString()}
									readOnly
									disabled={loading}
									style={{ backgroundColor: "#f5f5f5" }}
								/>
							</td>
							<td>
								<input
									type="text"
									value={row.assistanceStoneCount.toString()}
									readOnly
									disabled={loading}
									style={{ backgroundColor: "#f5f5f5" }}
								/>
							</td>
							<td>
								<input
									type="text"
									value={row.stoneWeightTotal.toString()}
									onChange={(e) =>
										onRowUpdate(row.id, "stoneWeightTotal", e.target.value)
									}
									placeholder="0"
									disabled={loading || !safeIsRowInputEnabled(index)}
									onFocus={() => {
										if (mode === "create" && safeIsRowInputEnabled(index)) {
											safeOnRowFocus(row.id);
										}
									}}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
									}}
								/>
							</td>
							<td>
								<input
									type="text"
									value={row.mainStoneNote}
									onChange={(e) =>
										onRowUpdate(row.id, "mainStoneNote", e.target.value)
									}
									placeholder="메인 알 메모"
									disabled={loading || !safeIsRowInputEnabled(index)}
									onFocus={() => {
										if (mode === "create" && safeIsRowInputEnabled(index)) {
											safeOnRowFocus(row.id);
										}
									}}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
									}}
								/>
							</td>
							<td>
								<input
									type="text"
									value={row.assistanceStoneNote}
									onChange={(e) =>
										onRowUpdate(row.id, "assistanceStoneNote", e.target.value)
									}
									placeholder="보조 알 메모"
									disabled={loading || !safeIsRowInputEnabled(index)}
									onFocus={() => {
										if (mode === "create" && safeIsRowInputEnabled(index)) {
											safeOnRowFocus(row.id);
										}
									}}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
									}}
								/>
							</td>
							<td>
								<input
									type="text"
									value={row.productSize}
									onChange={(e) =>
										onRowUpdate(row.id, "productSize", e.target.value)
									}
									placeholder="사이즈"
									disabled={loading || !safeIsRowInputEnabled(index)}
									onFocus={() => {
										if (mode === "create" && safeIsRowInputEnabled(index)) {
											safeOnRowFocus(row.id);
										}
									}}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
									}}
								/>
							</td>
							<td>
								<select
									value={row.priorityName}
									onChange={(e) => {
										if (!safeValidateSequence(row.id, "other")) {
											return;
										}
										const selectedPriority = priorities.find(
											(p) => p.priorityName === e.target.value
										);
										onRowUpdate(row.id, "priorityName", e.target.value);

										// priorityDate만큼 현재 날짜에 더해서 출고일 설정
										if (selectedPriority && selectedPriority.priorityDate) {
											const currentDate = new Date();
											const deliveryDate = new Date(currentDate);
											deliveryDate.setDate(
												currentDate.getDate() + selectedPriority.priorityDate
											);
											const formattedDate = deliveryDate
												.toISOString()
												.split("T")[0];
											onRowUpdate(row.id, "createAt", formattedDate);
										}
									}}
									disabled={loading || !safeIsRowInputEnabled(index)}
									onFocus={() => {
										if (mode === "create" && safeIsRowInputEnabled(index)) {
											safeOnRowFocus(row.id);
										}
									}}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
										cursor: !safeIsRowInputEnabled(index)
											? "not-allowed"
											: "pointer",
									}}
								>
									<option value="">선택</option>
									{priorities.map((priority) => (
										<option
											key={priority.priorityName}
											value={priority.priorityName}
										>
											{priority.priorityName}
										</option>
									))}
								</select>
							</td>
							<td>
								<input
									type="text"
									value={row.orderNote}
									onChange={(e) =>
										onRowUpdate(row.id, "orderNote", e.target.value)
									}
									placeholder="기타 메모"
									disabled={loading || !safeIsRowInputEnabled(index)}
									onFocus={() => {
										if (mode === "create" && safeIsRowInputEnabled(index)) {
											safeOnRowFocus(row.id);
										}
									}}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
									}}
								/>
							</td>
							<td>
								<input
									type="date"
									value={row.createAt}
									onChange={(e) =>
										onRowUpdate(row.id, "createAt", e.target.value)
									}
									disabled={loading || !safeIsRowInputEnabled(index)}
									onFocus={() => {
										if (mode === "create" && safeIsRowInputEnabled(index)) {
											safeOnRowFocus(row.id);
										}
									}}
									style={{
										opacity: !safeIsRowInputEnabled(index) ? 0.5 : 1,
									}}
								/>
							</td>
						</tr>
					))}
					{mode === "create" && (
						<tr>
							<td>{orderRows.length + 1}</td>
							<td>
								<button
									className="btn-add-row"
									onClick={safeOnAddOrderRow}
									disabled={loading}
								>
									+
								</button>
							</td>
							<td colSpan={22}></td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};

export default OrderTable;

import React, { useState } from "react";
import { addBusinessDays, formatDateToString } from "../../../utils/dateUtils";
import type { OrderRowData } from "../../../types/orderDto";
import type { ColorDto } from "../../../types/colorDto";
import type { MaterialDto } from "../../../types/materialDto";
import type { AssistantStoneDto } from "../../../types/AssistantStoneDto";

// 공통 Props
interface BaseOrderTableProps {
	orderRows: OrderRowData[];
	loading: boolean;
	materials: MaterialDto[];
	colors: ColorDto[];
	priorities: { priorityName: string; priorityDate: number }[];
	assistantStones: AssistantStoneDto[];
	onRowUpdate: (id: string, field: keyof OrderRowData, value: unknown) => void;
	onStoneInfoOpen?: (rowId: string) => void; // 스톤 정보 관리 함수 추가
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

	// 직접 입력 검색 핸들러 (선택적) - 반환값: true = 성공 (다음 컬럼으로 이동), false = 실패
	onDirectStoreSearch?: (rowId: string, searchTerm: string) => Promise<boolean>;
	onDirectProductSearch?: (rowId: string, searchTerm: string) => Promise<boolean>;
	onDirectFactorySearch?: (rowId: string, searchTerm: string) => Promise<boolean>;
}

// Update 모드 전용 Props
interface UpdateModeProps extends BaseOrderTableProps {
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
		fieldType: "store" | "product" | "material" | "color"
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

	const safeOnStoneInfoOpen = (rowId: string) => {
		if (props.onStoneInfoOpen) {
			props.onStoneInfoOpen(rowId);
		}
	};

	// 직접 검색 안전 호출 함수들 - boolean 반환 (성공=true, 실패=false)
	const safeOnDirectStoreSearch = async (rowId: string, searchTerm: string): Promise<boolean> => {
		if ("onDirectStoreSearch" in props && props.onDirectStoreSearch) {
			return await props.onDirectStoreSearch(rowId, searchTerm);
		}
		return false;
	};

	const safeOnDirectProductSearch = async (
		rowId: string,
		searchTerm: string
	): Promise<boolean> => {
		if ("onDirectProductSearch" in props && props.onDirectProductSearch) {
			return await props.onDirectProductSearch(rowId, searchTerm);
		}
		return false;
	};

	const safeOnDirectFactorySearch = async (
		rowId: string,
		searchTerm: string
	): Promise<boolean> => {
		if ("onDirectFactorySearch" in props && props.onDirectFactorySearch) {
			return await props.onDirectFactorySearch(rowId, searchTerm);
		}
		return false;
	};

	// 검색어 입력 상태 (기존 row.storeName과 분리)
	const [searchInputs, setSearchInputs] = useState<{
		[rowId: string]: {
			storeName?: string;
			productName?: string;
			factoryName?: string;
		};
	}>({});

	// 검색 중 상태 (loading indicator)
	const [searchingField, setSearchingField] = useState<{
		[rowId: string]: "store" | "product" | "factory" | null;
	}>({});

	// 검색어 변경 핸들러
	const handleSearchInputChange = (
		rowId: string,
		field: "storeName" | "productName" | "factoryName",
		value: string
	) => {
		setSearchInputs((prev) => ({
			...prev,
			[rowId]: {
				...prev[rowId],
				[field]: value,
			},
		}));
	};

	// 다음 입력 필드로 포커스 이동
	const focusNextField = (rowId: string, currentField: "store" | "product" | "factory") => {
		// 컬럼 순서: 거래처(store) → 모델번호(product) → 제조사(factory) → 재질(material)
		const nextFieldMap: Record<string, string> = {
			store: `product-input-${rowId}`,
			product: `factory-input-${rowId}`,
			factory: `material-select-${rowId}`,
		};

		const nextElementId = nextFieldMap[currentField];
		if (nextElementId) {
			setTimeout(() => {
				const nextElement = document.getElementById(nextElementId);
				if (nextElement) {
					nextElement.focus();
				}
			}, 100);
		}
	};

	// Enter 키 핸들러
	const handleSearchKeyDown = async (
		e: React.KeyboardEvent<HTMLInputElement>,
		rowId: string,
		field: "store" | "product" | "factory"
	) => {
		// IME 조합 중이면 무시 (한글 입력 완료 후에만 처리)
		if (e.key === "Enter" && !e.nativeEvent.isComposing) {
			e.preventDefault();

			const fieldMap = {
				store: "storeName",
				product: "productName",
				factory: "factoryName",
			} as const;

			const searchTerm = searchInputs[rowId]?.[fieldMap[field]]?.trim();
			if (!searchTerm) return;

			setSearchingField((prev) => ({ ...prev, [rowId]: field }));

			try {
				let success = false;
				switch (field) {
					case "store":
						success = await safeOnDirectStoreSearch(rowId, searchTerm);
						break;
					case "product":
						success = await safeOnDirectProductSearch(rowId, searchTerm);
						break;
					case "factory":
						success = await safeOnDirectFactorySearch(rowId, searchTerm);
						break;
				}

				// 검색 성공 시 다음 필드로 포커스 이동
				if (success) {
					focusNextField(rowId, field);
				}
			} finally {
				setSearchingField((prev) => ({ ...prev, [rowId]: null }));
				// 검색어 초기화
				setSearchInputs((prev) => ({
					...prev,
					[rowId]: { ...prev[rowId], [fieldMap[field]]: undefined },
				}));
			}
		}
	};

	// 포커스 해제 시 검색어 초기화
	const handleSearchBlur = (
		rowId: string,
		field: "storeName" | "productName" | "factoryName"
	) => {
		// 약간의 지연 후 초기화 (클릭 이벤트와 충돌 방지)
		setTimeout(() => {
			setSearchInputs((prev) => ({
				...prev,
				[rowId]: { ...prev[rowId], [field]: undefined },
			}));
		}, 200);
	};

	const handleIntegerChange = (
		id: string,
		field: keyof OrderRowData,
		value: string
	) => {
		const numericString = value.replace(/[^0-9]/g, "");
		const numericValue = numericString === "" ? 0 : parseInt(numericString, 10);
		onRowUpdate(id, field, numericValue);
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
						<th>유형</th>
						<th>입고</th>
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
					{orderRows.map((row, index) => {
						// 재고 상태 확인 (STOCK = 재고, SHIPPED = 출고됨)
						const isStockStatus = row.currentStatus === "STOCK";

						// 재고 상태일 때 붉은 배경색 스타일
						const rowStyle = isStockStatus
							? { backgroundColor: "#ffebee" }
							: {};

						return (
							<tr
								key={row.id}
								style={rowStyle}
								className={isStockStatus ? "stock-status-row" : ""}
							>
								<td className="order-create-table-no-cell">{index + 1}</td>
								<td className="order-create-table-del-cell">
									<button
										className="btn-delete-row"
										onClick={() => safeOnRowDelete(row.id)}
										disabled={loading || isStockStatus}
									>
										🗑️
									</button>
								</td>
								<td className="order-create-table-store-cell">
									<div className="search-field-container">
										<input
											id={`store-input-${row.id}`}
											type="text"
											value={
												searchInputs[row.id]?.storeName ?? row.storeName
											}
											placeholder="거래처"
											disabled={!safeIsRowInputEnabled(index) || isStockStatus}
											onChange={(e) =>
												handleSearchInputChange(
													row.id,
													"storeName",
													e.target.value
												)
											}
											onKeyDown={(e) =>
												handleSearchKeyDown(e, row.id, "store")
											}
											onBlur={() => handleSearchBlur(row.id, "storeName")}
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
											className={`search-icon ${
												searchingField[row.id] === "store" ? "loading" : ""
											}`}
											onClick={() => {
												if (
													searchingField[row.id] !== "store" &&
													safeIsRowInputEnabled(index) &&
													!isStockStatus
												) {
													safeOnStoreSearchOpen(row.id);
												} else if (isStockStatus) {
													alert("재고 상태에서는 수정할 수 없습니다.");
												} else if (searchingField[row.id] !== "store") {
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
											{searchingField[row.id] === "store" ? "⏳" : "🔍"}
										</span>
									</div>
								</td>
								<td className="order-create-table-model-cell">
									<div className="search-field-container">
										<input
											id={`product-input-${row.id}`}
											type="text"
											value={
												searchInputs[row.id]?.productName ?? row.productName
											}
											placeholder="모델번호"
											disabled={!safeIsRowInputEnabled(index) || isStockStatus}
											onChange={(e) =>
												handleSearchInputChange(
													row.id,
													"productName",
													e.target.value
												)
											}
											onKeyDown={(e) =>
												handleSearchKeyDown(e, row.id, "product")
											}
											onBlur={() => handleSearchBlur(row.id, "productName")}
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
											className={`search-icon ${
												searchingField[row.id] === "product" ? "loading" : ""
											}`}
											onClick={() => {
												if (
													searchingField[row.id] !== "product" &&
													safeIsRowInputEnabled(index) &&
													!isStockStatus
												) {
													safeOnProductSearchOpen(row.id);
												} else if (isStockStatus) {
													alert("재고 상태에서는 수정할 수 없습니다.");
												} else if (searchingField[row.id] !== "product") {
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
											{searchingField[row.id] === "product" ? "⏳" : "🔍"}
										</span>
									</div>
								</td>
								<td className="order-create-table-factory-cell">
									<div className="search-field-container">
										<input
											id={`factory-input-${row.id}`}
											type="text"
											value={
												searchInputs[row.id]?.factoryName ?? row.factoryName
											}
											placeholder="제조사"
											disabled={!safeIsRowInputEnabled(index) || isStockStatus}
											onChange={(e) =>
												handleSearchInputChange(
													row.id,
													"factoryName",
													e.target.value
												)
											}
											onKeyDown={(e) =>
												handleSearchKeyDown(e, row.id, "factory")
											}
											onBlur={() => handleSearchBlur(row.id, "factoryName")}
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
											className={`search-icon ${
												searchingField[row.id] === "factory" ? "loading" : ""
											}`}
											onClick={() => {
												if (
													searchingField[row.id] !== "factory" &&
													safeIsRowInputEnabled(index) &&
													!isStockStatus
												) {
													safeOnFactorySearchOpen(row.id);
												} else if (isStockStatus) {
													alert("재고 상태에서는 수정할 수 없습니다.");
												} else if (searchingField[row.id] !== "factory") {
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
											{searchingField[row.id] === "factory" ? "⏳" : "🔍"}
										</span>
									</div>
								</td>
								<td className="order-create-table-material-cell">
									<select
										id={`material-select-${row.id}`}
										value={row.materialId}
										onChange={(e) => {
											if (
												!safeValidateSequence(row.id, "material") ||
												isStockStatus
											)
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
										disabled={
											loading || !safeIsRowInputEnabled(index) || isStockStatus
										}
										onClick={() => {
											if (
												mode === "create" &&
												safeIsRowInputEnabled(index) &&
												!row.materialId &&
												!isStockStatus
											) {
												safeOnRequiredFieldClick(row.id, "material");
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
								<td className="order-create-table-color-cell">
									<select
										value={row.colorId}
										onChange={(e) => {
											if (
												!safeValidateSequence(row.id, "color") ||
												isStockStatus
											) {
												return;
											}
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
										disabled={
											loading || !safeIsRowInputEnabled(index) || isStockStatus
										}
										onClick={() => {
											if (
												mode === "create" &&
												safeIsRowInputEnabled(index) &&
												!row.colorId &&
												!isStockStatus
											) {
												safeOnRequiredFieldClick(row.id, "color");
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
										<option value="">선택</option>
										{colors.map((color) => (
											<option key={color.colorId} value={color.colorId}>
												{color.colorName}
											</option>
										))}
									</select>
								</td>
								{/* 보조석 필드들 */}
								<td className="order-create-table-type-cell">
									<select
										value={row.assistantStoneId || "1"}
										onChange={(e) => {
											if (!safeValidateSequence(row.id, "other")) {
												return;
											}
											const selectedAssistantStone = assistantStones.find(
												(a) => a.assistantStoneId === Number(e.target.value)
											);
											onRowUpdate(row.id, "assistantStoneId", e.target.value);
											onRowUpdate(
												row.id,
												"assistantStoneName",
												selectedAssistantStone?.assistantStoneName || ""
											);
										}}
										disabled={
											loading || !safeIsRowInputEnabled(index) || isStockStatus
										}
										onFocus={() => {
											if (
												mode === "create" &&
												safeIsRowInputEnabled(index) &&
												!isStockStatus
											) {
												safeOnRowFocus(row.id);
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
								<td className="order-create-table-insert-cell">
									<select
										value={row.assistantStone ? "Y" : "N"}
										onChange={(e) => {
											if (isStockStatus) return; // 재고 상태일 때 변경 방지
											safeOnAssistanceStoneArrivalChange(
												row.id,
												e.target.value
											);
										}}
										disabled={
											loading || !safeIsRowInputEnabled(index) || isStockStatus
										}
										className={`arrival-status ${
											row.assistantStone === true ? "arrived" : ""
										}`}
										style={{
											opacity:
												!safeIsRowInputEnabled(index) || isStockStatus
													? 0.5
													: 1,
										}}
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
										style={{
											backgroundColor:
												row.assistantStone === false || isStockStatus
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								<td className="order-create-table-money-cell">
									<input
										type="text"
										value={Number(row.productLaborCost || 0).toLocaleString()}
										onChange={(e) => {
											if (isStockStatus) return;
											handleIntegerChange(
												row.id,
												"productLaborCost",
												e.target.value
											);
										}}
										placeholder="0"
										disabled={
											loading || !safeIsRowInputEnabled(index) || isStockStatus
										}
										onFocus={() => {
											if (
												mode === "create" &&
												safeIsRowInputEnabled(index) &&
												!isStockStatus
											) {
												safeOnRowFocus(row.id);
											}
										}}
										style={{
											opacity:
												!safeIsRowInputEnabled(index) || isStockStatus
													? 0.5
													: 1,
										}}
									/>
								</td>
								<td className="order-create-table-money-cell">
									<input
										type="text"
										value={Number(row.productAddLaborCost || 0).toLocaleString()}
										onChange={(e) => {
											if (isStockStatus) return; // 재고 상태일 때 변경 방지
											handleIntegerChange(
												row.id,
												"productAddLaborCost",
												e.target.value
											);
										}}
										placeholder="0"
										disabled={
											loading || !safeIsRowInputEnabled(index) || isStockStatus
										}
										onFocus={() => {
											if (
												mode === "create" &&
												safeIsRowInputEnabled(index) &&
												!isStockStatus
											) {
												safeOnRowFocus(row.id);
											}
										}}
										style={{
											opacity:
												!safeIsRowInputEnabled(index) || isStockStatus
													? 0.5
													: 1,
										}}
									/>
								</td>
								<td className="order-create-table-money-cell">
									<input
										type="text"
										value={Number(row.mainStonePrice || 0).toLocaleString()}
										readOnly
										disabled={loading}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td className="money-cell-large">
									<div className="search-field-container">
										<input
											type="text"
											value={Number(row.assistanceStonePrice || 0).toLocaleString()}
											readOnly
											disabled={loading}
											style={{ backgroundColor: "#f5f5f5" }}
										/>
										<span
											className="search-icon"
											onClick={() => {
												if (safeIsRowInputEnabled(index)) {
													safeOnStoneInfoOpen(row.id);
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
								<td className="order-create-table-money-cell">
									<input
										type="text"
										value={Number(row.stoneAddLaborCost || 0).toLocaleString()}
										onChange={(e) => {
											if (isStockStatus) return;
											handleIntegerChange(
												row.id,
												"stoneAddLaborCost",
												e.target.value
											);
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
								<td className="order-create-table-count-cell">
									<input
										type="text"
										value={row.mainStoneCount.toString()}
										readOnly
										disabled={loading}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td className="order-create-table-count-cell">
									<input
										type="text"
										value={row.assistanceStoneCount.toString()}
										readOnly
										disabled={loading}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td className="order-create-table-stone-weight-cell">
									<input
										type="text"
										value={row.stoneWeightTotal === "" ? "0.000" : Number(row.stoneWeightTotal).toFixed(3)}
										onChange={(e) =>
											onRowUpdate(row.id, "stoneWeightTotal", e.target.value)
										}
										placeholder="0.000"
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
								<td className="order-create-table-note-cell">
									<input
										type="text"
										value={row.mainStoneNote}
										onChange={(e) => {
											if (isStockStatus) return; // 재고 상태일 때 변경 방지
											onRowUpdate(row.id, "mainStoneNote", e.target.value);
										}}
										placeholder="메인"
										disabled={
											loading || !safeIsRowInputEnabled(index) || isStockStatus
										}
										onFocus={() => {
											if (
												mode === "create" &&
												safeIsRowInputEnabled(index) &&
												!isStockStatus
											) {
												safeOnRowFocus(row.id);
											}
										}}
										style={{
											opacity:
												!safeIsRowInputEnabled(index) || isStockStatus
													? 0.5
													: 1,
										}}
									/>
								</td>
								<td className="order-create-table-note-cell">
									<input
										type="text"
										value={row.assistanceStoneNote}
										onChange={(e) => {
											if (isStockStatus) return; // 재고 상태일 때 변경 방지
											onRowUpdate(
												row.id,
												"assistanceStoneNote",
												e.target.value
											);
										}}
										placeholder="보조"
										disabled={
											loading || !safeIsRowInputEnabled(index) || isStockStatus
										}
										onFocus={() => {
											if (
												mode === "create" &&
												safeIsRowInputEnabled(index) &&
												!isStockStatus
											) {
												safeOnRowFocus(row.id);
											}
										}}
										style={{
											opacity:
												!safeIsRowInputEnabled(index) || isStockStatus
													? 0.5
													: 1,
										}}
									/>
								</td>
								<td className="order-create-table-size-cell">
									<input
										type="text"
										value={row.productSize}
										onChange={(e) => {
											if (isStockStatus) return; // 재고 상태일 때 변경 방지
											onRowUpdate(row.id, "productSize", e.target.value);
										}}
										placeholder="사이즈"
										disabled={
											loading || !safeIsRowInputEnabled(index) || isStockStatus
										}
										onFocus={() => {
											if (
												mode === "create" &&
												safeIsRowInputEnabled(index) &&
												!isStockStatus
											) {
												safeOnRowFocus(row.id);
											}
										}}
										style={{
											opacity:
												!safeIsRowInputEnabled(index) || isStockStatus
													? 0.5
													: 1,
										}}
									/>
								</td>
								<td className="order-create-table-priority-cell">
									<select
										value={row.priorityName}
										onChange={(e) => {
											if (
												!safeValidateSequence(row.id, "other") ||
												isStockStatus
											) {
												return;
											}
											const selectedPriority = priorities.find(
												(p) => p.priorityName === e.target.value
											);
											onRowUpdate(row.id, "priorityName", e.target.value);

											// priorityDate만큼 영업일 기준으로 출고일 설정
											if (selectedPriority && selectedPriority.priorityDate) {
												const currentDate = new Date();
												const deliveryDate = addBusinessDays(
													currentDate,
													selectedPriority.priorityDate
												);
												const formattedDate = formatDateToString(deliveryDate);
												onRowUpdate(row.id, "shippingAt", formattedDate);
											}
										}}
										disabled={
											loading || !safeIsRowInputEnabled(index) || isStockStatus
										}
										onFocus={() => {
											if (
												mode === "create" &&
												safeIsRowInputEnabled(index) &&
												!isStockStatus
											) {
												safeOnRowFocus(row.id);
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
								<td className="order-create-table-note-cell">
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
										value={row.shippingAt}
										onChange={(e) => {
											if (isStockStatus) return; // 재고 상태일 때 변경 방지
											onRowUpdate(row.id, "shippingAt", e.target.value);
										}}
										disabled={
											loading || !safeIsRowInputEnabled(index) || isStockStatus
										}
										onFocus={() => {
											if (
												mode === "create" &&
												safeIsRowInputEnabled(index) &&
												!isStockStatus
											) {
												safeOnRowFocus(row.id);
											}
										}}
										style={{
											opacity:
												!safeIsRowInputEnabled(index) || isStockStatus
													? 0.5
													: 1,
										}}
									/>
								</td>
							</tr>
						);
					})}
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

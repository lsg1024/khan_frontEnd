import React, { useState, useEffect, useCallback, useMemo } from "react";
import type {
	PriceTableProps,
	GradePolicyDto,
	ProductWorkGradePolicyGroupDto,
} from "../../../types/price";
import type { ColorDto } from "../../../types/color";
import { colorApi } from "../../../../libs/api/color";
import "../../../styles/components/PriceTable.css";

const GRADE_ORDER: GradePolicyDto["grade"][] = [
	"GRADE_1",
	"GRADE_2",
	"GRADE_3",
	"GRADE_4",
];

// 지정한 등급 순서로 정렬 + 누락 등급은 0원으로 채워 넣기
const normalizePolicies = (
	policies: GradePolicyDto[] | undefined,
	groupIdForNew: string
): GradePolicyDto[] => {
	const map = new Map((policies || []).map((p) => [p.grade, p]));
	return GRADE_ORDER.map((g, idx) => {
		const hit = map.get(g);
		if (hit) return hit;
		return {
			workGradePolicyId: `${groupIdForNew}-${idx + 1}`,
			grade: g,
			laborCost: 0,
			note: "",
			groupId: Number(groupIdForNew) || 0,
		};
	});
};

const makeTemplateGroup = (index: number): ProductWorkGradePolicyGroupDto => {
	const gid = `new-${index + 1}`;
	return {
		productGroupId: "", // 새 행은 서버 id 없음
		colorId: "", // 선택 유도 (빈 값)
		colorName: "",
		productPurchasePrice: 0,
		gradePolicyDtos: normalizePolicies([], gid),
		note: "",
	};
};

// “전송할 가치”가 있는 행인지 판단 (최소 하나라도 값이 들어갔는가)
const isRowDirty = (row: ProductWorkGradePolicyGroupDto): boolean => {
	return (
		!!row.colorId ||
		(row.productPurchasePrice ?? 0) > 0 ||
		!!row.note?.trim() ||
		(row.gradePolicyDtos || []).some((p) => (p.laborCost ?? 0) > 0)
	);
};

const PriceTable: React.FC<PriceTableProps> = ({
	priceGroups,
	showTitle = true,
	editable = true,
	onPriceGroupChange,
	validationErrors = {},
}) => {
	// 색상 옵션
	const [colorOptions, setColorOptions] = useState<ColorDto[]>([]);

	const loadColorOptions = useCallback(async () => {
		if (colorOptions.length > 0) return;
		try {
			const response = await colorApi.getColors();
			if (response.success && response.data) setColorOptions(response.data);
			else setColorOptions([]);
		} catch (e) {
			console.error("색상 옵션 로드 실패:", e);
		}
	}, [colorOptions.length]);

	useEffect(() => {
		loadColorOptions();
	}, [loadColorOptions]);

	// 화면에 보여줄 3줄 구성: 서버의 0~2번째를 우선 배치하고 부족분은 템플릿으로
	const displayRows: ProductWorkGradePolicyGroupDto[] = useMemo(() => {
		const src = Array.isArray(priceGroups) ? priceGroups : [];
		const out: ProductWorkGradePolicyGroupDto[] = [];
		for (let i = 0; i < 3; i++) {
			const g = src[i];
			if (g) {
				out.push({
					...g,
					gradePolicyDtos: normalizePolicies(
						g.gradePolicyDtos,
						g.productGroupId || `new-${i + 1}`
					),
				});
			} else {
				out.push(makeTemplateGroup(i));
			}
		}
		return out;
	}, [priceGroups]);

	// 상위로 변경 반영 (빈 템플릿은 제외, 단 기존 서버행은 id가 있으면 남김)
	const pushUp = useCallback(
		(rows: ProductWorkGradePolicyGroupDto[]) => {
			if (!onPriceGroupChange) return;
			const cleaned = rows
				// 뒤쪽 템플릿까지 포함되어 올 수 있음 → 실제 값이 있거나 기존 id가 있으면 유지
				.filter((r) => isRowDirty(r) || !!r.productGroupId)
				// gradePolicyDtos 안전화
				.map((r, idx) => ({
					...r,
					gradePolicyDtos: normalizePolicies(
						r.gradePolicyDtos,
						r.productGroupId || `new-${idx + 1}`
					),
				}));
			onPriceGroupChange(cleaned);
		},
		[onPriceGroupChange]
	);

	// 공통: 인덱스 기반으로 행 업데이트
	const updateRowByIndex = useCallback(
		(
			rowIndex: number,
			updater: (
				row: ProductWorkGradePolicyGroupDto
			) => ProductWorkGradePolicyGroupDto
		) => {
			const base: ProductWorkGradePolicyGroupDto[] = [...displayRows];
			base[rowIndex] = updater(base[rowIndex]);
			pushUp(base);
		},
		[displayRows, pushUp]
	);

	// 색상 변경
	const handleColorChange = (rowIndex: number, colorId: string) => {
		const selected = colorOptions.find((c) => c.colorId === colorId);
		updateRowByIndex(rowIndex, (row) => ({
			...row,
			colorId,
			colorName: selected?.colorName || "",
		}));
	};

	// 구매공임 / 비고
	const handleFieldChange = (
		rowIndex: number,
		field: "productPurchasePrice" | "note",
		value: string
	) => {
		updateRowByIndex(rowIndex, (row) => {
			if (field === "productPurchasePrice") {
				const onlyNum = value.replace(/[^0-9]/g, "");
				return {
					...row,
					productPurchasePrice: onlyNum ? parseInt(onlyNum) : 0,
				};
			}
			return { ...row, note: value };
		});
	};

	// 등급별 공임
	const handleLaborCostChange = (
		rowIndex: number,
		workGradePolicyId: string,
		value: string
	) => {
		const onlyNum = value.replace(/[^0-9]/g, "");
		const laborCost = onlyNum ? parseInt(onlyNum) : 0;

		updateRowByIndex(rowIndex, (row) => {
			const next = (row.gradePolicyDtos || []).map((p) =>
				p.workGradePolicyId === workGradePolicyId ? { ...p, laborCost } : p
			);
			return { ...row, gradePolicyDtos: next };
		});
	};

	const baseRowError = validationErrors["productWorkGradePolicyGroupDto[0]"];

	return (
		<div className="price-section">
			{showTitle && <h2>가격 정보</h2>}

			{/* 테이블 상단 에러 (필드별 문구는 숨기고 테두리/aria만 표시) */}
			{baseRowError && <div className="table-level-error">{baseRowError}</div>}

			<table className="price-table">
				<thead>
					<tr>
						<th>구분</th>
						<th>색상</th>
						<th>구매 공임</th>
						<th>1등급</th>
						<th>2등급</th>
						<th>3등급</th>
						<th>4등급</th>
						<th>비고</th>
					</tr>
				</thead>
				<tbody>
					{displayRows.map((group, index) => (
						<tr key={`${group.productGroupId || "new"}-${index}`}>
							{/* 구분 */}
							<td>
								<span className="fixed-text">
									{index === 0 && <span className="required-field">*</span>}
									{index === 0 ? "기본" : `추가${index}`}
								</span>
							</td>

							{/* 색상 */}
							<td>
								{editable ? (
									<select
										className={`editable-select color-select ${
											validationErrors[
												`productWorkGradePolicyGroupDto[${index}].colorId`
											]
												? "error"
												: ""
										}`}
										value={group.colorId || ""}
										onChange={(e) => handleColorChange(index, e.target.value)}
										aria-invalid={
											!!validationErrors[
												`productWorkGradePolicyGroupDto[${index}].colorId`
											]
										}
									>
										{!group.colorName && (
											<option value="">색상을 선택하세요</option>
										)}
										{group.colorName &&
											!colorOptions.some(
												(opt) => opt.colorId === group.colorId
											) && (
												<option value={group.colorId}>{group.colorName}</option>
											)}
										{colorOptions.map((c) => (
											<option key={c.colorId} value={c.colorId}>
												{c.colorName}
											</option>
										))}
									</select>
								) : (
									<span className="fixed-text">
										{group.colorName || "색상 없음"}
									</span>
								)}
							</td>

							{/* 구매 공임 */}
							<td>
								{editable ? (
									<input
										type="text"
										className={`editable-number table-input ${
											validationErrors[
												`productWorkGradePolicyGroupDto[${index}].productPurchasePrice`
											]
												? "error"
												: ""
										}`}
										value={group.productPurchasePrice.toString()}
										onChange={(e) =>
											handleFieldChange(
												index,
												"productPurchasePrice",
												e.target.value
											)
										}
										placeholder="0"
										aria-invalid={
											!!validationErrors[
												`productWorkGradePolicyGroupDto[${index}].productPurchasePrice`
											]
										}
									/>
								) : (
									<span className="fixed-text">
										{group.productPurchasePrice.toLocaleString()}
									</span>
								)}
							</td>

							{/* 1~4등급 공임 */}
							{GRADE_ORDER.map((grade, n) => {
								const policy = group.gradePolicyDtos.find(
									(p) => p.grade === grade
								);
								const idx = group.gradePolicyDtos.findIndex(
									(p) => p.grade === grade
								);
								const errKey = `productWorkGradePolicyGroupDto[${index}].gradePolicyDtos[${
									idx >= 0 ? idx : n
								}].laborCost`;
								const hasErr = !!validationErrors[errKey];

								return (
									<td key={grade}>
										{policy ? (
											editable ? (
												<input
													type="text"
													className={`editable-number table-input ${
														hasErr ? "error" : ""
													}`}
													value={policy.laborCost.toString()}
													onChange={(e) =>
														handleLaborCostChange(
															index,
															policy.workGradePolicyId,
															e.target.value
														)
													}
													placeholder="0"
													aria-invalid={hasErr}
												/>
											) : (
												<span className="fixed-text">
													{policy.laborCost.toLocaleString()}
												</span>
											)
										) : (
											<span className="grade-value">-</span>
										)}
									</td>
								);
							})}

							{/* 비고 */}
							<td>
								{editable ? (
									<input
										type="text"
										className="editable-text table-input"
										value={group.note || ""}
										onChange={(e) =>
											handleFieldChange(index, "note", e.target.value)
										}
										placeholder="비고 입력"
									/>
								) : (
									<span className="fixed-text">{group.note || ""}</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default PriceTable;

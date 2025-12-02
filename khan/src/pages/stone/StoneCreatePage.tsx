import React, { useState, useEffect } from "react";
import { stoneApi } from "../../../libs/api/stone";
import { stoneTypeApi } from "../../../libs/api/stoneType";
import { stoneShapeApi } from "../../../libs/api/stoneShape";
import type { StoneTypeDto } from "../../../src/types/stoneType";
import type { StoneShapeDto } from "../../../src/types/stoneShape";
import type {
	StoneCreateRequest,
	StoneWorkGradePolicyCreateDto,
} from "../../../src//types/stone";
import "../../styles/pages/stone/StoneCreatePage.css";

export interface StoneCreateFormRow {
	stoneTypeId: string;
	stoneShapeId: string;
	stoneSize: string;
	stoneName: string;
	note: string;
	weight: string;
	purchasePrice: string;
	grade_1: string;
	grade_2: string;
	grade_3: string;
	grade_4: string;
}

const WORK_GRADE_MAP: Record<1 | 2 | 3 | 4, string> = {
	1: "GRADE_1",
	2: "GRADE_2",
	3: "GRADE_3",
	4: "GRADE_4",
};

const makeEmptyRow = (): StoneCreateFormRow => ({
	stoneTypeId: "",
	stoneShapeId: "",
	stoneSize: "",
	stoneName: "",
	note: "",
	weight: "",
	purchasePrice: "",
	grade_1: "",
	grade_2: "",
	grade_3: "",
	grade_4: "",
});

const toNumberOrNull = (v: string): number | null => {
	if (v.trim() === "") return null;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
};

const StoneCreatePage: React.FC = () => {
	const [stoneTypes, setStoneTypes] = useState<StoneTypeDto[]>([]);
	const [stoneShapes, setStoneShapes] = useState<StoneShapeDto[]>([]);
	const [rows, setRows] = useState<StoneCreateFormRow[]>(() =>
		Array.from({ length: 20 }, () => makeEmptyRow())
	);
	const [checkingRows, setCheckingRows] = useState<Set<number>>(new Set());
	const [duplicateRows, setDuplicateRows] = useState<Set<number>>(new Set());
	const checkTimeouts = React.useRef<Map<number, number>>(new Map());

	// 드롭다운 데이터
	useEffect(() => {
		const loadData = async () => {
			const typesRes = await stoneTypeApi.getStoneTypes();
			const shapesRes = await stoneShapeApi.getStoneShapes();
			setStoneTypes(typesRes.data ?? []);
			setStoneShapes(shapesRes.data ?? []);
		};
		loadData();
	}, []);

	// 언마운트 시 타이머 정리
	useEffect(() => {
		const ref = checkTimeouts.current;
		return () => {
			ref.forEach((id) => clearTimeout(id));
			ref.clear();
		};
	}, []);

	// 스톤 이름 자동 생성
	const generateStoneName = (
		stoneTypeId: string,
		stoneShapeId: string,
		stoneSize: string
	): string => {
		const stoneType = stoneTypes.find((t) => t.stoneTypeId === stoneTypeId);
		const stoneShape = stoneShapes.find((s) => s.stoneShapeId === stoneShapeId);
		const typeName = stoneType?.stoneTypeName || "";
		const shapeName = stoneShape?.stoneShapeName || "";

		if (!typeName && !shapeName && !stoneSize) return "";
		const parts: string[] = [];
		if (typeName) parts.push(typeName);
		if (shapeName) parts.push(shapeName);
		if (stoneSize) parts.push(stoneSize);
		return parts.join("/");
	};

	// 전체 행에서 중복 검사 및 표시 업데이트
	const updateDuplicateDisplay = (allRows: StoneCreateFormRow[]) => {
		const duplicates = new Set<number>();
		const stoneNameMap = new Map<string, number[]>();

		// 스톤 이름별로 행 인덱스 수집
		allRows.forEach((row, index) => {
			if (
				row.stoneName.trim() &&
				row.stoneTypeId &&
				row.stoneShapeId &&
				row.stoneSize.trim()
			) {
				const stoneName = row.stoneName.trim();
				if (!stoneNameMap.has(stoneName)) {
					stoneNameMap.set(stoneName, []);
				}
				stoneNameMap.get(stoneName)!.push(index);
			}
		});

		// 중복된 스톤 이름의 행들을 duplicates에 추가
		stoneNameMap.forEach((indices) => {
			if (indices.length > 1) {
				indices.forEach((index) => duplicates.add(index));
			}
		});

		setDuplicateRows(duplicates);
	};

	// 로컬 중복 검사 (현재 입력된 행들 간의 중복)
	const checkLocalDuplicate = (
		targetStoneName: string,
		currentRowIndex: number,
		allRows: StoneCreateFormRow[]
	): boolean => {
		if (!targetStoneName.trim()) return false;

		// 현재 행보다 위쪽 행들에서 같은 스톤 이름이 있는지 확인
		for (let i = 0; i < currentRowIndex; i++) {
			const otherRow = allRows[i];
			if (
				otherRow.stoneName.trim() === targetStoneName.trim() &&
				otherRow.stoneTypeId &&
				otherRow.stoneShapeId &&
				otherRow.stoneSize.trim()
			) {
				return true; // 중복 발견
			}
		}
		return false;
	};

	// 중복 검사(서버 + 로컬)
	const checkStoneExists = async (
		stoneTypeId: string,
		stoneShapeId: string,
		stoneSize: string,
		rowIndex: number
	) => {
		if (!stoneTypeId || !stoneShapeId || !stoneSize) return;

		try {
			setCheckingRows((prev) => new Set([...prev, rowIndex]));

			const stoneType = stoneTypes.find((t) => t.stoneTypeId === stoneTypeId);
			const stoneShape = stoneShapes.find(
				(s) => s.stoneShapeId === stoneShapeId
			);
			if (!stoneType || !stoneShape) return;

			// 생성될 스톤 이름
			const generatedName = generateStoneName(
				stoneTypeId,
				stoneShapeId,
				stoneSize
			);

			// 1. 로컬 중복 검사 (현재 입력된 행들 간의 중복)
			const hasLocalDuplicate = checkLocalDuplicate(
				generatedName,
				rowIndex,
				rows
			);
			if (hasLocalDuplicate) {
				alert("이미 입력된 스톤 이름과 중복됩니다");
				setRows((prev) => {
					const next = [...prev];
					next[rowIndex] = makeEmptyRow();
					return next;
				});
				return;
			}

			// 2. 서버 중복 검사
			const response = await stoneApi.existStone(
				stoneType.stoneTypeName,
				stoneShape.stoneShapeName,
				stoneSize
			);

			if (response.success && response.data === true) {
				alert("서버에 이미 존재하는 값입니다");
				setRows((prev) => {
					const next = [...prev];
					next[rowIndex] = makeEmptyRow();
					return next;
				});
			}
		} catch (e) {
			console.error("스톤 중복 검사 오류:", e);
		} finally {
			setCheckingRows((prev) => {
				const ns = new Set(prev);
				ns.delete(rowIndex);
				return ns;
			});
		}
	};

	// 행 변경
	const handleChange = <K extends keyof StoneCreateFormRow>(
		index: number,
		field: K,
		value: StoneCreateFormRow[K]
	) => {
		setRows((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [field]: value };

			if (
				field === "stoneTypeId" ||
				field === "stoneShapeId" ||
				field === "stoneSize"
			) {
				const row = { ...next[index], [field]: value };
				row.stoneName = generateStoneName(
					row.stoneTypeId,
					row.stoneShapeId,
					row.stoneSize
				);
				next[index] = row;

				// 중복 표시 업데이트 (변경된 행 기준)
				updateDuplicateDisplay(next);

				if (row.stoneTypeId && row.stoneShapeId && row.stoneSize.trim()) {
					const existing = checkTimeouts.current.get(index);
					if (existing) clearTimeout(existing);

					const timeoutId = setTimeout(() => {
						checkStoneExists(
							row.stoneTypeId,
							row.stoneShapeId,
							row.stoneSize,
							index
						);
						checkTimeouts.current.delete(index);
					}, 500) as unknown as number;

					checkTimeouts.current.set(index, timeoutId);
				}
			}

			return next;
		});
	};

	// grade1~4 → 정책 배열
	const buildPolicies = (
		row: StoneCreateFormRow
	): StoneWorkGradePolicyCreateDto[] => {
		const entries: Array<[1 | 2 | 3 | 4, string]> = [
			[1, row.grade_1],
			[2, row.grade_2],
			[3, row.grade_3],
			[4, row.grade_4],
		];
		return entries
			.filter(([, v]) => v.trim() !== "")
			.map(([gradeNo, v]) => ({
				grade: WORK_GRADE_MAP[gradeNo],
				laborCost: Number(v),
			}));
	};

	// 입력된 행만 수집
	const collectFilledRows = (
		list: StoneCreateFormRow[]
	): StoneCreateFormRow[] =>
		list.filter(
			(r) =>
				r.stoneTypeId &&
				r.stoneShapeId &&
				r.stoneSize.trim() !== "" &&
				r.stoneName.trim() !== ""
		);

	// 최종 중복 검사 (저장 전)
	const validateFinalDuplicates = (
		filledRows: StoneCreateFormRow[]
	): string | null => {
		const stoneNames = new Set<string>();

		for (let i = 0; i < filledRows.length; i++) {
			const stoneName = filledRows[i].stoneName.trim();
			if (stoneNames.has(stoneName)) {
				return `${i + 1}번째 행의 스톤 이름 "${stoneName}"이 중복됩니다.`;
			}
			stoneNames.add(stoneName);
		}

		return null;
	};

	// 저장
	const handleSave = async () => {
		const filled = collectFilledRows(rows);
		if (filled.length === 0) {
			alert("입력된 행이 없습니다.");
			return;
		}

		// 현재 중복된 행이 있는지 확인
		if (duplicateRows.size > 0) {
			alert("중복된 스톤 이름이 있습니다. 중복을 해결한 후 저장해주세요.");
			return;
		}

		// 최종 중복 검사
		const duplicateError = validateFinalDuplicates(filled);
		if (duplicateError) {
			alert(duplicateError);
			return;
		}

		try {
			const payload: StoneCreateRequest[] = filled.map((r) => ({
				stoneName: r.stoneName,
				stoneNote: r.note || null,
				stoneWeight: r.weight?.trim() ? r.weight.trim() : "0",
				stonePurchasePrice: toNumberOrNull(r.purchasePrice),
				stoneWorkGradePolicyDto: buildPolicies(r),
			}));

			// 1건이면 단건, 2건 이상이면 벌크
			if (payload.length === 1) {
				await stoneApi.createStone(payload[0]);
			} else {
				await stoneApi.createBulkStones(payload);
			}

			alert(`총 ${payload.length}건 저장 완료`);
			window.opener?.postMessage(
				{ type: "STONE_CREATED" },
				window.location.origin
			);
			window.close();
		} catch (error) {
			console.error("저장 중 오류:", error);
			alert(
				"저장 중 오류가 발생했습니다. 중복된 데이터가 있는지 확인해주세요."
			);
		}
	};

	return (
		<div className="stone-create-page">
			<div className="stone-create-table-wrap">
				<table className="stone-create-table">
					<thead>
						<tr>
							<th className="no-th">No</th>
							<th className="stone-th">스톤종류</th>
							<th className="stone-th">스톤모양</th>
							<th className="stone-th">스톤사이즈</th>
							<th className="note-th">스톤 이름</th>
							<th className="note-th">비고</th>
							<th>중량(g)</th>
							<th>구매단가</th>
							<th>1등급</th>
							<th>2등급</th>
							<th>3등급</th>
							<th>4등급</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row, idx) => (
							<tr
								key={idx}
								style={{
									backgroundColor: duplicateRows.has(idx)
										? "#ffebee"
										: "transparent",
									border: duplicateRows.has(idx) ? "1px solid #f44336" : "none",
								}}
							>
								<td>{idx + 1}</td>
								<td>
									<select
										value={row.stoneTypeId}
										onChange={(e) =>
											handleChange(idx, "stoneTypeId", e.target.value)
										}
									>
										<option value="">선택</option>
										{stoneTypes.map((t) => (
											<option key={t.stoneTypeId} value={t.stoneTypeId}>
												{t.stoneTypeName}
											</option>
										))}
									</select>
								</td>
								<td>
									<select
										value={row.stoneShapeId}
										onChange={(e) =>
											handleChange(idx, "stoneShapeId", e.target.value)
										}
									>
										<option value="">선택</option>
										{stoneShapes.map((s) => (
											<option key={s.stoneShapeId} value={s.stoneShapeId}>
												{s.stoneShapeName}
											</option>
										))}
									</select>
								</td>
								<td>
									<input
										type="text"
										value={row.stoneSize}
										onChange={(e) =>
											handleChange(idx, "stoneSize", e.target.value)
										}
										style={{
											backgroundColor: checkingRows.has(idx)
												? "#f0f8ff"
												: "white",
											border: checkingRows.has(idx)
												? "1px solid #007bff"
												: "1px solid #ddd",
										}}
										placeholder={checkingRows.has(idx) ? "중복 검사 중..." : ""}
									/>
								</td>
								<td>
									<input
										type="text"
										value={row.stoneName}
										readOnly
										className="readonly-stone-name"
										style={{
											backgroundColor: duplicateRows.has(idx)
												? "#ffcdd2"
												: "#f5f5f5",
											border: duplicateRows.has(idx)
												? "1px solid #f44336"
												: "1px solid #ddd",
										}}
										title={
											duplicateRows.has(idx) ? "중복된 스톤 이름입니다" : ""
										}
									/>
								</td>
								<td>
									<input
										type="text"
										value={row.note}
										onChange={(e) => handleChange(idx, "note", e.target.value)}
									/>
								</td>
								<td>
									<input
										type="number"
										value={row.weight}
										onChange={(e) =>
											handleChange(idx, "weight", e.target.value)
										}
									/>
								</td>
								<td>
									<input
										type="number"
										value={row.purchasePrice}
										onChange={(e) =>
											handleChange(idx, "purchasePrice", e.target.value)
										}
									/>
								</td>
								<td>
									<input
										type="number"
										value={row.grade_1}
										onChange={(e) =>
											handleChange(idx, "grade_1", e.target.value)
										}
									/>
								</td>
								<td>
									<input
										type="number"
										value={row.grade_2}
										onChange={(e) =>
											handleChange(idx, "grade_2", e.target.value)
										}
									/>
								</td>
								<td>
									<input
										type="number"
										value={row.grade_3}
										onChange={(e) =>
											handleChange(idx, "grade_3", e.target.value)
										}
									/>
								</td>
								<td>
									<input
										type="number"
										value={row.grade_4}
										onChange={(e) =>
											handleChange(idx, "grade_4", e.target.value)
										}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="stone-create-actions">
				<button className="btn-cancel" onClick={() => window.close()}>
					닫기
				</button>
				<button className="btn-submit" onClick={handleSave}>
					등록
				</button>
			</div>
		</div>
	);
};

export default StoneCreatePage;

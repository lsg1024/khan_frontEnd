import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { stoneApi } from "../../../libs/api/stone";
import { stoneTypeApi } from "../../../libs/api/stoneType";
import { stoneShapeApi } from "../../../libs/api/stoneShape";
import type { StoneTypeDto } from "../../../src/types/stoneType";
import type { StoneShapeDto } from "../../../src/types/stoneShape";
import type {
	StoneSearchDto,
	StoneWorkGradePolicyDto,
} from "../../../src/types/stone";
import "../../styles/pages/stone/StoneEditPage.css";

const StoneEditPage = () => {
	const { stoneId } = useParams<{ stoneId: string }>();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [stoneTypes, setStoneTypes] = useState<StoneTypeDto[]>([]);
	const [stoneShapes, setStoneShapes] = useState<StoneShapeDto[]>([]);

	// 스톤 정보
	const [stoneName, setStoneName] = useState("");
	const [stoneNote, setStoneNote] = useState("");
	const [stoneWeight, setStoneWeight] = useState("");
	const [stonePurchasePrice, setStonePurchasePrice] = useState("");
	const [gradePolicies, setGradePolicies] = useState<StoneWorkGradePolicyDto[]>(
		[]
	);

	// 스톤 이름 파싱 (종류/모양/사이즈)
	const [stoneTypeName, setStoneTypeName] = useState("");
	const [stoneShapeName, setStoneShapeName] = useState("");
	const [stoneSize, setStoneSize] = useState("");

	useEffect(() => {
		loadDropdowns();
		if (stoneId) {
			loadStoneDetail(stoneId);
		}
	}, [stoneId]);

	const loadDropdowns = async () => {
		try {
			const [typesRes, shapesRes] = await Promise.all([
				stoneTypeApi.getStoneTypes(),
				stoneShapeApi.getStoneShapes(),
			]);
			setStoneTypes(typesRes.data ?? []);
			setStoneShapes(shapesRes.data ?? []);
		} catch (error) {
			console.error("드롭다운 데이터 로드 실패:", error);
		}
	};

	const loadStoneDetail = async (id: string) => {
		try {
			setLoading(true);
			const response = await stoneApi.getStone(id);

			if (response.success && response.data) {
				const stone = response.data as StoneSearchDto;
				setStoneName(stone.stoneName || "");
				setStoneNote(stone.stoneNote || "");
				setStoneWeight(stone.stoneWeight || "");
				setStonePurchasePrice(stone.stonePurchasePrice?.toString() || "");
				setGradePolicies(stone.stoneWorkGradePolicyDto || []);

				const parts = stone.stoneName.split("/");
				if (parts.length === 3) {
					setStoneTypeName(parts[0].trim());
					setStoneShapeName(parts[1].trim());
					setStoneSize(parts[2].trim());
				}
			}
		} catch (error) {
			console.error("스톤 정보 로드 실패:", error);
			alert("스톤 정보를 불러오는데 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	const handleGradeChange = (grade: string, value: string) => {
		setGradePolicies((prev) => {
			const existing = prev.find((p) => p.grade === grade);
			if (existing) {
				return prev.map((p) =>
					p.grade === grade ? { ...p, laborCost: Number(value) || 0 } : p
				);
			} else {
				return [
					...prev,
					{
						workGradePolicyId: "",
						grade,
						laborCost: Number(value) || 0,
					},
				];
			}
		});
	};

	const getGradeValue = (grade: string): string => {
		const policy = gradePolicies.find((p) => p.grade === grade);
		return policy ? String(policy.laborCost) : "";
	};

	const handleSave = async () => {
		if (!stoneId) return;

		if (!stoneName.trim()) {
			alert("스톤 이름은 필수입니다.");
			return;
		}

		try {
			setSaving(true);

			const payload = {
				stoneName: stoneName.trim(),
				stoneNote: stoneNote.trim() || null,
				stoneWeight: stoneWeight.trim() || "0",
				stonePurchasePrice: stonePurchasePrice
					? Number(stonePurchasePrice)
					: null,
				stoneWorkGradePolicyDto: gradePolicies.map((p) => ({
					grade: p.grade,
					laborCost: p.laborCost,
				})),
			};

			const response = await stoneApi.updateStone(stoneId, payload);

			if (response.success) {
				alert("스톤 정보가 수정되었습니다.");
				window.opener?.postMessage(
					{ type: "STONE_UPDATED" },
					window.location.origin
				);
				window.close();
			} else {
				alert("스톤 수정에 실패했습니다.");
			}
		} catch (error) {
			console.error("스톤 수정 오류:", error);
			alert("스톤 수정 중 오류가 발생했습니다.");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!stoneId) return;

		if (!window.confirm("정말로 이 스톤을 삭제하시겠습니까?")) {
			return;
		}

		try {
			setSaving(true);
			const response = await stoneApi.deleteStone(stoneId);

			if (response.success) {
				alert("스톤이 삭제되었습니다.");
				// 부모 창에 업데이트 알림
				window.opener?.postMessage(
					{ type: "STONE_UPDATED" },
					window.location.origin
				);
				window.close();
			} else {
				alert("스톤 삭제에 실패했습니다.");
			}
		} catch (error) {
			console.error("스톤 삭제 오류:", error);
			alert("스톤 삭제 중 오류가 발생했습니다.");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="stone-edit-page">
				<div className="loading-container">
					<div className="spinner"></div>
					<p>스톤 정보를 불러오는 중...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="stone-edit-page">
			<div className="stone-edit-section">
				<div className="stone-edit-table-wrap">
					<table className="stone-edit-table">
						<thead>
							<tr>
								<th>스톤 종류</th>
								<th>스톤 모양</th>
								<th>스톤 사이즈</th>
								<th>스톤 이름 *</th>
								<th>비고</th>
								<th>중량(g)</th>
								<th>구매단가</th>
								<th>1등급</th>
								<th>2등급</th>
								<th>3등급</th>
								<th>4등급</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<select
										value={stoneTypeName}
										onChange={(e) => {
											setStoneTypeName(e.target.value);
											// 스톤 이름 업데이트
											const newName = `${e.target.value}/${stoneShapeName}/${stoneSize}`;
											setStoneName(newName);
										}}
									>
										<option value="">선택</option>
										{stoneTypes.map((t) => (
											<option key={t.stoneTypeId} value={t.stoneTypeName}>
												{t.stoneTypeName}
											</option>
										))}
									</select>
								</td>
								<td>
									<select
										value={stoneShapeName}
										onChange={(e) => {
											setStoneShapeName(e.target.value);
											// 스톤 이름 업데이트
											const newName = `${stoneTypeName}/${e.target.value}/${stoneSize}`;
											setStoneName(newName);
										}}
									>
										<option value="">선택</option>
										{stoneShapes.map((s) => (
											<option key={s.stoneShapeId} value={s.stoneShapeName}>
												{s.stoneShapeName}
											</option>
										))}
									</select>
								</td>
								<td>
									<input
										type="text"
										value={stoneSize}
										onChange={(e) => {
											setStoneSize(e.target.value);
											// 스톤 이름 업데이트
											const newName = `${stoneTypeName}/${stoneShapeName}/${e.target.value}`;
											setStoneName(newName);
										}}
										placeholder="사이즈"
									/>
								</td>
								<td>
									<input
										type="text"
										value={stoneName}
										onChange={(e) => setStoneName(e.target.value)}
										placeholder="스톤 이름"
										className="stone-name-input"
										required
									/>
								</td>
								<td>
									<input
										type="text"
										value={stoneNote}
										onChange={(e) => setStoneNote(e.target.value)}
										placeholder="비고"
									/>
								</td>
								<td>
									<input
										type="number"
										step="0.01"
										value={stoneWeight}
										onChange={(e) => setStoneWeight(e.target.value)}
										placeholder="중량"
									/>
								</td>
								<td>
									<input
										type="number"
										value={stonePurchasePrice}
										onChange={(e) => setStonePurchasePrice(e.target.value)}
										placeholder="구매단가"
									/>
								</td>
								<td>
									<input
										type="number"
										value={getGradeValue("GRADE_1")}
										onChange={(e) =>
											handleGradeChange("GRADE_1", e.target.value)
										}
										placeholder="1등급"
									/>
								</td>
								<td>
									<input
										type="number"
										value={getGradeValue("GRADE_2")}
										onChange={(e) =>
											handleGradeChange("GRADE_2", e.target.value)
										}
										placeholder="2등급"
									/>
								</td>
								<td>
									<input
										type="number"
										value={getGradeValue("GRADE_3")}
										onChange={(e) =>
											handleGradeChange("GRADE_3", e.target.value)
										}
										placeholder="3등급"
									/>
								</td>
								<td>
									<input
										type="number"
										value={getGradeValue("GRADE_4")}
										onChange={(e) =>
											handleGradeChange("GRADE_4", e.target.value)
										}
										placeholder="4등급"
									/>
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div className="stone-edit-actions">
					<button
						className="btn-cancel"
						onClick={() => window.close()}
						disabled={saving}
					>
						닫기
					</button>
					<button
						className="delete-btn"
						onClick={handleDelete}
						disabled={saving}
					>
						{saving ? "처리 중..." : "삭제"}
					</button>
					<button className="btn-submit" onClick={handleSave} disabled={saving}>
						{saving ? "저장 중..." : "저장"}
					</button>
				</div>
			</div>

			{saving && (
				<div className="loading-overlay">
					<div className="loading-state">
						<div className="spinner"></div>
					</div>
				</div>
			)}
		</div>
	);
};

export default StoneEditPage;

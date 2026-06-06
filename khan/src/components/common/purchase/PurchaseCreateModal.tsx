import { useRef, useState } from "react";
import { factoryApi } from "../../../../libs/api/factoryApi";
import { isApiSuccess } from "../../../../libs/api/config";
import type {
	FactorySearchDto,
	PurchaseCreateLine,
} from "../../../types/factoryDto";
import { calculatePureGoldWeightWithHarry } from "../../../utils/goldUtils";
import { getLocalDate } from "../../../utils/dateUtils";
import "../../../styles/components/purchase/PurchaseCreateModal.css";

type TradeTypeLabel = "매입" | "결제" | "반품" | "DC";
type MaterialType = "14K" | "18K" | "24K";

// 표시명 → BE enum name
const TRADE_TYPE_ENUM: Record<TradeTypeLabel, string> = {
	매입: "PURCHASE",
	결제: "PAYMENT",
	반품: "RETURN",
	DC: "DISCOUNT",
};

const TRADE_TYPES: TradeTypeLabel[] = ["매입", "결제", "반품", "DC"];
const MATERIALS: MaterialType[] = ["14K", "18K", "24K"];
const DEFAULT_HARRY = "1.10";

interface PurchaseRow {
	id: string;
	factoryId: string; // accountId
	factoryName: string;
	factoryQuery: string;
	tradeType: TradeTypeLabel;
	material: MaterialType;
	goldWeight: string; // 금중량(실중량) 입력값
	harry: string;
	money: string;
	note: string;
	options: FactorySearchDto[];
	showOptions: boolean;
}

interface PurchaseCreateModalProps {
	onClose: () => void;
	onCreated: () => void;
}

/** 순금 환산: 금중량 → 재질/해리 적용 순금(g) */
const pureGoldOf = (row: PurchaseRow): number =>
	calculatePureGoldWeightWithHarry(
		row.goldWeight || 0,
		row.material,
		row.harry || DEFAULT_HARRY
	);

const PurchaseCreateModal: React.FC<PurchaseCreateModalProps> = ({
	onClose,
	onCreated,
}) => {
	const idSeq = useRef(0);
	const newRow = (): PurchaseRow => ({
		id: `row-${idSeq.current++}`,
		factoryId: "",
		factoryName: "",
		factoryQuery: "",
		tradeType: "매입",
		material: "18K",
		goldWeight: "",
		harry: DEFAULT_HARRY,
		money: "",
		note: "",
		options: [],
		showOptions: false,
	});

	const [registerDate, setRegisterDate] = useState<string>(getLocalDate());
	const [rows, setRows] = useState<PurchaseRow[]>(() =>
		Array.from({ length: 3 }, newRow)
	);
	const [submitting, setSubmitting] = useState(false);

	const updateRow = (id: string, patch: Partial<PurchaseRow>) => {
		setRows((prev) =>
			prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
		);
	};

	const addRow = () => setRows((prev) => [...prev, newRow()]);
	const removeRow = (id: string) =>
		setRows((prev) =>
			prev.length > 1 ? prev.filter((r) => r.id !== id) : prev
		);

	// 제조사(매입처) 검색
	const searchFactory = async (id: string, query: string) => {
		if (!query.trim()) return;
		try {
			const res = await factoryApi.getFactories(query.trim(), 1, false, 20);
			const list = (isApiSuccess(res) && res.data?.content) || [];
			updateRow(id, { options: list, showOptions: true });
		} catch {
			updateRow(id, { options: [], showOptions: true });
		}
	};

	const selectFactory = (id: string, f: FactorySearchDto) => {
		updateRow(id, {
			factoryId: f.factoryId != null ? String(f.factoryId) : "",
			factoryName: f.factoryName,
			factoryQuery: f.factoryName,
			harry: f.goldHarryLoss || DEFAULT_HARRY,
			options: [],
			showOptions: false,
		});
	};

	// 합계
	const totals = rows.reduce(
		(acc, r) => {
			acc.pureGold += pureGoldOf(r);
			acc.money += Number(r.money) || 0;
			return acc;
		},
		{ pureGold: 0, money: 0 }
	);

	const handleSubmit = async () => {
		const validRows = rows.filter(
			(r) => r.factoryId && (pureGoldOf(r) > 0 || (Number(r.money) || 0) > 0)
		);

		if (validRows.length === 0) {
			alert("매입처와 중량(또는 금액)을 입력해주세요.");
			return;
		}

		const lines: PurchaseCreateLine[] = validRows.map((r) => ({
			accountId: r.factoryId,
			transactionType: TRADE_TYPE_ENUM[r.tradeType],
			material: r.material,
			goldAmount: pureGoldOf(r),
			moneyAmount: Number(r.money) || 0,
			transactionNote: r.note || "",
			transactionDate: `${registerDate}T00:00:00`,
		}));

		try {
			setSubmitting(true);
			const res = await factoryApi.createFactoryPurchase(lines);
			if (isApiSuccess(res)) {
				alert("매입이 등록되었습니다.");
				onCreated();
				onClose();
			} else {
				alert(res.message || "매입 등록에 실패했습니다.");
			}
		} catch (err) {
			alert(
				err instanceof Error ? err.message : "매입 등록 중 오류가 발생했습니다."
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="purchase-modal-overlay" onClick={onClose}>
			<div
				className="purchase-modal"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="purchase-modal-header">
					<h2>매입 등록</h2>
					<button
						type="button"
						className="purchase-modal-close"
						onClick={onClose}
						aria-label="닫기"
					>
						×
					</button>
				</div>

				<div className="purchase-modal-toolbar">
					<label>
						등록일
						<input
							type="date"
							value={registerDate}
							onChange={(e) => setRegisterDate(e.target.value)}
						/>
					</label>
					<button type="button" className="pm-btn pm-btn-add" onClick={addRow}>
						+ 행 추가
					</button>
				</div>

				<div className="purchase-modal-body">
					<table className="purchase-create-table">
						<thead>
							<tr>
								<th>No</th>
								<th>삭제</th>
								<th>매입처 *</th>
								<th>구분</th>
								<th>재질</th>
								<th>금중량(g)</th>
								<th>해리</th>
								<th>순금환산(g)</th>
								<th>금액(원)</th>
								<th>비고</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((r, idx) => (
								<tr key={r.id}>
									<td>{idx + 1}</td>
									<td>
										<button
											type="button"
											className="pm-btn pm-btn-remove"
											onClick={() => removeRow(r.id)}
											disabled={rows.length <= 1}
										>
											✕
										</button>
									</td>
									<td className="pm-factory-cell">
										<input
											type="text"
											value={r.factoryQuery}
											placeholder="제조사 검색"
											onChange={(e) =>
												updateRow(r.id, {
													factoryQuery: e.target.value,
													factoryId: "",
												})
											}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													searchFactory(r.id, r.factoryQuery);
												}
											}}
										/>
										<button
											type="button"
											className="pm-btn pm-btn-search"
											onClick={() => searchFactory(r.id, r.factoryQuery)}
										>
											🔍
										</button>
										{r.showOptions && (
											<ul className="pm-factory-dropdown">
												{r.options.length === 0 ? (
													<li className="pm-empty">검색 결과 없음</li>
												) : (
													r.options.map((f) => (
														<li
															key={f.factoryId}
															onClick={() => selectFactory(r.id, f)}
														>
															{f.factoryName}
															<span className="pm-harry">
																해리 {f.goldHarryLoss}
															</span>
														</li>
													))
												)}
											</ul>
										)}
									</td>
									<td>
										<select
											value={r.tradeType}
											onChange={(e) =>
												updateRow(r.id, {
													tradeType: e.target.value as TradeTypeLabel,
												})
											}
										>
											{TRADE_TYPES.map((t) => (
												<option key={t} value={t}>
													{t}
												</option>
											))}
										</select>
									</td>
									<td>
										<select
											value={r.material}
											onChange={(e) =>
												updateRow(r.id, {
													material: e.target.value as MaterialType,
												})
											}
										>
											{MATERIALS.map((m) => (
												<option key={m} value={m}>
													{m}
												</option>
											))}
										</select>
									</td>
									<td>
										<input
											type="number"
											className="pm-num"
											value={r.goldWeight}
											min="0"
											step="0.001"
											onChange={(e) =>
												updateRow(r.id, { goldWeight: e.target.value })
											}
										/>
									</td>
									<td>
										<input
											type="number"
											className="pm-num pm-harry-input"
											value={r.harry}
											min="0"
											step="0.01"
											onChange={(e) =>
												updateRow(r.id, { harry: e.target.value })
											}
										/>
									</td>
									<td className="pm-pure-gold">
										{pureGoldOf(r).toFixed(3)}
									</td>
									<td>
										<input
											type="number"
											className="pm-num"
											value={r.money}
											min="0"
											step="1"
											onChange={(e) =>
												updateRow(r.id, { money: e.target.value })
											}
										/>
									</td>
									<td>
										<input
											type="text"
											value={r.note}
											onChange={(e) =>
												updateRow(r.id, { note: e.target.value })
											}
										/>
									</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr>
								<td colSpan={7} className="pm-total-label">
									합계
								</td>
								<td className="pm-pure-gold">
									{totals.pureGold.toFixed(3)}
								</td>
								<td className="pm-total-money">
									{totals.money.toLocaleString()}
								</td>
								<td></td>
							</tr>
						</tfoot>
					</table>
				</div>

				<div className="purchase-modal-footer">
					<button
						type="button"
						className="pm-btn pm-btn-submit"
						onClick={handleSubmit}
						disabled={submitting}
					>
						{submitting ? "등록 중..." : "등록"}
					</button>
					<button
						type="button"
						className="pm-btn pm-btn-cancel"
						onClick={onClose}
						disabled={submitting}
					>
						닫기
					</button>
				</div>
			</div>
		</div>
	);
};

export default PurchaseCreateModal;

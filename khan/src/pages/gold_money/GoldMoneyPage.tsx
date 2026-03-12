import { useState, useEffect } from "react";
import { ledgerApi } from "../../../libs/api/ledgerApi";
import type {
	LedgerEntry,
	LedgerBalance,
	LedgerCreateRequest,
	LedgerUpdateRequest,
} from "../../../libs/api/ledgerApi";
import { isApiSuccess } from "../../../libs/api/config";
import { useErrorHandler } from "../../utils/errorHandler";
import Pagination from "../../components/common/Pagination";
import "../../styles/pages/gold_money/GoldMoneyPage.css";

type AssetType = "GOLD" | "MONEY";
type TransactionType = "INCOME" | "EXPENSE";

interface ModalForm {
	ledgerDate: string;
	assetType: AssetType;
	transactionType: TransactionType;
	goldAmount: string;
	moneyAmount: string;
	description: string;
}

const initialForm: ModalForm = {
	ledgerDate: new Date().toISOString().slice(0, 10),
	assetType: "GOLD",
	transactionType: "INCOME",
	goldAmount: "",
	moneyAmount: "",
	description: "",
};

const formatGold = (value: number | null) => {
	if (value == null || value === 0) return "-";
	return `${value.toFixed(3)}g`;
};

const formatMoney = (value: number | null) => {
	if (value == null || value === 0) return "-";
	return `${value.toLocaleString()}원`;
};

export const GoldMoneyPage = () => {
	const { handleError } = useErrorHandler();
	const [entries, setEntries] = useState<LedgerEntry[]>([]);
	const [balance, setBalance] = useState<LedgerBalance>({
		totalGold: 0,
		totalMoney: 0,
	});
	const [loading, setLoading] = useState(false);

	// 페이지
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const size = 20;

	// 필터
	const [filterAssetType, setFilterAssetType] = useState<AssetType | "">("");
	const today = new Date().toISOString().slice(0, 10);
	const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
		.toISOString()
		.slice(0, 10);
	const [startDate, setStartDate] = useState(monthAgo);
	const [endDate, setEndDate] = useState(today);

	// 모달
	const [showModal, setShowModal] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [form, setForm] = useState<ModalForm>(initialForm);

	const loadData = async (page: number) => {
		setLoading(true);
		try {
			const [listRes, balanceRes] = await Promise.all([
				ledgerApi.getLedgerList(
					startDate,
					endDate,
					page,
					size,
					filterAssetType || undefined
				),
				ledgerApi.getBalance(),
			]);

			if (isApiSuccess(listRes) && listRes.data) {
				const data = listRes.data;
				setEntries(data.content || []);
				const pageInfo = data.page;
				setCurrentPage((pageInfo?.number ?? page - 1) + 1);
				setTotalPages(pageInfo?.totalPages ?? 1);
				setTotalElements(pageInfo?.totalElements ?? 0);
			} else {
				setEntries([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			}

			if (isApiSuccess(balanceRes) && balanceRes.data) {
				setBalance(balanceRes.data);
			}
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData(1);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSearch = () => {
		loadData(1);
	};

	const handlePageChange = (page: number) => {
		loadData(page);
	};

	// 등록 모달
	const openCreateModal = () => {
		setEditingId(null);
		setForm(initialForm);
		setShowModal(true);
	};

	// 수정 모달
	const openEditModal = (entry: LedgerEntry) => {
		setEditingId(entry.ledgerId);
		setForm({
			ledgerDate: entry.ledgerDate,
			assetType: entry.assetType,
			transactionType: entry.transactionType,
			goldAmount: entry.goldAmount != null ? String(entry.goldAmount) : "",
			moneyAmount: entry.moneyAmount != null ? String(entry.moneyAmount) : "",
			description: entry.description || "",
		});
		setShowModal(true);
	};

	const handleSubmit = async () => {
		if (!form.ledgerDate) {
			alert("날짜를 입력해주세요.");
			return;
		}

		if (form.assetType === "GOLD" && !form.goldAmount) {
			alert("금 수량을 입력해주세요.");
			return;
		}

		if (form.assetType === "MONEY" && !form.moneyAmount) {
			alert("현금 금액을 입력해주세요.");
			return;
		}

		try {
			if (editingId) {
				const data: LedgerUpdateRequest = {
					ledgerDate: form.ledgerDate,
					transactionType: form.transactionType,
					goldAmount:
						form.assetType === "GOLD" ? parseFloat(form.goldAmount) : null,
					moneyAmount:
						form.assetType === "MONEY" ? parseInt(form.moneyAmount) : null,
					description: form.description || undefined,
				};
				const res = await ledgerApi.updateLedger(editingId, data);
				if (!isApiSuccess(res)) {
					handleError(res.message);
					return;
				}
			} else {
				const data: LedgerCreateRequest = {
					ledgerDate: form.ledgerDate,
					assetType: form.assetType,
					transactionType: form.transactionType,
					goldAmount:
						form.assetType === "GOLD" ? parseFloat(form.goldAmount) : null,
					moneyAmount:
						form.assetType === "MONEY" ? parseInt(form.moneyAmount) : null,
					description: form.description || undefined,
				};
				const res = await ledgerApi.createLedger(data);
				if (!isApiSuccess(res)) {
					handleError(res.message);
					return;
				}
			}

			setShowModal(false);
			loadData(editingId ? currentPage : 1);
		} catch (err) {
			handleError(err);
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("정말 삭제하시겠습니까?")) return;

		try {
			const res = await ledgerApi.deleteLedger(id);
			if (!isApiSuccess(res)) {
				handleError(res.message);
				return;
			}
			loadData(currentPage);
		} catch (err) {
			handleError(err);
		}
	};

	return (
		<div className="page">
			<div className="gold-money-page">
				{/* 잔액 카드 */}
				<div className="balance-cards">
					<div className="balance-card">
						<span className="balance-label">보유 금 (총합)</span>
						<span className="balance-value gold">
							{balance.totalGold != null
								? `${balance.totalGold.toFixed(3)}g`
								: "0.000g"}
						</span>
					</div>
					<div className="balance-card">
						<span className="balance-label">보유 현금 (총합)</span>
						<span className="balance-value money">
							{balance.totalMoney != null
								? `${balance.totalMoney.toLocaleString()}원`
								: "0원"}
						</span>
					</div>
				</div>

				{/* 필터 */}
				<div className="filter-section">
					<select
						value={filterAssetType}
						onChange={(e) =>
							setFilterAssetType(e.target.value as AssetType | "")
						}
					>
						<option value="">전체</option>
						<option value="GOLD">금</option>
						<option value="MONEY">현금</option>
					</select>
					<input
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
					/>
					<span>~</span>
					<input
						type="date"
						value={endDate}
						onChange={(e) => setEndDate(e.target.value)}
					/>
					<button
						className="filter-btn"
						onClick={handleSearch}
						disabled={loading}
					>
						검색
					</button>
					<button
						className="filter-btn add-btn"
						onClick={openCreateModal}
					>
						+ 등록
					</button>
				</div>

				{/* 테이블 */}
				<div className="ledger-table-container">
					{loading ? (
						<div className="loading-state">
							<div className="spinner" />
							<p>데이터를 불러오는 중...</p>
						</div>
					) : entries.length === 0 ? (
						<div className="empty-state">
							<p>조회된 내역이 없습니다.</p>
						</div>
					) : (
						<table className="ledger-table">
							<thead>
								<tr>
									<th>날짜</th>
									<th>유형</th>
									<th>입/출</th>
									<th>금(g)</th>
									<th>현금(원)</th>
									<th>메모</th>
									<th>관리</th>
								</tr>
							</thead>
							<tbody>
								{entries.map((entry) => (
									<tr key={entry.ledgerId}>
										<td>{entry.ledgerDate}</td>
										<td>
											<span
												className={`type-badge ${
													entry.assetType === "GOLD"
														? "asset-gold"
														: "asset-money"
												}`}
											>
												{entry.assetType === "GOLD" ? "금" : "현금"}
											</span>
										</td>
										<td>
											<span
												className={`type-badge ${
													entry.transactionType === "INCOME"
														? "income"
														: "expense"
												}`}
											>
												{entry.transactionType === "INCOME"
													? "입금"
													: "출금"}
											</span>
										</td>
										<td className="amount-cell gold">
											{formatGold(entry.goldAmount)}
										</td>
										<td className="amount-cell money">
											{formatMoney(entry.moneyAmount)}
										</td>
										<td className="desc-cell">
											{entry.description || "-"}
										</td>
										<td>
											<button
												className="action-btn edit"
												onClick={() => openEditModal(entry)}
											>
												수정
											</button>
											<button
												className="action-btn delete"
												onClick={() => handleDelete(entry.ledgerId)}
											>
												삭제
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>

				{/* 페이지네이션 */}
				{entries.length > 0 && (
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={handlePageChange}
					/>
				)}

				{/* 등록/수정 모달 */}
				{showModal && (
					<div
						className="modal-overlay"
						onClick={() => setShowModal(false)}
					>
						<div
							className="modal-content"
							onClick={(e) => e.stopPropagation()}
						>
							<h3>{editingId ? "입출금 수정" : "입출금 등록"}</h3>

							<div className="form-group">
								<label>날짜</label>
								<input
									type="date"
									value={form.ledgerDate}
									onChange={(e) =>
										setForm({ ...form, ledgerDate: e.target.value })
									}
								/>
							</div>

							{!editingId && (
								<div className="form-group">
									<label>자산 유형</label>
									<select
										value={form.assetType}
										onChange={(e) =>
											setForm({
												...form,
												assetType: e.target.value as AssetType,
											})
										}
									>
										<option value="GOLD">금</option>
										<option value="MONEY">현금</option>
									</select>
								</div>
							)}

							<div className="form-group">
								<label>거래 유형</label>
								<select
									value={form.transactionType}
									onChange={(e) =>
										setForm({
											...form,
											transactionType:
												e.target.value as TransactionType,
										})
									}
								>
									<option value="INCOME">입금</option>
									<option value="EXPENSE">출금</option>
								</select>
							</div>

							{form.assetType === "GOLD" ? (
								<div className="form-group">
									<label>금 수량 (g)</label>
									<input
										type="number"
										step="0.001"
										placeholder="0.000"
										value={form.goldAmount}
										onChange={(e) =>
											setForm({ ...form, goldAmount: e.target.value })
										}
									/>
								</div>
							) : (
								<div className="form-group">
									<label>현금 금액 (원)</label>
									<input
										type="number"
										placeholder="0"
										value={form.moneyAmount}
										onChange={(e) =>
											setForm({
												...form,
												moneyAmount: e.target.value,
											})
										}
									/>
								</div>
							)}

							<div className="form-group">
								<label>메모</label>
								<textarea
									placeholder="메모 (선택)"
									value={form.description}
									onChange={(e) =>
										setForm({ ...form, description: e.target.value })
									}
								/>
							</div>

							<div className="modal-actions">
								<button
									className="modal-btn cancel"
									onClick={() => setShowModal(false)}
								>
									취소
								</button>
								<button
									className="modal-btn submit"
									onClick={handleSubmit}
								>
									{editingId ? "수정" : "등록"}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default GoldMoneyPage;

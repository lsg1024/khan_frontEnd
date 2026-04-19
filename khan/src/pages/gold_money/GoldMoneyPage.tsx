import { useState, useEffect, useCallback } from "react";
import { expenseRecordApi, expenseMasterApi } from "../../../libs/api/expenseApi";
import type {
  ExpenseRecordListItem,
  ExpenseSummary,
  ExpenseBankType,
  ExpenseIncomeAccount,
  ExpenseExpenseAccount,
  CreateExpenseRecordRequest,
} from "../../../libs/api/expenseApi";
import { getLocalDate } from "../../utils/dateUtils";
import { useToast } from "../../components/common/toast/Toast";
import Pagination from "../../components/common/Pagination";
import "../../styles/pages/gold_money/GoldMoneyPage.css";

// 다중 등록 폼 행
interface FormRow {
  key: number;
  expenseType: string; // "INCOME" | "EXPENSE" | ""
  accountId: number; // incomeAccountId or expenseAccountId
  bankTypeId: number;
  counterparty: string;
  description: string;
  material: string;
  weight: string;
  quantity: string;
  unitPrice: string;
  supplyAmount: string;
  taxRate: number; // 0 or 10
  taxAmount: string;
}

const ROWS_COUNT = 20;
let keySeq = 0;

const createEmptyRow = (): FormRow => ({
  key: ++keySeq,
  expenseType: "",
  accountId: 0,
  bankTypeId: 0,
  counterparty: "",
  description: "",
  material: "",
  weight: "",
  quantity: "1",
  unitPrice: "",
  supplyAmount: "",
  taxRate: 0,
  taxAmount: "",
});

const createEmptyRows = (): FormRow[] =>
  Array.from({ length: ROWS_COUNT }, () => createEmptyRow());

const formatNumber = (val: number | null | undefined): string => {
  if (val == null || val === 0) return "";
  return val.toLocaleString();
};

const formatWeight = (val: number | null | undefined): string => {
  if (val == null || val === 0) return "";
  return val.toFixed(3);
};

export const GoldMoneyPage = () => {
  const { showToast } = useToast();

  // 마스터 데이터
  const [bankTypes, setBankTypes] = useState<ExpenseBankType[]>([]);
  const [incomeAccounts, setIncomeAccounts] = useState<ExpenseIncomeAccount[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<ExpenseExpenseAccount[]>([]);

  // 조회 리스트
  const [records, setRecords] = useState<ExpenseRecordListItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 필터
  const [startDate, setStartDate] = useState(getLocalDate());
  const [endDate, setEndDate] = useState(getLocalDate());

  // 다중 등록 폼
  const [showRegister, setShowRegister] = useState(false);
  const [registerDate, setRegisterDate] = useState(getLocalDate());
  const [formRows, setFormRows] = useState<FormRow[]>(createEmptyRows());
  const [submitting, setSubmitting] = useState(false);

  // 체크박스 (조회 리스트)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadMasterData();
    loadRecords();
  }, []);

  const loadMasterData = async () => {
    try {
      const [bankRes, incomeRes, expenseRes] = await Promise.all([
        expenseMasterApi.getBankTypes(),
        expenseMasterApi.getIncomeAccounts(),
        expenseMasterApi.getExpenseAccounts(),
      ]);
      if (bankRes.success && bankRes.data) setBankTypes(bankRes.data);
      if (incomeRes.success && incomeRes.data) setIncomeAccounts(incomeRes.data);
      if (expenseRes.success && expenseRes.data) setExpenseAccounts(expenseRes.data);
    } catch {
      showToast("마스터 데이터 로딩 실패", "error", 3000);
    }
  };

  const loadRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const [recordRes, summaryRes] = await Promise.all([
        expenseRecordApi.getRecords(startDate, endDate, undefined, undefined, page),
        expenseRecordApi.getSummary(startDate, endDate),
      ]);
      if (recordRes.success && recordRes.data) {
        const data = recordRes.data;
        setRecords(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 0);
        setCurrentPage(data.currentPage || page);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch {
      showToast("데이터 로딩 실패", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const handleSearch = () => {
    setSelectedIds(new Set());
    loadRecords(1);
  };

  const handleReset = () => {
    setStartDate(getLocalDate());
    setEndDate(getLocalDate());
    setSelectedIds(new Set());
  };

  // ─── 다중 등록 폼 ───
  const updateRow = (index: number, field: keyof FormRow, value: string | number) => {
    setFormRows((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };

      // 공급가 자동 계산
      if (field === "quantity" || field === "unitPrice") {
        const qty = parseInt(field === "quantity" ? String(value) : row.quantity) || 0;
        const price = parseInt(field === "unitPrice" ? String(value) : row.unitPrice) || 0;
        row.supplyAmount = String(qty * price);
        // 세액 자동 계산
        if (row.taxRate > 0) {
          row.taxAmount = String(Math.round(qty * price * row.taxRate / 100));
        }
      }

      // 세율 변경 시 세액 재계산
      if (field === "taxRate") {
        const supply = parseInt(row.supplyAmount) || 0;
        row.taxAmount = String(Math.round(supply * Number(value) / 100));
      }

      next[index] = row;
      return next;
    });
  };

  const getAccountOptions = (expenseType: string) => {
    if (expenseType === "INCOME") return incomeAccounts;
    if (expenseType === "EXPENSE") return expenseAccounts;
    return [];
  };

  const handleCancelRow = (index: number) => {
    setFormRows((prev) => {
      const next = [...prev];
      next[index] = createEmptyRow();
      return next;
    });
  };

  const handleRegisterSubmit = async () => {
    const validRows = formRows.filter((r) => r.expenseType !== "");

    if (validRows.length === 0) {
      showToast("등록할 데이터를 입력해주세요.", "warning", 3000);
      return;
    }

    // 유효성 검사
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      if (!row.expenseType) {
        showToast(`행 ${i + 1}: 구분을 선택해주세요.`, "warning", 3000);
        return;
      }
      if (!row.accountId) {
        showToast(`행 ${i + 1}: 계정을 선택해주세요.`, "warning", 3000);
        return;
      }
    }

    setSubmitting(true);
    try {
      const requests: CreateExpenseRecordRequest[] = validRows.map((row) => ({
        recordDate: registerDate,
        expenseType: row.expenseType,
        bankTypeId: row.bankTypeId || 0,
        incomeAccountId: row.expenseType === "INCOME" ? row.accountId : null,
        expenseAccountId: row.expenseType === "EXPENSE" ? row.accountId : null,
        counterparty: row.counterparty || undefined,
        description: row.description || undefined,
        material: row.material || undefined,
        weight: row.weight ? parseFloat(row.weight) : undefined,
        quantity: row.quantity ? parseInt(row.quantity) : 1,
        unitPrice: row.unitPrice ? parseInt(row.unitPrice) : 0,
        supplyAmount: row.supplyAmount ? parseInt(row.supplyAmount) : 0,
        taxAmount: row.taxAmount ? parseInt(row.taxAmount) : 0,
      }));

      const res = await expenseRecordApi.createRecordsBatch(requests);
      if (res.success) {
        showToast(`${validRows.length}건 등록 완료`, "success", 3000);
        setFormRows(createEmptyRows());
        setShowRegister(false);
        loadRecords(1);
      } else {
        showToast(res.message || "등록 실패", "error", 3000);
      }
    } catch {
      showToast("등록 중 오류가 발생했습니다.", "error", 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── 체크박스 일괄 선택 ───
  const toggleSelectAll = () => {
    if (selectedIds.size === records.length && records.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── 일괄 삭제 ───
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      showToast("삭제할 항목을 선택해주세요.", "warning", 3000);
      return;
    }
    if (!confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) return;

    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        expenseRecordApi.deleteRecord(id)
      );
      await Promise.all(deletePromises);
      showToast(`${selectedIds.size}건 삭제 완료`, "success", 3000);
      setSelectedIds(new Set());
      loadRecords(currentPage);
    } catch {
      showToast("삭제 중 오류가 발생했습니다.", "error", 3000);
    }
  };

  // ─── 단건 삭제 ───
  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await expenseRecordApi.deleteRecord(id);
      showToast("삭제 완료", "success", 3000);
      loadRecords(currentPage);
    } catch {
      showToast("삭제 실패", "error", 3000);
    }
  };

  // 합계 행 계산
  const totalRow = (supply: number, tax: number) => supply + tax;

  return (
    <div className="page">
      {/* 검색 영역 */}
      <div className="search-section-common">
        <div className="search-filters-common">
          <div className="filter-row-common">
            <div className="gm-date-range">
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
            </div>
            <div className="search-buttons-common">
              <button className="search-btn-common" onClick={handleSearch} disabled={loading}>
                {loading ? "조회 중..." : "검색"}
              </button>
              <button className="reset-btn-common" onClick={handleReset}>
                새로고침
              </button>
              <button
                className="search-btn-common gm-register-btn"
                onClick={() => {
                  setShowRegister(true);
                  setFormRows(createEmptyRows());
                  setRegisterDate(getLocalDate());
                }}
              >
                자료등록
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 조회 리스트 */}
      <div className="list">
        {loading ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
            데이터를 불러오는 중...
          </p>
        ) : records.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
            조회된 내역이 없습니다.
          </p>
        ) : (
          <>
            <div className="gm-total-info">
              총 {totalElements}건
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === records.length && records.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>No</th>
                  <th>등록일</th>
                  <th>구분</th>
                  <th>통장구분</th>
                  <th>계정구분</th>
                  <th>거래처</th>
                  <th>내역</th>
                  <th>재질</th>
                  <th>중량(g)</th>
                  <th>수량</th>
                  <th>단가</th>
                  <th>공급가</th>
                  <th>세액</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                      />
                    </td>
                    <td>{(currentPage - 1) * 20 + idx + 1}</td>
                    <td>{r.recordDate?.slice(0, 10)}</td>
                    <td>
                      <span className={`gm-badge ${r.expenseType === "INCOME" ? "income" : "expense"}`}>
                        {r.expenseType === "INCOME" ? "입고" : "출고"}
                      </span>
                    </td>
                    <td>{r.bankTypeName || "-"}</td>
                    <td>{r.accountName || "-"}</td>
                    <td>{r.counterparty || "-"}</td>
                    <td>{r.description || "-"}</td>
                    <td>{r.material || "-"}</td>
                    <td className="text-right">{r.weight ? r.weight.toFixed(3) : "-"}</td>
                    <td className="text-right">{r.quantity || "-"}</td>
                    <td className="text-right">{formatNumber(r.unitPrice) || "-"}</td>
                    <td className="text-right">{formatNumber(r.supplyAmount) || "-"}</td>
                    <td className="text-right">{formatNumber(r.taxAmount) || "-"}</td>
                    <td>
                      <button className="delete-btn-common gm-action-btn" onClick={() => handleDelete(r.id)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}

                {/* 입고 합계 행 */}
                {summary && (
                  <>
                    <tr className="gm-summary-row income">
                      <td colSpan={9} className="text-right"><strong>입고 리스트 합계</strong></td>
                      <td className="text-right"><strong>{formatWeight(summary.totalIncomeWeight)}</strong></td>
                      <td colSpan={2}></td>
                      <td colSpan={2}></td>
                      <td className="text-right"><strong>{formatNumber(summary.totalIncomeAmount)}</strong></td>
                    </tr>
                    <tr className="gm-summary-row expense">
                      <td colSpan={9} className="text-right"><strong>출고 리스트 합계</strong></td>
                      <td className="text-right"><strong>{formatWeight(summary.totalExpenseWeight)}</strong></td>
                      <td colSpan={2}></td>
                      <td colSpan={2}></td>
                      <td className="text-right"><strong>{formatNumber(summary.totalExpenseAmount)}</strong></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* 일괄 액션 */}
            {selectedIds.size > 0 && (
              <div className="gm-bulk-actions">
                <span className="gm-bulk-label">체크된 것</span>
                <button className="delete-btn-common" onClick={handleBulkDelete}>
                  삭제 ({selectedIds.size}건)
                </button>
              </div>
            )}
          </>
        )}

        {records.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            loading={loading}
            onPageChange={(page) => {
              setSelectedIds(new Set());
              loadRecords(page);
            }}
          />
        )}
      </div>

      {/* ─── 다중 등록 모달 ─── */}
      {showRegister && (
        <div className="modal-overlay" onClick={() => setShowRegister(false)}>
          <div className="gm-register-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gm-register-header">
              <h3>금 및 현금 등록</h3>
              <div className="gm-register-date">
                <label>등록일</label>
                <input
                  type="date"
                  value={registerDate}
                  onChange={(e) => setRegisterDate(e.target.value)}
                />
              </div>
              {/* 입고/출고 합계 */}
              <div className="gm-register-totals">
                <div className="gm-reg-total income">
                  <span>입고</span>
                  <strong>
                    {formatNumber(
                      formRows
                        .filter((r) => r.expenseType === "INCOME")
                        .reduce((sum, r) => sum + (parseInt(r.supplyAmount) || 0) + (parseInt(r.taxAmount) || 0), 0)
                    ) || "0"}
                  </strong>
                </div>
                <div className="gm-reg-total expense">
                  <span>출고</span>
                  <strong>
                    {formatNumber(
                      formRows
                        .filter((r) => r.expenseType === "EXPENSE")
                        .reduce((sum, r) => sum + (parseInt(r.supplyAmount) || 0) + (parseInt(r.taxAmount) || 0), 0)
                    ) || "0"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="gm-register-table-wrap">
              <table className="table gm-register-table">
                <thead>
                  <tr>
                    <th style={{ width: "35px" }}>No</th>
                    <th style={{ width: "35px" }}>취소</th>
                    <th style={{ width: "90px" }}>구분 *</th>
                    <th style={{ width: "120px" }}>계정 *</th>
                    <th style={{ width: "120px" }}>통장구분</th>
                    <th style={{ width: "100px" }}>거래처</th>
                    <th style={{ width: "120px" }}>내역</th>
                    <th style={{ width: "70px" }}>재질</th>
                    <th style={{ width: "80px" }}>중량(g)</th>
                    <th style={{ width: "55px" }}>수량</th>
                    <th style={{ width: "90px" }}>단가</th>
                    <th style={{ width: "90px" }}>공급가</th>
                    <th style={{ width: "65px" }}>세율</th>
                    <th style={{ width: "80px" }}>세액</th>
                    <th style={{ width: "90px" }}>합계금액</th>
                  </tr>
                </thead>
                <tbody>
                  {formRows.map((row, idx) => (
                    <tr key={row.key}>
                      <td className="text-center">{idx + 1}</td>
                      <td className="text-center">
                        <button className="btn-delete-row" onClick={() => handleCancelRow(idx)} title="초기화">
                          🗑️
                        </button>
                      </td>
                      <td>
                        <select
                          value={row.expenseType}
                          onChange={(e) => {
                            updateRow(idx, "expenseType", e.target.value);
                            updateRow(idx, "accountId", 0);
                          }}
                          className="gm-input-select"
                        >
                          <option value="">선택</option>
                          <option value="INCOME">입고</option>
                          <option value="EXPENSE">출고</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={row.accountId}
                          onChange={(e) => updateRow(idx, "accountId", Number(e.target.value))}
                          className="gm-input-select"
                          disabled={!row.expenseType}
                        >
                          <option value={0}>선택</option>
                          {getAccountOptions(row.expenseType).map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={row.bankTypeId}
                          onChange={(e) => updateRow(idx, "bankTypeId", Number(e.target.value))}
                          className="gm-input-select"
                        >
                          <option value={0}>선택</option>
                          {bankTypes.map((bt) => (
                            <option key={bt.id} value={bt.id}>
                              {bt.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.counterparty}
                          onChange={(e) => updateRow(idx, "counterparty", e.target.value)}
                          className="gm-input-text"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => updateRow(idx, "description", e.target.value)}
                          className="gm-input-text"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.material}
                          onChange={(e) => updateRow(idx, "material", e.target.value)}
                          className="gm-input-text"
                          placeholder=""
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.001"
                          value={row.weight}
                          onChange={(e) => updateRow(idx, "weight", e.target.value)}
                          className="gm-input-number"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => updateRow(idx, "quantity", e.target.value)}
                          className="gm-input-number"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.unitPrice}
                          onChange={(e) => updateRow(idx, "unitPrice", e.target.value)}
                          className="gm-input-number"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.supplyAmount}
                          onChange={(e) => updateRow(idx, "supplyAmount", e.target.value)}
                          className="gm-input-number"
                          readOnly
                        />
                      </td>
                      <td>
                        <select
                          value={row.taxRate}
                          onChange={(e) => updateRow(idx, "taxRate", Number(e.target.value))}
                          className="gm-input-select"
                        >
                          <option value={0}>0</option>
                          <option value={10}>10</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.taxAmount}
                          className="gm-input-number"
                          readOnly
                        />
                      </td>
                      <td className="text-right gm-total-cell">
                        {formatNumber(totalRow(parseInt(row.supplyAmount) || 0, parseInt(row.taxAmount) || 0)) || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-actions">
              <button
                className="btn-submit"
                onClick={handleRegisterSubmit}
                disabled={submitting}
              >
                {submitting ? "등록 중..." : "등록"}
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowRegister(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldMoneyPage;

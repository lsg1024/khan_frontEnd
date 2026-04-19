import { useState, useEffect } from "react";
import { expenseRecordApi, expenseMasterApi } from "../../../libs/api/expenseApi";
import type {
  ExpenseRecordListItem,
  ExpenseSummary,
  ExpenseBankType,
  ExpenseIncomeAccount,
  ExpenseExpenseAccount,
  CreateExpenseRecordRequest,
  ExpenseRecordDetail,
  ExpenseRecordsResponse,
} from "../../../libs/api/expenseApi";
import { getLocalDate } from "../../utils/dateUtils";
import { useToast } from "../../components/common/toast/Toast";
import Pagination from "../../components/common/Pagination";
import "../../styles/pages/expense/ExpensePage.css";

const ExpensePage = () => {
  // States for list
  const [records, setRecords] = useState<ExpenseRecordListItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(getLocalDate());
  const [endDate, setEndDate] = useState(getLocalDate());
  const [filterType, setFilterType] = useState(""); // "", "INCOME", "EXPENSE"
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // States for master data (dropdowns)
  const [bankTypes, setBankTypes] = useState<ExpenseBankType[]>([]);
  const [incomeAccounts, setIncomeAccounts] = useState<ExpenseIncomeAccount[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<ExpenseExpenseAccount[]>([]);

  // States for create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateExpenseRecordRequest>({
    recordDate: getLocalDate(),
    expenseType: "INCOME",
    bankTypeId: 0,
    incomeAccountId: null,
    expenseAccountId: null,
    counterparty: "",
    description: "",
    material: "",
    weight: 0,
    quantity: 1,
    unitPrice: 0,
    supplyAmount: 0,
    taxAmount: 0,
  });

  const { showToast } = useToast();

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

  const loadRecords = async (page = 1) => {
    setLoading(true);
    try {
      const recordRes = await expenseRecordApi.getRecords(
        startDate,
        endDate,
        filterType || undefined,
        undefined,
        page
      );
      if (recordRes.success && recordRes.data) {
        const data = recordRes.data as ExpenseRecordsResponse;
        setRecords(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 1);
      }

      const summaryRes = await expenseRecordApi.getSummary(startDate, endDate);
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch {
      showToast("데이터 조회 실패", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadRecords(1);
  };

  const handleReset = () => {
    setStartDate(getLocalDate());
    setEndDate(getLocalDate());
    setFilterType("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadRecords(page);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      recordDate: getLocalDate(),
      expenseType: "INCOME",
      bankTypeId: bankTypes.length > 0 ? bankTypes[0].id : 0,
      incomeAccountId: incomeAccounts.length > 0 ? incomeAccounts[0].id : null,
      expenseAccountId: null,
      counterparty: "",
      description: "",
      material: "",
      weight: 0,
      quantity: 1,
      unitPrice: 0,
      supplyAmount: 0,
      taxAmount: 0,
    });
    setShowModal(true);
  };

  const openEditModal = async (id: number) => {
    try {
      const res = await expenseRecordApi.getRecordById(id);
      if (res.success && res.data) {
        const d = res.data;
        setEditingId(id);
        setFormData({
          recordDate: d.recordDate ? d.recordDate.split("T")[0] : getLocalDate(),
          expenseType: d.expenseType,
          bankTypeId: d.bankTypeId || 0,
          incomeAccountId: d.incomeAccountId,
          expenseAccountId: d.expenseAccountId,
          counterparty: d.counterparty || "",
          description: d.description || "",
          material: d.material || "",
          weight: d.weight || 0,
          quantity: d.quantity || 1,
          unitPrice: d.unitPrice || 0,
          supplyAmount: d.supplyAmount || 0,
          taxAmount: d.taxAmount || 0,
        });
        setShowModal(true);
      }
    } catch {
      showToast("데이터 조회 실패", "error", 3000);
    }
  };

  const handleSave = async () => {
    if (!formData.bankTypeId) {
      showToast("통장구분을 선택해주세요.", "warning", 3000);
      return;
    }

    try {
      if (editingId) {
        await expenseRecordApi.updateRecord(editingId, formData);
        showToast("수정되었습니다.", "success", 3000);
      } else {
        await expenseRecordApi.createRecord(formData);
        showToast("등록되었습니다.", "success", 3000);
      }
      setShowModal(false);
      loadRecords(currentPage);
    } catch {
      showToast("저장 실패", "error", 3000);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await expenseRecordApi.deleteRecord(editingId);
      showToast("삭제되었습니다.", "success", 3000);
      setShowModal(false);
      loadRecords(currentPage);
    } catch {
      showToast("삭제 실패", "error", 3000);
    }
  };

  // Format helpers
  const formatNumber = (n: number | null | undefined) => (n != null ? n.toLocaleString() : "");
  const formatWeight = (w: number | null | undefined) => (w != null ? w.toFixed(2) : "");
  const formatDate = (d: string) => (d ? d.split("T")[0] : "");

  return (
    <div className="page">
      {/* Search area */}
      <div className="search-section-common">
        <div className="search-filters-common">
          <div className="filter-row-common">
            <div className="expense-date-range">
              <span>기간</span>
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
            <select
              className="expense-filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">전체</option>
              <option value="INCOME">입고</option>
              <option value="EXPENSE">출고</option>
            </select>
            <div className="search-buttons-common">
              <button
                className="search-btn-common"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? "조회 중..." : "검색"}
              </button>
              <button className="reset-btn-common" onClick={handleReset}>
                새로고침
              </button>
              <button className="common-btn-common" onClick={openCreateModal}>
                자료등록
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Total count */}
      <div className="expense-total-info">총 {totalElements}건</div>

      {/* Table */}
      <div className="list">
        <table className="table">
          <thead>
            <tr>
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
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              records.map((r, idx) => (
                <tr key={r.id} className={r.expenseType === "EXPENSE" ? "expense-row-out" : ""}>
                  <td>
                    <button className="no-btn" onClick={() => openEditModal(r.id)}>
                      {(currentPage - 1) * 10 + idx + 1}
                    </button>
                  </td>
                  <td>{formatDate(r.recordDate)}</td>
                  <td>{r.expenseType === "INCOME" ? "입고" : "출고"}</td>
                  <td>{r.bankTypeName}</td>
                  <td>{r.accountName}</td>
                  <td>{r.counterparty}</td>
                  <td>{r.description}</td>
                  <td>{r.material}</td>
                  <td>{formatWeight(r.weight)}</td>
                  <td>{r.quantity}</td>
                  <td>{formatNumber(r.unitPrice)}</td>
                  <td>{formatNumber(r.supplyAmount)}</td>
                  <td>{formatNumber(r.taxAmount)}</td>
                </tr>
              ))
            )}
            {/* Summary rows */}
            {summary && records.length > 0 && (
              <>
                <tr className="expense-summary-income">
                  <td colSpan={8} style={{ textAlign: "right", fontWeight: 600 }}>
                    입고 리스트 합계
                  </td>
                  <td>{formatWeight(summary.totalIncomeWeight)}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>{formatNumber(summary.totalIncomeAmount)}</td>
                </tr>
                <tr className="expense-summary-expense">
                  <td colSpan={8} style={{ textAlign: "right", fontWeight: 600 }}>
                    출고 리스트 합계
                  </td>
                  <td>{formatWeight(summary.totalExpenseWeight)}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>{formatNumber(summary.totalExpenseAmount)}</td>
                </tr>
                <tr className="expense-summary-net">
                  <td colSpan={8} style={{ textAlign: "right", fontWeight: 600 }}>
                    입고-출고 리스트 합계
                  </td>
                  <td>{formatWeight(summary.netWeight)}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>{formatNumber(summary.netAmount)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={handlePageChange}
        loading={loading}
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="create-form-overlay" onClick={() => setShowModal(false)}>
          <div className="expense-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-form-header">
              <h3>{editingId ? "경비 수정" : "경비 등록"}</h3>
              <button
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="create-form-body">
              <div className="form-group">
                <label>등록일 *</label>
                <input
                  type="date"
                  value={formData.recordDate}
                  onChange={(e) =>
                    setFormData({ ...formData, recordDate: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>구분 *</label>
                <select
                  value={formData.expenseType}
                  onChange={(e) => {
                    const type = e.target.value;
                    setFormData({
                      ...formData,
                      expenseType: type,
                      incomeAccountId:
                        type === "INCOME" && incomeAccounts.length > 0
                          ? incomeAccounts[0].id
                          : null,
                      expenseAccountId:
                        type === "EXPENSE" && expenseAccounts.length > 0
                          ? expenseAccounts[0].id
                          : null,
                    });
                  }}
                >
                  <option value="INCOME">입고</option>
                  <option value="EXPENSE">출고</option>
                </select>
              </div>
              <div className="form-group">
                <label>계정 *</label>
                {formData.expenseType === "INCOME" ? (
                  <select
                    value={formData.incomeAccountId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        incomeAccountId: Number(e.target.value) || null,
                      })
                    }
                  >
                    <option value="">선택</option>
                    {incomeAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={formData.expenseAccountId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expenseAccountId: Number(e.target.value) || null,
                      })
                    }
                  >
                    <option value="">선택</option>
                    {expenseAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>통장구분 *</label>
                <select
                  value={formData.bankTypeId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankTypeId: Number(e.target.value),
                    })
                  }
                >
                  <option value="">선택</option>
                  {bankTypes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>거래처</label>
                <input
                  type="text"
                  value={formData.counterparty || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, counterparty: e.target.value })
                  }
                  placeholder="거래처명"
                />
              </div>
              <div className="form-group">
                <label>내역</label>
                <input
                  type="text"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="내역"
                />
              </div>
              <div className="expense-form-row">
                <div className="form-group">
                  <label>재질</label>
                  <input
                    type="text"
                    value={formData.material || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, material: e.target.value })
                    }
                    placeholder="예: 24K"
                  />
                </div>
                <div className="form-group">
                  <label>중량(g)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.weight || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="expense-form-row">
                <div className="form-group">
                  <label>수량</label>
                  <input
                    type="number"
                    value={formData.quantity || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>단가</label>
                  <input
                    type="number"
                    value={formData.unitPrice || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitPrice: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="expense-form-row">
                <div className="form-group">
                  <label>공급가</label>
                  <input
                    type="number"
                    value={formData.supplyAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supplyAmount: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>세액</label>
                  <input
                    type="number"
                    value={formData.taxAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taxAmount: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="create-form-footer">
              <button className="reset-btn-common" onClick={() => setShowModal(false)}>
                취소
              </button>
              {editingId && (
                <button className="delete-btn-common" onClick={handleDelete}>
                  삭제
                </button>
              )}
              <button className="search-btn-common" onClick={handleSave}>
                {editingId ? "수정" : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensePage;

import { useMemo, useState } from "react";
import {
  expenseRecordApi,
  type CreateExpenseRecordRequest,
  type ExpenseBankType,
  type ExpenseIncomeAccount,
  type ExpenseExpenseAccount,
} from "../../../libs/api/expenseApi";
import { getLocalDate } from "../../utils/dateUtils";
import { useToast } from "../../components/common/toast/Toast";

/**
 * 금&현금 일괄(멀티행) 등록 그리드.
 * - 주문/재고 "생성" 화면과 동일하게 여러 행을 한 번에 입력 → createRecordsBatch 로 일괄 저장.
 * - 계산 규칙(레거시 화면 기준, 필요 시 조정):
 *     공급가 = 단가 × 수량,  세액 = 공급가 × 세율(%) ,  합계금액 = 공급가 + 세액
 *   (세율/합계금액/관리매장은 BE 저장 필드가 아니라 화면 계산/맥락용)
 */

interface Props {
  bankTypes: ExpenseBankType[];
  incomeAccounts: ExpenseIncomeAccount[];
  expenseAccounts: ExpenseExpenseAccount[];
  onClose: () => void;
  onSuccess: () => void;
}

interface BulkRow {
  key: number;
  expenseType: "INCOME" | "EXPENSE";
  accountId: number | null;
  bankTypeId: number | null;
  counterparty: string;
  description: string;
  material: string;
  weight: number;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

const TAX_RATES = [0, 10]; // 세율(%) 선택지
const INITIAL_ROWS = 8;

let rowSeq = 0;
const emptyRow = (): BulkRow => ({
  key: rowSeq++,
  expenseType: "INCOME",
  accountId: null,
  bankTypeId: null,
  counterparty: "",
  description: "",
  material: "",
  weight: 0,
  quantity: 1,
  unitPrice: 0,
  taxRate: 0,
});

const supplyOf = (r: BulkRow) => Math.round((r.unitPrice || 0) * (r.quantity || 0));
const taxOf = (r: BulkRow) => Math.round((supplyOf(r) * (r.taxRate || 0)) / 100);
const totalOf = (r: BulkRow) => supplyOf(r) + taxOf(r);
const won = (n: number) => (n || 0).toLocaleString();

// 의미있는(저장 대상) 행 판정: 계정·통장 + (금액 또는 중량)
const isFilled = (r: BulkRow) =>
  r.accountId != null &&
  r.bankTypeId != null &&
  (supplyOf(r) > 0 || (r.weight || 0) > 0);

function GoldMoneyBulkRegister({
  bankTypes,
  incomeAccounts,
  expenseAccounts,
  onClose,
  onSuccess,
}: Props) {
  const { showToast } = useToast();
  const [recordDate, setRecordDate] = useState(getLocalDate());
  const [rows, setRows] = useState<BulkRow[]>(() =>
    Array.from({ length: INITIAL_ROWS }, () => emptyRow())
  );
  const [submitting, setSubmitting] = useState(false);

  const update = (key: number, patch: Partial<BulkRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (key: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));

  const accountsFor = (type: "INCOME" | "EXPENSE") =>
    type === "INCOME" ? incomeAccounts : expenseAccounts;

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    rows.forEach((r) => {
      if (!isFilled(r)) return;
      if (r.expenseType === "INCOME") income += totalOf(r);
      else expense += totalOf(r);
    });
    return { income, expense, net: income - expense };
  }, [rows]);

  const handleSubmit = async () => {
    const filled = rows.filter(isFilled);
    if (filled.length === 0) {
      showToast("입력된 행이 없습니다. 계정·통장구분·금액을 입력하세요.", "warning", 3000);
      return;
    }
    const payload: CreateExpenseRecordRequest[] = filled.map((r) => ({
      recordDate,
      expenseType: r.expenseType,
      bankTypeId: r.bankTypeId as number,
      incomeAccountId: r.expenseType === "INCOME" ? r.accountId : null,
      expenseAccountId: r.expenseType === "EXPENSE" ? r.accountId : null,
      counterparty: r.counterparty || undefined,
      description: r.description || undefined,
      material: r.material || undefined,
      weight: r.weight || 0,
      quantity: r.quantity || 1,
      unitPrice: r.unitPrice || 0,
      supplyAmount: supplyOf(r),
      taxAmount: taxOf(r),
    }));

    try {
      setSubmitting(true);
      const res = await expenseRecordApi.createRecordsBatch(payload);
      if (res.success) {
        showToast(`${filled.length}건 등록되었습니다.`, "success", 3000);
        onSuccess();
        onClose();
      } else {
        showToast("등록 실패", "error", 3000);
      }
    } catch {
      showToast("등록 중 오류가 발생했습니다.", "error", 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-content-xl gm-bulk"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>금&현금 일괄 등록</h2>
          <button className="modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* 상단: 등록일 + 합계 */}
          <div className="gm-bulk-top">
            <label className="gm-bulk-date">
              <span>등록일 *</span>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
              />
            </label>
            <div className="gm-bulk-summary">
              <div className="gm-sum gm-sum-in">
                <span>입고</span>
                <b>{won(totals.income)}</b>
              </div>
              <div className="gm-sum gm-sum-out">
                <span>출고</span>
                <b>{won(totals.expense)}</b>
              </div>
              <div className="gm-sum gm-sum-net">
                <span>입고-출고</span>
                <b>{won(totals.net)}</b>
              </div>
            </div>
          </div>

          {/* 입력 그리드 */}
          <div className="gm-bulk-grid">
            <table className="gm-bulk-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>취소</th>
                  <th>구분</th>
                  <th>계정</th>
                  <th>통장구분</th>
                  <th>거래처</th>
                  <th>내역</th>
                  <th>재질</th>
                  <th>중량(g)</th>
                  <th>수량</th>
                  <th>단가</th>
                  <th>공급가</th>
                  <th>세율</th>
                  <th>세액</th>
                  <th>합계금액</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.key}>
                    <td className="gm-no">{i + 1}</td>
                    <td>
                      <button
                        className="gm-row-del"
                        onClick={() => removeRow(r.key)}
                        title="행 삭제"
                      >
                        ✕
                      </button>
                    </td>
                    <td className="gm-col-sel">
                      <select
                        value={r.expenseType}
                        onChange={(e) =>
                          update(r.key, {
                            expenseType: e.target.value as "INCOME" | "EXPENSE",
                            accountId: null,
                          })
                        }
                      >
                        <option value="INCOME">입고</option>
                        <option value="EXPENSE">출고</option>
                      </select>
                    </td>
                    <td className="gm-col-sel">
                      <select
                        value={r.accountId ?? ""}
                        onChange={(e) =>
                          update(r.key, {
                            accountId: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      >
                        <option value="">선택</option>
                        {accountsFor(r.expenseType).map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="gm-col-sel">
                      <select
                        value={r.bankTypeId ?? ""}
                        onChange={(e) =>
                          update(r.key, {
                            bankTypeId: e.target.value ? Number(e.target.value) : null,
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
                    </td>
                    <td>
                      <input
                        type="text"
                        value={r.counterparty}
                        onChange={(e) => update(r.key, { counterparty: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={r.description}
                        onChange={(e) => update(r.key, { description: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={r.material}
                        placeholder="예:24K"
                        onChange={(e) => update(r.key, { material: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.001"
                        value={r.weight || ""}
                        onChange={(e) =>
                          update(r.key, { weight: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={r.quantity || ""}
                        onChange={(e) =>
                          update(r.key, { quantity: parseInt(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={r.unitPrice || ""}
                        onChange={(e) =>
                          update(r.key, { unitPrice: parseInt(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="gm-calc">{won(supplyOf(r))}</td>
                    <td className="gm-col-sel">
                      <select
                        value={r.taxRate}
                        onChange={(e) => update(r.key, { taxRate: Number(e.target.value) })}
                      >
                        {TAX_RATES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="gm-calc">{won(taxOf(r))}</td>
                    <td className="gm-calc gm-total">{won(totalOf(r))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="gm-add-row" onClick={addRow}>
            + 행 추가
          </button>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            닫기
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoldMoneyBulkRegister;

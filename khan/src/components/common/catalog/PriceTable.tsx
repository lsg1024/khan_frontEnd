import React from "react";
import type { PriceTableProps } from "../../../types/price";
import "../../../styles/components/PriceTable.css";

const PriceTable: React.FC<PriceTableProps> = ({
  priceGroups,
  showTitle = true,
  editable = true,
  editedPurchasePrices = {},
  editedLaborCosts = {},
  editedColors = {},
  editedNotes = {},
  onColorChange,
  onPurchasePriceChange,
  onLaborCostChange,
  onNoteChange,
}) => {
  // 숫자만 허용하는 입력 핸들러
  const handleNumberInput = (value: string): string => {
    const numericValue = value.replace(/[^0-9]/g, "");
    return numericValue;
  };

  // 구매 공임 변경 핸들러
  const handlePurchasePriceChange = (groupId: string, value: string) => {
    const numericValue = handleNumberInput(value);
    if (onPurchasePriceChange) {
      onPurchasePriceChange(groupId, numericValue);
    }
  };

  // 등급별 공임 변경 핸들러
  const handleLaborCostChange = (workGradePolicyId: string, value: string) => {
    const numericValue = handleNumberInput(value);
    if (onLaborCostChange) {
      onLaborCostChange(workGradePolicyId, numericValue);
    }
  };

  // 기본 행 구조 생성
  const getDefaultRows = () => {
    return [
      {
        productGroupId: "default-0",
        colorName: "",
        productPurchasePrice: 0,
        gradePolicyDtos: [
          {
            workGradePolicyId: "grade-1-0",
            grade: "GRADE_1",
            laborCost: 0,
            note: "",
            groupId: 0,
          },
          {
            workGradePolicyId: "grade-2-0",
            grade: "GRADE_2",
            laborCost: 0,
            note: "",
            groupId: 0,
          },
          {
            workGradePolicyId: "grade-3-0",
            grade: "GRADE_3",
            laborCost: 0,
            note: "",
            groupId: 0,
          },
          {
            workGradePolicyId: "grade-4-0",
            grade: "GRADE_4",
            laborCost: 0,
            note: "",
            groupId: 0,
          },
        ],
        note: "",
      },
      {
        productGroupId: "default-1",
        colorName: "",
        productPurchasePrice: 0,
        gradePolicyDtos: [
          {
            workGradePolicyId: "grade-1-1",
            grade: "GRADE_1",
            laborCost: 0,
            note: "",
            groupId: 1,
          },
          {
            workGradePolicyId: "grade-2-1",
            grade: "GRADE_2",
            laborCost: 0,
            note: "",
            groupId: 1,
          },
          {
            workGradePolicyId: "grade-3-1",
            grade: "GRADE_3",
            laborCost: 0,
            note: "",
            groupId: 1,
          },
          {
            workGradePolicyId: "grade-4-1",
            grade: "GRADE_4",
            laborCost: 0,
            note: "",
            groupId: 1,
          },
        ],
        note: "",
      },
      {
        productGroupId: "default-2",
        colorName: "",
        productPurchasePrice: 0,
        gradePolicyDtos: [
          {
            workGradePolicyId: "grade-1-2",
            grade: "GRADE_1",
            laborCost: 0,
            note: "",
            groupId: 2,
          },
          {
            workGradePolicyId: "grade-2-2",
            grade: "GRADE_2",
            laborCost: 0,
            note: "",
            groupId: 2,
          },
          {
            workGradePolicyId: "grade-3-2",
            grade: "GRADE_3",
            laborCost: 0,
            note: "",
            groupId: 2,
          },
          {
            workGradePolicyId: "grade-4-2",
            grade: "GRADE_4",
            laborCost: 0,
            note: "",
            groupId: 2,
          },
        ],
        note: "",
      },
    ];
  };

  // 표시할 행 데이터 결정 (최소 3개 행 보장)
  const displayRows = (() => {
    if (!priceGroups || priceGroups.length === 0) {
      return getDefaultRows();
    }

    const rows = [...priceGroups];

    // 부족한 행을 기본 구조로 채움
    while (rows.length < 3) {
      const defaultRow = getDefaultRows()[rows.length];
      rows.push(defaultRow);
    }

    return rows;
  })();

  return (
    <div className="price-section">
      {showTitle && <h2>가격 정보</h2>}
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
            <tr key={group.productGroupId}>
              {/* 구분 */}
              <td>
                <span className="fixed-text">
                  {index === 0 ? "기본" : `추가${index}`}
                  {index === 0 && <span className="required-field">*</span>}
                </span>
              </td>

              {/* 색상 */}
              <td>
                {editable ? (
                  <select
                    className="editable-select color-select"
                    value={
                      editedColors[group.productGroupId] !== undefined
                        ? editedColors[group.productGroupId]
                        : group.colorName
                    }
                    onChange={(e) =>
                      onColorChange &&
                      onColorChange(group.productGroupId, e.target.value)
                    }
                  >
                    <option value={group.colorName}>{group.colorName}</option>
                  </select>
                ) : (
                  <span className="fixed-text">{group.colorName}</span>
                )}
              </td>

              {/* 구매 공임 */}
              <td>
                {editable ? (
                  <input
                    type="text"
                    className="editable-number table-input"
                    value={
                      editedPurchasePrices[group.productGroupId] !== undefined
                        ? editedPurchasePrices[group.productGroupId]
                        : group.productPurchasePrice.toString()
                    }
                    onChange={(e) =>
                      handlePurchasePriceChange(
                        group.productGroupId,
                        e.target.value
                      )
                    }
                    placeholder="0"
                  />
                ) : (
                  <span className="fixed-text">
                    {group.productPurchasePrice.toLocaleString()}
                  </span>
                )}
              </td>

              {/* 1등급~4등급 */}
              {[1, 2, 3, 4].map((gradeNum) => {
                const gradePolicy = group.gradePolicyDtos.find(
                  (policy) => policy.grade === `GRADE_${gradeNum}`
                );
                return (
                  <td key={gradeNum}>
                    {gradePolicy ? (
                      editable ? (
                        <input
                          type="text"
                          className="editable-number table-input"
                          value={
                            editedLaborCosts[gradePolicy.workGradePolicyId] !==
                            undefined
                              ? editedLaborCosts[gradePolicy.workGradePolicyId]
                              : gradePolicy.laborCost.toString()
                          }
                          onChange={(e) =>
                            handleLaborCostChange(
                              gradePolicy.workGradePolicyId,
                              e.target.value
                            )
                          }
                          placeholder="0"
                        />
                      ) : (
                        <span className="fixed-text">
                          {gradePolicy.laborCost.toLocaleString()}
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
                    value={editedNotes[group.productGroupId] || ""}
                    onChange={(e) =>
                      onNoteChange &&
                      onNoteChange(group.productGroupId, e.target.value)
                    }
                    placeholder="비고 입력"
                  />
                ) : (
                  <span className="fixed-text">
                    {editedNotes[group.productGroupId] || ""}
                  </span>
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

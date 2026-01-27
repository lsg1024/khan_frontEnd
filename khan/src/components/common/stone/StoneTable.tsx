import React, { useState, useRef, useEffect } from "react";
import type {
  StoneTableProps,
  ProductStoneDto,
  StoneSearchDto,
} from "../../../types/stoneDto";
import StoneSearch from "./StoneSearch";
import "../../../styles/components/stone/StoneTable.css";

const StoneTable: React.FC<StoneTableProps> = ({
  stones,
  showTitle = true,
  showTotalRow = true,
  editable = true,
  showAddButton = false,
  fieldPermissions = {
    stoneName: false,
    stoneWeight: false,
    stonePurchase: false,
    grades: false,
    mainStone: true,
    includeStone: true,
    stoneQuantity: true,
    note: true,
  },
  onStoneChange,
  onAddStone,
  onDeleteStone,
}) => {
  // 툴팁 상태 관리
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    content: string;
    x: number;
    y: number;
  }>({
    show: false,
    content: "",
    x: 0,
    y: 0,
  });

  // 스톤 검색 모달 상태
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [currentEditingStoneId, setCurrentEditingStoneId] =
    useState<string>("");

  const tooltipRef = useRef<HTMLDivElement>(null);

  // 툴팁 표시 함수
  const showTooltip = (event: React.MouseEvent, content: string) => {
    if (!content) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      content,
      x: rect.left + rect.width / 2,
      y: rect.top - 25, // 셀 상단에 고정
    });
  };

  // 툴팁 숨김 함수
  const hideTooltip = () => {
    setTooltip({ show: false, content: "", x: 0, y: 0 });
  };

  // 개별 셀 툴팁 내용 생성 함수
  const getCellTooltipContent = (stone: ProductStoneDto, cellType: string) => {
    switch (cellType) {
      case "stoneName":
        return stone.stoneName || "";
      case "stoneQuantity":
        return stone.stoneQuantity ? `${stone.stoneQuantity}` : "";
      case "stoneWeight":
        return stone.stoneWeight ? `${stone.stoneWeight}` : "";
      case "stonePurchase":
        return stone.stonePurchase
          ? `${stone.stonePurchase.toLocaleString()}`
          : "";
      case "grade1": {
        const grade1 = stone.stoneWorkGradePolicyDtos?.find(
          (p) => p.grade === "GRADE_1"
        );
        return grade1?.laborCost
          ? `1등급: ${grade1.laborCost.toLocaleString()}`
          : "";
      }
      case "grade2": {
        const grade2 = stone.stoneWorkGradePolicyDtos?.find(
          (p) => p.grade === "GRADE_2"
        );
        return grade2?.laborCost
          ? `2등급: ${grade2.laborCost.toLocaleString()}`
          : "";
      }
      case "grade3": {
        const grade3 = stone.stoneWorkGradePolicyDtos?.find(
          (p) => p.grade === "GRADE_3"
        );
        return grade3?.laborCost
          ? `3등급: ${grade3.laborCost.toLocaleString()}`
          : "";
      }
      case "grade4": {
        const grade4 = stone.stoneWorkGradePolicyDtos?.find(
          (p) => p.grade === "GRADE_4"
        );
        return grade4?.laborCost
          ? `4등급: ${grade4.laborCost.toLocaleString()}`
          : "";
      }
      case "note":
        return stone.productStoneNote ? `비고: ${stone.productStoneNote}` : "";
      default:
        return "";
    }
  };

  // 툴팁이 표시될 때 위치 조정
  useEffect(() => {
    if (tooltip.show && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      let x = tooltip.x;
      let y = tooltip.y;

      // 화면 오른쪽 끝을 벗어나는 경우
      if (x + tooltipRect.width / 2 > viewportWidth) {
        x = viewportWidth - tooltipRect.width / 2 - 10;
      }

      // 화면 왼쪽 끝을 벗어나는 경우
      if (x - tooltipRect.width / 2 < 0) {
        x = tooltipRect.width / 2 + 10;
      }

      // 화면 위쪽을 벗어나는 경우
      if (y < 0) {
        y = 10;
      }

      // 위치가 변경된 경우만 업데이트
      if (x !== tooltip.x || y !== tooltip.y) {
        setTooltip((prev) => ({ ...prev, x, y }));
      }
    }
  }, [tooltip.show, tooltip.x, tooltip.y]);
  // 숫자와 소수점만 허용하는 입력 핸들러
  const handleNumberInput = (value: string): string => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    return numericValue;
  };

  // 필드 변경 핸들러
  const handleFieldChange = (
    stoneId: string,
    field: string,
    value: string | number | boolean
  ) => {
    if (onStoneChange) {
      onStoneChange(stoneId, field, value);
    }
  };

  // 검색 버튼 클릭 핸들러
  const handleSearchClick = (stoneId: string) => {
    setCurrentEditingStoneId(stoneId);
    setIsSearchModalOpen(true);
  };

  // 스톤 선택 핸들러
  const handleStoneSelect = (selectedStone: StoneSearchDto) => {
    const newStoneId = currentEditingStoneId;

    if (!newStoneId || !onStoneChange) {
      return;
    }

    // 중복 체크: 같은 stoneId를 가진 스톤이 이미 존재하는지 확인
    const isDuplicate = stones.some(
      (stone) =>
        stone.stoneId === selectedStone.stoneId &&
        stone.productStoneId !== newStoneId
    );

    if (isDuplicate) {
      alert(`"${selectedStone.stoneName}" 스톤은 이미 추가되어 있습니다.`);
      return;
    }

    // 선택된 스톤의 정보로 기존 스톤 정보 업데이트
    onStoneChange(newStoneId, "stoneId", selectedStone.stoneId);
    onStoneChange(newStoneId, "stoneName", selectedStone.stoneName);
    onStoneChange(newStoneId, "stoneWeight", selectedStone.stoneWeight);
    onStoneChange(
      newStoneId,
      "stonePurchase",
      selectedStone.stonePurchasePrice
    );

    // 등급별 가격 업데이트 - 실제 사용되는 필드명 형식으로 수정
    selectedStone.stoneWorkGradePolicyDto?.forEach((gradePolicy) => {
      const gradeNumber = gradePolicy.grade.replace("GRADE_", "");
      const fieldName = `grade_${gradeNumber}`;
      onStoneChange(newStoneId, fieldName, gradePolicy.laborCost);
    });

    // 비고란 초기화
    onStoneChange(newStoneId, "note", "");
    handleCloseModal();
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsSearchModalOpen(false);
    setCurrentEditingStoneId("");
  };

  if (!stones || stones.length === 0) {
    return (
      <div className="stone-section">
        <div className="stone-section-header">
          {showTitle && <h2>스톤 정보</h2>}
          {showAddButton && editable && (
            <button
              className="add-stone-button"
              onClick={() => onAddStone && onAddStone()}
            >
              + 스톤 추가
            </button>
          )}
        </div>
        <div className="no-stones-message">
          <p>등록된 스톤이 없습니다. 스톤을 추가해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stone-section">
      <div className="stone-section-header">
        {showTitle && <h2>스톤 정보</h2>}
        {showAddButton && editable && (
          <button
            className="add-stone-button"
            onClick={() => onAddStone && onAddStone()}
          >
            +
          </button>
        )}
      </div>
      <table className="stone-table">
        <thead>
          <tr>
            <th>No</th>
            <th>메인</th>
            <th>적용</th>
            <th>스톤명</th>
            <th>알수</th>
            <th>개당 중량</th>
            <th>구매 단가</th>
            <th colSpan={4}>등급별 판매 단가</th>
            <th>비고</th>
            {editable && onDeleteStone && <th>삭제</th>}
          </tr>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th>1등급</th>
            <th>2등급</th>
            <th>3등급</th>
            <th>4등급</th>
            <th></th>
            {editable && onDeleteStone && <th></th>}
          </tr>
        </thead>
        <tbody>
          {stones.map((stone, index) => (
            <tr key={stone.productStoneId}>
              {/* No */}
              <td>{index + 1}</td>

              {/* 메인구분 */}
              <td>
                {editable ? (
                  <select
                    className="editable-select"
                    value={stone.mainStone ? "Y" : "N"}
                    onChange={(e) =>
                      handleFieldChange(
                        stone.productStoneId,
                        "mainStone",
                        e.target.value === "Y"
                      )
                    }
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                ) : (
                  <span>{stone.mainStone ? "Y" : "N"}</span>
                )}
              </td>

              {/* 적용 */}
              <td>
                {editable ? (
                  <select
                    className="editable-select"
                    value={stone.includeStone ? "Y" : "N"}
                    onChange={(e) =>
                      handleFieldChange(
                        stone.productStoneId,
                        "includeStone",
                        e.target.value === "Y"
                      )
                    }
                  >
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                ) : (
                  <span>{stone.includeStone ? "Y" : "N"}</span>
                )}
              </td>

              {/* 스톤명 */}
              <td
                onMouseEnter={(e) =>
                  showTooltip(e, getCellTooltipContent(stone, "stoneName"))
                }
                onMouseLeave={hideTooltip}
              >
                {editable && fieldPermissions.stoneName ? (
                  <div className="stone-name-input-container">
                    <input
                      type="text"
                      className="editable-text table-input"
                      value={stone.stoneName}
                      onChange={(e) =>
                        handleFieldChange(
                          stone.productStoneId,
                          "stoneName",
                          e.target.value
                        )
                      }
                    />
                    <button
                      className="search-button-stone-table"
                      onClick={() => handleSearchClick(stone.productStoneId)}
                    >
                      🔍
                    </button>
                  </div>
                ) : (
                  <div className="stone-name-input-container">
                    <input
                      type="text"
                      className="readonly-input table-input"
                      value={stone.stoneName}
                      readOnly
                    />
                    <button
                      className="search-button-stone-table"
                      onClick={() => handleSearchClick(stone.productStoneId)}
                    >
                      🔍
                    </button>
                  </div>
                )}
              </td>

              {/* 알수 */}
              <td
                onMouseEnter={(e) =>
                  !editable || !fieldPermissions.stoneQuantity
                    ? showTooltip(
                        e,
                        getCellTooltipContent(stone, "stoneQuantity")
                      )
                    : undefined
                }
                onMouseLeave={
                  !editable || !fieldPermissions.stoneQuantity
                    ? hideTooltip
                    : undefined
                }
              >
                {editable && fieldPermissions.stoneQuantity ? (
                  <input
                    type="text"
                    className="editable-number table-input"
                    value={stone.stoneQuantity.toString()}
                    onChange={(e) => {
                      const numericValue = handleNumberInput(e.target.value);
                      handleFieldChange(
                        stone.productStoneId,
                        "stoneQuantity",
                        parseInt(numericValue) || 0
                      );
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    className="readonly-input table-input"
                    value={stone.stoneQuantity.toString()}
                    readOnly
                  />
                )}
              </td>

              {/* 개당중량 */}
              <td
                onMouseEnter={(e) =>
                  !editable || !fieldPermissions.stoneWeight
                    ? showTooltip(
                        e,
                        getCellTooltipContent(stone, "stoneWeight")
                      )
                    : undefined
                }
                onMouseLeave={
                  !editable || !fieldPermissions.stoneWeight
                    ? hideTooltip
                    : undefined
                }
              >
                {editable && fieldPermissions.stoneWeight ? (
                  <input
                    type="text"
                    className="editable-text table-input"
                    value={stone.stoneWeight}
                    onChange={(e) =>
                      handleFieldChange(
                        stone.productStoneId,
                        "stoneWeight",
                        e.target.value
                      )
                    }
                  />
                ) : (
                  <input
                    type="text"
                    className="readonly-input table-input"
                    value={stone.stoneWeight}
                    readOnly
                  />
                )}
              </td>

              {/* 구매단가 */}
              <td
                onMouseEnter={(e) =>
                  !editable || !fieldPermissions.stonePurchase
                    ? showTooltip(
                        e,
                        getCellTooltipContent(stone, "stonePurchase")
                      )
                    : undefined
                }
                onMouseLeave={
                  !editable || !fieldPermissions.stonePurchase
                    ? hideTooltip
                    : undefined
                }
              >
                {editable && fieldPermissions.stonePurchase ? (
                  <input
                    type="text"
                    className="editable-number table-input"
                    value={stone.stonePurchase.toString()}
                    onChange={(e) => {
                      const numericValue = handleNumberInput(e.target.value);
                      handleFieldChange(
                        stone.productStoneId,
                        "stonePurchase",
                        parseFloat(numericValue) || 0
                      );
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    className="readonly-input table-input"
                    value={stone.stonePurchase.toString()}
                    readOnly
                  />
                )}
              </td>

              {/* 1등급~4등급 */}
              {[1, 2, 3, 4].map((gradeNum) => {
                const gradePolicy = stone.stoneWorkGradePolicyDtos?.find(
                  (policy) => policy.grade === `GRADE_${gradeNum}`
                );
                return (
                  <td
                    key={gradeNum}
                    onMouseEnter={(e) =>
                      !editable || !fieldPermissions.grades
                        ? showTooltip(
                            e,
                            getCellTooltipContent(stone, `grade${gradeNum}`)
                          )
                        : undefined
                    }
                    onMouseLeave={
                      !editable || !fieldPermissions.grades
                        ? hideTooltip
                        : undefined
                    }
                  >
                    {editable && fieldPermissions.grades ? (
                      <input
                        type="text"
                        className="editable-number table-input"
                        value={gradePolicy?.laborCost.toString() || ""}
                        onChange={(e) => {
                          const numericValue = handleNumberInput(
                            e.target.value
                          );
                          handleFieldChange(
                            stone.productStoneId,
                            `grade_${gradeNum}`,
                            parseFloat(numericValue) || 0
                          );
                        }}
                        placeholder="0"
                      />
                    ) : (
                      <input
                        type="text"
                        className="readonly-input table-input"
                        value={gradePolicy?.laborCost.toString() || ""}
                        readOnly
                        placeholder="0"
                      />
                    )}
                  </td>
                );
              })}

              {/* 비고 */}
              <td
                onMouseEnter={(e) =>
                  !editable || !fieldPermissions.note
                    ? showTooltip(e, getCellTooltipContent(stone, "note"))
                    : undefined
                }
                onMouseLeave={
                  !editable || !fieldPermissions.note ? hideTooltip : undefined
                }
              >
                {editable && fieldPermissions.note ? (
                  <input
                    type="text"
                    className="editable-text table-input"
                    value={stone.productStoneNote || ""}
                    placeholder="비고 입력"
                    onChange={(e) =>
                      handleFieldChange(
                        stone.productStoneId,
                        "note",
                        e.target.value
                      )
                    }
                  />
                ) : (
                  <input
                    type="text"
                    className="readonly-input table-input"
                    value={stone.productStoneNote || ""}
                    placeholder="비고 입력"
                    readOnly
                  />
                )}
              </td>

              {/* 삭제 버튼 */}
              {editable && onDeleteStone && (
                <td>
                  <button
                    className="delete-stone-button"
                    onClick={() => onDeleteStone(stone.productStoneId)}
                    title="스톤 삭제"
                  >
                    🗑️
                  </button>
                </td>
              )}
            </tr>
          ))}

          {/* 소계 행 */}
          {showTotalRow && (
            <tr className="stone-total-row">
              <td colSpan={4}>소계</td>
              <td className="stone-total-cell">
                {stones
                  .filter((stone) => stone.includeStone)
                  .reduce((sum, stone) => sum + stone.stoneQuantity, 0)}
              </td>
              <td>
                <span>
                  {stones
                    .filter((stone) => stone.includeStone)
                    .reduce(
                      (sum, stone) =>
                        sum + Number(stone.stoneWeight) * stone.stoneQuantity,
                      0
                    )
                    .toLocaleString()}
                </span>
              </td>
              <td className="stone-total-cell">
                {stones
                  .filter((stone) => stone.includeStone)
                  .reduce(
                    (sum, stone) =>
                      sum + stone.stonePurchase * stone.stoneQuantity,
                    0
                  )
                  .toLocaleString()}
              </td>
              {[1, 2, 3, 4].map((gradeNum) => (
                <td key={gradeNum} className="stone-total-cell">
                  {stones
                    .filter((stone) => stone.includeStone)
                    .reduce((sum, stone) => {
                      const gradePolicy = stone.stoneWorkGradePolicyDtos?.find(
                        (policy) => policy.grade === `GRADE_${gradeNum}`
                      );
                      return (
                        sum +
                        (gradePolicy?.laborCost || 0) * stone.stoneQuantity
                      );
                    }, 0)
                    .toLocaleString()}
                </td>
              ))}
              <td></td>
              {editable && onDeleteStone && <td></td>}
            </tr>
          )}
        </tbody>
      </table>

      {/* 툴팁 */}
      {tooltip.show && (
        <div
          ref={tooltipRef}
          className={`stone-table-tooltip ${tooltip.show ? "show" : ""}`}
          style={{
            position: "fixed",
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translateX(-50%)",
          }}
        >
          {tooltip.content}
        </div>
      )}

      {/* 스톤 검색 모달 */}
      <StoneSearch
        isOpen={isSearchModalOpen}
        onClose={handleCloseModal}
        onSelectStone={handleStoneSelect}
        currentStoneId={currentEditingStoneId}
      />
    </div>
  );
};

export default StoneTable;

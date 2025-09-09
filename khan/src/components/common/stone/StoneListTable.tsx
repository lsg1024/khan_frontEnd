import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ProductStoneDto } from "../../../types/stone";
import "../../../styles/components/StoneListTable.css";

interface StoneListTableProps {
    stones: ProductStoneDto[];
    showTitle?: boolean;
    showTotalRow?: boolean;
}

const StoneListTable: React.FC<StoneListTableProps> = ({
    stones,
    showTitle = true
}) => {
    const navigate = useNavigate();

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

    const tooltipRef = useRef<HTMLDivElement>(null);

    // 툴팁 표시 함수
    const showTooltip = (event: React.MouseEvent, content: string) => {
        if (!content) return;

        const rect = event.currentTarget.getBoundingClientRect();
        setTooltip({
        show: true,
        content,
        x: rect.left + rect.width / 2,
        y: rect.top - 25,
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
        case "stoneWeight":
            return stone.stoneWeight ? `개당중량: ${stone.stoneWeight}` : "";
        case "stonePurchase":
            return stone.stonePurchase
            ? `구매단가: ${stone.stonePurchase.toLocaleString()}`
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

    // 툴팁 위치 조정
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

    // 스톤 상세/수정 페이지로 이동
    const handleStoneClick = (stoneId: string) => {
        navigate(`/stone/${stoneId}`);
    };

    if (!stones || stones.length === 0) {
        return (
        <div className="stone-list-section">
            {showTitle && (
            <div className="stone-list-header">
                <h2>스톤 목록</h2>
            </div>
            )}
            <div className="no-stones-message">
            <p>등록된 스톤이 없습니다.</p>
            </div>
        </div>
        );
    }

    return (
        <div className="stone-list-section">
        {showTitle && (
            <div className="stone-list-header">
            <h2>스톤 목록</h2>
            </div>
        )}

        <table className="stone-list-table">
            <thead>
            <tr>
                <th>No</th>
                <th>스톤명</th>
                <th>개당 중량</th>
                <th>구매 단가</th>
                <th colSpan={4}>등급별 판매 단가</th>
                <th>비고</th>
            </tr>
            <tr>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th>1등급</th>
                <th>2등급</th>
                <th>3등급</th>
                <th>4등급</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            {stones.map((stone, index) => (
                <tr key={stone.productStoneId}>
                {/* No - 클릭 가능 */}
                <td>
                    <button
                    className="stone-number-button"
                    onClick={() => handleStoneClick(stone.stoneId)}
                    title="스톤 상세 정보 보기"
                    >
                    {index + 1}
                    </button>
                </td>

                {/* 스톤명 */}
                <td
                    className="stone-name-cell"
                    onMouseEnter={(e) =>
                    showTooltip(e, getCellTooltipContent(stone, "stoneName"))
                    }
                    onMouseLeave={hideTooltip}
                >
                    <span className="stone-name-text">{stone.stoneName}</span>
                </td>

                {/* 개당중량 */}
                <td
                    className="stone-weight-cell"
                    onMouseEnter={(e) =>
                    showTooltip(e, getCellTooltipContent(stone, "stoneWeight"))
                    }
                    onMouseLeave={hideTooltip}
                >
                    <span className="stone-weight-text">{stone.stoneWeight}</span>
                </td>

                {/* 구매단가 */}
                <td
                    className="stone-purchase-cell"
                    onMouseEnter={(e) =>
                    showTooltip(e, getCellTooltipContent(stone, "stonePurchase"))
                    }
                    onMouseLeave={hideTooltip}
                >
                    <span className="stone-purchase-text">
                    {stone.stonePurchase.toLocaleString() || "0"}
                    </span>
                </td>

                {/* 1등급~4등급 */}
                {[1, 2, 3, 4].map((gradeNum) => {
                    const gradePolicy = stone.stoneWorkGradePolicyDtos?.find(
                    (policy) => policy.grade === `GRADE_${gradeNum}`
                    );
                    return (
                    <td
                        key={gradeNum}
                        className="stone-grade-cell"
                        onMouseEnter={(e) =>
                        showTooltip(
                            e,
                            getCellTooltipContent(stone, `grade${gradeNum}`)
                        )
                        }
                        onMouseLeave={hideTooltip}
                    >
                        <span className="stone-grade-text">
                        {gradePolicy?.laborCost?.toLocaleString() || "0"}
                        </span>
                    </td>
                    );
                })}

                {/* 비고 */}
                <td
                    className="stone-note-cell"
                    onMouseEnter={(e) =>
                    showTooltip(e, getCellTooltipContent(stone, "note"))
                    }
                    onMouseLeave={hideTooltip}
                >
                    <span className="stone-note-text">
                    {stone.productStoneNote || ""}
                    </span>
                </td>
                </tr>
            ))}
            </tbody>
        </table>

        {/* 툴팁 */}
        {tooltip.show && (
            <div
            ref={tooltipRef}
            className={`stone-list-tooltip ${tooltip.show ? "show" : ""}`}
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
        </div>
    );
};

export default StoneListTable;

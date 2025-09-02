import React, { useState, useEffect } from "react";
import type { StoneSearchDto } from "../../../types/stone";
import { basicInfoApi } from "../../../../libs/api";
import "../../../styles/components/StoneSearchModal.css";

interface StoneSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStone: (stone: StoneSearchDto) => void;
  currentStoneId?: string;
}

const StoneSearchModal: React.FC<StoneSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStone,
  currentStoneId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [stones, setStones] = useState<StoneSearchDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 스톤 검색 API 호출
  const searchStones = async (name?: string, page: number = 1) => {
    setLoading(true);
    try {
      const response = await basicInfoApi.getStones(name, page);

      if (response.data?.success && response.data.data) {
        setStones(response.data.data.content || []);
        setCurrentPage(response.data.data.page.number);
        setTotalPages(response.data.data.page.totalPages);
        setTotalElements(response.data.data.page.totalElements);
      }
    } catch (error) {
      console.error("스톤 검색 실패:", error);
      setStones([]);
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열릴 때 초기 데이터 로드
  useEffect(() => {
    if (isOpen) {
      searchStones();
    }
  }, [isOpen]);

  // 검색 핸들러
  const handleSearch = () => {
    setCurrentPage(0);
    searchStones(searchTerm || undefined, 0);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    searchStones(searchTerm || undefined, page);
  };

  // 스톤 선택 핸들러
  const handleStoneSelect = (stone: StoneSearchDto) => {
    onSelectStone(stone);
    onClose();
  };

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div className="stone-search-modal-overlay" onClick={onClose}>
      <div className="stone-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>스톤 검색</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="search-section">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="스톤명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="search-input"
            />
            <button
              className="search-btn"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? "검색 중..." : "검색"}
            </button>
          </div>
        </div>

        <div className="stones-list">
          {loading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>검색 중...</span>
            </div>
          ) : stones.length === 0 ? (
            <div className="no-results">검색 결과가 없습니다.</div>
          ) : (
            <div className="stones-table">
              <div className="table-header">
                <span className="col-name">스톤명</span>
                <span className="col-weight">무게</span>
                <span className="col-purchase">구매단가</span>
                <span className="col-grade1">1등급</span>
                <span className="col-grade2">2등급</span>
                <span className="col-grade3">3등급</span>
                <span className="col-grade4">4등급</span>
                <span className="col-action">선택</span>
              </div>

              {stones.map((stone) => {
                const grade1 = stone.stoneWorkGradePolicyDto?.find(
                  (p) => p.grade === "GRADE_1"
                );
                const grade2 = stone.stoneWorkGradePolicyDto?.find(
                  (p) => p.grade === "GRADE_2"
                );
                const grade3 = stone.stoneWorkGradePolicyDto?.find(
                  (p) => p.grade === "GRADE_3"
                );
                const grade4 = stone.stoneWorkGradePolicyDto?.find(
                  (p) => p.grade === "GRADE_4"
                );

                return (
                  <div
                    key={stone.stoneId}
                    className={`table-row ${
                      stone.stoneId === currentStoneId ? "current" : ""
                    }`}
                  >
                    <span className="col-name" title={stone.stoneName}>
                      {stone.stoneName}
                    </span>
                    <span className="col-weight">
                      {stone.stoneWeight || "0"}
                    </span>
                    <span className="col-purchase">
                      {stone.stonePurchasePrice?.toLocaleString() || "0"}
                    </span>
                    <span className="col-grade1">
                      {grade1?.laborCost?.toLocaleString() || "0"}
                    </span>
                    <span className="col-grade2">
                      {grade2?.laborCost?.toLocaleString() || "0"}
                    </span>
                    <span className="col-grade3">
                      {grade3?.laborCost?.toLocaleString() || "0"}
                    </span>
                    <span className="col-grade4">
                      {grade4?.laborCost?.toLocaleString() || "0"}
                    </span>
                    <span className="col-action">
                      <button
                        className="select-button"
                        onClick={() => handleStoneSelect(stone)}
                      >
                        선택
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPage === 0}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              이전
            </button>

            <span className="page-info">
              {currentPage + 1} / {totalPages} 페이지 (총 {totalElements}개)
            </span>

            <button
              className="page-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoneSearchModal;

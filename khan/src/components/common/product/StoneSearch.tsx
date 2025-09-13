import React, { useState, useEffect, useCallback } from "react";
import type { StoneSearchDto } from "../../../types/stone";
import { stoneApi } from "../../../../libs/api";
import { useErrorHandler } from "../../../utils/errorHandler";
import StonesList from "./StonesList";
import Pagination from "../Pagination";
import "../../../styles/components/stoneSearch.css";

interface StoneSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStone: (stone: StoneSearchDto) => void;
  currentStoneId?: string;
}

const StoneSearch: React.FC<StoneSearchProps> = ({
  isOpen,
  onClose,
  onSelectStone,
  currentStoneId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [stones, setStones] = useState<StoneSearchDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string>("");
  const { handleError } = useErrorHandler();

  // 검색 API 호출
  const performSearch = useCallback(async (term?: string, page: number = 1) => {
    setLoading(true);
    setError("");

    try {
      const response = await stoneApi.getStones(term, page);

      if (response.success && response.data) {
        const pageData = response.data.page;
        const content = response.data.content || [];

        setStones(content);
        setCurrentPage(page);
        setTotalPages(pageData.totalPages || 1);
        setTotalElements(pageData.totalElements || 0);
      }
    } catch (err: unknown) {
      handleError(err, setError);
      setStones([]);
      setCurrentPage(1);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, []); 

  // 모달이 열릴 때 초기 데이터 로드
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setCurrentPage(1);
      performSearch("", 1);
    }
  }, [isOpen, performSearch]);

  // 검색 처리
  const handleSearch = () => {
    setCurrentPage(1);
    performSearch(searchTerm, 1);
  };

  // 엔터 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setSearchTerm("");
    setStones([]);
    setCurrentPage(1);
    setTotalPages(0);
    setTotalElements(0);
    setError("");
    onClose();
  };

  // 오버레이 클릭 처리
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="search-modal-overlay stone-search-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div className="search-modal-content stone-search-modal-content">
        {/* 모달 헤더 */}
        <div className="search-modal-header stone-search-modal-header">
          <h3>스톤 검색</h3>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        {/* 검색 섹션 */}
        <div className="search-section">
          <div className="search-input-group">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="스톤명을 입력해 주세요"
              className="search-input"
            />
            <button
              onClick={handleSearch}
              className="search-btn"
              disabled={loading}
            >
              {loading ? "검색 중..." : "검색"}
            </button>
          </div>
        </div>

        {/* 결과 섹션 */}
        <div className="search-results stone-search-results">
          <div className="results-content">
            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>검색 중...</p>
              </div>
            )}

            {error && (
              <div className="error-state">
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && stones.length === 0 && (
              <div className="empty-state">
                <p>검색된 스톤이 없습니다.</p>
              </div>
            )}

            {!loading && !error && stones.length > 0 && (
              <StonesList
                stones={stones}
                onSelectStone={onSelectStone}
                currentStoneId={currentStoneId}
              />
            )}
          </div>

          {/* 페이지네이션 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            loading={loading}
            onPageChange={(page) => {
              performSearch(searchTerm, page);
            }}
            className="stone"
          />
        </div>
      </div>
    </div>
  );
};

export default StoneSearch;

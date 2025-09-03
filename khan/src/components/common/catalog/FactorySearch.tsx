import React, { useState, useEffect, useCallback } from "react";
import { basicInfoApi } from "../../../../libs/api";
import FactoryList from "./FactoryList";
import Pagination from "../Pagination";
import "../../../styles/components/FactorySearch.css";

interface FactoryData {
  factoryId?: number;
  factoryName: string;
  factoryOwnerName: string;
  factoryPhoneNumber: string;
  factoryContactNumber1: string;
  factoryContactNumber2: string;
  factoryFaxNumber: string;
  factoryNote: string;
  address: string;
  tradeType: "WEIGHT" | "PIECE";
  level: "ONE" | "TWO" | "THREE";
  goldHarryLoss: string;
}

interface FactorySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFactory: (factory: FactoryData) => void;
}

const FactorySearc: React.FC<FactorySearchModalProps> = ({
  isOpen,
  onClose,
  onSelectFactory,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [factories, setFactories] = useState<FactoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string>("");

  // 검색 API 호출
  const performSearch = useCallback(async (term?: string, page: number = 1) => {
    setLoading(true);
    setError("");

    try {
      const response = await basicInfoApi.getFactories(term, page);

      console.log("Factory API Response:", response.data);

      if (response.status === 200 && response.data) {
        if (Array.isArray(response.data)) {
          // 단순 배열 응답인 경우 - 페이지네이션 없음
          const factoriesWithId = response.data.map((factory, index) => ({
            ...factory,
            factoryId: factory.factoryId || Date.now() + index,
          }));
          setFactories(factoriesWithId);
          setCurrentPage(1);
          setTotalPages(1);
          setTotalElements(response.data.length);
        } else if (response.data.success && response.data.data) {
          // 페이지네이션이 있는 응답인 경우
          const pageData = response.data.data.page;
          const content = response.data.data.content || [];

          const factoriesWithId = content.map(
            (factory: FactoryData, index: number) => ({
              ...factory,
              factoryId: factory.factoryId || Date.now() + index,
            })
          );

          setFactories(factoriesWithId);
          setCurrentPage(page);
          setTotalPages(pageData.totalPages || 1);
          setTotalElements(pageData.totalElements || 0);
        }
      }
    } catch {
      setError("제조사 검색에 실패했습니다.");
      setFactories([]);
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
    setFactories([]);
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
    <div className="factory-search-modal-overlay" onClick={handleOverlayClick}>
      <div className="factory-search-modal-content">
        {/* 모달 헤더 */}
        <div className="factory-search-modal-header">
          <h3>제조사 검색</h3>
          <button className="close-btn" onClick={handleClose}>
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
              onKeyPress={handleKeyPress}
              placeholder="제조사명을 입력해 주세요"
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
        <div className="factory-search-results">
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

            {!loading && !error && factories.length === 0 && (
              <div className="empty-state">
                <p>검색된 제조사가 없습니다.</p>
              </div>
            )}

            {!loading && !error && factories.length > 0 && (
              <FactoryList
                factories={factories}
                onSelectFactory={onSelectFactory}
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
              setCurrentPage(page);
              performSearch(searchTerm, page);
            }}
            className="factory"
          />
        </div>
      </div>
    </div>
  );
};

export default FactorySearc;

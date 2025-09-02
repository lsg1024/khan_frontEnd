import React, { useState, useEffect, useCallback } from "react";
import type { StoneSearchDto } from "../../../types/stone";
import { basicInfoApi } from "../../../../libs/api";
import StonesList from "./StonesList";
import FactoryList from "./FactoryList";
import "../../../styles/components/UnifiedSearchModal.css";

interface FactoryData {
    factoryId?: number; // optional로 변경
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

interface UnifiedSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectStone?: (stone: StoneSearchDto) => void;
    onSelectFactory?: (factory: FactoryData) => void;
    searchType: "stone" | "factory";
    currentStoneId?: string;
}

const UnifiedSearchModal: React.FC<UnifiedSearchModalProps> = ({
    isOpen,
    onClose,
    onSelectStone,
    onSelectFactory,
    searchType,
    currentStoneId,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [stones, setStones] = useState<StoneSearchDto[]>([]);
    const [factories, setFactories] = useState<FactoryData[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [error, setError] = useState<string>("");

  // 검색 API 호출
const performSearch = useCallback(
    async (term?: string, page: number = 1) => {
    setLoading(true);
    setError("");

    try {
        if (searchType === "stone") {
        const response = await basicInfoApi.getStones(term, page);

        if (response.data?.success && response.data.data) {
            const pageData = response.data.data.page;
            const content = response.data.data.content || [];

            setStones(content);
            setCurrentPage(page);
            setTotalPages(pageData.totalPages || 1);
            setTotalElements(pageData.totalElements || 0);
        }
        } else if (searchType === "factory") {
        const response = await basicInfoApi.getFactories(term, page);

        console.log("Factory API Response:", response.data); // 디버깅용

        if (response.status === 200 && response.data) {
            if (Array.isArray(response.data)) {
            // 단순 배열 응답인 경우 - 페이지네이션 없음
            // factoryId가 없다면 factoryName 기반으로 생성
            const factoriesWithId = response.data.map((factory, index) => ({
                ...factory,
                factoryId: factory.factoryId || Date.now() + index, // 타임스탬프 + 인덱스로 고유 ID 생성
            }));
            setFactories(factoriesWithId);
            setCurrentPage(1);
            setTotalPages(1);
            setTotalElements(response.data.length);
            } else if (response.data.success && response.data.data) {
            // 페이지네이션이 있는 응답인 경우
            const pageData = response.data.data.page;
            const content = response.data.data.content || [];

            // factoryId가 없다면 타임스탬프 기반으로 생성
            const factoriesWithId = content.map(
                (factory: FactoryData, index: number) => ({
                ...factory,
                factoryId: factory.factoryId || Date.now() + index, // 타임스탬프 + 인덱스로 고유 ID 생성
                })
            );

            setFactories(factoriesWithId);
            setCurrentPage(page);
            setTotalPages(pageData.totalPages || 1);
            setTotalElements(pageData.totalElements || 0);
            }
        }
        }
    } catch {
        setError(
        `${searchType === "stone" ? "스톤" : "제조사"} 검색에 실패했습니다.`
        );
        if (searchType === "stone") {
        setStones([]);
        } else {
        setFactories([]);
        }
        setCurrentPage(1);
        setTotalPages(0);
        setTotalElements(0);
    } finally {
        setLoading(false);
    }
    },
    [searchType]
);

    // 모달이 열릴 때 초기 데이터 로드
    useEffect(() => {
        if (isOpen) {
        setSearchTerm("");
        setCurrentPage(1);
        performSearch("", 1);
        }
    }, [isOpen, searchType, performSearch]);

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

    // 페이지 변경
    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) {
        return;
        }

        setCurrentPage(page);
        performSearch(searchTerm, page);
    };

    // 이전 페이지로 이동
    const handlePrevPage = () => {
        if (currentPage > 1) {
        handlePageChange(currentPage - 1);
        }
    };

    // 다음 페이지로 이동
    const handleNextPage = () => {
        if (currentPage < totalPages) {
        handlePageChange(currentPage + 1);
        }
    };

    // 모달 닫기
    const handleClose = () => {
        setSearchTerm("");
        setStones([]);
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

    const getTitle = () => {
        return searchType === "stone" ? "스톤 검색" : "제조사 검색";
    };

    const getPlaceholder = () => {
        return searchType === "stone"
        ? "스톤명을 입력해 주세요"
        : "제조사명을 입력해 주세요";
    };

    return (
        <div className="unified-search-modal-overlay" onClick={handleOverlayClick}>
        <div className="unified-search-modal-content">
            {/* 모달 헤더 */}
            <div className="unified-search-modal-header">
            <h3>{getTitle()}</h3>
            <button className="close-btn" onClick={handleClose}>
                ×
            </button>
            </div>

            {/* 검색 섹션 (통합 컴포넌트) */}
            <div className="search-section">
            <div className="search-input-group">
                <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getPlaceholder()}
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
            <div className="unified-search-results">
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

                {!loading &&
                !error &&
                searchType === "stone" &&
                stones.length === 0 && (
                    <div className="empty-state">
                    <p>검색된 스톤이 없습니다.</p>
                    </div>
                )}

                {!loading &&
                !error &&
                searchType === "factory" &&
                factories.length === 0 && (
                    <div className="empty-state">
                    <p>검색된 제조사가 없습니다.</p>
                    </div>
                )}

                {/* 스톤 리스트 (개별 컴포넌트) */}
                {!loading &&
                !error &&
                searchType === "stone" &&
                stones.length > 0 && (
                    <StonesList
                    stones={stones}
                    onSelectStone={onSelectStone!}
                    currentStoneId={currentStoneId}
                    />
                )}

                {/* 제조사 리스트 (개별 컴포넌트) */}
                {!loading &&
                !error &&
                searchType === "factory" &&
                factories.length > 0 && (
                    <FactoryList
                    factories={factories}
                    onSelectFactory={onSelectFactory!}
                    />
                )}
                </div>

                {/* 고정 페이지네이션 */}
                <div className="pagination-footer">
                    <div className="pagination-controls">
                    <button
                        className="page-btn"
                        onClick={handlePrevPage}
                        disabled={currentPage <= 1 || loading}
                    >
                        이전
                    </button>

                    <span className="page-info">
                        {totalPages > 0 && totalElements > 0
                        ? `페이지 ${currentPage} / ${totalPages} (총 ${totalElements}개)`
                        : "데이터 없음"}
                    </span>

                    <button
                        className="page-btn"
                        onClick={handleNextPage}
                        disabled={
                        currentPage >= totalPages || totalPages <= 1 || loading
                        }
                    >
                        다음
                    </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};

export default UnifiedSearchModal;

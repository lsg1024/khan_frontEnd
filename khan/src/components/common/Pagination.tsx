import React from "react";
import type { UsePaginationReturn } from "../../hooks/usePagination";

interface PaginationProps {
    pagination: UsePaginationReturn;
    className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
    pagination,
    className = "",
    }) => {
    const {
        paginationState,
        goToPage,
        nextPage,
        prevPage,
        canGoNext,
        canGoPrev,
        getVisiblePages,
    } = pagination;
    const { currentPage } = paginationState;

    const visiblePages = getVisiblePages();

    return (
        <div className={`pagination ${className}`}>
        <button className="page-btn" onClick={prevPage} disabled={!canGoPrev}>
            이전
        </button>

        <div className="page-numbers">
            {visiblePages.map((pageNumber) => (
            <button
                key={pageNumber}
                className={`page-number ${
                currentPage === pageNumber ? "active" : ""
                }`}
                onClick={() => {
                goToPage(pageNumber);
                }}
            >
                {pageNumber}
            </button>
            ))}
        </div>

        <button className="page-btn" onClick={nextPage} disabled={!canGoNext}>
            다음
        </button>
        </div>
    );
};

export default Pagination;

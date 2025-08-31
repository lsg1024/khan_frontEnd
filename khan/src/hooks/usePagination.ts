import { useState, useCallback } from 'react';

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
}

export interface UsePaginationReturn {
    paginationState: PaginationState;
    setPaginationState: (state: Partial<PaginationState>) => void;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    reset: () => void;
    canGoNext: boolean;
    canGoPrev: boolean;
    getVisiblePages: () => number[];
}

export const usePagination = (
    initialPageSize: number = 20,
    onPageChange?: (page: number) => void
): UsePaginationReturn => {
    const [paginationState, setPaginationStateInternal] = useState<PaginationState>({
        currentPage: 1, // 기본값을 1로 설정
        totalPages: 0,
        totalElements: 0,
        pageSize: initialPageSize,
    });

    const setPaginationState = useCallback((state: Partial<PaginationState>) => {
        setPaginationStateInternal(prev => ({ ...prev, ...state }));
    }, []);

    const goToPage = useCallback((page: number) => {
        if (page >= 1 && (paginationState.totalPages === 0 || page <= paginationState.totalPages)) {
        setPaginationState({ currentPage: page });
        onPageChange?.(page);
        }
    }, [paginationState.totalPages, onPageChange, setPaginationState]);

    const nextPage = useCallback(() => {
        goToPage(paginationState.currentPage + 1);
    }, [paginationState.currentPage, goToPage]);

    const prevPage = useCallback(() => {
        goToPage(paginationState.currentPage - 1);
    }, [paginationState.currentPage, goToPage]);

    const reset = useCallback(() => {
        setPaginationState({
        currentPage: 1, // 리셋 시에도 1로 설정
        totalPages: 0,
        totalElements: 0,
        });
    }, [setPaginationState]);

    const canGoNext = paginationState.currentPage < paginationState.totalPages;
    const canGoPrev = paginationState.currentPage > 1; // 1보다 큰지 확인

    const getVisiblePages = useCallback(() => {
        const { currentPage, totalPages } = paginationState;
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1); // 1부터 시작
        }
        
        if (currentPage <= 3) {
        return Array.from({ length: maxVisible }, (_, i) => i + 1); // 1부터 시작
        }
        
        if (currentPage > totalPages - 3) {
        return Array.from({ length: maxVisible }, (_, i) => totalPages - maxVisible + i + 1);
        }
        
        return Array.from({ length: maxVisible }, (_, i) => currentPage - 2 + i);
    }, [paginationState]);

    return {
        paginationState,
        setPaginationState,
        goToPage,
        nextPage,
        prevPage,
        reset,
        canGoNext,
        canGoPrev,
        getVisiblePages,
    };
};

import { useState, useCallback } from "react";

/**
 * 검색 모달의 열림/닫힘 상태와 선택된 행을 관리하는 커스텀 훅
 * @returns {object} 모달 상태 및 제어 함수들
 */
export const useSearchModal = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedRowId, setSelectedRowId] = useState<string>("");

	/**
	 * 모달 열기
	 * @param rowId - 대상 행의 ID
	 */
	const openModal = useCallback((rowId: string) => {
		setSelectedRowId(rowId);
		setIsOpen(true);
	}, []);

	/**
	 * 모달 닫기
	 */
	const closeModal = useCallback(() => {
		setIsOpen(false);
		setSelectedRowId("");
	}, []);

	/**
	 * 선택 완료 시 모달 닫기
	 */
	const handleSelect = useCallback(() => {
		setIsOpen(false);
		setSelectedRowId("");
	}, []);

	return {
		isOpen,
		selectedRowId,
		openModal,
		closeModal,
		handleSelect,
	};
};

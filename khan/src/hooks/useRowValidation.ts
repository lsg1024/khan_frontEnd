import { useCallback } from "react";

export interface RowData {
	id: string;
	storeId?: string;
	storeName?: string;
	productId?: string;
	productName?: string;
	materialId?: string;
	materialName?: string;
	colorId?: string;
}

export type ValidationStep = "product" | "material" | "other" | "color";

interface UseRowValidationOptions {
	rows: RowData[];
	showToast: (message: string, type: string, duration: number) => void;
	openStoreSearch: (rowId: string) => void;
	openProductSearch: (rowId: string) => void;
}

interface UseRowValidationResult {
	checkStoreSelected: (rowId: string) => boolean;
	checkProductSelected: (rowId: string) => boolean;
	checkMaterialSelected: (rowId: string) => boolean;
	validateSequence: (rowId: string, currentStep: ValidationStep) => boolean;
	isRowInputEnabled: (currentIndex: number) => boolean;
}

export function useRowValidation({
	rows,
	showToast,
	openStoreSearch,
	openProductSearch,
}: UseRowValidationOptions): UseRowValidationResult {
	const checkStoreSelected = useCallback(
		(rowId: string): boolean => {
			const row = rows.find((r) => r.id === rowId);
			return !!(row?.storeId && row?.storeName);
		},
		[rows]
	);

	const checkProductSelected = useCallback(
		(rowId: string): boolean => {
			const row = rows.find((r) => r.id === rowId);
			return !!(row?.productId && row?.productName);
		},
		[rows]
	);

	const checkMaterialSelected = useCallback(
		(rowId: string): boolean => {
			const row = rows.find((r) => r.id === rowId);
			return !!(row?.materialId && row?.materialName);
		},
		[rows]
	);

	const validateSequence = useCallback(
		(rowId: string, currentStep: ValidationStep): boolean => {
			if (currentStep === "product" && !checkStoreSelected(rowId)) {
				showToast("거래처를 먼저 선택해주세요.", "warning", 3000);
				openStoreSearch(rowId);
				return false;
			}

			if (currentStep === "material" && !checkStoreSelected(rowId)) {
				showToast("거래처를 먼저 선택해주세요.", "warning", 3000);
				openStoreSearch(rowId);
				return false;
			}

			if (currentStep === "material" && !checkProductSelected(rowId)) {
				showToast("모델번호를 먼저 선택해주세요.", "warning", 3000);
				openProductSearch(rowId);
				return false;
			}

			if (currentStep === "color" && !checkStoreSelected(rowId)) {
				showToast("거래처를 먼저 선택해주세요.", "warning", 3000);
				openStoreSearch(rowId);
				return false;
			}

			if (currentStep === "other" && !checkStoreSelected(rowId)) {
				showToast("거래처를 먼저 선택해주세요.", "warning", 3000);
				openStoreSearch(rowId);
				return false;
			}

			if (currentStep === "other" && !checkProductSelected(rowId)) {
				showToast("모델번호를 먼저 선택해주세요.", "warning", 3000);
				openProductSearch(rowId);
				return false;
			}

			if (currentStep === "other" && !checkMaterialSelected(rowId)) {
				showToast("재질을 먼저 선택해주세요.", "warning", 3000);
				const materialSelect = document.querySelector(
					`[data-row-id="${rowId}"][data-field="material"]`
				) as HTMLSelectElement;
				if (materialSelect) {
					materialSelect.focus();
				}
				return false;
			}
			return true;
		},
		[
			checkStoreSelected,
			checkProductSelected,
			checkMaterialSelected,
			showToast,
			openStoreSearch,
			openProductSearch,
		]
	);

	const isRowInputEnabled = useCallback(
		(currentIndex: number): boolean => {
			if (currentIndex === 0) return true; // 첫 번째 행은 항상 입력 가능

			// 바로 직전 행의 필수값이 완성되어 있으면 입력 가능
			const prevRow = rows[currentIndex - 1];
			return !!(
				prevRow &&
				prevRow.storeId &&
				prevRow.productId &&
				prevRow.materialId &&
				prevRow.colorId
			);
		},
		[rows]
	);

	return {
		checkStoreSelected,
		checkProductSelected,
		checkMaterialSelected,
		validateSequence,
		isRowInputEnabled,
	};
}

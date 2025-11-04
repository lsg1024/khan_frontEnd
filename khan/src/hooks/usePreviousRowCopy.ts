import { useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const usePreviousRowCopy = (rows: any[], updateRow: any) => {
	// 바로 직전 행의 필수값 가져오기
	const getPreviousRowRequiredValues = useCallback(
		(currentIndex: number) => {
			if (currentIndex === 0) return null;

			// 바로 직전 행만 체크
			const prevRow = rows[currentIndex - 1];
			if (
				prevRow &&
				prevRow.id &&
				prevRow.storeId &&
				prevRow.productId &&
				prevRow.materialId
			) {
				return prevRow;
			}
			return null;
		},
		[rows]
	);

	// 필수값 자동 복사 핸들러
	const handleRequiredFieldClick = useCallback(
		(
			currentRowId: string,
			fieldType: "store" | "product" | "material" | "color"
		) => {
			const currentIndex = rows.findIndex(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(row: any) => row.id === currentRowId
			);
			const currentRow = rows[currentIndex];

			// 현재 행에 이미 값이 있으면 복사하지 않음
			if (
				(fieldType === "store" && currentRow.storeId) ||
				(fieldType === "product" && currentRow.productId) ||
				(fieldType === "material" && currentRow.materialId)
			) {
				return;
			}

			const prevValues = getPreviousRowRequiredValues(currentIndex);
			if (prevValues) {
				if (fieldType === "store") {
					updateRow(currentRowId, "storeId", prevValues.storeId);
					updateRow(currentRowId, "storeName", prevValues.storeName);
					// 거래처 해리율이 있으면 복사
					if (prevValues.storeHarry) {
						updateRow(currentRowId, "storeHarry", prevValues.storeHarry);
					}
					// 거래처 등급이 있으면 복사
					if (prevValues.storeGrade) {
						updateRow(currentRowId, "storeGrade", prevValues.storeGrade);
					}
					// 재고 등급이 있으면 복사
					if (prevValues.grade) {
						updateRow(currentRowId, "grade", prevValues.grade);
					}
				} else if (fieldType === "product") {
					updateRow(currentRowId, "productId", prevValues.productId);
					updateRow(currentRowId, "productName", prevValues.productName);

					// 공장 정보
					if (prevValues.factoryId) {
						updateRow(currentRowId, "factoryId", prevValues.factoryId);
					}
					if (prevValues.factoryName) {
						updateRow(currentRowId, "factoryName", prevValues.factoryName);
					}

					// 가격 정보
					if (prevValues.productLaborCost !== undefined) {
						updateRow(
							currentRowId,
							"productLaborCost",
							prevValues.productLaborCost
						);
					}
					if (prevValues.productAddLaborCost !== undefined) {
						updateRow(
							currentRowId,
							"productAddLaborCost",
							prevValues.productAddLaborCost
						);
					}
					if (prevValues.mainStonePrice !== undefined) {
						updateRow(
							currentRowId,
							"mainStonePrice",
							prevValues.mainStonePrice
						);
					}
					if (prevValues.stoneAddLaborCost !== undefined) {
						updateRow(
							currentRowId,
							"stoneAddLaborCost",
							prevValues.stoneAddLaborCost
						);
					}
					if (prevValues.assistanceStonePrice !== undefined) {
						updateRow(
							currentRowId,
							"assistanceStonePrice",
							prevValues.assistanceStonePrice
						);
					}

					// 수량 정보
					if (prevValues.mainStoneCount !== undefined) {
						updateRow(
							currentRowId,
							"mainStoneCount",
							prevValues.mainStoneCount
						);
					}
					if (prevValues.assistanceStoneCount !== undefined) {
						updateRow(
							currentRowId,
							"assistanceStoneCount",
							prevValues.assistanceStoneCount
						);
					}

					// 분류 정보 (재고용)
					if (prevValues.classificationId) {
						updateRow(
							currentRowId,
							"classificationId",
							prevValues.classificationId
						);
					}
					if (prevValues.classificationName) {
						updateRow(
							currentRowId,
							"classificationName",
							prevValues.classificationName
						);
					}
					if (prevValues.setTypeId) {
						updateRow(currentRowId, "setTypeId", prevValues.setTypeId);
					}
					if (prevValues.setTypeName) {
						updateRow(currentRowId, "setTypeName", prevValues.setTypeName);
					}
				} else if (fieldType === "material") {
					updateRow(currentRowId, "materialId", prevValues.materialId);
					updateRow(currentRowId, "materialName", prevValues.materialName);
				}
			}
		},
		[rows, updateRow, getPreviousRowRequiredValues]
	);

	return {
		getPreviousRowRequiredValues,
		handleRequiredFieldClick,
	};
};

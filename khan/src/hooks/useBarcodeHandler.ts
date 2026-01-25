import { useCallback, useMemo } from "react";
import { useToast } from "../components/common/toast/Toast";
import { useTenant } from "../tenant/UserTenant";
import {
	printDeliveryBarcode,
	printProductBarcode,
	type ProductBarcodeData,
} from "../service/barcodePrintService";

/**
 * 바코드 출력을 위한 커스텀 훅
 * 바코드 출력 전 검증 및 데이터 변환 로직을 통합합니다.
 */

export interface BarcodeItem {
	flowCode: string;
	productName?: string;
	materialName?: string;
	colorName?: string;
	productWeight?: number | string;
	goldWeight?: number | string;
	productSize?: string;
	mainStoneNote?: string;
	assistanceStoneNote?: string;
	assistantStoneName?: string;
}

export interface UseBarcodeHandlerOptions<T extends BarcodeItem> {
	/** 전체 아이템 목록 */
	items: T[];
	/** 아이템에서 바코드 데이터로 변환하는 함수 (선택) */
	dataMapper?: (item: T, subdomain: string) => ProductBarcodeData;
}

export interface UseBarcodeHandlerResult {
	/** 출고 바코드 출력 */
	printDeliveryBarcodes: (selectedFlowCodes: string[]) => Promise<void>;
	/** 제품 바코드 출력 */
	printProductBarcodes: (selectedFlowCodes: string[]) => Promise<void>;
	/** 프린터 설정 확인 */
	isPrinterConfigured: boolean;
	/** 프린터 이름 */
	printerName: string | null;
}

/**
 * 기본 데이터 매퍼
 */
const defaultDataMapper = <T extends BarcodeItem>(
	item: T,
	subdomain: string
): ProductBarcodeData => ({
	subdomain,
	productName: item.productName || "",
	material: item.materialName || "",
	color: item.colorName || "",
	weight: item.productWeight?.toString() || item.goldWeight?.toString() || "",
	size: item.productSize || "",
	mainStoneMemo: item.mainStoneNote || "",
	assistantStoneMemo: item.assistanceStoneNote || "",
	assistantStoneName: item.assistantStoneName || "",
	serialNumber: item.flowCode || "",
});

export function useBarcodeHandler<T extends BarcodeItem>({
	items,
	dataMapper = defaultDataMapper,
}: UseBarcodeHandlerOptions<T>): UseBarcodeHandlerResult {
	const { showToast } = useToast();
	const { tenant } = useTenant();

	// flowCode로 아이템을 빠르게 찾기 위한 Map
	const itemsMap = useMemo(() => {
		const map = new Map<string, T>();
		items.forEach((item) => {
			if (item.flowCode) {
				map.set(item.flowCode, item);
			}
		});
		return map;
	}, [items]);

	const printerName = useMemo(
		() => localStorage.getItem("preferred_printer_name"),
		[]
	);

	const isPrinterConfigured = !!printerName;

	/**
	 * 선택된 아이템 검증
	 */
	const validateSelection = useCallback(
		(selectedFlowCodes: string[], actionName: string): boolean => {
			if (selectedFlowCodes.length === 0) {
				showToast(
					`${actionName}할 항목을 선택해주세요.`,
					"warning",
					3000
				);
				return false;
			}

			if (!printerName) {
				showToast(
					"프린터를 먼저 설정해주세요. (설정 > 바코드 프린터 설정)",
					"warning",
					4000
				);
				return false;
			}

			return true;
		},
		[printerName, showToast]
	);

	/**
	 * 출고 바코드 출력
	 */
	const printDeliveryBarcodes = useCallback(
		async (selectedFlowCodes: string[]): Promise<void> => {
			if (!validateSelection(selectedFlowCodes, "출고 바코드를 출력")) {
				return;
			}

			try {
				for (const flowCode of selectedFlowCodes) {
					const item = itemsMap.get(flowCode);
					if (!item) continue;

					const barcodeData = dataMapper(item, tenant || "");
					await printDeliveryBarcode(printerName!, barcodeData);
				}

				showToast(
					`${selectedFlowCodes.length}개의 출고 바코드 출력이 완료되었습니다.`,
					"success",
					3000
				);
			} catch {
				showToast(
					"바코드 출력 중 오류가 발생했습니다.",
					"error",
					4000
				);
			}
		},
		[itemsMap, dataMapper, tenant, printerName, validateSelection, showToast]
	);

	/**
	 * 제품 바코드 출력
	 */
	const printProductBarcodes = useCallback(
		async (selectedFlowCodes: string[]): Promise<void> => {
			if (!validateSelection(selectedFlowCodes, "제품 바코드를 출력")) {
				return;
			}

			try {
				for (const flowCode of selectedFlowCodes) {
					await printProductBarcode(printerName!, {
						subdomain: tenant || "",
						productName: "",
						serialNumber: flowCode,
					});
				}

				showToast(
					`${selectedFlowCodes.length}개의 제품 바코드 출력이 완료되었습니다.`,
					"success",
					3000
				);
			} catch {
				showToast(
					"제품 바코드 출력 기능은 준비 중입니다.",
					"info",
					3000
				);
			}
		},
		[tenant, printerName, validateSelection, showToast]
	);

	return {
		printDeliveryBarcodes,
		printProductBarcodes,
		isPrinterConfigured,
		printerName,
	};
}

export default useBarcodeHandler;

import { useRef } from "react";
import { calculateStoneDetails } from "../utils/calculateStone";
import type { OrderRowData } from "../types/order";

interface UseStoneInfoManagerProps {
	orderRows: OrderRowData[];
	updateOrderRow: (
		id: string,
		field: keyof OrderRowData,
		value: unknown
	) => void;
}

export const useStoneInfoManager = ({
	orderRows,
	updateOrderRow,
}: UseStoneInfoManagerProps) => {
	const orderRowsRef = useRef<OrderRowData[]>(orderRows);

	// orderRows가 변경될 때마다 ref 업데이트
	orderRowsRef.current = orderRows;

	const openStoneInfoManager = (rowId: string) => {
		const url = `/orders/stone-info?rowId=${rowId}&origin=${window.location.origin}`;
		const NAME = `stoneInfo_${rowId}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1200,height=800";

		const popup = window.open(url, NAME, FEATURES);
		if (popup) {
			// 팝업에서 스톤 정보 요청 시 응답
			const handleMessage = (event: MessageEvent) => {
				if (
					event.data.type === "REQUEST_STONE_INFO" &&
					event.data.rowId === rowId
				) {
					// ref를 사용하여 최신 orderRows 값 참조
					const row = orderRowsRef.current.find((r) => r.id === rowId);
					popup.postMessage(
						{
							type: "STONE_INFO_DATA",
							stoneInfos: row?.stoneInfos || [],
						},
						window.location.origin
					);
				} else if (
					event.data.type === "STONE_INFO_SAVE" &&
					event.data.rowId === rowId
				) {
					// 스톤 정보 업데이트
					updateOrderRow(rowId, "stoneInfos", event.data.stoneInfos);

					// 스톤 정보 변경 시 알 단가 자동 계산
					const calculatedStoneData = calculateStoneDetails(
						event.data.stoneInfos
					);
					updateOrderRow(
						rowId,
						"mainStonePrice",
						calculatedStoneData.mainStonePrice
					);
					updateOrderRow(
						rowId,
						"assistanceStonePrice",
						calculatedStoneData.assistanceStonePrice
					);
					updateOrderRow(
						rowId,
						"stoneAddLaborCost",
						calculatedStoneData.stoneAddLaborCost
					);
					updateOrderRow(
						rowId,
						"mainStoneCount",
						calculatedStoneData.mainStoneCount
					);
					updateOrderRow(
						rowId,
						"assistanceStoneCount",
						calculatedStoneData.assistanceStoneCount
					);
					updateOrderRow(
						rowId,
						"stoneWeightTotal",
						calculatedStoneData.stoneWeight
					);
					updateOrderRow(rowId, "stoneWeight", calculatedStoneData.stoneWeight);
				}
			};

			window.addEventListener("message", handleMessage);

			// 팝업이 닫힐 때 이벤트 리스너 제거
			const checkClosed = setInterval(() => {
				if (popup.closed) {
					window.removeEventListener("message", handleMessage);
					clearInterval(checkClosed);
				}
			}, 1000);
		}
	};

	return { openStoneInfoManager };
};

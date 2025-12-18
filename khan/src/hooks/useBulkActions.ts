import { useState, useCallback, useRef } from "react";
import { orderApi } from "../../libs/api/order";
import { useErrorHandler } from "../utils/errorHandler";
import type { OrderDto } from "../types/order";
import type { SearchFilters } from "../components/common/order/OrderSearch";

interface UseBulkActionsProps {
	selectedItems: string[];
	setSelectedItems: (items: string[]) => void;
	items: OrderDto[];
	searchFilters: SearchFilters;
	currentPage: number;
	loadData: (filters: SearchFilters, page: number) => Promise<void | unknown>;
}

export const useBulkActions = ({
	selectedItems,
	setSelectedItems,
	items,
	searchFilters,
	currentPage,
	loadData,
}: UseBulkActionsProps) => {
	const { handleError } = useErrorHandler();
	const [loading, setLoading] = useState(false);

	// 출고일 변경 관련 상태
	const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
	const [newDeliveryDate, setNewDeliveryDate] = useState<Date>(new Date());

	// 팝업 참조
	const stockRegisterPopups = useRef<Map<string, Window>>(new Map());

	// 출고일 변경 모달 열기
	const handleChangeDeliveryDate = useCallback(() => {
		if (selectedItems.length !== 1) {
			alert("출고일 변경은 주문을 1개만 선택해야 합니다.");
			return;
		}

		const targetOrder = items.find(
			(item) => item.flowCode === selectedItems[0]
		);

		if (targetOrder) {
			const initialDate = targetOrder.shippingAt
				? new Date(targetOrder.shippingAt)
				: new Date();
			setNewDeliveryDate(initialDate);
		}
		setIsDatePickerOpen(true);
	}, [selectedItems, items]);

	// 출고일 변경 저장
	const handleSaveDeliveryDate = useCallback(async () => {
		if (selectedItems.length === 0) return;

		const isoDateString = newDeliveryDate.toISOString();
		const confirmMessage = `선택된 ${selectedItems.length}개 주문의 출고일을 ${
			isoDateString.split("T")[0]
		}(으)로 변경하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);
				const promises = selectedItems.map((orderId) =>
					orderApi.updateDeliveryDate(orderId, isoDateString)
				);
				await Promise.all(promises);
				alert(
					`${selectedItems.length}개 주문의 출고일이 성공적으로 변경되었습니다.`
				);

				await loadData(searchFilters, currentPage);
			} catch (err) {
				handleError(err);
			} finally {
				setIsDatePickerOpen(false);
				setLoading(false);
			}
		}
	}, [
		selectedItems,
		newDeliveryDate,
		searchFilters,
		currentPage,
		loadData,
		handleError,
	]);

	// 출고일 변경 모달 닫기
	const handleCloseDatePicker = useCallback(() => {
		setIsDatePickerOpen(false);
	}, []);

	// 재고 등록
	const handleStockRegister = useCallback(() => {
		if (selectedItems.length === 0) {
			alert("등록할 주문을 먼저 선택해주세요.");
			return;
		}

		const ids = selectedItems.join(",");
		const stock = "STOCK";

		const url = `/orders/register-stock?ids=${ids}&type=${stock}`;
		const NAME = `stockRegisterBulk`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=450";

		const existingPopup = stockRegisterPopups.current.get(NAME);

		if (existingPopup && !existingPopup.closed) {
			existingPopup.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				stockRegisterPopups.current.set(NAME, newPopup);

				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						stockRegisterPopups.current.delete(NAME);
						clearInterval(checkClosed);
					}
				}, 1000);
			}
		}
	}, [selectedItems]);

	// 판매 등록
	const handleSalesRegister = useCallback(() => {
		if (selectedItems.length === 0) {
			alert("등록할 주문을 먼저 선택해주세요.");
			return;
		}

		const ids = selectedItems.join(",");

		const url = `/sales/create?source=order&ids=${ids}`;
		const NAME = `salesRegisterBulk`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=800";

		const existingPopup = stockRegisterPopups.current.get(NAME);

		if (existingPopup && !existingPopup.closed) {
			existingPopup.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				stockRegisterPopups.current.set(NAME, newPopup);

				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						stockRegisterPopups.current.delete(NAME);
						clearInterval(checkClosed);
					}
				}, 1000);
			}
		}
	}, [selectedItems]);

	// 대량 삭제
	const handleBulkDelete = useCallback(async () => {
		if (selectedItems.length === 0) {
			alert("삭제할 값을 먼저 선택해주세요.");
			return;
		}

		const confirmMessage = `선택된 ${selectedItems.length}개 값을 삭제하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);

				const deletePromises = selectedItems.map((flowCode) =>
					orderApi.deleteOrder(flowCode)
				);

				await Promise.all(deletePromises);

				alert(
					`선택된 ${selectedItems.length}개 값이 성공적으로 삭제되었습니다.`
				);

				setSelectedItems([]);
				await loadData(searchFilters, currentPage);
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		}
	}, [
		selectedItems,
		searchFilters,
		currentPage,
		loadData,
		setSelectedItems,
		handleError,
	]);

	// 메시지 이벤트 핸들러
	const handleBulkActionMessage = useCallback(
		(event: MessageEvent) => {
			if (
				event.data &&
				(event.data.type === "STOCK_REGISTERED" ||
					event.data.type === "SALES_REGISTERED")
			) {
				setSelectedItems([]);
				loadData(searchFilters, currentPage);
			}
		},
		[setSelectedItems, loadData, searchFilters, currentPage]
	);

	// cleanup 함수
	const cleanupPopups = useCallback(() => {
		stockRegisterPopups.current.forEach((popup) => {
			if (popup && !popup.closed) {
				// 팝업 참조만 제거
			}
		});
		stockRegisterPopups.current.clear();
	}, []);

	return {
		loading,
		isDatePickerOpen,
		newDeliveryDate,
		setNewDeliveryDate,
		handleChangeDeliveryDate,
		handleSaveDeliveryDate,
		handleCloseDatePicker,
		handleStockRegister,
		handleSalesRegister,
		handleBulkDelete,
		handleBulkActionMessage,
		cleanupPopups,
		stockRegisterPopups,
	};
};

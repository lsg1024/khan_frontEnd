import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { stockApi } from "../../../libs/api/stock";
import { getLocalDate } from "../../utils/dateUtils";
import type { StockResponse } from "../../types/stock";
import { useErrorHandler } from "../../utils/errorHandler";
import Pagination from "../../components/common/Pagination";
import "../../styles/pages/sale/StockSearchPopup.css";

export const StockSearchPopup = () => {
	const [searchParams] = useSearchParams();
	const [stocks, setStocks] = useState<StockResponse[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedStock, setSelectedStock] = useState<string>("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const { handleError } = useErrorHandler();

	const storeName = searchParams.get("storeName") || "";
	const rowId = searchParams.get("rowId") || "";
	const origin = searchParams.get("origin") || "";

	useEffect(() => {
		if (storeName) {
			loadStocks(1);
		}

		// 부모 창으로부터 팝업 닫기 메시지 수신
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== origin) return;

			if (event.data.type === "CLOSE_POPUP") {
				window.close();
			}
		};

		window.addEventListener("message", handleMessage);
		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [storeName, origin]); // eslint-disable-line react-hooks/exhaustive-deps

	const loadStocks = async (page: number = 1) => {
		setLoading(true);
		try {
			const response = await stockApi.getStocks(
				"2025-01-01", // start
				getLocalDate(), // end
				"", // search
				"STOCK", // order_status - 재고 상태만 조회
				"", // factory
				storeName, // store - 거래처명으로 필터링
				"", // setType
				"", // color
				"", // sortField
				"", // sortOrder
				page, // page
				12 // size (페이지당 12개)
			);

			if (response.success && response.data) {
				const pageData = response.data.page;
				setStocks(response.data.content || []);
				setCurrentPage(page);
				setTotalPages(pageData.totalPages || 1);
				setTotalElements(pageData.totalElements || 0);
			}
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		setSelectedStock(""); // 페이지 변경 시 선택 초기화
		loadStocks(page);
	};

	const handleStockSelect = (flowCode: string) => {
		setSelectedStock(flowCode);
	};

	const handleConfirm = async () => {
		if (!selectedStock) {
			alert("재고를 선택해주세요.");
			return;
		}

		try {
			// 선택한 재고의 상세 정보 가져오기
			const response = await stockApi.getStock([selectedStock]);

			if (response.success && response.data && response.data.length > 0) {
				const stockDetail = response.data[0];

				// 부모 창으로 재고 데이터 전달
				if (window.opener) {
					window.opener.postMessage(
						{
							type: "STOCK_SELECTED",
							rowId: rowId,
							stockData: stockDetail,
						},
						origin
					);
				}

				window.close();
			}
		} catch (err) {
			handleError(err);
		}
	};

	const handleCancel = () => {
		window.close();
	};

	if (loading) {
		return (
			<div className="stock-search-popup">
				<div className="loading-container">
					<div className="spinner"></div>
					<p>재고를 불러오는 중...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="stock-search-popup">
			<div className="popup-header">
				<h2>재고 선택 - {storeName}</h2>
			</div>

			<div className="popup-content">
				{stocks.length === 0 ? (
					<div className="empty-state">
						<p>해당 거래처의 재고가 없습니다.</p>
					</div>
				) : (
					<table className="stock-search-table">
						<thead>
							<tr>
								<th>No</th>
								<th>선택</th>
								<th>시리얼</th>
								<th>거래처</th>
								<th>주문</th>
								<th>등록일</th>
								<th className="stock-table-twin">사이즈/비고</th>
								<th>재질</th>
								<th>색상</th>
								<th className="stock-table-twin">알 메모</th>
								<th colSpan={2}>알 개수</th>
								<th colSpan={2}>중량</th>
								<th colSpan={2}>상품 단가</th>
								<th colSpan={2}>보조석</th>
								<th colSpan={3}>알단가</th>
								<th colSpan={2}>매입가</th>
							</tr>
							<tr>
								<th></th>
								<th></th>
								<th></th>
								<th></th>
								<th>상태</th>
								<th></th>
								<th></th>
								<th></th>
								<th></th>
								<th>메인/보조</th>
								<th>메인</th>
								<th>보조</th>
								<th>금</th>
								<th>스톤</th>
								<th>메인</th>
								<th>추가</th>
								<th>이름</th>
								<th>상태</th>
								<th>메인</th>
								<th>보조</th>
								<th>추가</th>
								<th>상품</th>
								<th>스톤</th>
							</tr>
						</thead>
						<tbody>
							{stocks.map((stock, index) => {
								const rowNumber = (currentPage - 1) * 12 + index + 1;

								// originStatus와 currentStatus 조합으로 CSS 클래스 결정
								const getRowClass = (
									originStatus: string,
									currentStatus: string
								) => {
									const origin = originStatus || "";
									const current = currentStatus || "";

									// 일반 + 재고 = 회색
									if (origin === "일반" && current === "재고") {
										return "stock-row-general-stock";
									}
									// 일반 + 대여 = 주황색
									if (origin === "일반" && current === "대여") {
										return "stock-row-general-rental";
									}
									// 주문 + 재고 = 초록색
									if (origin === "주문" && current === "재고") {
										return "stock-row-order-stock";
									}
									// 주문 + 대여 = 주황색
									if (origin === "주문" && current === "대여") {
										return "stock-row-order-rental";
									}
									// 수리 + 재고 = 노란색
									if (origin === "수리" && current === "재고") {
										return "stock-row-repair-stock";
									}

									return "stock-row";
								};

								const isSelected = selectedStock === stock.flowCode;
								const rowClass = `${getRowClass(
									stock.originStatus,
									stock.currentStatus
								)} ${isSelected ? "selected-row" : ""}`;

								return (
									<tr
										key={stock.flowCode}
										className={rowClass}
										onClick={() => handleStockSelect(stock.flowCode)}
									>
										<td className="no-cell">{rowNumber}</td>
										<td className="no-cell">
											<input
												type="radio"
												name="stockSelect"
												checked={isSelected}
												onChange={() => handleStockSelect(stock.flowCode)}
												onClick={(e) => e.stopPropagation()}
											/>
										</td>
										<td className="serial-cell" title={stock.flowCode}>
											{stock.flowCode}
										</td>
										<td className="serial-cell" title={stock.storeName}>
											{stock.storeName}
										</td>
										<td className="order-cell">
											<div className="info-row-order">
												<span>{stock.originStatus}</span>
											</div>
											<div className="info-row-order">
												<span style={{ color: "red" }}>
													{stock.currentStatus || "-"}
												</span>
											</div>
										</td>
										<td className="date-cell">
											<div className="info-row-order">
												<span>
													{stock.createAt
														? (() => {
																const date = new Date(stock.createAt);
																const year = date.getFullYear();
																const month = String(
																	date.getMonth() + 1
																).padStart(2, "0");
																const day = String(date.getDate()).padStart(
																	2,
																	"0"
																);
																return `${year}-${month}-${day}`;
														  })()
														: "-"}
												</span>
											</div>
										</td>
										<td
											className="size-note-content"
											title={`사이즈: ${stock.productSize || "-"}\n비고: ${
												stock.stockNote || "-"
											}`}
										>
											<div className="info-row-order">
												<span>{stock.productSize || "-"}</span>
											</div>
											<div className="info-row-order">
												<span>{stock.stockNote || "-"}</span>
											</div>
										</td>
										<td
											className={`material-cell ${
												stock.materialName === "18K"
													? "material-name-18k"
													: stock.materialName === "24K"
													? "material-name-24k"
													: ""
											}`}
											title={stock.materialName || "-"}
										>
											{stock.materialName || "-"}
										</td>
										<td className="color-cell" title={stock.colorName || "-"}>
											{stock.colorName || "-"}
										</td>
										<td
											className="stone-note-content"
											title={`메인: ${stock.mainStoneNote || "-"}\n보조: ${
												stock.assistanceStoneNote || "-"
											}`}
										>
											<div className="main-note">
												{stock.mainStoneNote || "-"}
											</div>
											<div className="assistance-note">
												{stock.assistanceStoneNote || "-"}
											</div>
										</td>
										<td
											className="main-quantity-cell"
											title={stock.mainStoneQuantity?.toString() || "-"}
										>
											{stock.mainStoneQuantity || "-"}
										</td>
										<td
											className="assistance-quantity-cell"
											title={stock.assistanceStoneQuantity?.toString() || "-"}
										>
											{stock.assistanceStoneQuantity || "-"}
										</td>
										<td
											className="gold-weight-cell"
											title={stock.goldWeight || "-"}
										>
											{stock.goldWeight || "-"}
										</td>
										<td
											className="stone-weight-cell"
											title={stock.stoneWeight || "-"}
										>
											{stock.stoneWeight || "-"}
										</td>
										<td
											className="product-labor-cost-cell"
											title={
												stock.productLaborCost
													? stock.productLaborCost.toLocaleString()
													: "-"
											}
										>
											{stock.productLaborCost
												? stock.productLaborCost.toLocaleString()
												: "-"}
										</td>
										<td
											className="add-labor-cost-cell"
											title={
												stock.productAddLaborCost
													? stock.productAddLaborCost.toLocaleString()
													: "-"
											}
										>
											{stock.productAddLaborCost
												? stock.productAddLaborCost.toLocaleString()
												: "-"}
										</td>
										<td
											className="assistant-stone-name-cell"
											title={stock.assistantStoneName || "-"}
										>
											{stock.assistantStoneName || "-"}
										</td>
										<td
											className="assistant-stone-cell"
											title={stock.assistantStone ? "입고 완료" : "미입고"}
										>
											<span
												className={`status ${
													stock.assistantStone ? "active" : "inactive"
												}`}
											>
												{stock.assistantStone ? "Y" : "N"}
											</span>
										</td>
										<td
											className="main-stone-labor-cost-cell"
											title={
												stock.mainStoneLaborCost
													? stock.mainStoneLaborCost.toLocaleString()
													: "-"
											}
										>
											{stock.mainStoneLaborCost
												? stock.mainStoneLaborCost.toLocaleString()
												: "-"}
										</td>
										<td
											className="assistance-stone-labor-cost-cell"
											title={
												stock.assistanceStoneLaborCost
													? stock.assistanceStoneLaborCost.toLocaleString()
													: "-"
											}
										>
											{stock.assistanceStoneLaborCost
												? stock.assistanceStoneLaborCost.toLocaleString()
												: "-"}
										</td>
										<td
											className="stone-add-labor-cost-cell"
											title={
												stock.stoneAddLaborCost
													? stock.stoneAddLaborCost.toLocaleString()
													: "-"
											}
										>
											{stock.stoneAddLaborCost
												? stock.stoneAddLaborCost.toLocaleString()
												: "-"}
										</td>
										<td
											className="product-purchase-cost-cell"
											title={
												stock.productPurchaseCost
													? stock.productPurchaseCost.toLocaleString()
													: "-"
											}
										>
											{stock.productPurchaseCost
												? stock.productPurchaseCost.toLocaleString()
												: "-"}
										</td>
										<td
											className="stone-purchase-cost-cell"
											title={
												stock.stonePurchaseCost
													? stock.stonePurchaseCost.toLocaleString()
													: "-"
											}
										>
											{stock.stonePurchaseCost
												? stock.stonePurchaseCost.toLocaleString()
												: "-"}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}

				{/* 페이지네이션 */}
				{stocks.length > 0 && (
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={handlePageChange}
					/>
				)}
			</div>

			{/* 하단 버튼 */}
			<div className="form-actions">
				<button
					className="btn-cancel"
					onClick={handleCancel}
					disabled={loading}
				>
					취소
				</button>
				<button
					className="btn-submit"
					onClick={handleConfirm}
					disabled={loading}
				>
					{loading ? "처리 중..." : "등록"}
				</button>
			</div>
		</div>
	);
};

export default StockSearchPopup;

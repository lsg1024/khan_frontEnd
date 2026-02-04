import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { saleApi } from "../../../libs/api/saleApi";
import type { SalePrintResponse, SaleItem } from "../../types/saleDto";
import { useErrorHandler } from "../../utils/errorHandler";
import {
	calculatePureGoldWeightWithHarry,
	getGoldDonFromWeight,
} from "../../utils/goldUtils";
import { AuthImage } from "../../components/common/AuthImage";
import "../../styles/pages/sale/SalePrintPage.css";

export const SalePrintPage = () => {
	const { saleCode } = useParams<{ saleCode: string }>();
	const [loading, setLoading] = useState(true);
	const [printData, setPrintData] = useState<SalePrintResponse | null>(null);
	const { handleError } = useErrorHandler();
	const printRef = useRef<HTMLDivElement>(null);

	// 인쇄 핸들러
	const handlePrint = useReactToPrint({
		contentRef: printRef,
		documentTitle: `거래명세서_${printData?.saleItemResponses?.[0]?.storeName}_${printData?.saleItemResponses?.[0]?.storeCode}`,
	});

	// 데이터 로드
	useEffect(() => {
		const loadPrintData = async () => {
			if (!saleCode) {
				alert("거래번호가 없습니다.");
				window.close();
				return;
			}

			try {
				setLoading(true);
				const response = await saleApi.getSalePrint(saleCode);

				if (response.success && response.data) {
					setPrintData(response.data);
				} else {
					handleError(new Error("거래명세서 데이터를 불러올 수 없습니다."));
					window.close();
				}
			} catch (err) {
				handleError(err);
				window.close();
			} finally {
				setLoading(false);
			}
		};

		loadPrintData();
	}, [saleCode]); // eslint-disable-line react-hooks/exhaustive-deps

	// 재질별 총중량 계산
	const calculateTotalWeightByMaterial = (items: SaleItem[]) => {
		const materialWeights: Record<string, number> = {};

		items.forEach((item) => {
			if (item.materialName) {
				if (!materialWeights[item.materialName]) {
					materialWeights[item.materialName] = 0;
				}
				materialWeights[item.materialName] += item.goldWeight || 0;
			}
		});

		return materialWeights;
	};

	// 거래명세서 단일 컴포넌트
	const InvoiceTemplate = ({
		pageNumber,
		totalPages,
		items,
	}: {
		pageNumber: number;
		totalPages: number;
		items: SaleItem[];
	}) => {
		if (
			!printData ||
			!printData.saleItemResponses ||
			printData.saleItemResponses.length === 0
		)
			return null;

		const saleData = printData.saleItemResponses[0]; // 첫 번째 거래 정보 사용
		const materialWeights = calculateTotalWeightByMaterial(items);
		const harry = saleData.storeHarry;

		// 서브도메인 추출
		const subdomain = window.location.hostname.split(".")[0];

		// 총 합계 계산
		const totalProductCount = items.length;

		const totalLaborCost = items.reduce(
			(sum, item) =>
				sum +
				(item.totalProductLaborCost || 0) +
				(item.mainStoneLaborCost || 0) +
				(item.assistanceStoneLaborCost || 0) +
				(item.stoneAddLaborCost || 0),
			0
		);
		const totalSubtotal = totalLaborCost; // VAT 별도

		return (
			<div className="invoice-container">
				{/* 헤더 */}
				<div className="invoice-header">
					<h1 className="invoice-title">{saleData.storeName} 거래 명세서</h1>
					<div className="invoice-subtitle">
						<span>
							일자:
							{saleData.createAt
								? (() => {
										const date = new Date(saleData.createAt);
										const year = String(date.getFullYear()).slice(-2); // 연도 2자리
										const month = String(date.getMonth() + 1).padStart(2, "0");
										const day = String(date.getDate()).padStart(2, "0");
										return `${year}-${month}-${day}`;
								  })()
								: "-"}
						</span>
						<span>거래처: {saleData.storeName}</span>
						<span>공급자: {subdomain}</span>
						<span>No: {saleData.storeCode}</span>
					</div>
				</div>

				{/* 상품 테이블 */}
				<table className="invoice-table">
					<thead>
						<tr>
							<th rowSpan={2}>No</th>
							<th rowSpan={2}>사진 모델번호</th>
							<th rowSpan={2}>함량 색상</th>
							<th colSpan={2}>중량</th>
							<th rowSpan={2}>알</th>
							<th rowSpan={2}>상품 단가</th>
							<th rowSpan={2}>중/보/추</th>
							<th rowSpan={2}>공임합</th>
							<th rowSpan={3}>
								소계
								<br />
								VAT별도
							</th>
						</tr>
						<tr>
							<th>금</th>
							<th>알</th>
						</tr>
					</thead>
					<tbody>
						{items.map((item, index) => {
							const totalStoneCount =
								(item.mainStoneQuantity || 0) +
								(item.assistanceStoneQuantity || 0);
							const laborSum =
								(item.totalProductLaborCost || 0) +
								(item.mainStoneLaborCost || 0) +
								(item.assistanceStoneLaborCost || 0) +
								(item.stoneAddLaborCost || 0);
							const subtotal = laborSum;

							return (
								<tr key={index}>
									<td style={{ width: "20px" }}>{index + 1}</td>
									<td>
										<div
											className="print-product"
											style={{ minWidth: "130px", padding: "1px 2px" }}
										>
											<div className="product-image-cell">
												<AuthImage
													imagePath={item.imagePath}
													alt={item.productName}
													style={{
														width: "100%",
														height: "100%",
														objectFit: "cover",
													}}
												/>
											</div>
											<div className="product-info-cell">
												<div>{item.productName}</div>
												<div className="note-text">{item.note || ""}</div>
											</div>
										</div>
									</td>
									<td style={{ padding: "0px 2px" }}>
										<div className="material-color">
											{item.materialName || ""} {item.colorName || ""}
										</div>
									</td>
									<td style={{ width: "40px", padding: "0px 2px" }}>
										{item.goldWeight?.toFixed(3) || "-"}
									</td>
									<td style={{ width: "40px", padding: "0px 2px" }}>
										{item.stoneWeight?.toFixed(3) || "-"}
									</td>
									<td style={{ width: "20px", padding: "0px 2px" }}>
										{totalStoneCount || "-"}
									</td>
									<td style={{ width: "50px", padding: "0px 2px" }}>
										{item.totalProductLaborCost?.toLocaleString() || "-"}
									</td>
									<td style={{ width: "50px", padding: "0px 2px" }}>
										{(() => {
											const itemStoneLaborCost =
												(item.mainStoneLaborCost || 0) +
												(item.assistanceStoneLaborCost || 0) +
												(item.stoneAddLaborCost || 0);
											return itemStoneLaborCost !== 0
												? itemStoneLaborCost.toLocaleString()
												: "-";
										})()}
									</td>
									<td style={{ width: "70px", padding: "0px 2px" }}>
										{laborSum.toLocaleString()}
									</td>
									<td style={{ width: "70px", padding: "0px 2px" }}>
										{subtotal.toLocaleString()}
									</td>
								</tr>
							);
						})}
						{/* 빈 행 채우기 (10개 미만일 경우) */}
						{Array.from({ length: 10 - items.length }).map((_, index) => (
							<tr key={`empty-${index}`}>
								<td>{items.length + index + 1}</td>
								<td></td>
								<td></td>
								<td></td>
								<td></td>
								<td></td>
								<td></td>
								<td></td>
								<td></td>
								<td></td>
							</tr>
						))}
					</tbody>
					<tfoot>
						<tr className="total-row">
							<td colSpan={2}>
								<div className="material-weights">
									{Object.entries(materialWeights)
										// eslint-disable-next-line @typescript-eslint/no-unused-vars
										.filter(([_, weight]) => weight !== 0)
										.map(([material, weight]) => (
											<div key={material}>
												{material}: {weight.toFixed(3)}g
											</div>
										))}
								</div>
							</td>
							<td colSpan={2}>상품 {totalProductCount}개</td>
							<td colSpan={4}></td>
							<td colSpan={1}>{totalLaborCost.toLocaleString()}</td>
							<td>{totalSubtotal.toLocaleString()}</td>
						</tr>
					</tfoot>
				</table>

				{/* 페이지 번호 */}
				<div style={{ fontSize: "10px" }}>
					{pageNumber} / {totalPages}
				</div>

				{/* 푸터 영역 (미수금 계산) */}
				<div className="invoice-footer">
					<table className="payment-history-table">
						<thead>
							<tr>
								<th className="payment-label-col"></th>
								<th className="payment-gold-col">순금(g)</th>
								<th className="payment-don-col">순금(돈)</th>
								<th className="payment-amount-col">공임 및 현금</th>
								<th className="payment-date-col"></th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td className="payment-label">최근 결제</td>
								<td>-</td>
								<td>-</td>
								<td>-</td>
								<td>
									{printData.lastSaleDate
										? (() => {
												const date = new Date(printData.lastSaleDate);
												const year = String(date.getFullYear()).slice(-2); // 연도 2자리
												const month = String(date.getMonth() + 1).padStart(
													2,
													"0"
												);
												const day = String(date.getDate()).padStart(2, "0");
												return `${year}-${month}-${day}`;
										  })()
										: "-"}
								</td>
							</tr>
							<tr className="highlight-row">
								<td className="payment-label">거래 전 미수</td>
								<td>{printData.previousGoldBalance || "0"}g</td>
								<td>
									{getGoldDonFromWeight(
										Number(printData.previousGoldBalance) || 0
									)}
									돈
								</td>
								<td>
									{printData.previousMoneyBalance
										? Number(printData.previousMoneyBalance).toLocaleString()
										: "-"}
								</td>
								<td></td>
							</tr>
							<tr>
								<td className="payment-label">판 매</td>
								<td>
									{(() => {
										const totalPureGold = Object.entries(
											materialWeights
										).reduce((sum, [material, weight]) => {
											return (
												sum +
												calculatePureGoldWeightWithHarry(
													weight,
													material,
													harry
												)
											);
										}, 0);
										return totalPureGold !== 0 ? totalPureGold.toFixed(3) : "-";
									})()}
								</td>
								<td>
									{(() => {
										const totalPureGold = Object.entries(
											materialWeights
										).reduce((sum, [material, weight]) => {
											return (
												sum +
												calculatePureGoldWeightWithHarry(
													weight,
													material,
													harry
												)
											);
										}, 0);
										const don = getGoldDonFromWeight(totalPureGold);
										return don !== 0 ? don.toFixed(3) : "-";
									})()}
								</td>
								<td>
									{totalLaborCost !== 0 ? totalLaborCost.toLocaleString() : "-"}
								</td>
								<td></td>
							</tr>
							<tr>
								<td className="payment-label">반 품</td>
								<td>
									{(() => {
										const allSaleItems =
											printData.saleItemResponses[0]?.saleItems || [];
										const returnItems = allSaleItems.filter(
											(item) => item.saleType === "반품"
										);
										const returnGold = returnItems.reduce(
											(sum, item) => sum + (item.goldWeight || 0),
											0
										);
										return returnGold !== 0 ? returnGold.toFixed(3) : "-";
									})()}
								</td>
								<td>
									{(() => {
										const allSaleItems =
											printData.saleItemResponses[0]?.saleItems || [];
										const returnItems = allSaleItems.filter(
											(item) => item.saleType === "반품"
										);
										const returnPureGold = returnItems.reduce((sum, item) => {
											return (
												sum +
												calculatePureGoldWeightWithHarry(
													item.goldWeight || 0,
													item.materialName || "24K",
													harry
												)
											);
										}, 0);
										return returnPureGold !== 0
											? returnPureGold.toFixed(3)
											: "-";
									})()}
								</td>
								<td>
									{(() => {
										const allSaleItems =
											printData.saleItemResponses[0]?.saleItems || [];
										const returnItems = allSaleItems.filter(
											(item) => item.saleType === "반품"
										);
										const returnMoney = returnItems.reduce(
											(sum, item) =>
												sum +
												(item.totalProductLaborCost || 0) +
												(item.mainStoneLaborCost || 0) +
												(item.assistanceStoneLaborCost || 0),
											0
										);
										return returnMoney !== 0
											? returnMoney.toLocaleString()
											: "-";
									})()}
								</td>
								<td></td>
							</tr>
							<tr>
								<td className="payment-label">D C</td>
								<td>
									{(() => {
										const allSaleItems =
											printData.saleItemResponses[0]?.saleItems || [];
										const dcItems = allSaleItems.filter(
											(item) => item.saleType === "DC"
										);
										const dcGold = dcItems.reduce(
											(sum, item) => sum + (item.goldWeight || 0),
											0
										);
										return dcGold !== 0 ? dcGold.toFixed(3) : "-";
									})()}
								</td>
								<td>
									{(() => {
										const allSaleItems =
											printData.saleItemResponses[0]?.saleItems || [];
										const returnItems = allSaleItems.filter(
											(item) => item.saleType === "DC"
										);
										const returnPureGold = returnItems.reduce((sum, item) => {
											return (
												sum +
												calculatePureGoldWeightWithHarry(
													item.goldWeight || 0,
													item.materialName || "24K",
													harry
												)
											);
										}, 0);
										return getGoldDonFromWeight(returnPureGold) !== 0
											? getGoldDonFromWeight(returnPureGold.toFixed(3))
											: "-";
									})()}
								</td>
								<td>
									{(() => {
										const allSaleItems =
											printData.saleItemResponses[0]?.saleItems || [];
										const dcItems = allSaleItems.filter(
											(item) => item.saleType === "DC"
										);
										const dcMoney = dcItems.reduce(
											(sum, item) =>
												sum +
												(item.totalProductLaborCost || 0) +
												(item.mainStoneLaborCost || 0) +
												(item.assistanceStoneLaborCost || 0),
											0
										);
										return dcMoney !== 0 ? dcMoney.toLocaleString() : "-";
									})()}
								</td>
								<td></td>
							</tr>
							<tr>
								<td className="payment-label">결 제</td>
								<td>
									{(() => {
										const allSaleItems =
											printData.saleItemResponses[0]?.saleItems || [];
										const paymentItems = allSaleItems.filter(
											(item) =>
												item.saleType === "결제" ||
												item.saleType === "WG" ||
												item.saleType === "결통"
										);
										const paymentGold = paymentItems.reduce(
											(sum, item) => sum + (item.goldWeight || 0),
											0
										);
										return paymentGold !== 0 ? paymentGold.toFixed(3) : "-";
									})()}
								</td>
								<td>
									{(() => {
										const allSaleItems =
											printData.saleItemResponses[0]?.saleItems || [];
										const paymentItems = allSaleItems.filter(
											(item) =>
												item.saleType === "결제" ||
												item.saleType === "WG" ||
												item.saleType === "결통"
										);
										const paymentPureGold = paymentItems.reduce((sum, item) => {
											return (
												sum +
												calculatePureGoldWeightWithHarry(
													item.goldWeight || 0,
													item.materialName || "24K",
													harry
												)
											);
										}, 0);
										return getGoldDonFromWeight(paymentPureGold) || "-";
									})()}
								</td>
								<td>
									{(() => {
										const allSaleItems =
											printData.saleItemResponses[0]?.saleItems || [];
										const paymentItems = allSaleItems.filter(
											(item) =>
												item.saleType === "결제" ||
												item.saleType === "WG" ||
												item.saleType === "결통"
										);
										const paymentMoney = paymentItems.reduce(
											(sum, item) =>
												sum +
												(item.totalProductLaborCost || 0) +
												(item.mainStoneLaborCost || 0) +
												(item.assistanceStoneLaborCost || 0),
											0
										);
										return paymentMoney !== 0
											? paymentMoney.toLocaleString()
											: "-";
									})()}
								</td>
								<td></td>
							</tr>
							<tr className="highlight-row total-row">
								<td className="payment-label">거래 후 미수</td>
								<td>
									{(() => {
										const allSaleItems =
											printData.saleItemResponses[0]?.saleItems || [];
										const beforeGold = Number(
											printData.previousGoldBalance || 0
										);
										// 판매의 순금 중량 (해리 적용)
										const currentPureGold = Object.entries(
											materialWeights
										).reduce((sum, [material, weight]) => {
											return (
												sum +
												calculatePureGoldWeightWithHarry(
													weight,
													material,
													harry
												)
											);
										}, 0);
										const returnGold = allSaleItems
											.filter((item) => item.saleType === "반품")
											.reduce((sum, item) => {
												return (
													sum +
													calculatePureGoldWeightWithHarry(
														item.goldWeight || 0,
														item.materialName || "24K",
														harry
													)
												);
											}, 0);
										const dcGold = allSaleItems
											.filter((item) => item.saleType === "DC")
											.reduce((sum, item) => {
												return (
													sum +
													calculatePureGoldWeightWithHarry(
														item.goldWeight || 0,
														item.materialName || "24K",
														harry
													)
												);
											}, 0);
										const paymentItems = allSaleItems.filter(
											(item) =>
												item.saleType === "결제" ||
												item.saleType === "WG" ||
												item.saleType === "결통"
										);
										const paymentGold = paymentItems.reduce((sum, item) => {
											return (
												sum +
												calculatePureGoldWeightWithHarry(
													item.goldWeight || 0,
													item.materialName || "24K",
													harry
												)
											);
										}, 0);

										return (
											beforeGold +
											currentPureGold +
											returnGold +
											dcGold +
											paymentGold
										).toFixed(3);
									})()}
								</td>
								<td>
									{(() => {
										const allSaleItems =
											printData.saleItemResponses[0]?.saleItems || [];
										const beforeGold = Number(
											printData.previousGoldBalance || 0
										);
										// 판매의 순금 중량 (해리 적용)
										const currentPureGold = Object.entries(
											materialWeights
										).reduce((sum, [material, weight]) => {
											return (
												sum +
												calculatePureGoldWeightWithHarry(
													weight,
													material,
													harry
												)
											);
										}, 0);
										const returnGold = allSaleItems
											.filter((item) => item.saleType === "반품")
											.reduce((sum, item) => {
												return (
													sum +
													calculatePureGoldWeightWithHarry(
														item.goldWeight || 0,
														item.materialName || "24K",
														harry
													)
												);
											}, 0);
										const dcGold = allSaleItems
											.filter((item) => item.saleType === "DC")
											.reduce((sum, item) => {
												return (
													sum +
													calculatePureGoldWeightWithHarry(
														item.goldWeight || 0,
														item.materialName || "24K",
														harry
													)
												);
											}, 0);
										const paymentGold = allSaleItems
											.filter(
												(item) =>
													item.saleType === "결제" ||
													item.saleType === "WG" ||
													item.saleType === "결통"
											)
											.reduce((sum, item) => {
												return (
													sum +
													calculatePureGoldWeightWithHarry(
														item.goldWeight || 0,
														item.materialName || "24K",
														harry
													)
												);
											}, 0);
										const totalGold =
											beforeGold +
											currentPureGold +
											returnGold +
											dcGold +
											paymentGold;
										return getGoldDonFromWeight(totalGold) + "돈";
									})()}
								</td>
								<td>
									{(() => {
										const allSaleItems =
											printData.saleItemResponses[0]?.saleItems || [];
										const beforeMoney = Number(
											printData.previousMoneyBalance || 0
										);
										const currentMoney = totalLaborCost;
										const returnMoney = allSaleItems
											.filter((item) => item.saleType === "반품")
											.reduce(
												(sum, item) =>
													sum +
													(item.totalProductLaborCost || 0) +
													(item.mainStoneLaborCost || 0) +
													(item.assistanceStoneLaborCost || 0),
												0
											);
										const dcMoney = allSaleItems
											.filter((item) => item.saleType === "DC")
											.reduce(
												(sum, item) =>
													sum +
													(item.totalProductLaborCost || 0) +
													(item.mainStoneLaborCost || 0) +
													(item.assistanceStoneLaborCost || 0),
												0
											);
										const paymentMoney = allSaleItems
											.filter(
												(item) =>
													item.saleType === "결제" ||
													item.saleType === "WG" ||
													item.saleType === "결통"
											)
											.reduce(
												(sum, item) =>
													sum +
													(item.totalProductLaborCost || 0) +
													(item.mainStoneLaborCost || 0) +
													(item.assistanceStoneLaborCost || 0),
												0
											);
										return (
											beforeMoney +
											currentMoney +
											returnMoney +
											dcMoney +
											paymentMoney
										).toLocaleString();
									})()}
								</td>
								<td></td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		);
	};

	if (loading) {
		return (
			<div className="print-loading">
				<div className="spinner"></div>
				<p>거래명세서를 불러오는 중...</p>
			</div>
		);
	}

	if (!printData) {
		return (
			<div className="print-error">
				<p>거래명세서 데이터를 불러올 수 없습니다.</p>
			</div>
		);
	}

	return (
		<div className="print-page">
			<div ref={printRef}>
				{(() => {
					// 판매 타입만 필터링하여 상품 테이블에 표시
					const allSaleItems = printData.saleItemResponses[0]?.saleItems || [];
					const saleOnlyItems = allSaleItems.filter(
						(item) => item.saleType === "판매"
					);
					const itemsPerPage = 10;
					const totalPages = Math.max(
						1,
						Math.ceil(saleOnlyItems.length / itemsPerPage)
					); // 최소 1페이지

					const pages = [];
					for (let i = 0; i < totalPages; i++) {
						const startIndex = i * itemsPerPage;
						const endIndex = startIndex + itemsPerPage;
						const pageItems = saleOnlyItems.slice(startIndex, endIndex);
						const pageNumber = i + 1;

						pages.push(
							<div className="print-content" key={`page-${i}`}>
								{/* 매장용 */}
								<InvoiceTemplate
									pageNumber={pageNumber}
									totalPages={totalPages}
									items={pageItems}
								/>

								{/* 판매용 */}
								<InvoiceTemplate
									pageNumber={pageNumber}
									totalPages={totalPages}
									items={pageItems}
								/>

								{/* 다음 페이지가 있으면 구분선 추가 */}
								{i < totalPages - 1 && <div className="page-break"></div>}
							</div>
						);
					}

					return pages;
				})()}
			</div>
			<div className="print-controls">
				<button onClick={() => window.close()} className="btn-cancel">
					닫기
				</button>
				<button onClick={handlePrint} className="btn-submit">
					인쇄하기
				</button>
			</div>
		</div>
	);
};

export default SalePrintPage;

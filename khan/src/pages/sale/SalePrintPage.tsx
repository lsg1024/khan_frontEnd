import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { saleApi } from "../../../libs/api/sale";
import type { SaleItemResponse, SaleItem } from "../../types/sale";
import { useErrorHandler } from "../../utils/errorHandler";
import { getGoldTransferWeight } from "../../utils/goldUtils";
import "../../styles/pages/sale/SalePrintPage.css";

export const SalePrintPage = () => {
	const { saleCode } = useParams<{ saleCode: string }>();
	const [loading, setLoading] = useState(true);
	const [printData, setPrintData] = useState<SaleItemResponse | null>(null);
	const { handleError } = useErrorHandler();
	const printRef = useRef<HTMLDivElement>(null);

	// 인쇄 핸들러
	const handlePrint = useReactToPrint({
		contentRef: printRef,
		documentTitle: `거래명세서_${printData?.storeName}_${printData?.storeCode}`,
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

				if (response.success && response.data && response.data.length > 0) {
					setPrintData(response.data[0]);
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
	const InvoiceTemplate = ({ title }: { title: string }) => {
		if (!printData) return null;

		const items = printData.saleItems.slice(0, 10); // 최대 10개
		const materialWeights = calculateTotalWeightByMaterial(items);

		// 총 합계 계산
		const totalProductCount = items.length;
		const totalLaborCost = items.reduce(
			(sum, item) =>
				sum +
				(item.totalProductLaborCost || 0) +
				(item.mainStoneLaborCost || 0) +
				(item.assistanceStoneLaborCost || 0),
			0
		);
		const totalSubtotal = totalLaborCost; // VAT 별도

		return (
			<div className="invoice-container">
				{/* 헤더 */}
				<div className="invoice-header">
					<h1 className="invoice-title">{printData.storeName} 거래 명세서</h1>
					<div className="invoice-subtitle">
						<span>
							일자:{" "}
							{printData.createAt
								? (() => {
										const date = new Date(printData.createAt);
										const year = String(date.getFullYear()).slice(-2); // 연도 2자리
										const month = String(date.getMonth() + 1).padStart(2, "0");
										const day = String(date.getDate()).padStart(2, "0");
										return `${year}-${month}-${day}`;
								  })()
								: "-"}
						</span>
						<span>거래처: {printData.storeName}</span>
						<span>공급자: {printData.createBy}</span>
						<span>No: {printData.storeCode}</span>
						<span>전화: -</span>
						<span>팩스: -</span>
					</div>
					<div className="invoice-copy-label">{title}</div>
				</div>

				{/* 상품 테이블 */}
				<table className="invoice-table">
					<thead>
						<tr>
							<th rowSpan={2} style={{ width: "40px" }}>
								No
							</th>
							<th rowSpan={2} style={{ width: "55px" }}>
								사진
							</th>
							<th rowSpan={2} style={{ width: "95px" }}>
								모델번호
							</th>
							<th colSpan={2} style={{ width: "90px" }}>
								중량
							</th>
							<th rowSpan={2} style={{ width: "50px" }}>
								개당
								<br />알 수
							</th>
							<th rowSpan={2} style={{ width: "70px" }}>
								상품
								<br />
								단가
							</th>
							<th colSpan={2} style={{ width: "110px" }}>
								중앙 보조
							</th>
							<th rowSpan={2} style={{ width: "70px" }}>
								공임
								<br />합
							</th>
							<th rowSpan={2} style={{ width: "70px" }}>
								금값
							</th>
							<th rowSpan={2} style={{ width: "90px" }}>
								소계
								<br />
								VAT별도
							</th>
						</tr>
						<tr>
							<th>금</th>
							<th>알</th>
							<th>메인</th>
							<th>보조</th>
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
								(item.assistanceStoneLaborCost || 0);
							const subtotal = laborSum;

							return (
								<tr key={index}>
									<td>{index + 1}</td>
									<td>
										<div className="product-image-cell">이미지</div>
									</td>
									<td>
										<div className="product-info-cell">
											<div>{item.productName}</div>
											<div className="note-text">{item.note || ""}</div>
											<div className="material-color">
												{item.materialName || ""} {item.colorName || ""}
											</div>
										</div>
									</td>
									<td>{item.goldWeight?.toFixed(3) || "-"}</td>
									<td>{item.stoneWeight?.toFixed(3) || "-"}</td>
									<td>{totalStoneCount || "-"}</td>
									<td>{item.totalProductLaborCost?.toLocaleString() || "-"}</td>
									<td>{item.mainStoneLaborCost?.toLocaleString() || "-"}</td>
									<td>
										{item.assistanceStoneLaborCost?.toLocaleString() || "-"}
									</td>
									<td>{laborSum.toLocaleString()}</td>
									<td>-</td>
									<td>{subtotal.toLocaleString()}</td>
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
								<td></td>
								<td></td>
							</tr>
						))}
					</tbody>
					<tfoot>
						<tr className="total-row">
							<td colSpan={3}>
								<div className="material-weights">
									{Object.entries(materialWeights).map(([material, weight]) => (
										<div key={material}>
											{material}: {weight.toFixed(3)}g (
											{getGoldTransferWeight(weight, material).toFixed(3)}돈)
										</div>
									))}
								</div>
							</td>
							<td colSpan={2}>제품 수량: {totalProductCount}개</td>
							<td colSpan={3}></td>
							<td colSpan={2}>총 공임합: {totalLaborCost.toLocaleString()}</td>
							<td></td>
							<td>총 소계: {totalSubtotal.toLocaleString()}</td>
						</tr>
					</tfoot>
				</table>

				{/* 푸터 영역 (미수금 계산 - 추후 추가) */}
				<div className="invoice-footer">
					<div className="footer-note">
						거래 이후 미수 금액 계산 (추후 추가 예정)
					</div>
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
			<div ref={printRef} className="print-content">
				{/* 매장용 */}
				<InvoiceTemplate title="매장용" />

				{/* 페이지 구분선 */}
				<div className="page-break"></div>

				{/* 판매용 */}
				<InvoiceTemplate title="판매용" />
			</div>
			<div className="print-controls">
				<button onClick={handlePrint} className="btn-submit">
					인쇄하기
				</button>
				<button onClick={() => window.close()} className="btn-cancel">
					닫기
				</button>
			</div>
		</div>
	);
};

export default SalePrintPage;

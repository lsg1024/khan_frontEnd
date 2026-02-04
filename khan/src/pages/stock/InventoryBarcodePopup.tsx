// 재고 조사 바코드 스캔 팝업
import { useState, useEffect, useRef } from "react";
import { stockApi } from "../../../libs/api/stockApi";
import type { InventoryCheckResponse } from "../../types/stockDto";
import "../../styles/pages/stock/InventoryBarcodePopup.css";

function InventoryBarcodePopup() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [barcodeInput, setBarcodeInput] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);
	const [results, setResults] = useState<InventoryCheckResponse[]>([]);
	const [successCount, setSuccessCount] = useState(0);
	const [errorCount, setErrorCount] = useState(0);

	// 바코드 체크
	const handleBarcodeCheck = async (flowCode: string) => {
		if (!flowCode.trim() || isProcessing) return;

		setIsProcessing(true);
		try {
			const response = await stockApi.checkInventory(flowCode.trim());
			if (response.success && response.data) {
				const result = response.data;
				setResults((prev) => [result, ...prev].slice(0, 50)); // 최근 50개만 유지

				if (result.status === "SUCCESS") {
					setSuccessCount((c) => c + 1);
				} else {
					setErrorCount((c) => c + 1);
				}
			}
		} catch (err) {
			console.error("바코드 체크 실패:", err);
			setErrorCount((c) => c + 1);
		} finally {
			setIsProcessing(false);
			setBarcodeInput("");
			inputRef.current?.focus();
		}
	};

	// 바코드 입력 핸들러
	const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleBarcodeCheck(barcodeInput);
		}
	};

	// 결과 초기화
	const handleClearResults = () => {
		setResults([]);
		setSuccessCount(0);
		setErrorCount(0);
	};

	// 창 닫기
	const handleClose = () => {
		window.close();
	};

	// 자동 포커스
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	// 상태에 따른 색상
	const getStatusColor = (status: string) => {
		switch (status) {
			case "SUCCESS":
				return "#28a745";
			case "ALREADY_CHECKED":
				return "#ffc107";
			case "NOT_CHECKABLE":
				return "#ff9800";
			case "NOT_FOUND":
				return "#dc3545";
			default:
				return "#666";
		}
	};

	// 상태 텍스트
	const getStatusText = (status: string) => {
		switch (status) {
			case "SUCCESS":
				return "완료";
			case "ALREADY_CHECKED":
				return "기확인";
			case "NOT_CHECKABLE":
				return "불가";
			case "NOT_FOUND":
				return "미존재";
			default:
				return status;
		}
	};

	return (
		<div className="barcode-popup">
			<div className="barcode-popup-header">
				<h1>재고 조사 - 바코드 스캔</h1>
				<button className="close-btn" onClick={handleClose}>
					✕
				</button>
			</div>

			<div className="barcode-popup-input-section">
				<div className="input-wrapper">
					<svg
						className="barcode-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<rect x="3" y="4" width="18" height="16" rx="2" />
						<path d="M7 8v8M11 8v8M15 8v8M19 8v8" />
					</svg>
					<input
						ref={inputRef}
						type="text"
						placeholder="바코드를 스캔하거나 고유 번호를 입력하세요"
						value={barcodeInput}
						onChange={(e) => setBarcodeInput(e.target.value)}
						onKeyDown={handleBarcodeKeyDown}
						disabled={isProcessing}
						autoFocus
					/>
					<button
						className="submit-btn"
						onClick={() => handleBarcodeCheck(barcodeInput)}
						disabled={!barcodeInput.trim() || isProcessing}
					>
						{isProcessing ? "처리중..." : "확인"}
					</button>
				</div>
			</div>

			<div className="barcode-popup-stats">
				<div className="stat-item success">
					<span className="stat-label">성공</span>
					<span className="stat-value">{successCount}</span>
				</div>
				<div className="stat-item error">
					<span className="stat-label">오류/중복</span>
					<span className="stat-value">{errorCount}</span>
				</div>
				<button className="clear-btn" onClick={handleClearResults}>
					결과 초기화
				</button>
			</div>

			<div className="barcode-popup-results">
				<h3>스캔 결과</h3>
				{results.length === 0 ? (
					<div className="no-results">
						<p>바코드를 스캔하면 결과가 여기에 표시됩니다.</p>
					</div>
				) : (
					<div className="results-list">
						{results.map((result, idx) => (
							<div
								key={`${result.flowCode}-${idx}`}
								className={`result-item ${result.status.toLowerCase()}`}
							>
								<span
									className="result-status"
									style={{ backgroundColor: getStatusColor(result.status) }}
								>
									{getStatusText(result.status)}
								</span>
								<span className="result-code">{result.flowCode}</span>
								<span className="result-name">
									{result.productName || "-"}
								</span>
								<span className="result-message">{result.message}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default InventoryBarcodePopup;

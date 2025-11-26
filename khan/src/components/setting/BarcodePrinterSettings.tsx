import { useEffect, useState } from "react";
import { qzTrayService } from "../../service/qzTrayService";
import "../../styles/components/barcodePrinterSettings.css";

interface BarcodePrinterSettingsProps {
	onPrinterChange?: (printer: string | null) => void;
}

export default function BarcodePrinterSettings({
	onPrinterChange,
}: BarcodePrinterSettingsProps) {
	const [status, setStatus] = useState("연결 시도 중...");
	const [printers, setPrinters] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
	const [printStatus, setPrintStatus] = useState<string>("");

	useEffect(() => {
		const startQz = async () => {
			qzTrayService.initialize();
			const connected = await qzTrayService.connect();

			if (connected) {
				setStatus("✅ 연결 성공");
				const foundPrinters = await qzTrayService.findPrinters();
				setPrinters(foundPrinters);
				if (foundPrinters.length > 0) {
					setSelectedPrinter(foundPrinters[0]);
					onPrinterChange?.(foundPrinters[0]);
				}
			} else {
				setStatus("❌ 연결 실패");
				setError(
					"QZ Tray에 연결할 수 없습니다. 프로그램 실행 여부와 인증서 설정을 확인하세요."
				);
			}
		};

		startQz();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const handlePrinterChange = (printer: string) => {
		setSelectedPrinter(printer);
		onPrinterChange?.(printer);
	};

	const handleTestPrint = async () => {
		if (!selectedPrinter) {
			alert("프린터를 선택해주세요.");
			return;
		}

		setPrintStatus("인쇄 작업 전송 중...");

		const pplbBarcodeData = `N
q144
Q144,16
JFJ

A10,10,0,1,1,1,N,"GOLDPEN"
B10,28,0,1,2,2,25,N,"10000201" 
A10,58,0,1,1,1,N,"10000201"

A10,90,0,1,1,1,N,"GOLDPEN"
A10,105,0,1,1,1,N,"10000201"
A10,120,0,1,1,1,N,"W:271,000"

P1
`;

		try {
			const result = await qzTrayService.printRaw(
				selectedPrinter,
				pplbBarcodeData
			);
			if (result) {
				setPrintStatus("✅ 인쇄 작업이 성공적으로 전송되었습니다.");
			} else {
				setPrintStatus("❌ 인쇄 작업 전송에 실패했습니다.");
			}
		} catch (err) {
			console.error(err);
			setPrintStatus("❌ 인쇄 중 오류가 발생했습니다.");
		}
	};

	return (
		<div className="barcode-printer-settings">
			<div className="printer-status">
				<strong>연결 상태:</strong> {status}
			</div>

			{error && (
				<div className="printer-error">
					<strong>오류:</strong> {error}
				</div>
			)}

			<div className="printer-select-section">
				<label>프린터 선택</label>
				{printers.length > 0 ? (
					<select
						value={selectedPrinter ?? ""}
						onChange={(e) => handlePrinterChange(e.target.value)}
						className="printer-select"
					>
						{printers.map((p) => (
							<option key={p} value={p}>
								{p}
							</option>
						))}
					</select>
				) : (
					<p className="no-printer">사용 가능한 프린터를 찾지 못했습니다.</p>
				)}
			</div>

			<div className="printer-test-section">
				<button
					onClick={handleTestPrint}
					disabled={!selectedPrinter}
					className="test-print-btn"
				>
					🖨️ 테스트 인쇄
				</button>
				{printStatus && (
					<div className="print-status">
						<strong>인쇄 결과:</strong> {printStatus}
					</div>
				)}
			</div>
		</div>
	);
}

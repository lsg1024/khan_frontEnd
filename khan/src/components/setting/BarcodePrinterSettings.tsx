import { useEffect, useState } from "react";
import { qzTrayService } from "../../service/qzTrayService";
import "../../styles/components/settings/BarcodePrinterSettings.css";

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

	// 로컬 스토리지 키 이름 정의
	const STORAGE_KEY = "preferred_printer_name";

	useEffect(() => {
		const startQz = async () => {
			qzTrayService.initialize();
			const connected = await qzTrayService.connect();

			if (connected) {
				setStatus("✅ 연결 성공");
				const foundPrinters = await qzTrayService.findPrinters();
				setPrinters(foundPrinters);

				console.log("Found Printers:", foundPrinters);
				const savedPrinter = localStorage.getItem(STORAGE_KEY);

				if (savedPrinter && foundPrinters.includes(savedPrinter)) {
					setSelectedPrinter(savedPrinter);
					onPrinterChange?.(savedPrinter);
				} else if (foundPrinters.length > 0) {
					const defaultPrinterName = foundPrinters.find((p) =>
						p.includes("Argox OS-214 plus series PPLB")
					);
					setSelectedPrinter(defaultPrinterName ?? foundPrinters[0]);
					onPrinterChange?.(defaultPrinterName ?? foundPrinters[0]);
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

	const stringToBytes = (str: string): Uint8Array => {
		const bytes = new Uint8Array(str.length);
		for (let i = 0; i < str.length; i++) {
			bytes[i] = str.charCodeAt(i);
		}
		return bytes;
	};

	const uint8ArrayToBase64 = (buffer: Uint8Array): string => {
		let binary = "";
		const len = buffer.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(buffer[i]);
		}
		return window.btoa(binary);
	};

	const createTextGwCommandBytes = (
		text: string,
		x: number,
		y: number,
		fontSize: number = 16, // [변경] 기본 크기를 22 -> 16으로 축소
		fontFamily: string = "Malgun Gothic"
	): Promise<Uint8Array> => {
		return new Promise((resolve) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d", { willReadFrequently: true });

			if (!ctx) return resolve(new Uint8Array(0));

			// 1. 텍스트 크기 계산 (여백 최소화)
			ctx.font = `bold ${fontSize}px ${fontFamily}`;
			const textMetrics = ctx.measureText(text);

			const width = Math.ceil(textMetrics.width);
			const widthBytes = Math.ceil(width / 8);
			const finalWidth = widthBytes * 8;
			const height = Math.ceil(fontSize * 1.2); // [변경] 높이 여백을 1.4 -> 1.2로 줄임

			canvas.width = finalWidth;
			canvas.height = height;

			// 2. 텍스트 그리기
			// 배경: 흰색, 글자: 검은색
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, finalWidth, height);

			ctx.fillStyle = "black";
			ctx.font = `bold ${fontSize}px ${fontFamily}`;
			ctx.textBaseline = "top";
			ctx.fillText(text, 0, 0);

			const imageData = ctx.getImageData(0, 0, finalWidth, height);
			const data = imageData.data;

			// 3. GW 명령어 헤더
			const headerStr = `GW${x},${y},${widthBytes},${height}\n`;
			const headerBytes = stringToBytes(headerStr);

			// 4. 비트맵 데이터 생성
			const imageBytes = new Uint8Array(widthBytes * height);

			for (let row = 0; row < height; row++) {
				for (let colByte = 0; colByte < widthBytes; colByte++) {
					let byte = 0;
					for (let bit = 0; bit < 8; bit++) {
						const xPos = colByte * 8 + bit;
						const pixelIndex = (row * finalWidth + xPos) * 4;

						const r = data[pixelIndex];
						const g = data[pixelIndex + 1];
						const b = data[pixelIndex + 2];

						// 밝기 계산 (평균값이 128 이상이면 흰색으로 간주)
						const isWhite = (r + g + b) / 3 > 128;

						if (isWhite) {
							byte |= 1 << (7 - bit); // 흰색이면 비트를 1로 켬 (배경)
						}
						// 검은색(글자)이면 비트를 0으로 둠 (인쇄)
					}
					imageBytes[row * widthBytes + colByte] = byte;
				}
			}

			const newLine = stringToBytes("\n");
			const merged = new Uint8Array(
				headerBytes.length + imageBytes.length + newLine.length
			);

			merged.set(headerBytes, 0);
			merged.set(imageBytes, headerBytes.length);
			merged.set(newLine, headerBytes.length + imageBytes.length);

			resolve(merged);
		});
	};
	const handlePrinterChange = (printer: string) => {
		setSelectedPrinter(printer);
		onPrinterChange?.(printer);

		localStorage.setItem(STORAGE_KEY, printer);
	};

	const handleTestPrint = async () => {
		if (!selectedPrinter) {
			alert("프린터를 선택해주세요.");
			return;
		}

		setPrintStatus("데이터 생성 중...");

		try {
			// 1. "로고" 이미지
			const imageLogo = await createTextGwCommandBytes(
				"칸",
				10,
				10, 
				18
			);

			// 2. "제품 이름" 이미지
			const imageProductName = await createTextGwCommandBytes(
				"ㄴㅇㄴㅁㄴㅇㄹ",
				10,
				90 , 
				18
			);

			// 3. 명령어 문자열
			const part1 = `N
q144
Q144,16
JFJ
`;

			// Part 2: 바코드 및 첫 번째 숫자
			const part2 = `B10,${38},0,1,1,2,25,N,"10000201" 
A10,${58}"
`;

			// Part 3: 하단 텍스트 및 가격
			const part3 = `A10,${105},0,1,1,1,N,"10000201"
A10,${120},0,1,1,1,N,"W:271,000"
P1
`;

			// --- 이하 데이터 병합 및 전송 로직은 동일 ---
			const bPart1 = stringToBytes(part1);
			const bPart2 = stringToBytes(part2);
			const bPart3 = stringToBytes(part3);

			const totalSize =
				bPart1.length +
				imageLogo.length +
				bPart2.length +
				imageProductName.length +
				bPart3.length;
			const finalData = new Uint8Array(totalSize);

			let offset = 0;
			finalData.set(bPart1, offset);
			offset += bPart1.length;
			finalData.set(imageLogo, offset);
			offset += imageLogo.length;
			finalData.set(bPart2, offset);
			offset += bPart2.length;
			finalData.set(imageProductName, offset);
			offset += imageProductName.length;
			finalData.set(bPart3, offset);

			const base64Data = uint8ArrayToBase64(finalData);

			setPrintStatus("인쇄 작업 전송 중...");

			await qzTrayService.printRaw(selectedPrinter, base64Data, true);

			setPrintStatus("✅ 인쇄 작업이 성공적으로 전송되었습니다.");
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

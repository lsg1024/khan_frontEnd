import { useEffect, useState, type JSX } from "react";
import { qzTrayService } from "../service/qzTrayService";

export default function SettingsPage(): JSX.Element {
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
				// 첫 번째 프린터를 기본 선택 값으로 설정
				if (foundPrinters.length > 0) {
					setSelectedPrinter(foundPrinters[0]);
				}
			} else {
				setStatus("❌ 연결 실패");
				setError(
					"QZ Tray에 연결할 수 없습니다. 프로그램 실행 여부와 인증서 설정을 확인하세요."
				);
			}
		};

		startQz();
	}, []); // 한 번만 실행

	// '바코드 출력' 버튼 클릭 시 실행될 함수
	const handlePrint = async () => {
		if (!selectedPrinter) {
			alert("프린터를 선택해주세요.");
			return;
		}

		setPrintStatus("인쇄 작업 전송 중...");

		// Argox 프린터에 보낼 PPLB 명령어
		// const storeName = "한글가게"; // 한글은 라벨 텍스트로 이미지에 렌더링
		// const flowCode = "764022842362681427"; // Code39 Full ASCII 범위(숫자) -> OK
		// const modelName = "한글이름";
		// const materialInfo = "14K 3.50g";

		// 프린터 내장 폰트(비트맵)를 사용하는 PPLB 명령어
		const pplbBarcodeData = `N
		S3
		q144
		Q144,16
		JF

		A10,10,0,1,1,1,N,"GOLDPEN"
		B10,28,0,1,1,3,25,N,"10000201"
		A10,58,0,1,1,1,N,"10000201"

		A10,90,0,1,1,1,N,"GOLDPEN"
		A10,105,0,1,1,1,N,"10000201"
		A10,120,0,1,1,1,N,"W:271,000"

		P1
		`;

		// const pplbBarcodeData = `N
		// S3
		// q144
		// Q144,16
		// JF

		// GRAPHICS,10,15,8,15,"06181FF80018006C061800183F983F6C7FD800180198026C001800180198066C1F1800180318066C319E7FFE031807EC30D80000061E0C6C319800000E18186C1F181FF81C18386C001800187818706C08001FF82018206C080018000018006C080018000018006C0FF81FF80018006C000000000018006C"
		// B10,48,0,1,1,3,25,N,"${flowCode}"

		// A10,90,0,0,1,1,N,"${modelName}"
		// A10,105,0,1,1,1,N,"${materialInfo}"

		// P1
		// `;

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
		}
	};

	return (
		<div style={{ padding: 24, fontFamily: "sans-serif" }}>
			<h2>QZ Tray 프린터 설정</h2>
			<p>
				<strong>연결 상태:</strong> {status}
			</p>

			{error && (
				<p style={{ color: "crimson" }}>
					<strong>오류:</strong> {error}
				</p>
			)}

			<hr style={{ margin: "20px 0" }} />

			{/* --- 프린터 선택 드롭다운 --- */}
			<div style={{ marginTop: 12 }}>
				<strong>1. 프린터 선택</strong>
				{printers.length > 0 ? (
					<div>
						<select
							value={selectedPrinter ?? ""}
							onChange={(e) => setSelectedPrinter(e.target.value)}
							style={{ minWidth: 300, padding: 8, marginTop: 8 }}
						>
							{printers.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>
					</div>
				) : (
					<p>사용 가능한 프린터를 찾지 못했습니다.</p>
				)}
			</div>

			{/* --- 인쇄 버튼 및 상태 표시 --- */}
			<div style={{ marginTop: 24 }}>
				<strong>2. 인쇄 실행</strong>
				<div style={{ marginTop: 8 }}>
					<button
						onClick={handlePrint}
						disabled={!selectedPrinter}
						style={{ padding: "10px 20px", fontSize: 16, cursor: "pointer" }}
					>
						🖨️ 바코드 출력
					</button>
					{printStatus && (
						<p style={{ marginTop: 10 }}>
							<strong>인쇄 결과:</strong> {printStatus}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

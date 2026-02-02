import { qzApi } from "../../libs/api/qzApi";
import type { ApiResponse } from "../../libs/api/config";

// 초기화 상태 플래그
let isInitialized = false;
let isInitializing = false;
let initializePromise: Promise<boolean> | null = null;

const publicKey = `-----BEGIN CERTIFICATE-----
MIIEATCCAumgAwIBAgIUNA7KujJdG6Qe0TR+gs1LJgb7JykwDQYJKoZIhvcNAQEL
BQAwgY4xCzAJBgNVBAYTAktSMQ4wDAYDVQQIDAVTZW91bDESMBAGA1UEBwwJU2Vv
Y2hvLWd1MRMwEQYDVQQKDApLS0hBTiBMdGQuMQwwCgYDVQQLDAMgSVQxFjAUBgNV
BAMMDSoua2toYW4uY28ua3IxIDAeBgkqhkiG9w0BCQEWEWFkbWluQGtraGFuLmNv
LmtyMCAXDTI2MDEyODAxNDY1NFoYDzIwNTcwNzIzMDE0NjU0WjCBjjELMAkGA1UE
BhMCS1IxDjAMBgNVBAgMBVNlb3VsMRIwEAYDVQQHDAlTZW9jaG8tZ3UxEzARBgNV
BAoMCktLSEFOIEx0ZC4xDDAKBgNVBAsMAyBJVDEWMBQGA1UEAwwNKi5ra2hhbi5j
by5rcjEgMB4GCSqGSIb3DQEJARYRYWRtaW5Aa2toYW4uY28ua3IwggEiMA0GCSqG
SIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7G7jBvZATnz/ZRI21+htuD3345YFFHgMG
Yt5f6uAce/cUbMsINSWLDl/QIC7ZxxTVNxjw3EpxMPxytH6cHceobP8lbwOpCS2W
EqBm39ulMN5MTUvvigQ9ukci45yZFUxn8eJmlb6s8hQzxWr5i9Bxd2KoPraxr6dl
vmGjmWdjtC/lmsdPFf8eVLdwCojMnVTIRv8B2tcC9VxtV7NL+wOYWlXDX5x6oPs4
yfrFvFT5ojVGdK0kx5rAuOTypaoEYrh07Ab5/tdGot9mGPVu1NTgQfMLE35tjgRo
x4qMjR/6OqgsD1vT5/ZxjO7+T2XYdiPrk0ngN29R7zYhZPE1nx5LAgMBAAGjUzBR
MB0GA1UdDgQWBBRqKV43I4QlOMYZehaMdVmy3nI+aDAfBgNVHSMEGDAWgBRqKV43
I4QlOMYZehaMdVmy3nI+aDAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUA
A4IBAQCeB6NzFmLJ96k/RZyR4hQqWsnUp6m7+5hZixOZO4cKMfnt/x8P6eFF92Lb
lliHWaTPgb29IJZUsqU2v7fgL/s7pC8TUbjUYNVIS+t/RpYuh803auXFBbsymA5A
5V8E3VkQhfCTdnkEOqBrifZjYqwjrL+FVCdam0K9eQ3pVoCYN2Kn9LPsP2fSAQ7c
PBGEEBRIDshrSfkTzZ5l7h7pwUXVgIzFu4NJXVivOoT1nGRT6cCEZXr5OqRVYEeT
w7V0ecYtWJ473G6MEHrC5ZIOE5SuV9k6mPJ0Rb6rWMsKJnRZF5aC7G6ss3en3bsj
PR5kbxf41T9zRNMxmX3bZQM8Cklg
-----END CERTIFICATE-----`;

const initialize = (): void => {
	// 이미 초기화되었으면 스킵
	if (isInitialized) {
		console.log("QZ Tray가 이미 초기화되어 있습니다.");
		return;
	}

	if (typeof qz === "undefined") {
		console.error("QZ Tray 스크립트가 로드되지 않아 초기화할 수 없습니다.");
		return;
	}

	qz.security.setCertificatePromise((resolve: (cert: string) => void) => {
		resolve(publicKey);
	});

	qz.security.setSignaturePromise((toSign: string) => {
		return (
			resolve: (signature: string) => void,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			reject: (reason?: any) => void
		) => {
			qzApi
				.getQzSign({ toSign })
				.then((response: ApiResponse<{ signature: string }>) => {
					if (response && response.success === true) {
						const sig = response.data?.signature;
						if (sig) {
							resolve(sig);
							return;
						}
						reject(new Error(response.message || "서명 데이터가 없습니다."));
					} else {
						reject(new Error(response.message || "서명 요청 실패"));
					}
				})
				.catch((err) => {
					console.error("qzApi.getQzSign 호출 중 에러:", err);
					reject(err);
				});
		};
	});

	isInitialized = true;
};

/**
 * QZ Tray 웹소켓에 연결합니다.
 * `initialize` 함수에서 설정한 인증을 자동으로 사용합니다.
 */
const connect = async (): Promise<boolean> => {
	if (typeof qz === "undefined") {
		alert("QZ Tray가 실행 중이 아닙니다.");
		console.error(
			"QZ Tray가 실행 중이 아니거나 스크립트가 로드되지 않았습니다."
		);
		return false;
	}

	if (qz.websocket.isActive()) {
		console.log("이미 QZ Tray에 연결되어 있습니다.");
		return true;
	}

	try {
		await qz.websocket.connect();
		console.log("✅ QZ Tray에 연결되었습니다!");
		return true;
	} catch (error) {
		console.error("QZ Tray 연결에 실패했습니다:", error);
		return false;
	}
};

/**
 * 사용 가능한 모든 프린터 목록을 배열로 반환합니다.
 */
const findPrinters = async (): Promise<string[]> => {
	if (typeof qz === "undefined" || !qz.websocket.isActive()) {
		console.error("QZ Tray에 연결되어 있지 않습니다.");
		return [];
	}

	try {
		const printers: string[] = await qz.printers.find();
		return printers;
	} catch (error) {
		console.error("프린터 목록을 찾는 데 실패했습니다:", error);
		return [];
	}
};

/**
 * 지정된 프린터로 Raw 데이터를 전송하여 인쇄합니다.
 * @param printerName 대상 프린터의 이름
 * @param data 인쇄할 Raw 데이터 (예: EPL, ZPL 명령어)
 */
const printRaw = async (
	printerName: string,
	data: string,
	isBase64: boolean = false
): Promise<boolean> => {
	if (typeof qz === "undefined" || !qz.websocket.isActive()) {
		console.error("QZ Tray에 연결되어 있지 않습니다.");
		return false;
	}

	try {
		const config = qz.configs.create(printerName); // 인코딩 설정 불필요 (Base64는 바이너리이므로)

		const printData = [
			{
				type: "raw" as const,
				format: isBase64 ? ("base64" as const) : ("command" as const),
				data: data,
			},
		];

		await qz.print(config, printData);
		return true;
	} catch (error) {
		console.error("인쇄 작업에 실패했습니다:", error);
		return false;
	}
};

const getPrinterStatus = async (
	printerName: string
): Promise<object | null> => {
	if (typeof qz === "undefined" || !qz.websocket.isActive()) {
		console.error("QZ Tray에 연결되어 있지 않습니다.");
		return null;
	}

	try {
		const status = await qz.printers.getStatus(printerName);
		console.log(`🖨️ 프린터 [${printerName}] 상태:`, status);
		return status;
	} catch (error) {
		console.error(`프린터 [${printerName}] 상태 확인에 실패했습니다:`, error);
		return null;
	}
};

type PrintImageOptions = {
	/** 이미지가 의도한 출력 픽셀 너비(프린터 기준). 제공 시 프린터 드라이버 스케일에 도움 됨 */
	widthPx?: number;
	/** 이미지 의도한 높이 */
	heightPx?: number;
	/** DPI 정보(참고용) */
	dpi?: number;
	/** 프린터에 맞춰 이미지 크기를 자동으로 맞출지 여부. 기본 true */
	fitToPage?: boolean;
	/** 회전(0,90,180,270) */
	rotate?: 0 | 90 | 180 | 270;
	/** 이미지 전송이 실패할 때 raw 전송으로 재시도할지 여부. 기본 true */
	fallbackToRaw?: boolean;
};

/**
 * 이미지( base64 PNG ) 를 전송하여 인쇄합니다.
 * - base64PngData: data:image/png;base64,... 의 '...' 부분(순수 base64)
 * - 옵션으로 widthPx/heightPx/dpi 등을 전달하면 QZ config/print에 반영 시도
 *
 * 동작:
 * 1) qz.print(config, [{type:'image', format:'base64', data:...}]) 시도
 * 2) 실패하면 (fallbackToRaw=true) qz.print(... raw 형태)로 재시도
 */
const printImageBase64 = async (
	printerName: string,
	base64PngData: string,
	options?: PrintImageOptions
): Promise<boolean> => {
	if (typeof qz === "undefined" || !qz.websocket.isActive()) {
		console.error("QZ Tray에 연결되어 있지 않습니다.");
		return false;
	}

	const cfgOptions: Record<string, unknown> = {};

	// 가능한 config 옵션(프린터/드라이버에 따라 동작 여부가 다름)
	if (options?.dpi) cfgOptions["dpi"] = options.dpi;
	if (options?.fitToPage === false) cfgOptions["fit_to_page"] = false;
	if (typeof options?.rotate !== "undefined")
		cfgOptions["rotate"] = options.rotate;

	// qz.configs.create의 두번째 인자로 옵션을 일부 전달할 수 있음
	const config = qz.configs.create(printerName, cfgOptions);

	// 1차 시도: 'image' 타입으로 전송 (가장 표준적)
	try {
		console.debug("printImageBase64: 표준 image 전송 시도", {
			printerName,
			cfgOptions,
			widthPx: options?.widthPx,
			heightPx: options?.heightPx,
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const imagePayload: any = {
			type: "image",
			format: "base64",
			data: base64PngData,
		};

		// 일부 QZ 버전/드라이버는 추가 옵션을 지원함 (그렇지 않으면 무시됨)
		if (options?.widthPx || options?.heightPx) {
			imagePayload.options = {
				width: options.widthPx,
				height: options.heightPx,
				dpi: options.dpi,
			};
		}
		if (options?.rotate) {
			imagePayload.options = {
				...(imagePayload.options ?? {}),
				rotate: options.rotate,
			};
		}

		await qz.print(config, [imagePayload]);
		console.log("이미지 인쇄(표준 방식) 전송 성공");
		return true;
	} catch (errImage) {
		console.warn("이미지 인쇄(표준 방식) 실패:", errImage);

		// 폴백이 허용되지 않으면 실패 반환
		if (options?.fallbackToRaw === false) {
			return false;
		}

		// 2차 시도: raw 전송으로 재시도 — 일부 프린터는 raw 데이터로 전송해야만 제대로 받음
		try {
			console.debug("printImageBase64: raw(fallback) 전송 시도");

			// raw 방식은 프린터에 따라 다름.
			// 단순히 base64 PNG를 raw로 전송하는 것은 항상 동작하지 않지만,
			// 드라이버가 PNG를 직접 받는 환경에서는 동작할 수 있습니다.
			// (예: Windows 드라이버가 PNG를 처리해 프린터에 맞게 변환)
			const rawPayload = {
				type: "raw" as const,
				format: "base64" as const,
				data: base64PngData,
			};

			await qz.print(config, [rawPayload]);
			console.log("이미지 인쇄(raw 방식) 전송 성공");
			return true;
		} catch (errRaw) {
			console.error("이미지 인쇄(raw 방식) 재시도 실패:", errRaw);
			return false;
		}
	}
};

/**
 * 앱 시작 시 자동으로 QZ Tray를 초기화하고 바코드 프린터에 연결합니다.
 *
 * 동작 순서:
 * 1. localStorage에서 preferred_printer_name 확인
 * 2. QZ Tray 초기화 및 연결
 * 3. 저장된 프린터가 있으면 해당 프린터 사용
 * 4. 없으면 "Argox OS-214 plus series PPLB" 자동 검색 및 설정
 *
 * @returns Promise<boolean> 성공 여부
 */
const autoInitializeAndConnect = async (): Promise<boolean> => {
	// 이미 초기화 중이면 진행 중인 Promise 반환
	if (isInitializing && initializePromise) {
		console.log("QZ Tray 초기화가 이미 진행 중입니다. 기존 작업을 기다립니다.");
		return initializePromise;
	}

	// 이미 초기화 완료되고 연결된 상태면 즉시 반환
	if (isInitialized && typeof qz !== "undefined" && qz.websocket.isActive()) {
		console.log("QZ Tray가 이미 초기화되어 연결되어 있습니다.");
		return true;
	}

	isInitializing = true;

	initializePromise = (async () => {
		try {
			console.log("🔄 QZ Tray 자동 초기화 시작...");

			// 1. QZ Tray 초기화
			initialize();

			// 2. QZ Tray 연결
			const isConnected = await connect();
			if (!isConnected) {
				console.warn("⚠️ QZ Tray 연결 실패 - QZ Tray가 실행 중인지 확인하세요.");
				return false;
			}

			// 3. localStorage에서 저장된 프린터 확인
			const savedPrinter = localStorage.getItem("preferred_printer_name");

			if (savedPrinter) {
				console.log(`✅ 저장된 프린터 사용: ${savedPrinter}`);
				// 프린터가 실제로 존재하는지 확인
				const printers = await findPrinters();
				if (printers.includes(savedPrinter)) {
					console.log(`✅ 프린터 [${savedPrinter}] 연결 준비 완료`);
					return true;
				} else {
					console.warn(
						`⚠️ 저장된 프린터 [${savedPrinter}]를 찾을 수 없습니다. 기본 프린터를 검색합니다.`
					);
					localStorage.removeItem("preferred_printer_name");
				}
			}

			// 4. 기본 프린터 자동 검색 및 설정
			const defaultPrinterName = "Argox OS-214 plus series PPLB";
			console.log(`🔍 기본 프린터 검색 중: ${defaultPrinterName}`);

			const printers = await findPrinters();
			console.log(`📋 사용 가능한 프린터 목록:`, printers);

			// 대소문자 구분 없이 부분 일치 검색
			const foundPrinter = printers.find(
				(printer) =>
					printer.toLowerCase().includes("argox") &&
					printer.toLowerCase().includes("os-214")
			);

			if (foundPrinter) {
				console.log(`✅ 기본 프린터 발견: ${foundPrinter}`);
				localStorage.setItem("preferred_printer_name", foundPrinter);
				console.log(`💾 프린터가 자동으로 저장되었습니다: ${foundPrinter}`);
				return true;
			} else {
				console.warn(
					`⚠️ 기본 프린터 [${defaultPrinterName}]를 찾을 수 없습니다.`
				);
				console.log(
					"ℹ️ 설정 > 바코드 프린터 설정에서 수동으로 프린터를 선택해주세요."
				);
				return false;
			}
		} catch (error) {
			console.error("❌ QZ Tray 자동 초기화 중 오류 발생:", error);
			return false;
		} finally {
			isInitializing = false;
		}
	})();

	return initializePromise;
};

/**
 * QZ Tray 웹소켓 연결을 해제합니다.
 */
const disconnect = async (): Promise<void> => {
	if (typeof qz === "undefined") {
		return;
	}

	if (qz.websocket.isActive()) {
		try {
			await qz.websocket.disconnect();
			console.log("QZ Tray 연결이 해제되었습니다.");
		} catch (error) {
			console.error("QZ Tray 연결 해제 중 오류:", error);
		}
	}
};

// 4. 서비스 객체로 묶어서 내보냅니다.
export const qzTrayService = {
	initialize,
	connect,
	findPrinters,
	printRaw,
	printImageBase64,
	getPrinterStatus,
	autoInitializeAndConnect,
	disconnect,
};

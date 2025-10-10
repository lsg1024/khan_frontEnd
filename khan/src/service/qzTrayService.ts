import { qzApi } from "../../libs/api/qz";
import type { ApiResponse } from "../../libs/api/config";

const publicKey = `-----BEGIN CERTIFICATE-----
MIIEATCCAumgAwIBAgIUbOahxVI8LS8+0fNiN9nfTj+LM5kwDQYJKoZIhvcNAQEL
BQAwgY4xCzAJBgNVBAYTAktSMQ4wDAYDVQQIDAVTZW91bDETMBEGA1UEBwwKRG9u
Z2phay1ndTERMA8GA1UECgwIQVdTIEx0ZC4xCzAJBgNVBAsMAklUMRcwFQYDVQQD
DA4qLmxvY2FsdGVzdC5tZTEhMB8GCSqGSIb3DQEJARYSemtzMTQ1NjZAZ21haWwu
Y29tMCAXDTI1MTAwNDA3NTQ1MVoYDzIwNTcwMzI5MDc1NDUxWjCBjjELMAkGA1UE
BhMCS1IxDjAMBgNVBAgMBVNlb3VsMRMwEQYDVQQHDApEb25namFrLWd1MREwDwYD
VQQKDAhBV1MgTHRkLjELMAkGA1UECwwCSVQxFzAVBgNVBAMMDioubG9jYWx0ZXN0
Lm1lMSEwHwYJKoZIhvcNAQkBFhJ6a3MxNDU2NkBnbWFpbC5jb20wggEiMA0GCSqG
SIb3DQEBAQUAA4IBDwAwggEKAoIBAQC6t48jr/RUTOlqfvPCAlMqSS94VZYkp6R0
VwzoeVvCu2fzBN7mjlHjYGhtflnvLx82kyb/u4msqVu0ZpYpCu+Y/e7OdH74z3T3
S/FCt+gkAKE6TqLpUQO3TW1HCdH4SYlHsUFUErKhWWOkIM6BEtPUqR/Behu/GWv9
Z2v40KcvH/6H9Q+yL3TLVv00lFR8apXajtTOGhHcsxgNiPQYoKnOljwNcAASFaLE
j4rPsrPXnXBIy7PHxg3O6m9oppxyqof+/WQUJaPb5giy3BPgECvHrGSIAlym0vyO
A90Vl7SoXeTyvUqu4yRwknnwNd22s7SMaO+Xe4MTFUzvXGHe75+BAgMBAAGjUzBR
MB0GA1UdDgQWBBQ33ConzNQGAQnmlr/MLJ5vtxz8NzAfBgNVHSMEGDAWgBQ33Con
zNQGAQnmlr/MLJ5vtxz8NzAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUA
A4IBAQAx1wUcwUhUd+ErokUcOtj4n//Cmwi8LaWcPM+xqidfgcm/t+5BYLLU2I1G
BKdGro/wIQQbjMCKRRZ+MWke82UtiFH3teTDAfBb4BdUGMav8YPH6m3VZJvG3zwY
iqt2cHs66hsVAiMNgKGTV3EbMK2CqirdaRemHkeFhYbchbIhv4WBA5VDgQ6R1G7+
+23LW92tm9qlJLLl1hPW7q5Nu7RUFLsGHyczUIHoZ48J2erBf7n9XNuYKFhK0ZrJ
ThxsM6dIBD8pPVR8oSDHf6ikGiinxHGG05zFrxwyv7z3MxV4w+UVUCP8BRd63RMu
fx/3dE+MkSH63WR74CibNrEfXtAI
-----END CERTIFICATE-----`;

const initialize = (): void => {
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
							console.log("서버로부터 서명을 받았습니다:", sig);
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
	data: string
): Promise<boolean> => {
	if (typeof qz === "undefined" || !qz.websocket.isActive()) {
		console.error("QZ Tray에 연결되어 있지 않습니다.");
		return false;
	}

	try {
		const config = qz.configs.create(printerName, { encoding: "EUC-KR" });

		console.log("printRaw: Raw 데이터 인쇄 시도", { printerName, data });
		const printData = [
			{
				type: "raw" as const,
				format: "command" as const,
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

// 4. 서비스 객체로 묶어서 내보냅니다.
export const qzTrayService = {
	initialize,
	connect,
	findPrinters,
	printRaw,
	printImageBase64,
	getPrinterStatus,
};

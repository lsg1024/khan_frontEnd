import { qzTrayService } from "./qzTrayService";

export interface ProductBarcodeData {
	subdomain: string; // 로고용
	productName: string; // 제품 이름
	material?: string; // 재질
	color?: string; // 색상
	weight?: string; // 무게
	size?: string; // 사이즈
	assistantStoneName?: string; // 보조석 이름
	mainStoneMemo?: string; // 메인 스톤 메모
	assistantStoneMemo?: string; // 보조 스톤 메모
	serialNumber?: string; // 시리얼 번호
}

const stringToBytes = (str: string): Uint8Array => {
	const bytes = new Uint8Array(str.length);
	for (let i = 0; i < str.length; i++) {
		bytes[i] = str.charCodeAt(i);
	}
	return bytes;
};

// 1. 텍스트를 이미지(GW)로 변환
const createTextGwCommandBytes = (
	text: string,
	x: number,
	y: number,
	fontSize: number = 16,
	fontFamily: string = "Malgun Gothic"
): Promise<Uint8Array> => {
	return new Promise((resolve) => {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d", { willReadFrequently: true });

		if (!ctx) {
			resolve(new Uint8Array(0));
			return;
		}

		// 텍스트 크기 계산
		ctx.font = `bold ${fontSize}px ${fontFamily}`;
		const textMetrics = ctx.measureText(text);

		const width = Math.ceil(textMetrics.width);
		const widthBytes = Math.ceil(width / 8); // 8비트 단위 정렬
		const finalWidth = widthBytes * 8;
		const height = Math.ceil(fontSize * 1.2); // 줄 간격 포함

		canvas.width = finalWidth;
		canvas.height = height;

		// 배경(흰색) 및 글자(검은색) 그리기
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, finalWidth, height);

		ctx.fillStyle = "black";
		ctx.font = `bold ${fontSize}px ${fontFamily}`;
		ctx.textBaseline = "top";
		ctx.fillText(text, 0, 0);

		const imageData = ctx.getImageData(0, 0, finalWidth, height);
		const data = imageData.data;

		// GW 명령어 헤더
		const headerStr = `GW${x},${y},${widthBytes},${height}\n`;
		const headerBytes = stringToBytes(headerStr);

		// 비트맵 데이터 생성
		const imageBytes = new Uint8Array(widthBytes * height);
		for (let row = 0; row < height; row++) {
			for (let col = 0; col < widthBytes; col++) {
				let byte = 0;
				for (let bit = 0; bit < 8; bit++) {
					const pixelX = col * 8 + bit;
					if (pixelX < finalWidth) {
						const pixelIndex = (row * finalWidth + pixelX) * 4;

						const r = data[pixelIndex];
						const g = data[pixelIndex + 1];
						const b = data[pixelIndex + 2];

						const isWhite = (r + g + b) / 3 > 128;

						if (isWhite) {
							byte |= 1 << (7 - bit);
						}
					}
				}
				imageBytes[row * widthBytes + col] = byte;
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

const uint8ArrayToBase64 = (buffer: Uint8Array): string => {
	let binary = "";
	const len = buffer.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(buffer[i]);
	}
	return window.btoa(binary);
};

/**
 * 출고 바코드 출력 (모든 텍스트 이미지 변환 방식 적용)
 */
export const printDeliveryBarcode = async (
    printerName: string,
    data: ProductBarcodeData
): Promise<void> => {
    try {
        const isConnected = await qzTrayService.connect();
        if (!isConnected) {
            throw new Error("QZ Tray에 연결할 수 없습니다.");
        }

        // 데이터 안전 처리
        const subdomain = data.subdomain || "";
        const productName = data.productName || "";
        const serialNumber = data.serialNumber || "";

        console.log("출고 바코드 출력 데이터:", data);

        // [Part 1] 초기 설정
        const part1 = `N\nq144\nQ144,16\nJFJ\n`;

        // [Part 2] 바코드 및 시리얼 번호 (좌표 유지)
        const part2 = `B10,28,0,1,1,2,25,N,"${serialNumber}"
`; 
        // (1) 로고 이미지 (Y=10)
        const imageLogo = await createTextGwCommandBytes(
            subdomain, 10, 10, 16
        );

        // (2) 제품 이름 이미지 (Y=80)
        const imageProductName = await createTextGwCommandBytes(
            productName, 10, 80, 16
        );

        // (3) 동적 텍스트 이미지들 생성
        let currentY = 95; // 시작 Y 좌표
        const fontSize = 14; // 폰트 크기
        const lineSpacing = 20; // 줄 간격
        const dynamicImages: Uint8Array[] = [];

        // (3) 스펙 정보 (재질/색상/무게) -> 이미지 변환
        const specInfo = [data.material, data.color, data.weight, data.size]
            .filter(Boolean)
            .filter(weight => data.weight ? weight + "g" : true)
            .join("/"); // 구분자

        if (specInfo) {
            const img = await createTextGwCommandBytes(specInfo, 10, currentY, fontSize);
            dynamicImages.push(img);
            currentY += lineSpacing;
        }

        // (4) 스톤 및 메모 정보 (Note 값들) -> 이미지 변환
        const stoneInfos = [];
        if (data.mainStoneMemo) stoneInfos.push(`${data.mainStoneMemo}`);
        if (data.assistantStoneName) stoneInfos.push(`${data.assistantStoneName}`);
        if (data.assistantStoneMemo) stoneInfos.push(`${data.assistantStoneMemo}`);

        const combinedStoneText = stoneInfos.join("/");

        if (combinedStoneText) {
            const img = await createTextGwCommandBytes(combinedStoneText, 10, currentY, fontSize);
            dynamicImages.push(img);
            currentY += lineSpacing;
        }

        // 문자열 -> 바이트 변환
        const bPart1 = stringToBytes(part1);
        const bPart2 = stringToBytes(part2);
        const bEnd = stringToBytes("P1\n"); // 마지막 출력 명령

        // 전체 크기 계산
        let totalSize = 
            bPart1.length + 
            imageLogo.length + 
            bPart2.length + 
            imageProductName.length;
        
        // 동적 이미지들 크기 합산
        for (const img of dynamicImages) {
            totalSize += img.length;
        }
        
        totalSize += bEnd.length;

        // 버퍼 병합
        const finalData = new Uint8Array(totalSize);
        let offset = 0;

        // 1. Part 1
        finalData.set(bPart1, offset); offset += bPart1.length;
        // 2. Logo
        finalData.set(imageLogo, offset); offset += imageLogo.length;
        // 3. Part 2 (Barcode)
        finalData.set(bPart2, offset); offset += bPart2.length;
        // 4. Product Name
        finalData.set(imageProductName, offset); offset += imageProductName.length;
        
        // 5. 동적 이미지들 (스펙, 스톤메모, 사이즈)
        for (const img of dynamicImages) {
            finalData.set(img, offset);
            offset += img.length;
        }

        // 6. 종료 명령 (P1)
        finalData.set(bEnd, offset);

        // 전송
        const base64Data = uint8ArrayToBase64(finalData);
        await qzTrayService.printRaw(printerName, base64Data, true);

    } catch (error) {
        console.error("바코드 출력 상세 에러:", error);
        alert(`바코드 출력 중 오류가 발생했습니다.\n내용: ${error}`);
    }
};

/**
 * 제품 바코드 출력 - 향후 구현 예정
 */
export const printProductBarcode = async (
    printerName: string,
    data: ProductBarcodeData
): Promise<void> => {
    alert("제품 바코드 출력 기능은 준비 중입니다.");
};
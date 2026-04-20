/**
 * 빈 문자열("")을 null로 재귀 변환한다.
 * 백엔드 DTO가 숫자/날짜를 String으로 받지만 서비스 계층에서 Long.valueOf() 등으로 파싱할 때
 * 빈 문자열이 NumberFormatException("For input string: \"\"")을 일으키는 문제를 방지.
 * 배열은 요소 타입을 유지한 채 내부만 재귀 변환.
 * Date 객체, File, Blob 등은 그대로 보존.
 */
export function cleanPayload<T>(value: T): T {
  if (value === "" || value === undefined) {
    return null as unknown as T;
  }
  if (value === null) return value;
  if (Array.isArray(value)) {
    return value.map((v) => cleanPayload(v)) as unknown as T;
  }
  if (typeof value === "object") {
    if (value instanceof Date) return value;
    // 파일/Blob 같은 객체는 그대로 보존
    if (typeof (value as any).append === "function" || value instanceof Blob) {
      return value;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = cleanPayload(v);
    }
    return out as T;
  }
  return value;
}

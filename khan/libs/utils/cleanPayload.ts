/**
 * 빈 문자열("")·undefined·리터럴 문자열 "null"/"undefined" 를 모두 null 로 재귀 변환한다.
 *
 * 백엔드 DTO 가 숫자/날짜를 String 으로 받지만 서비스 계층에서 Long.valueOf() 등으로 파싱할 때
 *   - "" → NumberFormatException("For input string: \"\"")
 *   - "null" → NumberFormatException("For input string: \"null\"")
 * 를 일으키는 문제를 원천 차단한다. "null" 문자열은 백엔드가 엔티티 Long 필드를
 * String.valueOf(null) 로 잘못 직렬화해서 응답으로 내려줬을 때 그대로 재전송되는 케이스.
 *
 * 배열은 요소 타입을 유지한 채 내부만 재귀 변환. Date 객체, File, Blob 등은 그대로 보존.
 */
export function cleanPayload<T>(value: T): T {
  if (value === "" || value === undefined) {
    return null as unknown as T;
  }
  if (value === null) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "null" || trimmed === "undefined") {
      return null as unknown as T;
    }
    return value;
  }
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

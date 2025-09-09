// libs/api.ts - 기존 호환성을 위한 re-export 파일
// 새로운 분리된 API 구조를 사용하되, 기존 import 경로 호환성 유지

// 새로운 API 구조에서 re-export
export * from "./api/index";

// 기존 import 호환성을 위한 별칭들
export { 
    apiRequest,
    isApiSuccess,
    getApiErrorMessage,
    productInfoApi
} from "./api/index";
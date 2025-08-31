// 토큰 관리 유틸리티

interface TokenPayload {
    exp?: number;
    iat?: number;
    sub?: string;
    [key: string]: unknown;
}

export const tokenUtils = {
    // AccessToken 저장
    setToken: (token: string) => {
        localStorage.setItem("app:accessToken", token);
        // 토큰 변경 이벤트 발생
        window.dispatchEvent(new Event('tokenChange'));
    },
    
    // AccessToken 조회
    getToken: (): string | null => {
        return localStorage.getItem("app:accessToken");
    },
    
    // AccessToken 삭제 (로그아웃)
    removeToken: () => {
        console.log("AccessToken 삭제됨");
        localStorage.removeItem("app:accessToken");
        // 토큰 변경 이벤트 발생
        window.dispatchEvent(new Event('tokenChange'));
    },
    
    // AccessToken 존재 여부 확인
    hasToken: (): boolean => {
        return !!localStorage.getItem("app:accessToken");
    },
    
    // Authorization 헤더에서 토큰 추출
    extractTokenFromHeader: (authHeader: string): string | null => {
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    },
    
    // 토큰 정보 조회 (디버깅용)
    getTokenInfo: () => {
        return {
            accessToken: localStorage.getItem("app:accessToken"),
            hasAccessToken: !!localStorage.getItem("app:accessToken")
        };
    },

    // JWT 토큰 디코딩 (페이로드만)
    decodeToken: (token: string): TokenPayload | null => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload) as TokenPayload;
        } catch (error) {
            console.error('토큰 디코딩 실패:', error);
            return null;
        }
    },

    // 토큰 만료 시간 반환 (초 단위)
    getTokenExpiration: (): number | null => {
        const token = localStorage.getItem("app:accessToken");
        if (!token) return null;

        const decoded = tokenUtils.decodeToken(token);
        if (!decoded || !decoded.exp) return null;

        return decoded.exp;
    },

    // 토큰 남은 시간 계산 (초 단위)
    getTokenRemainingTime: (): number => {
        const exp = tokenUtils.getTokenExpiration();
        if (!exp) return 0;

        const now = Math.floor(Date.now() / 1000);
        const remaining = exp - now;
        return Math.max(0, remaining);
    },

    // 토큰이 만료되었는지 확인
    isTokenExpired: (): boolean => {
        return tokenUtils.getTokenRemainingTime() <= 0;
    },

    // 남은 시간을 포맷팅 (예: "5분 30초", "2시간 15분 30초")
    formatRemainingTime: (): string => {
        const remaining = tokenUtils.getTokenRemainingTime();
        if (remaining <= 0) return "만료됨";

        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;

        if (hours > 0) {
            return `${hours}시간 ${minutes}분 ${seconds}초`;
        } else if (minutes > 0) {
            return `${minutes}분 ${seconds}초`;
        } else {
            return `${seconds}초`;
        }
    },

    // 토큰이 곧 만료되는지 확인 (5분 이하)
    isTokenExpiringSoon: (): boolean => {
        const remaining = tokenUtils.getTokenRemainingTime();
        return remaining > 0 && remaining <= 300; // 5분 = 300초
    },

    // 토큰에서 닉네임 추출
    getNickname: (): string | null => {
        const token = localStorage.getItem("app:accessToken");
        if (!token) return null;

        const decoded = tokenUtils.decodeToken(token);
        if (!decoded) return null;

        // 토큰에서 닉네임 필드 찾기 (nickname, name, preferred_username 등 가능)
        return (decoded.nickname as string) || 
               (decoded.name as string) || 
               (decoded.preferred_username as string) || 
               (decoded.sub as string) || 
               null;
    },

    // 토큰에서 사용자 ID 추출
    getUserId: (): string | null => {
        const token = localStorage.getItem("app:accessToken");
        if (!token) return null;

        const decoded = tokenUtils.decodeToken(token);
        if (!decoded) return null;

        return (decoded.userId as string) || (decoded.sub as string) || null;
    }
};

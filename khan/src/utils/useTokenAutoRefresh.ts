// 토큰 자동 갱신을 위한 React Hook
import { useEffect, useState } from 'react';
import { tokenRefreshService } from './tokenRefreshService';
import { tokenUtils } from './tokenUtils';

interface TokenStatus {
    hasToken: boolean;
    remainingTime: number;
    formattedTime: string;
    isExpiringSoon: boolean;
    isRefreshing: boolean;
}

/**
 * 토큰 자동 갱신을 관리하는 Hook
 */
export function useTokenAutoRefresh() {
    const [tokenStatus, setTokenStatus] = useState<TokenStatus>({
        hasToken: tokenUtils.hasToken(),
        remainingTime: tokenUtils.getTokenRemainingTime(),
        formattedTime: tokenUtils.formatRemainingTime(),
        isExpiringSoon: tokenUtils.isTokenExpiringSoon(),
        isRefreshing: false
    });

    useEffect(() => {
        // 토큰 상태 업데이트 함수
        const updateTokenStatus = () => {
            const status = tokenRefreshService.getStatus();
            setTokenStatus({
                hasToken: tokenUtils.hasToken(),
                remainingTime: status.tokenRemainingTime,
                formattedTime: status.tokenFormattedTime,
                isExpiringSoon: status.isTokenExpiringSoon,
                isRefreshing: status.isRefreshing
            });
        };

        // 토큰 변경 이벤트 리스너
        const handleTokenChange = () => {
            updateTokenStatus();
            
            // 토큰이 새로 설정된 경우 자동 갱신 서비스 시작
            if (tokenUtils.hasToken()) {
                tokenRefreshService.start();
            } else {
                tokenRefreshService.stop();
            }
        };

        // 토큰 갱신 완료 이벤트 리스너
        const handleTokenRefreshed = (event: CustomEvent) => {
            console.log('토큰이 자동 갱신되었습니다:', event.detail);
            updateTokenStatus();
        };

        // 토큰 만료 이벤트 리스너
        const handleTokenExpired = () => {
            console.log('토큰이 완전히 만료되었습니다');
            updateTokenStatus();
        };

        // 이벤트 리스너 등록
        window.addEventListener('tokenChange', handleTokenChange);
        window.addEventListener('tokenRefreshed', handleTokenRefreshed as EventListener);
        window.addEventListener('tokenExpired', handleTokenExpired);

        // 초기 상태 설정
        updateTokenStatus();
        
        // 토큰이 있으면 자동 갱신 서비스 시작
        if (tokenUtils.hasToken()) {
            tokenRefreshService.start();
        }

        // 상태 업데이트를 위한 주기적 갱신 (UI 업데이트용)
        const statusUpdateInterval = setInterval(updateTokenStatus, 30000); // 30초마다

        return () => {
            // 이벤트 리스너 제거
            window.removeEventListener('tokenChange', handleTokenChange);
            window.removeEventListener('tokenRefreshed', handleTokenRefreshed as EventListener);
            window.removeEventListener('tokenExpired', handleTokenExpired);
            
            // 인터벌 정리
            clearInterval(statusUpdateInterval);
        };
    }, []);

    // 수동 토큰 갱신 함수
    const manualRefresh = async () => {
        return await tokenRefreshService.manualRefresh();
    };

    // 토큰 갱신 설정 변경 함수
    const setRefreshSettings = (thresholdMinutes: number, checkIntervalMinutes: number) => {
        tokenRefreshService.setRefreshThreshold(thresholdMinutes);
        tokenRefreshService.setCheckInterval(checkIntervalMinutes);
    };

    return {
        tokenStatus,
        manualRefresh,
        setRefreshSettings,
        serviceStatus: tokenRefreshService.getStatus()
    };
}

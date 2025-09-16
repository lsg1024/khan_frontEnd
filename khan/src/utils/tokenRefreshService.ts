// 토큰 자동 갱신 서비스
import axios from "axios";
import { tokenUtils } from "./tokenUtils";
import { getApiBaseUrl } from "../../libs/api";

class TokenRefreshService {
	private refreshTimer: number | null = null;
	private isRefreshing = false;
	private refreshThresholdMinutes = 10; // 10분 전에 갱신
	private checkIntervalMinutes = 30; // 30분마다 체크

	/**
	 * 토큰 자동 갱신 서비스 시작
	 */
	start() {
		this.scheduleNextCheck();
	}

	/**
	 * 토큰 자동 갱신 서비스 중지
	 */
	stop() {
		if (this.refreshTimer) {
			clearTimeout(this.refreshTimer);
			this.refreshTimer = null;
		}
		this.isRefreshing = false;
	}

	/**
	 * 다음 체크 스케줄링 (토큰 남은 시간에 따라 동적 조정)
	 */
	private scheduleNextCheck() {
		const remainingTime = tokenUtils.getTokenRemainingTime();
		let nextCheckDelay: number;

		if (remainingTime <= 0) {
			// 토큰이 이미 만료된 경우 즉시 체크
			nextCheckDelay = 1000; // 1초 후
		} else if (remainingTime <= this.refreshThresholdMinutes * 60) {
			// 갱신 임계값 이내인 경우 자주 체크
			nextCheckDelay = 60 * 1000; // 1분마다
		} else if (remainingTime <= 30 * 60) {
			// 30분 이내인 경우 15분마다 체크
			nextCheckDelay = 15 * 60 * 1000;
		} else {
			// 충분한 시간이 남은 경우 기본 간격으로 체크
			nextCheckDelay = this.checkIntervalMinutes * 60 * 1000;
		}

		this.refreshTimer = setTimeout(() => {
			this.checkAndRefreshToken();
		}, nextCheckDelay);
	}

	/**
	 * 토큰 체크 및 필요시 갱신
	 */
	private async checkAndRefreshToken() {
		try {
			const token = tokenUtils.getToken();

			if (!token) {
				this.stop();
				return;
			}

			const remainingTime = tokenUtils.getTokenRemainingTime();
			const thresholdSeconds = this.refreshThresholdMinutes * 60;

			// 토큰이 만료되었거나 곧 만료될 예정인 경우
			if (remainingTime <= thresholdSeconds) {
				await this.refreshToken();
			}

			// 다음 체크 스케줄링
			this.scheduleNextCheck();
		} catch (error) {
			console.log(error);
			this.scheduleNextCheck();
		}
	}

	/**
	 * 토큰 갱신 실행
	 */
	private async refreshToken(): Promise<boolean> {
		if (this.isRefreshing) {
			return false;
		}

		this.isRefreshing = true;

		try {
			const refreshResponse = await axios.post(
				`${getApiBaseUrl()}/auth/reissue`,
				{},
				{
					withCredentials: true, // 쿠키의 refreshToken 사용
					timeout: 10000,
				}
			);

			// 새 AccessToken 추출 및 저장
			const newAuthHeader =
				refreshResponse.headers["authorization"] ||
				refreshResponse.headers["Authorization"] ||
				refreshResponse.headers.authorization;

			if (newAuthHeader && newAuthHeader.startsWith("Bearer ")) {
				const newToken = newAuthHeader.substring(7);
				tokenUtils.setToken(newToken);

				window.dispatchEvent(
					new CustomEvent("tokenRefreshed", {
						detail: {
							newToken,
							remainingTime: tokenUtils.getTokenRemainingTime(),
						},
					})
				);

				return true;
			} else {
				return false;
			}
		} catch (error) {
			// RefreshToken도 만료된 경우 로그아웃 처리
			if (axios.isAxiosError(error) && error.response?.status === 401) {
				this.handleLogout();
			}

			return false;
		} finally {
			this.isRefreshing = false;
		}
	}

	/**
	 * 로그아웃 처리
	 */
	private handleLogout() {
		tokenUtils.removeToken();
		this.stop();

		// 로그아웃 이벤트 발생
		window.dispatchEvent(new CustomEvent("tokenExpired"));

		// 로그인 페이지로 리다이렉트
		if (window.location.pathname !== "/login") {
			window.location.href = "/login";
		}
	}

	/**
	 * 갱신 임계값 설정 (분 단위)
	 */
	setRefreshThreshold(minutes: number) {
		this.refreshThresholdMinutes = Math.max(1, minutes);
	}

	/**
	 * 체크 간격 설정 (분 단위)
	 */
	setCheckInterval(minutes: number) {
		this.checkIntervalMinutes = Math.max(0.5, minutes);
	}

	/**
	 * 수동 토큰 갱신
	 */
	async manualRefresh(): Promise<boolean> {
		return await this.refreshToken();
	}

	/**
	 * 현재 상태 정보
	 */
	getStatus() {
		return {
			isRunning: !!this.refreshTimer,
			isRefreshing: this.isRefreshing,
			refreshThresholdMinutes: this.refreshThresholdMinutes,
			checkIntervalMinutes: this.checkIntervalMinutes,
			tokenRemainingTime: tokenUtils.getTokenRemainingTime(),
			tokenFormattedTime: tokenUtils.formatRemainingTime(),
			isTokenExpiringSoon: tokenUtils.isTokenExpiringSoon(),
		};
	}
}

// 싱글톤 인스턴스
export const tokenRefreshService = new TokenRefreshService();

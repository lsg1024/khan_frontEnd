import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isApiSuccess } from "../../libs/api/config";
import { authApi } from "../../libs/api/auth";
import { extractSubdomain } from "../../libs/domain";
import { tokenUtils } from "../utils/tokenUtils";
import "../styles/pages/LoginPage.css";

function LoginPage() {
	const navigate = useNavigate();
	const [userId, setUserId] = useState("");
	const [password, setPassword] = useState("");
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);
	const [isLoggingIn, setIsLoggingIn] = useState(false);

	useEffect(() => {
		let isMounted = true;
		let hasTriedReissue = false;

		const checkAuthentication = async () => {
			const token = tokenUtils.getToken();

			// AccessToken이 없으면 RefreshToken으로 재발급 시도 (1회만)
			if (!token && !hasTriedReissue) {
				hasTriedReissue = true;
				try {
					// RefreshToken이 쿠키에 있으면 재발급 시도
					const reissueResponse = await authApi.refreshToken();

					if (isMounted && reissueResponse.success) {
						// 재발급 성공 시 홈으로 리다이렉트
						window.dispatchEvent(new Event("tokenChange"));
						navigate("/", { replace: true });
						return;
					}
				} catch {
					// RefreshToken도 없거나 유효하지 않으면 로그인 페이지 표시
				}

				if (isMounted) {
					setIsCheckingAuth(false);
				}
				return;
			}

			// AccessToken이 있으면 프로필 조회로 유효성 확인
			if (token) {
				try {
					const response = await authApi.getProfile();

					if (isMounted && response.success) {
						window.dispatchEvent(new Event("tokenChange"));
						navigate("/", { replace: true });
						return;
					}
				} catch {
					tokenUtils.removeToken();
				}
			}

			if (isMounted) {
				setIsCheckingAuth(false);
			}
		};

		checkAuthentication();

		return () => {
			isMounted = false;
		};
	}, [navigate]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();

		if (userId === "" || password === "") {
			return;
		}

		// 이미 로그인 중이면 중복 요청 방지
		if (isLoggingIn) {
			return;
		}

		setIsLoggingIn(true);

		let errorMessage = "";

		try {
			const data = await authApi.login({
				userId: userId,
				password,
			});

			const isLoginSuccess = !data || isApiSuccess(data);

			if (isLoginSuccess) {
				window.dispatchEvent(new Event("tokenChange"));
				navigate("/", { replace: true });
				return;
			} else {
				errorMessage = data?.message || "로그인에 실패했습니다.";
			}
		} catch (error: unknown) {
			if (error && typeof error === "object" && "response" in error) {
				const axiosError = error as {
					response?: {
						status?: number;
						data?: { message?: string; success?: boolean };
					};
				};

				const status = axiosError.response?.status;
				const responseData = axiosError.response?.data;

				if (status === 401) {
					errorMessage = "아이디 또는 비밀번호가 일치하지 않습니다.";
				} else if (status === 403) {
					errorMessage = "접근 권한이 없거나 계정이 잠겼습니다.";
				} else if (responseData?.message) {
					errorMessage = responseData.message;
				} else {
					errorMessage = "서버 통신 중 오류가 발생했습니다.";
				}
			} else {
				errorMessage = "로그인 요청 중 알 수 없는 오류가 발생했습니다.";
			}
		} finally {
			setIsLoggingIn(false);

			// 로딩 상태 해제 후 alert 표시
			if (errorMessage) {
				setTimeout(() => {
					alert(errorMessage);
				}, 100);
			}
		}
	};

	if (isCheckingAuth) {
		return (
			<div className="login-page-container">
				<div className="login-card">
					<div className="loading-state">
						<div className="spinner"></div>
						<p>접속 권한을 확인 중입니다...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="login-page-container">
			<div className="login-card">
				<div className="login-header">
					<h1>{extractSubdomain(window.location.hostname)}</h1>
				</div>

				<form onSubmit={handleLogin} className="login-form">
					<div className="form-group">
						<label htmlFor="userId">아이디</label>
						<input
							id="userId"
							type="text"
							placeholder="아이디를 입력하세요"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							required
							className="form-input"
							disabled={isLoggingIn}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">비밀번호</label>
						<input
							id="password"
							type="password"
							placeholder="비밀번호를 입력하세요"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="form-input"
							disabled={isLoggingIn}
						/>
					</div>

					<button type="submit" className="login-button" disabled={isLoggingIn}>
						로그인
					</button>
				</form>

				{isLoggingIn && (
					<div className="loading-overlay">
						<div className="loading-state">
							<div className="spinner"></div>
							<p>로그인 중...</p>
						</div>
					</div>
				)}

				<div className="login-footer">
					<p>계정이 없으신가요?</p>
					<button
						type="button"
						className="signup-button"
						onClick={() => navigate("/join")}
					>
						회원가입
					</button>
				</div>
			</div>
		</div>
	);
}

export default LoginPage;

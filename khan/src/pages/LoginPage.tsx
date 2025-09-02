import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isApiSuccess, apiRequest, type ApiResponse } from "../../libs/api";
import "../styles/pages/LoginPage.css";

function LoginPage() {
    const navigate = useNavigate();

  // 모든 state를 컴포넌트 최상단에서 선언
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // 컴포넌트 마운트 시 토큰 체크
    useEffect(() => {
        const checkAuthStatus = async () => {
        const token = localStorage.getItem("app:accessToken");

        if (token) {
            try {
            // 토큰이 유효한지 서버에 확인
            const response = await apiRequest.get("/users/info");
            if (response.success) {
                navigate("/", { replace: true }); // 루트로 리다이렉트, replace 사용
                return;
            } else {
                // 토큰이 유효하지 않으면 제거
                localStorage.removeItem("app:accessToken");
            }
            } catch (error) {
            if (error instanceof Error) {
                localStorage.removeItem("app:accessToken");
            }
            }
        } else {
            // 토큰이 없으면 로그인 페이지에 그대로 있음
        }

        setIsCheckingAuth(false);
        };

        checkAuthStatus();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (userId === "" || password === "") {
        return;
        }

        try {
        const data = await apiRequest.login<ApiResponse>("/auth/login", {
            userId,
            password,
        });

        console.log("로그인 응답 데이터:", data);

        // 204 No Content 응답이거나 성공 응답 처리
        const isLoginSuccess = !data || isApiSuccess(data);

        if (isLoginSuccess) {
            // 로그인 성공 후 토큰이 저장되었는지 확인
            const token = localStorage.getItem("app:accessToken");
            if (token) {
            try {
                const userInfoResponse = await apiRequest.get("/users/info");
                if (userInfoResponse.success) {
                navigate("/", { replace: true }); // 루트로 리다이렉트, replace 사용
                } else {
                setError("인증 정보 확인에 실패했습니다.");
                }
            } catch (userInfoError) {
                console.error("사용자 정보 조회 에러:", userInfoError);
                navigate("/");
            }
            } else {
            setError("로그인 처리 중 오류가 발생했습니다.");
            }
        } else {
            setError(data?.message || "로그인에 실패했습니다.");
        }
        } catch (error: unknown) {
        // 로그인 실패 시 더 구체적인 에러 메시지 표시
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
            setError("아이디 또는 비밀번호가 올바르지 않습니다.");
            } else if (status === 403) {
            setError("계정이 비활성화되었거나 접근이 제한되었습니다.");
            } else if (status === 404) {
            setError("존재하지 않는 사용자입니다.");
            } else if (responseData?.message) {
            setError(responseData.message);
            } else {
            setError("로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
            }
        } else {
            setError("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
        }

        console.error("로그인 에러:", error);
        }
    };

    // 인증 확인 중일 때 로딩 표시
    if (isCheckingAuth) {
        return (
        <div className="login-page-container">
            <div className="login-card">
            <div className="loading-state">
                <div className="spinner"></div>
                <p>인증 상태를 확인 중입니다...</p>
            </div>
            </div>
        </div>
        );
    }

    return (
        <div className="login-page-container">
        <div className="login-card">
            <div className="login-header">
            <h1>Khan System</h1>
            <p>로그인하여 시스템에 접속하세요</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
                <label htmlFor="userId">아이디</label>
                <input
                id="userId"
                type="text"
                placeholder="아이디를 입력하세요"
                value={userId}
                onChange={(e) => {
                    setUserId(e.target.value);
                    if (error) setError(""); // 입력 시 에러 메시지 제거
                }}
                required
                className={`form-input ${error ? "error" : ""}`}
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">비밀번호</label>
                <input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(""); // 입력 시 에러 메시지 제거
                }}
                required
                className={`form-input ${error ? "error" : ""}`}
                />
            </div>

            {error && (
                <div className="error-message">
                <span>⚠️</span>
                <p>{error}</p>
                </div>
            )}

            <button type="submit" className="login-button">
                로그인
            </button>
            </form>

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

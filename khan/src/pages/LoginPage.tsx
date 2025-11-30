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

    useEffect(() => {
        const checkAuthentication = async () => {
            const token = tokenUtils.getToken();

            if (!token) {
                setIsCheckingAuth(false);
                return;
            }

            try {
                const response = await authApi.getProfile();

                if (response.success) {
                    window.dispatchEvent(new Event("tokenChange"));
                    navigate("/", { replace: true });
                    return;
                }
            } catch {
                tokenUtils.removeToken();
            }

            setIsCheckingAuth(false);
        };

        checkAuthentication();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (userId === "" || password === "") {
            return;
        }

        try {
            const data = await authApi.login({
                userId: userId,
                password,
            });

            const isLoginSuccess = !data || isApiSuccess(data);

            if (isLoginSuccess) {
                window.dispatchEvent(new Event("tokenChange"));
                navigate("/", { replace: true });
            } else {
                alert(data?.message || "로그인에 실패했습니다.");
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
                    alert("아이디 또는 비밀번호가 일치하지 않습니다.");
                } else if (status === 403) {
                    alert("접근 권한이 없거나 계정이 잠겼습니다.");
                } else if (responseData?.message) {
                    alert(responseData.message);
                } else {
                    alert("서버 통신 중 오류가 발생했습니다.");
                }
            } else {
                alert("로그인 요청 중 알 수 없는 오류가 발생했습니다.");
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
                        />
                    </div>

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
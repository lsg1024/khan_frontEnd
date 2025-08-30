import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isApiSuccess, apiRequest, type ApiResponse } from "../../libs/api";
import { useErrorHandler } from "../utils/errorHandler";

function LoginPage() {
    const navigate = useNavigate();
    const { handleError } = useErrorHandler();

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
                        console.log("토큰 유효성 검사 성공 - HomePage로 이동");
                        navigate("/home"); // 또는 navigate("/home")
                        return;
                    } else {
                        // 토큰이 유효하지 않으면 제거
                        localStorage.removeItem("app:accessToken");
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        localStorage.removeItem("app:accessToken");
                        console.log("토큰 검증 실패, 로그인이 필요합니다");
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
                password
            });

            console.log("로그인 응답 데이터:", data);

            // 204 No Content 응답이거나 성공 응답 처리
            const isLoginSuccess = !data || isApiSuccess(data);
            
            if (isLoginSuccess) {
                // 로그인 성공 후 토큰이 저장되었는지 확인
                const token = localStorage.getItem("app:accessToken");
                console.log("저장된 토큰:", token ? "존재함" : "없음");
                
                if (token) {
                    try {
                        const userInfoResponse = await apiRequest.get("/users/info");
                        if (userInfoResponse.success) {
                            console.log("로그인 성공 - 사용자 정보 확인됨, HomePage로 이동");
                            navigate("/"); // 또는 navigate("/home")
                        } else {
                            console.log("사용자 정보 조회 실패");
                            setError("인증 정보 확인에 실패했습니다.");
                        }
                    } catch (userInfoError) {
                        console.error("사용자 정보 조회 에러:", userInfoError);
                        // 사용자 정보 조회 실패해도 토큰이 있으면 일단 인증된 것으로 처리
                        console.log("토큰 존재로 인증 처리 - HomePage로 이동");
                        navigate("/"); // 또는 navigate("/home")
                    }
                } else {
                    console.log("토큰이 저장되지 않았습니다");
                    setError("로그인 처리 중 오류가 발생했습니다.");
                }
            } else {
                console.log("로그인 API 응답 실패:", data?.message);
                setError(data?.message || "로그인에 실패했습니다.");
            }
        } catch (error: unknown) {
            console.error("로그인 에러:", error);
            handleError(error, setError);
        }
    };

    // 인증 확인 중일 때 로딩 표시
    if (isCheckingAuth) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <p>인증 상태를 확인 중입니다...</p>
            </div>
        );
    }

    return (
        <div>
            <h1>Login Page</h1>
            <form onSubmit={handleLogin}>
                <label>아이디</label>
                <input 
                    type="text"
                    placeholder="아이디"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                />

                <label>비밀번호</label>
                <input 
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {error && <p style={{ color: "red" }}>{error}</p>}
                <button type="submit">로그인</button>
            </form>
        </div>
    );
}

export default LoginPage;

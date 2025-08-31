import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isApiSuccess, apiRequest, type ApiResponse } from "../../libs/api";
import { useErrorHandler } from "../utils/errorHandler";
import "../styles/pages/JoinPage.css";

function JoinPage() { 
    const navigate = useNavigate();
    const { handleError } = useErrorHandler();

    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [confirm_password, setConfirmPassword] = useState("");
    const [nickname, setNickname] = useState("");
    const [error, setError] = useState("");

    const handleSignUp = async (e: React.FormEvent) => {

        e.preventDefault();
        setError("");

        if (userId.length < 5) {
            setError("아이디는 최소 5자 이상이어야 합니다.");
            return;
        }
        if (password.length < 6) {
            setError("비밀번호는 최소 6자 이상이어야 합니다.");
            return;
        }
        if (password !== confirm_password) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }
        if (nickname.trim() === "") {
            setError("닉네임을 입력하세요.");
            return;
        }

        try {
            const data = await apiRequest.post<ApiResponse>("/users/signup", {
                userId,
                nickname,
                password,
                confirm_password
            });
            
            if (isApiSuccess(data)) {
                const message = data.data;
                alert(`${message}`);
                navigate("/login");
            }
        } catch (err: unknown) {
            handleError(err, setError);
        }
    };

    return (
        <div className="join-page-container">
            <div className="join-card">
                <div className="join-header">
                    <h1>회원 가입</h1>
                    <p>새로운 계정을 만들어 시작하세요</p>
                </div>

                <form className="join-form" onSubmit={handleSignUp}>
                    <div className="form-group">
                        <label htmlFor="userId">아이디</label>
                        <input 
                            id="userId"
                            className="form-input"
                            type="text" 
                            placeholder="아이디를 입력하세요 (최소 5자)"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                            minLength={5}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">비밀번호</label>
                        <input 
                            id="password"
                            className="form-input"
                            type="password" 
                            placeholder="비밀번호를 입력하세요 (최소 6자)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">비밀번호 확인</label>
                        <input
                            id="confirmPassword"
                            className="form-input"
                            type="password"
                            placeholder="비밀번호를 재입력하세요"
                            value={confirm_password}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="nickname">닉네임</label>
                        <input 
                            id="nickname"
                            className="form-input"
                            type="text" 
                            placeholder="닉네임을 입력하세요"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            <span>⚠️</span>
                            <p>{error}</p>
                        </div>
                    )}

                    <button type="submit" className="join-button">
                        회원 가입
                    </button>
                </form>

                <div className="join-footer">
                    <p>이미 계정이 있으신가요?</p>
                    <button 
                        type="button" 
                        className="login-button"
                        onClick={() => navigate('/login')}
                    >
                        로그인하기
                    </button>
                </div>
            </div>
        </div>
    ); 
} 
export default JoinPage;
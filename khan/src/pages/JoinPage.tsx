import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isApiSuccess, apiRequest, type ApiResponse } from "../../libs/api";
import { useErrorHandler } from "../utils/errorHandler";

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
    <div>
        <h1>회원 가입</h1>

        <form onSubmit={handleSignUp}>
            <label>아이디</label>
            <input 
                type="text" 
                placeholder="아이디를 입력하세요"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                minLength={4}
            />

            <label>비밀번호</label>
            <input 
                type="password" 
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
            />

            <label>비밀번호 확인</label>
            <input
                type="confirm_password"
                placeholder="비밀번호를 재입력"
                value={confirm_password}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
            />

            <label>닉네임</label>
            <input 
                type="text" 
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
            />

            {error && <p className="error">{error}</p>}

            <button type="submit">회원 가입</button>
        </form>
    </div> 
    ); 
} 
export default JoinPage;
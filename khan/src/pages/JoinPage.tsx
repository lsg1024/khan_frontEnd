import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	isApiSuccess,
	apiRequest,
	type ApiResponse,
} from "../../libs/api/config";
import { useErrorHandler } from "../utils/errorHandler";
import { extractSubdomain } from "../../libs/domain";
import "../styles/pages/LoginPage.css";

function JoinPage() {
	const navigate = useNavigate();
	const { handleError } = useErrorHandler();

	const [userId, setUserId] = useState("");
	const [password, setPassword] = useState("");
	const [confirm_password, setConfirmPassword] = useState("");
	const [nickname, setNickname] = useState("");

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();

		if (userId.length < 5) {
			alert("아이디는 최소 5자 이상이어야 합니다.");
			return;
		}
		if (password.length < 6) {
			alert("비밀번호는 최소 6자 이상이어야 합니다.");
			return;
		}
		if (password !== confirm_password) {
			alert("비밀번호가 일치하지 않습니다.");
			return;
		}
		if (nickname.trim() === "") {
			alert("닉네임을 입력하세요.");
			return;
		}

		try {
			const data = await apiRequest.post<ApiResponse>("/users/signup", {
				userId,
				nickname,
				password,
				confirm_password,
			});

			if (isApiSuccess(data)) {
				const message = data.data;
				alert(`${message}`);
				navigate("/login");
			}
		} catch (err: unknown) {
			handleError(err);
		}
	};

	return (
		<div className="login-page-container">
			<div className="login-card">
				<div className="login-header">
					<h1>{extractSubdomain(window.location.hostname)}</h1>
					<p>회원가입</p>
				</div>

				<form onSubmit={handleSignUp} className="login-form">
					<div className="form-group">
						<label htmlFor="userId">아이디</label>
						<input
							id="userId"
							type="text"
							placeholder="아이디를 입력하세요 (최소 5자)"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							required
							minLength={5}
							className="form-input"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">비밀번호</label>
						<input
							id="password"
							type="password"
							placeholder="비밀번호를 입력하세요 (최소 6자)"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
							className="form-input"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="confirm_password">비밀번호 확인</label>
						<input
							id="confirm_password"
							type="password"
							placeholder="비밀번호를 재입력하세요"
							value={confirm_password}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							minLength={6}
							className="form-input"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="nickname">닉네임</label>
						<input
							id="nickname"
							type="text"
							placeholder="닉네임을 입력하세요"
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
							required
							className="form-input"
						/>
					</div>

					<button type="submit" className="login-button">
						회원 가입
					</button>
				</form>

				<div className="login-footer">
					<p>이미 계정이 있으신가요?</p>
					<button
						type="button"
						className="signup-button"
						onClick={() => navigate("/login")}
					>
						로그인
					</button>
				</div>
			</div>
		</div>
	);
}
export default JoinPage;

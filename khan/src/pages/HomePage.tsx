import { useEffect, useState } from "react";
import { apiRequest } from "../../libs/api";
import { tokenUtils } from "../utils/tokenUtils";
import "../../src/styles/pages/HomePage.css";

interface UserInfo {
    userId: string;
    nickname: string;
}

function HomePage() {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 사용자 정보 로드
        const loadUserInfo = async () => {
            try {
                // 토큰 확인
                const token = tokenUtils.getToken();
                console.log("HomePage - 현재 토큰:", token);
                console.log("HomePage - 토큰 존재 여부:", tokenUtils.hasToken());
                
                if (!token) {
                    console.error("HomePage - 토큰이 없습니다. 로그인이 필요합니다.");
                    setLoading(false);
                    return;
                }

                console.log("HomePage - API 요청 시작: /users/info");
                const response = await apiRequest.get("/users/info");
                console.log("HomePage - API 응답:", response);
                
                if (response.success) {
                    console.log("HomePage - 사용자 정보 로드 성공:", response.data);
                    setUserInfo(response.data as UserInfo);
                } else {
                    console.error("HomePage - API 응답이 성공이 아님:", response);
                }
            } catch (error) {
                console.error("사용자 정보 로드 실패:", error);
                // 토큰이 만료되었거나 유효하지 않은 경우 처리
                if (error instanceof Error && error.message.includes('401')) {
                    console.log("HomePage - 토큰이 유효하지 않음, 토큰 제거");
                    tokenUtils.removeToken();
                }
            } finally {
                setLoading(false);
            }
        };

        loadUserInfo();
    }, []);

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>로딩 중...</p>
            </div>
        );
    }

    return (
        <div className="home-page-content">
            <div className="home-header">
                <h1>홈페이지</h1>
                <p>환영합니다!</p>
            </div>
            
            {userInfo ? (
                <div className="user-info-section">
                    <h3>사용자 정보</h3>
                    <div className="user-info-grid">
                        <div className="user-info-item">
                            <strong>사용자 ID</strong>
                            <span>{userInfo.userId}</span>
                        </div>
                        <div className="user-info-item">
                            <strong>닉네임</strong>
                            <span>{userInfo.nickname}</span>
                        </div>
                    </div>
                    
                    <details className="user-data-details">
                        <summary>원본 데이터 (개발용)</summary>
                        <div className="details-content">
                            <pre>{JSON.stringify(userInfo, null, 2)}</pre>
                        </div>
                    </details>
                </div>
            ) : (
                <div className="error-section">
                    <h3>사용자 정보를 불러올 수 없습니다</h3>
                    <p>토큰이 유효하지 않거나 서버에 문제가 있을 수 있습니다.</p>
                    <div className="debug-info">
                        <p><strong>현재 토큰:</strong> {tokenUtils.getToken() || '없음'}</p>
                        <p><strong>토큰 존재 여부:</strong> {tokenUtils.hasToken() ? '있음' : '없음'}</p>
                    </div>
                </div>
            )}
        
        </div>
    );
}

export default HomePage;

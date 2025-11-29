import { createRoot } from "react-dom/client";
import { TenantProvider } from "./tenant/TenantProvider.tsx";
import { extractSubdomain } from "../libs/domain";
import "./index.css";
import App from "./App.tsx";
import './service/qzTrayService.ts';

// 서브도메인을 추출하여 페이지 타이틀 설정
const subdomain = extractSubdomain(window.location.hostname);
document.title = subdomain.toUpperCase();

createRoot(document.getElementById("root")!).render(
	<TenantProvider>
		<App />
	</TenantProvider>
);

import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
	Outlet,
} from "react-router-dom";
import { useState, useEffect } from "react";

import JoinPage from "./pages/JoinPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CataLogPage from "./pages/product/CataLogPage";
import ProductCreatePage from "./pages/product/ProductCreatePage";
import ProductDetailPage from "./pages/product/ProductDetailPage";
import StonePage from "./pages/stone/StonePage";
import StoneCreatePage from "./pages/stone/StoneCreatePage";
import OrderPage from "./pages/order/OrderPage";
import FixPage from "./pages/order/FixPage";
import ExpactPage from "./pages/order/DeliveryPage";
import OrderCreatePage from "./pages/order/OrderCreatePage";
import OrderUpdatePage from "./pages/order/OrderUpdatePage";
import StockRegisterPage from "./pages/stock/StockRegisterPage";
import StockPage from "./pages/stock/StockPage";
import StockCreatePage from "./pages/stock/StockCreatePage";
import StockUpdatePage from "./pages/stock/StockUpdatePage";
import StockDetailPage from "./pages/stock/StockDetailPage";
import StockHistoryPage from "./pages/stock/StockHistoryPage";
import StockReturnPage from "./pages/stock/StockReturnPage";
import StockDeletePage from "./pages/stock/StockDeletePage";
import OrderDeletedPage from "./pages/order/OrderDeletePage";
import StoneSearchPage from "./pages/stone/StoneSearchPage";
import StoneInfoPage from "./pages/order/StoneInfoPage";
import FactorySearchPage from "./pages/search/FactorySearchPage";
import StoreSearchPage from "./pages/search/StoreSearchPage";
import ProductSearchPage from "./pages/search/ProductSearchPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

import Layout from "./components/layout/Layout";

import "./App.css";
import "./styles/index.css";
import { tokenUtils } from "./utils/tokenUtils";

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState(() => {
		const token = tokenUtils.getToken();
		return !!token;
	});

	const handleLogout = () => {
		setIsAuthenticated(false);
	};

	useEffect(() => {
		const handleTokenChange = () => {
			const hasToken = tokenUtils.hasToken();
			setIsAuthenticated(hasToken);
		};

		const handleTokenExpired = () => {
			setIsAuthenticated(false);
		};

		window.addEventListener("tokenChange", handleTokenChange);
		window.addEventListener("tokenExpired", handleTokenExpired);

		return () => {
			window.removeEventListener("tokenChange", handleTokenChange);
			window.removeEventListener("tokenExpired", handleTokenExpired);
		};
	}, []);

	return (
		<BrowserRouter>
			{!isAuthenticated ? (
				<Routes>
					<Route path="/join" element={<JoinPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>
			) : (
				<Routes>
					{/* Layout 없이 단독 페이지 렌더링 */}
					<Route path="/stone/create" element={<StoneCreatePage />} />
					<Route
						path="/orders/update/:mode/:flowCode"
						element={<OrderUpdatePage />}
					/>
					<Route
						path="/orders/register-stock"
						element={<StockRegisterPage />}
					/>
					<Route path="/orders/create/:mode" element={<OrderCreatePage />} />
					<Route path="/orders/stone-info" element={<StoneInfoPage />} />
					<Route path="/stone-search" element={<StoneSearchPage />} />
					<Route path="/factory-search" element={<FactorySearchPage />} />
					<Route path="/store-search" element={<StoreSearchPage />} />
					<Route path="/product-search" element={<ProductSearchPage />} />
					<Route path="/stock/create" element={<StockRegisterPage />} />
					<Route path="/stocks/create/:mode" element={<StockCreatePage />} />
					<Route path="/stock/stone-info" element={<StoneInfoPage />} />
					<Route
						path="/stocks/update/:flowCode"
						element={<StockUpdatePage />}
					/>
					<Route
						path="/stocks/detail/:flowCode"
						element={<StockDetailPage />}
					/>

					{/* Layout 안에서 렌더링 */}
					<Route
						element={
							<Layout onLogout={handleLogout}>
								<Outlet />
							</Layout>
						}
					>
						<Route path="/" element={<HomePage />} />
						<Route path="/home" element={<HomePage />} />
						<Route path="/catalog" element={<CataLogPage />} />
						<Route path="/catalog/create" element={<ProductCreatePage />} />
						<Route path="/catalog/:productId" element={<ProductDetailPage />} />
						<Route path="/profile" element={<ProfilePage />} />
						<Route path="/settings" element={<SettingsPage />} />
						<Route path="/stone" element={<StonePage />} />
						<Route path="/stone/create" element={<StoneCreatePage />} />
						<Route path="/orders" element={<OrderPage />} />
						<Route path="/fix" element={<FixPage />} />
						<Route path="/expact" element={<ExpactPage />} />
						<Route path="/order-deleted" element={<OrderDeletedPage />} />
						<Route path="/stocks" element={<StockPage />} />
						<Route path="/stocks/history" element={<StockHistoryPage />} />
						<Route path="/stocks/return" element={<StockReturnPage />} />
						<Route path="/stocks/delete" element={<StockDeletePage />} />
						<Route path="/login" element={<Navigate to="/" replace />} />
						<Route path="/join" element={<Navigate to="/" replace />} />
					</Route>

					{/* catch-all 라우트는 가장 마지막에 */}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			)}
		</BrowserRouter>
	);
}

export default App;

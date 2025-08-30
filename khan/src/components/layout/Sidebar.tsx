import { useNavigate, useLocation } from "react-router-dom";

interface SidebarItem {
  path: string;
  label: string;
  icon?: string;
}

interface SidebarProps {
  isOpen?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { path: "/", label: "홈", icon: "🏠" },
  { path: "/profile", label: "프로필", icon: "👤" },
  { path: "/settings", label: "설정", icon: "⚙️" },
  { path: "/help", label: "도움말", icon: "❓" },
];

function Sidebar({ isOpen = true }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h3>메뉴</h3>
      </div>
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {sidebarItems.map((item) => (
            <li key={item.path} className="nav-item">
              <button
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                {item.icon && <span className="nav-icon">{item.icon}</span>}
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;

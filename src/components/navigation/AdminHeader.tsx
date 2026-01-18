import React, { useState } from "react";
import {
  Menu,
  X,
  Bell,
  User,
  LayoutDashboard,
  Users,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import NotificationsDropdown from "../NotificationsDropdown";
import { useNotifications } from "../../hooks/useNotifications";

const AdminHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount, refresh: refreshNotifications } = useNotifications();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleNotificationsClose = () => {
    setIsNotificationsOpen(false);
    // Refresh to sync unread count when dropdown closes
    refreshNotifications();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Teams",
      path: "/admin/teams",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Matches",
      path: "/admin/matches",
      icon: <ClipboardList className="h-5 w-5" />,
    },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-cream-400">
      <div className="flex justify-between items-center px-6 py-3">
        {/* Mobile menu button */}
        <button
          className="md:hidden text-dark focus:outline-none"
          onClick={toggleMenu}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Spacer to push right side elements to the right */}
        <div className="flex-1"></div>

        {/* Right side elements */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="text-dark hover:text-primary transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-accent rounded-full"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <NotificationsDropdown
              isOpen={isNotificationsOpen}
              onClose={handleNotificationsClose}
            />
          </div>

          <div className="relative">
            <button
              className="flex items-center space-x-2 focus:outline-none"
              onClick={toggleProfile}
            >
              <div className="h-8 w-8 bg-cream-400 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-dark" />
              </div>
              <span className="text-sm font-medium text-dark hidden md:block">
                {user?.first_name || "Admin"}
              </span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-cream-400">
                <Link
                  to="/admin/profile"
                  className="block px-4 py-2 text-sm text-dark hover:bg-cream-200"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  to="/admin/settings"
                  className="block px-4 py-2 text-sm text-dark hover:bg-cream-200"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-dark hover:bg-cream-200"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <nav className="bg-dark text-cream p-4 md:hidden slide-in">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${
                    location.pathname === item.path
                      ? "bg-primary text-white"
                      : "text-cream-400 hover:bg-dark-400"
                  }`}
                  onClick={toggleMenu}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-2 rounded-md text-cream-400 hover:bg-dark-400 w-full transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};

export default AdminHeader;

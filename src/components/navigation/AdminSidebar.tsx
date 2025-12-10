import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, LogOut, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: 'Leagues',
      path: '/admin/leagues',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: 'Seasons',
      path: '/admin/seasons',
      icon: <ClipboardList className="h-5 w-5" />,
    },
  ];

  return (
    <aside className="bg-dark text-cream w-64 flex-shrink-0 hidden md:block">
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-dark-400">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/league-genius-logo.png" alt="League Genius" className="h-10 w-10" />
            <span className="font-bold text-xl">League Genius</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary text-white shadow-md'
                      : 'text-cream-400 hover:bg-dark-400 hover:text-cream'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-dark-400">
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 rounded-md text-cream-400 hover:bg-dark-400 hover:text-cream w-full transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
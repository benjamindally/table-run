import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, LogOut, School as PoolBall } from 'lucide-react';
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
      name: 'Teams',
      path: '/admin/teams',
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: 'Matches',
      path: '/admin/matches',
      icon: <ClipboardList className="h-5 w-5" />,
    },
  ];

  return (
    <aside className="bg-black text-white w-64 flex-shrink-0 hidden md:block">
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="flex items-center space-x-2">
            <PoolBall className="h-8 w-8 text-orange-500" />
            <span className="font-bold text-xl">8-Ball Admin</span>
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
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 rounded-md text-gray-300 hover:bg-gray-800 w-full transition-colors"
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
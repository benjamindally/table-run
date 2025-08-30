import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, School as PoolBall } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-black text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <PoolBall className="h-8 w-8 text-orange-500" />
            <span className="font-bold text-xl">8-Ball League</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link
              to="/"
              className={`hover:text-orange-400 transition-colors ${
                isActive('/') ? 'text-orange-500 font-medium' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/register"
              className={`hover:text-orange-400 transition-colors ${
                isActive('/register') ? 'text-orange-500 font-medium' : ''
              }`}
            >
              Register Team
            </Link>
            <Link
              to="/match-score"
              className={`hover:text-orange-400 transition-colors ${
                isActive('/match-score') ? 'text-orange-500 font-medium' : ''
              }`}
            >
              Submit Scores
            </Link>
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="hover:text-orange-400 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="hover:text-orange-400 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`hover:text-orange-400 transition-colors ${
                  isActive('/login') ? 'text-orange-500 font-medium' : ''
                }`}
              >
                Login
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 slide-in">
            <Link
              to="/"
              className={`block py-2 hover:text-orange-400 ${
                isActive('/') ? 'text-orange-500 font-medium' : ''
              }`}
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              to="/register"
              className={`block py-2 hover:text-orange-400 ${
                isActive('/register') ? 'text-orange-500 font-medium' : ''
              }`}
              onClick={toggleMenu}
            >
              Register Team
            </Link>
            <Link
              to="/match-score"
              className={`block py-2 hover:text-orange-400 ${
                isActive('/match-score') ? 'text-orange-500 font-medium' : ''
              }`}
              onClick={toggleMenu}
            >
              Submit Scores
            </Link>
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="block py-2 hover:text-orange-400"
                    onClick={toggleMenu}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    toggleMenu();
                  }}
                  className="block py-2 hover:text-orange-400 w-full text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`block py-2 hover:text-orange-400 ${
                  isActive('/login') ? 'text-orange-500 font-medium' : ''
                }`}
                onClick={toggleMenu}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;